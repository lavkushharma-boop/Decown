"use client";
import { useEffect, useState } from "react";

const LINKS = [
  ["#hero", "Home"],
  ["#collection", "Collection"],
  ["#about", "About"],
  ["#contact", "Contact"],
];

export function Header() {
  const [open, setOpen] = useState(false);

  // The original CSS keys the mobile menu off body.menu-open.
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
  }, [open]);

  return (
    <header id="top">
      <div className="wrap bar">
        <a className="brand" href="#hero" aria-label="Decown, home">
          <img src="/brand/logo-mark.webp" width={213} height={240} alt="" />
          <span className="nm">
            <span className="logo">Decown</span>
            <span className="hi" lang="hi">डेकओन</span>
          </span>
        </a>
        <nav id="nav" aria-label="Main">
          <ul>
            {LINKS.map(([href, label]) => (
              <li key={href}>
                <a href={href} onClick={() => setOpen(false)}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <button className="burger" aria-label="Open menu" aria-expanded={open} aria-controls="nav" onClick={() => setOpen(o => !o)}>
          <i />
        </button>
      </div>
    </header>
  );
}
