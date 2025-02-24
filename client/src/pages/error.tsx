import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw } from 'lucide-react';

interface ErrorPageProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export default function ErrorPage({ error, resetErrorBoundary }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="text-center space-y-6 max-w-lg">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Something went wrong</h1>
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mt-4">
            <p className="text-red-800 font-medium">
              {error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <p className="text-gray-600 mt-4">
            We apologize for the inconvenience. Please try refreshing the page or return to the home page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <Button className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          {resetErrorBoundary && (
            <Button
              variant="outline"
              onClick={resetErrorBoundary}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}