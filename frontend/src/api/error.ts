import axios from "axios";

export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (!axios.isAxiosError(err)) {
    return fallback;
  }

  const message = err.response?.data?.message;

  if (Array.isArray(message) && message.length) {
    return String(message[0]);
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (!err.response) {
    return "Network error. Please check your connection and try again.";
  }

  return fallback;
}
