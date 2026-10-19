import { supabase } from "@/lib/supabase";
import { getApiErrorMessage } from "@/lib/user-facing-errors";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://jobhunter-api-6c47.onrender.com/api/v1"
    : "http://127.0.0.1:8000/api/v1");

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

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new Error(
      "We couldn’t connect right now. Check your connection and try again.",
    );
  }

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    throw new Error(getApiErrorMessage(payload, res.status));
  }

  return res.json();
}