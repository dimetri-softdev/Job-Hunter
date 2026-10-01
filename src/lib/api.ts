import { supabase } from "@/lib/supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  // Grab active session token from Supabase
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  // Preserve custom headers while injecting Content-Type and Authorization
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Handle FormData (e.g. CV upload) where browser must set Content-Type boundary automatically
  if (options?.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const responseBody = await res.text();
    let errorDetail = responseBody;

    try {
      const payload: unknown = JSON.parse(responseBody);
      if (payload && typeof payload === "object") {
        const errorPayload = payload as {
          detail?: unknown;
          error?: unknown;
          message?: unknown;
        };
        const detail =
          errorPayload.detail ?? errorPayload.error ?? errorPayload.message;
        if (typeof detail === "string") {
          errorDetail = detail;
        } else if (detail !== undefined) {
          errorDetail = JSON.stringify(detail);
        }
      }
    } catch {
      // Keep the raw response body when the API did not return JSON.
    }

    throw new Error(
      `API error: ${res.status} ${errorDetail || res.statusText}`,
    );
  }

  return res.json();
}