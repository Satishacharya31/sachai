import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SiOpenai, SiGooglecloud } from "react-icons/si";
import { Bot, ArrowRight, Sparkles, Share2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                AI Content Generator
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/app">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Create Amazing Content with AI
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Generate high-quality, SEO-optimized content for your blog, social
            media, and more using advanced AI models.
          </p>
          <Link href="/app">
            <Button size="lg" className="gap-2">
              Start Creating <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multiple AI Models</h3>
            <p className="text-gray-600">
              Choose from various AI models including Gemini, GPT-4, Claude, and
              DeepSeek for the perfect content generation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Social Integration</h3>
            <p className="text-gray-600">
              Directly post to Facebook, Blogger, and WordPress with our
              seamless integration.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">SEO Optimization</h3>
            <p className="text-gray-600">
              Generate content that ranks well in search engines with built-in
              SEO best practices.
            </p>
          </div>
        </div>

        {/* Model Providers */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-8">Supported AI Models</h2>
          <div className="flex justify-center items-center gap-12 grayscale opacity-50">
            <SiOpenai className="w-12 h-12" />
            <SiGooglecloud className="w-12 h-12" />
            {/* Add other model provider logos */}
          </div>
        </div>
      </div>
    </div>
  );
}
