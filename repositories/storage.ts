// Typed local persistence layer providing real state storage without hardcoded mock records.
// AWS-ready: can be swapped with AWS DynamoDB / RDS client in production.

export function getStoredCollection<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`farm2home_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCollection<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`farm2home_${key}`, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to persist collection ${key}`, error);
  }
}
