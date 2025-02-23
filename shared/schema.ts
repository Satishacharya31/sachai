import { z } from "zod";

// Schema for content validation
export const insertContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(['blog', 'facebook', 'script']),
  model: z.string(),
});

// Schema for user profiles
export const profileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().optional(),
  full_name: z.string().optional(),
  avatar_url: z.string().optional(),
  website: z.string().optional(),
  updated_at: z.string(),
  created_at: z.string(),
});

// Schema for API keys
export const apiKeySchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  key: z.string(),
  user_id: z.string().uuid(),
  created_at: z.string(),
});

// Types for TypeScript
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = InsertContent & {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};
export type Profile = z.infer<typeof profileSchema>;
export type ApiKey = z.infer<typeof apiKeySchema>;