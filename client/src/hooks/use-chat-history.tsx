import { useState, useEffect } from 'react';

interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const CHAT_HISTORY_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function useChatHistory(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = localStorage.getItem('chat_history');
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      // Filter out expired messages
      const now = Date.now();
      const validMessages = parsedMessages.filter(
        (msg: ChatMessage) => now - msg.timestamp < CHAT_HISTORY_TTL
      );
      return validMessages.length ? validMessages : initialMessages;
    }
    return initialMessages;
  });

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  const addMessage = (message: Omit<ChatMessage, 'timestamp'>) => {
    setMessages(prev => [...prev, { ...message, timestamp: Date.now() }]);
  };

  const clearHistory = () => {
    setMessages([]); // Clear all messages
    localStorage.removeItem('chat_history');
  };

  const startNewChat = (welcomeMessage?: ChatMessage) => {
    setMessages(welcomeMessage ? [welcomeMessage] : []); // Start fresh with optional welcome message
    localStorage.removeItem('chat_history');
  };

  return {
    messages,
    addMessage,
    clearHistory,
    startNewChat
  };
}