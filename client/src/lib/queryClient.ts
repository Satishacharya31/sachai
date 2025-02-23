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

const TIMEOUT_DURATION = 30000; // 30 seconds timeout

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let authHeader = await getAuthHeader();
  let retryCount = 0;
  const MAX_RETRIES = 2;

  while (retryCount <= MAX_RETRIES) {
    try {
      const res = await fetchWithTimeout(url, {
        method,
        headers: {
          ...(data ? { "Content-Type": "application/json" } : {}),
          ...(authHeader ? { "Authorization": authHeader } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });

      // If unauthorized, try refreshing the session
      if (res.status === 401 && retryCount < MAX_RETRIES) {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (!error && session) {
          authHeader = `Bearer ${session.access_token}`;
          retryCount++;
          continue; // Retry with new token
        }
      }

      // If server error, retry with exponential backoff
      if (res.status >= 500 && retryCount < MAX_RETRIES) {
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        retryCount++;
        continue;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API Request failed: ${res.status}`, {
          url,
          method,
          errorText,
          headers: res.headers,
          attempt: retryCount + 1
        });

        if (retryCount === MAX_RETRIES) {
          throw new Error(`${res.status}: ${errorText || res.statusText}`);
        }
      }

      return res;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout:', {
          url,
          method,
          timeout: TIMEOUT_DURATION
        });
        throw new Error(`Request timeout after ${TIMEOUT_DURATION}ms`);
      }

      console.error('API Request error:', {
        url,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: retryCount + 1
      });

      if (retryCount === MAX_RETRIES) {
        throw error;
      }
      retryCount++;
    }
  }
  throw new Error('Max retries exceeded');
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