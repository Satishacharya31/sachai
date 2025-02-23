import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ContentWindowProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function ContentWindow({ content, onContentChange }: ContentWindowProps) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const { toast } = useToast();

  const renderPreview = () => {
    if (!content) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 italic p-4 sm:p-8">
          <p className="text-center text-base sm:text-lg">
            Generated content will appear here...<br />
            Start a conversation with the AI to begin.
          </p>
        </div>
      );
    }

    const htmlContent = marked(content);
    const sanitizedHtml = DOMPurify.sanitize(htmlContent);

    return (
      <div 
        className="prose prose-sm md:prose-base lg:prose-lg max-w-none dark:prose-invert p-4 sm:p-6 md:p-8 overflow-x-hidden"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white rounded-lg shadow-inner">
      <div className="sticky top-0 z-10 flex justify-between items-center p-3 sm:p-4 border-b bg-gray-50/95 backdrop-blur-sm">
        <Tabs defaultValue="preview" value={mode} onValueChange={(value) => setMode(value as 'preview' | 'edit')}>
          <TabsList className="grid w-[140px] sm:w-[160px] md:w-[200px] grid-cols-2">
            <TabsTrigger 
              value="preview" 
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-1.5 sm:py-2 touch-manipulation"
              aria-label="Switch to preview mode"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger 
              value="edit" 
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-1.5 sm:py-2 touch-manipulation"
              aria-label="Switch to edit mode"
            >
              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
              Edit
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === 'preview' ? (
          <div className="h-full overflow-y-auto overscroll-contain custom-scrollbar bg-white">
            {renderPreview()}
          </div>
        ) : (
          <textarea
            className="w-full h-full p-4 sm:p-6 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-base leading-relaxed bg-gray-50/50 transition-colors duration-200"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Edit your content here..."
            aria-label="Content editor"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          />
        )}
      </div>
    </div>
  );
}