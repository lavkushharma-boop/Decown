"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { deleteProduct, reorderProducts, setProductActive } from "@/app/admin/actions";

type Row = { id: number; name: string; imageUrl: string; isActive: boolean; category: string };

export function ProductTable({ initial, categories }: { initial: Row[]; categories: string[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");

  useEffect(() => setRows(initial), [initial]);

  const filtering = Boolean(q.trim() || cat);
  const shown = rows.filter(
    r => (!cat || r.category === cat) && (!q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase())),
  );

  function drop(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    const next = [...rows];
    const from = next.findIndex(r => r.id === dragId);
    const to = next.findIndex(r => r.id === targetId);
    next.splice(to, 0, next.splice(from, 1)[0]);
    setRows(next);
    start(async () => {
      await reorderProducts(next.map(r => r.id));
      setNote("Order saved");
    });
  }

  function move(id: number, dir: -1 | 1) {
    const i = rows.findIndex(r => r.id === id);
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    start(async () => {
      await reorderProducts(next.map(r => r.id));
      setNote("Order saved");
    });
  }

  function toggle(r: Row) {
    setRows(rs => rs.map(x => (x.id === r.id ? { ...x, isActive: !r.isActive } : x)));
    start(() => setProductActive(r.id, !r.isActive));
  }

  function remove(r: Row) {
    if (!confirm(`Delete "${r.name}"? This also deletes its image and cannot be undone.`)) return;
    setRows(rs => rs.filter(x => x.id !== r.id));
    start(() => deleteProduct(r.id));
  }

  return (
    <>
      <div className="toolbar">
        <input className="input" type="search" placeholder="Search products…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="input" value={cat} onChange={e => setCat(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="note" aria-live="polite">
          {pending ? "Saving…" : filtering ? "Clear search and filter to reorder" : note || "Drag rows to change the order on the website"}
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="card empty">
          {rows.length ? "No products match." : <>No products yet. <Link href="/admin/products/new">Add your first product</Link>.</>}
        </div>
      ) : (
        <div className="plist">
          {shown.map((r, idx) => (
            <div
              key={r.id}
              className={`prow${r.isActive ? "" : " inactive"}${dragId === r.id ? " dragging" : ""}${overId === r.id && dragId !== r.id ? " over" : ""}`}
              draggable={!filtering}
              onDragStart={e => { setDragId(r.id); e.dataTransfer.effectAllowed = "move"; }}
              onDragOver={e => { if (dragId !== null) { e.preventDefault(); setOverId(r.id); } }}
              onDragLeave={() => setOverId(o => (o === r.id ? null : o))}
              onDrop={e => { e.preventDefault(); drop(r.id); }}
              onDragEnd={() => { setDragId(null); setOverId(null); }}
            >
              <button
                className="grip"
                type="button"
                disabled={filtering}
                title="Drag to reorder (or use arrow keys)"
                aria-label={`Reorder ${r.name}: use up and down arrow keys`}
                onKeyDown={e => {
                  if (e.key === "ArrowUp") { e.preventDefault(); move(r.id, -1); }
                  if (e.key === "ArrowDown") { e.preventDefault(); move(r.id, 1); }
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
              </button>
              <div className="thumb"><img src={r.imageUrl} alt="" loading={idx > 12 ? "lazy" : undefined} /></div>
              <div className="pname">
                <b title={r.name}>{r.name}</b>
                <span>{r.category}</span>
              </div>
              <span className={`badge ${r.isActive ? "on" : "off"}`}>{r.isActive ? "Visible" : "Hidden"}</span>
              <div className="pactions">
                <label className="switch" title={r.isActive ? "Hide from website" : "Show on website"}>
                  <input type="checkbox" checked={r.isActive} onChange={() => toggle(r)} aria-label={`Show ${r.name} on website`} />
                </label>
                <Link className="btn ghost sm" href={`/admin/products/${r.id}`}>Edit</Link>
                <button className="btn danger sm" type="button" onClick={() => remove(r)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
