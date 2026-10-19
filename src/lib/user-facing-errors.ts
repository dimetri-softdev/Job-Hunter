const TECHNICAL_ERROR_PATTERN =
  /\b(?:api|http|status(?:\s+code)?|traceback|exception|stack trace|sql|prisma|postgres(?:ql)?|database|internal server|gateway|gemini|groq|supabase|render)\b|\b[45]\d{2}\b|\b(?:ECONN\w*|ERR_\w+)\b|failed to fetch/i;

const FALLBACK_BY_STATUS: Record<number, string> = {
  400: "Please check the information and try again.",
  401: "Please sign in again to continue.",
  403: "You don’t have permission to do that.",
  404: "We couldn’t find what you were looking for.",
  409: "This change conflicts with the current information. Refresh and try again.",
  413: "That file or message is too large. Please shorten it and try again.",
  422: "Some information needs attention. Please check it and try again.",
  429: "You’ve made too many requests. Please wait a little and try again.",
};

export function getApiErrorMessage(payload: unknown, status: number): string {
  if (status >= 500) {
    return "Something went wrong on our end. Please try again shortly.";
  }

  if (payload && typeof payload === "object") {
    const response = payload as {
      detail?: unknown;
      error?: unknown;
      message?: unknown;
    };
    const detail = response.detail ?? response.error ?? response.message;
    if (
      typeof detail === "string" &&
      detail.trim() &&
      detail.length <= 300 &&
      !TECHNICAL_ERROR_PATTERN.test(detail)
    ) {
      return detail.trim();
    }
  }

  return (
    FALLBACK_BY_STATUS[status] ??
    "We couldn’t complete that. Please try again."
  );
}

export function getUserFacingError(error: unknown, fallback: string): string {
  if (error instanceof TypeError) {
    return "We couldn’t connect right now. Check your connection and try again.";
  }

  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message.length <= 300 &&
    !TECHNICAL_ERROR_PATTERN.test(error.message)
  ) {
    return error.message.trim();
  }

  return fallback;
}
