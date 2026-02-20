const CODE_KEY = "genui-access";

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(CODE_KEY) === "1";
}

export function getCode(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(CODE_KEY + "-code") || "";
}

export function unlock(code: string) {
  sessionStorage.setItem(CODE_KEY, "1");
  sessionStorage.setItem(CODE_KEY + "-code", code);
}

export function verifyCode(code: string): boolean {
  const expected = process.env.ACCESS_CODE;
  if (!expected) return true; // no code configured = open access
  return code === expected;
}
