"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicProduct } from "@/lib/data";
import { GENERAL_ENQUIRY, waLink } from "@/lib/whatsapp";

type Props = { products: PublicProduct[]; categories: string[]; whatsappNumber: string };

export function Collection({ products, categories, whatsappNumber }: Props) {
  const [activeCat, setActiveCat] = useState("All");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<PublicProduct | null>(null);
  const closeModal = useCallback(() => setCurrent(null), []);

  const cats = ["All", ...categories];
  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      products.filter(
        p =>
          (activeCat === "All" || p.category === activeCat) &&
          (!q || (p.name + " " + p.category + " " + p.description).toLowerCase().includes(q)),
      ),
    [products, activeCat, q],
  );

  return (
    <section id="collection">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <h2>The Collection</h2>
            <p>Explore our carefully selected collection of decor and gifting pieces.</p>
          </div>
          <label className="search">
            <span className="sr" hidden>Search products</span>
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" placeholder="Search products..." autoComplete="off" value={query} onChange={e => setQuery(e.target.value)} />
          </label>
        </div>
        <div className="filters" role="group" aria-label="Filter by category">
          {cats.map(c => (
            <button key={c} className="chip-f" aria-pressed={c === activeCat} onClick={() => setActiveCat(c)}>
              {c}
            </button>
          ))}
        </div>
        <p className="count" aria-live="polite">
          {list.length} {list.length === 1 ? "piece" : "pieces"}
        </p>
        <div className="grid">
          {list.length ? (
            list.map(p => (
              <button key={p.id} className="card" aria-label={`View ${p.name}`} onClick={() => setCurrent(p)}>
                <span className="ph">
                  <img src={p.image} alt={p.name} loading="lazy" decoding="async" />
                </span>
                <small>{p.category}</small>
                <h3>{p.name}</h3>
                {p.description && <p>{p.description}</p>}
              </button>
            ))
          ) : (
            <p className="empty">
              No pieces match your search. Try another word, or{" "}
              <a href={waLink(whatsappNumber, GENERAL_ENQUIRY)} target="_blank" rel="noopener">ask us on WhatsApp</a>.
            </p>
          )}
        </div>
      </div>
      {current && <ProductModal product={current} whatsappNumber={whatsappNumber} onClose={closeModal} />}
    </section>
  );
}

function ProductModal({ product, whatsappNumber, onClose }: { product: PublicProduct; whatsappNumber: string; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const lastFocus = document.activeElement as HTMLElement | null;
    document.body.classList.add("lock");
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        // keep focus inside the modal
        const f = [...ref.current.querySelectorAll<HTMLElement>("button,a[href]")].filter(x => x.offsetParent !== null);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("lock");
      lastFocus?.focus();
    };
  }, [onClose]);

  const msg = `Hi Decown, I would like to enquire about:\n\nProduct: ${product.name}\nCategory: ${product.category}\nQuantity: ${qty}\n\nPlease share the price and availability.`;

  return (
    <div
      id="productModal"
      className="open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mName"
      ref={ref}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sheet">
        <button className="close" ref={closeRef} aria-label="Close product details" onClick={onClose}>×</button>
        <div className="m-img"><img src={product.image} alt={product.name} /></div>
        <div className="m-info">
          <p className="eyebrow">{product.category}</p>
          <h2 id="mName">{product.name}</h2>
          <p className="desc">{product.description}</p>
          <div className="buy">
            <p className="qlabel" id="ql">Quantity</p>
            <div className="qty" role="group" aria-labelledby="ql">
              <button aria-label="Decrease quantity" onClick={() => setQty(n => Math.max(1, n - 1))}>−</button>
              <output aria-live="polite">{qty}</output>
              <button aria-label="Increase quantity" onClick={() => setQty(n => n + 1)}>+</button>
            </div>
            <a className="btn wa" href={waLink(whatsappNumber, msg)} target="_blank" rel="noopener">Enquire on WhatsApp</a>
          </div>
        </div>
      </div>
    </div>
  );
}
