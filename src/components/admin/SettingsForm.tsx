"use client";
import { useActionState } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/data";

export function SettingsForm({ settings, products }: { settings: SiteSettings; products: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const productSelect = (name: keyof SiteSettings, label: string, hint: string) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select className="input" id={name} name={name} defaultValue={settings[name]}>
        <option value="">Automatic ({hint})</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );

  return (
    <form className="card" action={action} style={{ maxWidth: 720 }}>
      {state?.error && <p className="msg err" role="alert">{state.error}</p>}
      {state?.ok && <p className="msg ok">{state.ok}</p>}
      <div className="field">
        <label htmlFor="whatsappNumber">WhatsApp number</label>
        <input className="input" id="whatsappNumber" name="whatsappNumber" defaultValue={settings.whatsappNumber} inputMode="tel" required />
        <span className="hint">With country code, no + or spaces. Example: 918504081933</span>
      </div>
      <div className="grid2">
        <div className="field">
          <label htmlFor="instagramUrl">Instagram link</label>
          <input className="input" id="instagramUrl" name="instagramUrl" type="url" defaultValue={settings.instagramUrl} />
        </div>
        <div className="field">
          <label htmlFor="facebookUrl">Facebook link</label>
          <input className="input" id="facebookUrl" name="facebookUrl" type="url" defaultValue={settings.facebookUrl} />
        </div>
      </div>
      <div className="grid2">
        {productSelect("heroProductId", "Hero image (large)", "first product")}
        {productSelect("heroChipProductId", "Hero image (small)", "second product")}
      </div>
      <div className="form-foot">
        <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
      </div>
    </form>
  );
}
