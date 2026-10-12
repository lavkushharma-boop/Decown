import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function isAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

// Every server action and admin page calls this; middleware is the first gate, this is the second.
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
