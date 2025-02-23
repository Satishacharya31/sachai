import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session, try to refresh
  if (!session?.access_token) {
    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Session refresh failed:', error);
      return '';
    }
    return refreshedSession?.access_token ? `Bearer ${refreshedSession.access_token}` : '';
  }
  
  return `Bearer ${session.access_token}`;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let authHeader = await getAuthHeader();

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(authHeader ? { "Authorization": authHeader } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // If unauthorized, try refreshing the session once
    if (res.status === 401) {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (!error && session) {
        authHeader = `Bearer ${session.access_token}`;
        // Retry the request with new token
        const retryRes = await fetch(url, {
          method,
          headers: {
            ...(data ? { "Content-Type": "application/json" } : {}),
            "Authorization": authHeader,
          },
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });
        return retryRes;
      }
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Request failed: ${res.status}`, {
        url,
        method,
        errorText,
        headers: res.headers
      });
      throw new Error(`${res.status}: ${errorText || res.statusText}`);
    }

    return res;
  } catch (error) {
    console.error('API Request error:', {
      url,
      method,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const authHeader = await getAuthHeader();

    const res = await fetch(queryKey[0] as string, {
      headers: authHeader ? { "Authorization": authHeader } : {},
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});