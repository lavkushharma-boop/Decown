// Signed admin session token: "<expiry-ms>.<hmac-sha256(expiry)>".
// Uses Web Crypto so it runs in both middleware (edge) and server actions (node).

export const SESSION_COOKIE = "decown_admin";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

async function hmac(data: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken() {
  const exp = String(Date.now() + SESSION_TTL_MS);
  return `${exp}.${await hmac(exp)}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(exp));
}

export async function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compare HMACs so the comparison length does not leak the password length.
  return safeEqual(await hmac("pw:" + input), await hmac("pw:" + expected));
}
