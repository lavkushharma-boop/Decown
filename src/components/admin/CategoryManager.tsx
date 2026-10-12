"use client";
import { useActionState, useState, useTransition } from "react";
import { createCategory, deleteCategory, moveCategory, renameCategory, type FormState } from "@/app/admin/actions";

type Row = { id: number; name: string; products: number };

export function CategoryManager({ rows }: { rows: Row[] }) {
  const [addState, add, adding] = useActionState(createCategory, undefined);
  const [msg, setMsg] = useState<FormState>();
  const [pending, start] = useTransition();

  return (
    <div style={{ maxWidth: 720 }}>
      <form className="card" action={add} style={{ marginBottom: 20 }} key={addState?.ok}>
        {addState?.error && <p className="msg err">{addState.error}</p>}
        {addState?.ok && <p className="msg ok">{addState.ok}</p>}
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="newcat">New category</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input className="input" id="newcat" name="name" placeholder="e.g. Wall Decor" required maxLength={60} />
            <button className="btn" disabled={adding}>Add</button>
          </div>
        </div>
      </form>

      {msg?.error && <p className="msg err">{msg.error}</p>}
      {msg?.ok && <p className="msg ok">{msg.ok}</p>}

      <div className="clist" aria-busy={pending}>
        {rows.map((r, i) => (
          <CategoryRow
            key={r.id + ":" + r.name}
            row={r}
            first={i === 0}
            last={i === rows.length - 1}
            onMove={dir => start(() => moveCategory(r.id, dir))}
            onDelete={() => {
              if (!confirm(`Delete category "${r.name}"?`)) return;
              start(async () => setMsg(await deleteCategory(r.id)));
            }}
          />
        ))}
        {!rows.length && <div className="card empty">No categories yet.</div>}
      </div>
    </div>
  );
}

function CategoryRow({ row, first, last, onMove, onDelete }: { row: Row; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; onDelete: () => void }) {
  const [state, action, saving] = useActionState(renameCategory, undefined);
  const [name, setName] = useState(row.name);
  const dirty = name.trim() !== row.name;

  return (
    <div className="crow">
      <button className="iconbtn" type="button" disabled={first} onClick={() => onMove(-1)} aria-label={`Move ${row.name} up`}>↑</button>
      <button className="iconbtn" type="button" disabled={last} onClick={() => onMove(1)} aria-label={`Move ${row.name} down`}>↓</button>
      <form action={action}>
        <input type="hidden" name="id" value={row.id} />
        <input className="input" name="name" value={name} onChange={e => setName(e.target.value)} aria-label="Category name" required maxLength={60} />
        {dirty && <button className="btn sm" disabled={saving}>Save</button>}
      </form>
      {state?.error && <span className="msg err" style={{ margin: 0, padding: "4px 8px" }}>{state.error}</span>}
      <span className="count">{row.products} product{row.products === 1 ? "" : "s"}</span>
      <button className="btn danger sm" type="button" onClick={onDelete} disabled={row.products > 0} title={row.products > 0 ? "Move or delete its products first" : "Delete category"}>
        Delete
      </button>
    </div>
  );
}
