import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { supabase } from "./db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";

// Middleware to validate Supabase token and extract user ID
async function authenticateUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user.id;
}

function detectContentType(prompt: string): 'blog' | 'facebook' | 'script' {
  const lowercasePrompt = prompt.toLowerCase();

  if (lowercasePrompt.includes('blog') || 
      lowercasePrompt.includes('article') || 
      lowercasePrompt.includes('post')) {
    return 'blog';
  } else if (lowercasePrompt.includes('facebook') || 
             lowercasePrompt.includes('social media') || 
             lowercasePrompt.includes('fb')) {
    return 'facebook';
  } else if (lowercasePrompt.includes('script') || 
             lowercasePrompt.includes('video') || 
             lowercasePrompt.includes('dialogue')) {
    return 'script';
  }

  return 'blog';
}

// Content generation endpoint
export function registerRoutes(app: Express): Server {
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, model, saveContent = false } = req.body;

      if (!prompt || !model) {
        return res.status(400).json({ 
          message: "Missing required fields: prompt and model must be provided" 
        });
      }

      // Authenticate user and get userId from token
      let userId: string;
      try {
        userId = await authenticateUser(req);
        if (!userId) {
          return res.status(401).json({ message: "Authentication required" });
        }
      } catch (authError: any) {
        console.error('Authentication error:', authError);
        return res.status(401).json({ 
          message: authError.message || "Authentication failed" 
        });
      }

      let content: string | undefined;
      let finalModel = model;

      async function generateWithGroq() {
        const groq = new Groq({
          apiKey: process.env.GROQ_API_KEY!
        });
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `Generate content that is SEO-optimized and human-like. Keep the content professional and safe.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: "llama2-70b-4096",
          temperature: 0.7,
        });
        return completion.choices[0]?.message?.content;
      }

      try {
        if (model.startsWith('gemini')) {
          try {
            const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
            const genModel = gemini.getGenerativeModel({ model: "gemini-pro" });
            const result = await genModel.generateContent([prompt]);
            const response = await result.response;
            content = response.text();

            if (!content) {
              throw new Error("No content generated from Gemini model");
            }
          } catch (geminiError: any) {
            console.log('Gemini generation failed, falling back to Groq:', geminiError.message);
            // If Gemini fails due to safety filters, try Groq
            if (geminiError.message.includes('SAFETY')) {
              content = await generateWithGroq();
              finalModel = 'llama2-70b-4096'; // Update the model name for storage
            } else {
              throw geminiError;
            }
          }
        } else if (model.startsWith('llama')) {
          content = await generateWithGroq();
        } else {
          throw new Error("Only Gemini and Groq models are available by default. For other models like GPT-4 or Claude, please add your API key in settings.");
        }

        if (!content) {
          throw new Error("Failed to generate content: No content was returned from any model");
        }

        // Only save content if explicitly requested
        if (saveContent) {
          const contentType = detectContentType(prompt);
          const { error: saveError } = await supabase
            .from('content')
            .insert({
              user_id: userId,
              title: prompt.slice(0, 50),
              content,
              type: contentType,
              model: finalModel,
            });

          if (saveError) {
            console.error('Error saving to Supabase:', saveError);
            // Don't throw here, just log the error and continue
            // The content is still generated successfully
          }
        }

        res.json({ 
          content,
          model: finalModel,
          message: finalModel !== model ? 
            "Content was generated using a fallback model due to safety filters" : 
            undefined
        });
      } catch (genError: any) {
        console.error('Content generation error:', genError?.message || genError);
        throw new Error(genError?.message || "Unknown error occurred during content generation");
      }
    } catch (error: any) {
      console.error('Content generation failed:', error);

      // Determine the appropriate status code
      let status = 500;
      if (error.message.includes('token') || error.message.includes('Authentication')) {
        status = 401;
      } else if (error.message.includes('validation') || error.message.includes('required')) {
        status = 400;
      }

      // Send a more detailed error response
      res.status(status).json({ 
        message: error.message || "An unexpected error occurred",
        error: error.name || "GeneralError",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}