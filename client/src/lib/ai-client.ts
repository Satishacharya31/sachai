import { apiRequest } from "./queryClient";
import { supabase } from "./supabase";

export type AIModel =
  | "gemini-pro"
  | "gemini-pro-vision"
  | "llama-3.1-sonar-small-128k-online"
  | "llama-3.1-sonar-large-128k-online"
  | "llama-3.1-sonar-huge-128k-online"
  | "gpt-4-turbo-preview"
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "claude-3-opus"
  | "claude-3-sonnet"
  | "claude-3-haiku"
  | "deepseek-chat"
  | "deepseek-coder";

export interface ModelProvider {
  name: string;
  models: AIModel[];
  requiresApiKey: boolean;
  description: string;
}

export interface GenerateContentOptions {
  saveContent?: boolean;
}

export const modelProviders: ModelProvider[] = [
  {
    name: "Google",
    models: ["gemini-pro", "gemini-pro-vision"],
    requiresApiKey: false,
    description: "Default AI model powered by Google's Gemini",
  },
  {
    name: "Groq",
    models: [
      "llama-3.1-sonar-small-128k-online",
      "llama-3.1-sonar-large-128k-online",
      "llama-3.1-sonar-huge-128k-online",
    ],
    requiresApiKey: false,
    description: "High-performance Llama models by Groq",
  },
  {
    name: "OpenAI",
    models: ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"],
    requiresApiKey: true,
    description: "Requires your own OpenAI API key",
  },
  {
    name: "Anthropic",
    models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    requiresApiKey: true,
    description: "Requires your own Anthropic API key",
  },
  {
    name: "DeepSeek",
    models: ["deepseek-chat", "deepseek-coder"],
    requiresApiKey: true,
    description: "Requires your own DeepSeek API key",
  },
];

export type ContentType = "blog" | "facebook" | "script";

export async function generateContent(
  prompt: string, 
  model: AIModel, 
  options: GenerateContentOptions = {}
) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Authentication required. Please sign in.");
  }

  try {
    const response = await apiRequest("POST", "/api/generate", { 
      prompt, 
      model,
      saveContent: options.saveContent
    });

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate content: ${error.message}`);
    }
    throw new Error("Failed to generate content");
  }
}

export function getProviderForModel(model: AIModel): ModelProvider {
  return modelProviders.find((provider) => provider.models.includes(model))!;
}

export function isModelAvailable(model: AIModel, apiKeys: any[]): boolean {
  const provider = getProviderForModel(model);
  if (!provider.requiresApiKey) return true;
  return apiKeys?.some(key => key.provider.toLowerCase() === provider.name.toLowerCase());
}