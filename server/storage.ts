import { supabase } from "./db";
import { type Content, type InsertContent } from "@shared/schema";

export interface IStorage {
  // Content
  createContent(userId: string, content: InsertContent): Promise<Content>;
  getUserContent(userId: string): Promise<Content[]>;
}

export class SupabaseStorage implements IStorage {
  async createContent(userId: string, content: InsertContent): Promise<Content> {
    const { data, error } = await supabase
      .from('content_items')
      .insert([{ ...content, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserContent(userId: string): Promise<Content[]> {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }
}

export const storage = new SupabaseStorage();