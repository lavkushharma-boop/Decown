import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";
import { SideNav } from "@/components/admin/SideNav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="a-shell">
      <aside className="a-side">
        <a className="a-brand" href="/admin/products">
          <img src="/brand/logo-mark.webp" alt="" />
          <span><b>Decown</b><small>ADMIN</small></span>
        </a>
        <SideNav />
        <div className="spacer" />
        {/* Plain <a> so the public site's stylesheet loads cleanly in a fresh page. */}
        <a className="linkbtn" href="/" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
          <span>View website</span>
        </a>
        <form action={logout}>
          <button className="linkbtn" type="submit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" /></svg>
            <span>Log out</span>
          </button>
        </form>
      </aside>
      <main className="a-main">{children}</main>
    </div>
  );
}
