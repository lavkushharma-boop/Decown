"use client";
import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <div className="login">
      <form className="card" action={action}>
        <div className="logo">
          <img src="/brand/logo-full.webp" alt="Decown" />
          <h1>Admin login</h1>
        </div>
        {state?.error && <p className="msg err" role="alert">{state.error}</p>}
        <div className="field">
          <label htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
        </div>
        <button className="btn" style={{ width: "100%" }} disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
