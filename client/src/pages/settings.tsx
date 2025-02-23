import { useState } from 'react';
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Settings2, Key, User, Share2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ApiKey, SocialConnection } from "@shared/schema";
import { SiFacebook, SiBlogger, SiWordpress } from "react-icons/si";

interface ApiKeyForm {
  provider: string;
  apiKey: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  const { register, handleSubmit, reset } = useForm<ApiKeyForm>();

  // Fetch API keys
  const { data: apiKeys, refetch: refetchApiKeys } = useQuery<ApiKey[]>({
    queryKey: ["/api/settings/api-keys"],
  });

  // Fetch social connections
  const { data: socialConnections, refetch: refetchSocialConnections } = useQuery<SocialConnection[]>({
    queryKey: ["/api/settings/social-connections"],
  });

  // Add API key mutation
  const addApiKeyMutation = useMutation({
    mutationFn: async (data: ApiKeyForm) => {
      const res = await apiRequest("POST", "/api/settings/api-keys", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Added",
        description: "Your API key has been saved successfully.",
      });
      reset();
      refetchApiKeys();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/settings/api-keys/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "API Key Removed",
        description: "The API key has been removed successfully.",
      });
      refetchApiKeys();
    },
  });

  // Delete social connection mutation
  const deleteSocialConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/settings/social-connections/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Connection Removed",
        description: "Social media connection has been removed successfully.",
      });
      refetchSocialConnections();
    },
  });

  const onSubmit = (data: ApiKeyForm) => {
    addApiKeyMutation.mutate(data);
  };

  const handleSocialConnect = (provider: string) => {
    // Redirect to the OAuth endpoint
    window.location.href = `/auth/${provider}`;
  };

  const getSocialIcon = (provider: string) => {
    switch (provider) {
      case 'facebook':
        return <SiFacebook className="w-5 h-5" />;
      case 'blogger':
        return <SiBlogger className="w-5 h-5" />;
      case 'wordpress':
        return <SiWordpress className="w-5 h-5" />;
      default:
        return <Share2 className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>View and manage your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input value={user?.username} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Social Media Connections
            </CardTitle>
            <CardDescription>Connect your social media accounts for direct posting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['facebook', 'blogger', 'wordpress'].map((provider) => {
                  const connection = socialConnections?.find(
                    (conn) => conn.provider === provider
                  );

                  return (
                    <div
                      key={provider}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getSocialIcon(provider)}
                        <div>
                          <p className="font-medium capitalize">{provider}</p>
                          {connection && (
                            <p className="text-sm text-gray-500">
                              Connected as {connection.profileName}
                            </p>
                          )}
                        </div>
                      </div>
                      {connection ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSocialConnectionMutation.mutate(connection.id)}
                          disabled={deleteSocialConnectionMutation.isPending}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSocialConnect(provider)}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </CardTitle>
            <CardDescription>Manage your AI model API keys</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Provider</Label>
                  <select
                    {...register("provider")}
                    className="w-full px-3 py-2 border rounded-md"
                    onChange={(e) => setSelectedProvider(e.target.value)}
                  >
                    <option value="">Select Provider</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="deepseek">Deepseek</option>
                  </select>
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input
                    {...register("apiKey")}
                    type="password"
                    placeholder={`Enter your ${selectedProvider || 'provider'} API key`}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={addApiKeyMutation.isPending}
                className="w-full"
              >
                {addApiKeyMutation.isPending ? "Adding..." : "Add API Key"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Your API Keys</h3>
              {apiKeys?.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">{key.provider}</p>
                    <p className="text-sm text-gray-500">
                      Added on {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteApiKeyMutation.mutate(key.id)}
                    disabled={deleteApiKeyMutation.isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}