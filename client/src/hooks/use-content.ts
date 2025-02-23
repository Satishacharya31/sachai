import { useState, useEffect } from 'react';

interface UseContentOptions {
  key?: string;
}

export function useContent(initialContent: string = '', options: UseContentOptions = {}) {
  const storageKey = options.key || 'app_content';

  // Initialize state with content from localStorage if available
  const [content, setContent] = useState(() => {
    if (typeof window === 'undefined') return initialContent;
    const savedContent = localStorage.getItem(storageKey);
    return savedContent || initialContent;
  });

  // Sync content with localStorage whenever it changes
  useEffect(() => {
    if (content) {
      localStorage.setItem(storageKey, content);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [content, storageKey]);

  const updateContent = (newContent: string) => {
    setContent(newContent);
  };

  const clearContent = () => {
    setContent('');
    localStorage.removeItem(storageKey);
  };

  return {
    content,
    updateContent,
    clearContent
  };
}