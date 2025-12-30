export function isErrorLike(value: unknown): value is { message: string } {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.message === "string";
}

export function toErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (isErrorLike(error)) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export function logDevError(context: string, error: unknown) {
  if (process.env.NODE_ENV === "production") return;
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, error);
}
