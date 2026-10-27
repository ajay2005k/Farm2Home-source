import type { AuthUser } from "../types";

export const HARDCODED_CREDENTIALS = {
  username: "admin",
  password: "farm2home123",
  name: "Farm Admin",
  email: "admin@farm2home.com",
  role: "admin" as const,
  avatarInitials: "FA",
};

const STORAGE_KEY = "farm2home_auth_user";

export function validateCredentials(
  userInput: string,
  passInput: string
): { success: true; user: AuthUser } | { success: false; error: string } {
  const cleanUser = userInput.trim().toLowerCase();
  const cleanPass = passInput.trim();

  const isUserMatch =
    cleanUser === HARDCODED_CREDENTIALS.username.toLowerCase() ||
    cleanUser === HARDCODED_CREDENTIALS.email.toLowerCase();

  const isPassMatch = cleanPass === HARDCODED_CREDENTIALS.password;

  if (isUserMatch && isPassMatch) {
    const user: AuthUser = {
      username: HARDCODED_CREDENTIALS.username,
      name: HARDCODED_CREDENTIALS.name,
      email: HARDCODED_CREDENTIALS.email,
      role: HARDCODED_CREDENTIALS.role,
      avatarInitials: HARDCODED_CREDENTIALS.avatarInitials,
    };
    return { success: true, user };
  }

  if (!cleanUser && !cleanPass) {
    return { success: false, error: "Please enter your username and password." };
  }

  if (!cleanUser) {
    return { success: false, error: "Please enter your username." };
  }

  if (!cleanPass) {
    return { success: false, error: "Please enter your password." };
  }

  return {
    success: false,
    error: "Invalid username or password. Please use the hardcoded credentials provided.",
  };
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage write errors
  }
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage removal errors
  }
}
