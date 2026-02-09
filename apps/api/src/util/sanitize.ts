export function sanitize(
  value: string | Record<string, unknown> | unknown
): string | Record<string, unknown> | unknown {
  if (typeof value === "string") {
    return value.replace("$", "").replace(".", "");
  } else if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    value !== null
  ) {
    return Object.entries(value).reduce((acc, [key, value]) => {
      (acc as Record<string, unknown>)[key] = sanitize(value);
      return acc;
    }, {});
  } else {
    return value;
  }
}

export function sanitizeForHtml(value: string) {
  return value
    .replace("<script", "")
    .replace("/>", "")
    .replace("javascript", "")
    .replace("$", "");
}

export type Sanitize = typeof sanitize;
export type SanitizeForHtml = typeof sanitizeForHtml;
