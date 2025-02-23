import { Button } from '@/components/ui/button';
import { Facebook, MoreHorizontal } from 'lucide-react';
import { SiBlogger, SiWordpress } from 'react-icons/si';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SocialButtonsProps {
  onPost: (platform: string) => void;
}

export function SocialButtons({ onPost }: SocialButtonsProps) {
  const handleFacebookConnect = () => {
    // OAuth flow for Facebook
    window.location.href = '/auth/facebook';
  };

  const handleBloggerConnect = () => {
    // OAuth flow for Blogger
    window.location.href = '/auth/blogger';
  };

  const handleWordPressConnect = () => {
    // OAuth flow for WordPress
    window.location.href = '/auth/wordpress';
  };

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
            <MoreHorizontal className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onPost('facebook-page')}>
            Post to Page
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPost('facebook-group')}>
            Share to Group
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFacebookConnect}>
            Connect Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <SiBlogger className="h-4 w-4 mr-2" />
            Blogger
            <MoreHorizontal className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onPost('blogger-draft')}>
            Save as Draft
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPost('blogger-publish')}>
            Publish Post
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBloggerConnect}>
            Connect Blog
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <SiWordpress className="h-4 w-4 mr-2" />
            WordPress
            <MoreHorizontal className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onPost('wordpress-draft')}>
            Save as Draft
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPost('wordpress-publish')}>
            Publish Post
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleWordPressConnect}>
            Connect Site
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}