import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  generateContent,
  type AIModel,
  modelProviders,
  isModelAvailable,
} from "@/lib/ai-client";
import { PlusCircle, Trash2, Bot, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useChatHistory } from "@/hooks/use-chat-history";
import type { ApiKey } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  type: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatWindowProps {
  onContentGenerated: (content: string) => void;
}

export function ChatWindow({ onContentGenerated }: ChatWindowProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini-pro");
  const { messages, addMessage, startNewChat, clearHistory } = useChatHistory([
    {
      type: "assistant",
      content:
        "Hello! I'm your AI assistant powered by Gemini and Groq. I can help you create content or chat about any topic. For advanced models like GPT-4 or Claude, you'll need to add your API keys in settings. What would you like to discuss?",
      timestamp: Date.now(),
    },
  ]);
  const { toast } = useToast();

  const { data: apiKeys = [] } = useQuery<ApiKey[]>({
    queryKey: ["/api/settings/api-keys"],
  });

  const getAvailableModels = useCallback(() => {
    return modelProviders.filter((provider) => {
      if (!provider.requiresApiKey) return true;
      return apiKeys.some(
        (key) => key.provider.toLowerCase() === provider.name.toLowerCase(),
      );
    });
  }, [apiKeys]);

  useEffect(() => {
    if (!isModelAvailable(selectedModel, apiKeys)) {
      setSelectedModel("gemini-pro");
    }
  }, [apiKeys, selectedModel]);

  const handleSubmit = async () => {
    if (!prompt) return;

    addMessage({ type: "user", content: prompt });
    setLoading(true);

    try {
      const contextMessages = messages
        .slice(-5)
        .map((m) => `${m.type}: ${m.content}`)
        .join("\n");

      const enhancedPrompt = `
Previous conversation context:
${contextMessages}

User input: ${prompt}

First, determine if this is a content generation request or a chat conversation. 
If it's a content generation request, focus on creating high-quality, structured content.
If it's a chat conversation, provide a detailed and helpful response.
For content editing requests, modify the existing content according to the request.
If the request is not clear, provide a detailed explanation and ask for clarification.
Respond in this format:
TASK_TYPE: [GENERATE | CHAT | EDIT]
[Your response]
`;

      const result = await generateContent(enhancedPrompt, selectedModel);
      const [taskType, ...contentParts] = result.content.split("\n");
      const generatedContent = contentParts.join("\n");

      if (taskType.includes("GENERATE")) {
        const savedResult = await generateContent(prompt, selectedModel, { 
          saveContent: true 
        });
        onContentGenerated(savedResult.content);

        const followupPrompt = `You've just generated content based on this request: "${prompt}"`;
        const followupResponse = await generateContent(
          followupPrompt + "\nPlease provide a helpful response acknowledging the action and asking if they'd like to refine it further.",
          selectedModel
        );

        addMessage({
          type: "assistant",
          content: followupResponse.content,
        });

        toast({
          title: "Content Generated",
          description: "The content has been saved and updated in the editor panel.",
        });
      } else if (taskType.includes("EDIT")) {
        onContentGenerated(generatedContent);

        const followupPrompt = `You've just edited content based on this request: "${prompt}"`;
        const followupResponse = await generateContent(
          followupPrompt + "\nPlease provide a helpful response acknowledging the action and asking if they'd like to refine it further.",
          selectedModel
        );

        addMessage({
          type: "assistant",
          content: followupResponse.content,
        });

        toast({
          title: "Content Updated",
          description: "The content has been updated in the editor panel.",
        });
      } else {
        addMessage({
          type: "assistant",
          content: generatedContent,
        });
      }
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to process your request. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      addMessage({
        type: "assistant",
        content: `Sorry, I encountered an error: ${errorMessage}`,
      });
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  const handleNewChat = () => {
    startNewChat({
      type: "assistant",
      content: "Hello! How can I help you today?",
      timestamp: Date.now(),
    });
    onContentGenerated("");
    toast({
      title: "New Chat Started",
      description: "You can now start a fresh conversation.",
    });
  };

  const handleClearHistory = () => {
    clearHistory();
    onContentGenerated("");
    toast({
      title: "Chat History Cleared",
      description: "All previous conversations have been cleared.",
    });
  };

  return (
    <Card className="h-full flex flex-col p-2 sm:p-4 md:p-6 border-0 bg-transparent">
      <div className="flex flex-col gap-3 mb-3 sm:mb-4 md:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Bot className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-500" />
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">
              AI Assistant
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">Powered by advanced AI</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="flex-1 sm:flex-none items-center gap-1.5 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
            >
              <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              New Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="flex-1 sm:flex-none items-center gap-1.5 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Clear
            </Button>
          </div>
          <Select
            value={selectedModel}
            onValueChange={(value: AIModel) => setSelectedModel(value)}
          >
            <SelectTrigger className="w-full sm:w-[160px] md:w-[200px] text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableModels().map((provider) => (
                <SelectGroup key={provider.name}>
                  <SelectLabel className="flex items-center justify-between font-semibold text-xs sm:text-sm">
                    {provider.name}
                    {provider.requiresApiKey && (
                      <span className="text-xs text-gray-500 font-normal">
                        API Key Required
                      </span>
                    )}
                  </SelectLabel>
                  {provider.models.map((model) => (
                    <SelectItem
                      key={model}
                      value={model}
                      className="pl-6 text-xs sm:text-sm"
                      disabled={!isModelAvailable(model, apiKeys)}
                    >
                      {model}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto mb-3 sm:mb-4 space-y-3 sm:space-y-4 custom-scrollbar">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] rounded-lg p-2.5 sm:p-3 md:p-4 ${message.type === "user" ? "bg-blue-500 text-white ml-2 sm:ml-4" : "bg-gray-100 text-gray-800 mr-2 sm:mr-4"}`}
            >
              <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-auto">
        <Textarea
          placeholder="Type your message..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="min-h-[45px] sm:min-h-[60px] bg-white pr-12 sm:pr-16 resize-none text-sm sm:text-base rounded-xl"
        />
        <Button
          onClick={handleSubmit}
          disabled={loading || !prompt}
          className="absolute bottom-1.5 right-1.5 py-1 px-2 sm:py-1.5 sm:px-3 rounded-lg"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span className="sr-only">Working...</span>
            </>
          ) : (
            <>
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sr-only">Send</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}