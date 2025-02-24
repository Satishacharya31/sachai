import { useState,useEffect } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { ChatWindow } from '@/components/chat-window';
import { ContentWindow } from '@/components/content-window';
import { SiOpenai } from 'react-icons/si';
import { useAuth } from '@/hooks/use-auth';
import { useContent } from '@/hooks/use-content';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Settings2, LogOut, Loader2 } from 'lucide-react';

export default function Home() {
  const { content, updateContent, clearContent } = useContent();
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsHorizontal(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="w-full bg-white/80 backdrop-blur-sm border-b shadow-sm py-2 sm:py-4 flex-shrink-0">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <SiOpenai className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 transition-transform hover:scale-110" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  AI Content Generator
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Welcome, {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/settings">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:bg-blue-50 px-2 sm:px-3 py-1 sm:py-2"
                  aria-label="Open Settings"
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoading}
                className="flex items-center gap-1.5 sm:gap-2 transition-colors hover:bg-blue-50 px-2 sm:px-3 py-1 sm:py-2"
                aria-label={isLoading ? "Signing out..." : "Sign out"}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="h-[200vh] md:h-[90vh] container mx-auto px-2 sm:px-4 py-3 sm:py-6 flex flex-col md:flex-row">
          <ResizablePanelGroup 
            direction={isHorizontal ? "horizontal" : "vertical"}
            className="h-full rounded-xl overflow-hidden border shadow-lg bg-white/80 backdrop-blur-sm"
          >
            <ResizablePanel 
              defaultSize={60}
              className="bg-gradient-to-b from-blue-50/50 min-h-[40vh] overflow-y-auto transition-all duration-300 ease-in-out"
              minSize={40}
            >
              <ChatWindow onContentGenerated={updateContent} />
            </ResizablePanel>
            <ResizableHandle 
              withHandle 
              className="transition-colors hover:bg-blue-100"
              aria-label="Resize panels"
            />
            <ResizablePanel 
              defaultSize={40}
              minSize={30}
              className={`min-h-[30vh] transition-all duration-300 ease-in-out overflow-y-auto ${!content ? 'opacity-50' : 'opacity-100'}`}
            >
              <ContentWindow content={content} onContentChange={updateContent} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </main>
    </div>
  );
}