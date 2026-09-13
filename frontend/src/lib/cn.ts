type ClassValue = string | number | null | undefined | false | Record<string, boolean | undefined>;

/** Tiny classnames joiner — avoids pulling in a dependency for this alone. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
    } else {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) out.push(key);
      }
    }
  }
  return out.join(" ");
}
