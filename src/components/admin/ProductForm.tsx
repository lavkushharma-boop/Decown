"use client";
import Link from "next/link";
import { useActionState } from "react";
import { saveProduct } from "@/app/admin/actions";
import type { Product } from "@/db/schema";
import { ImageUpload } from "./ImageUpload";

type Props = { product?: Product; categories: { id: number; name: string }[] };

export function ProductForm({ product, categories }: Props) {
  const [state, action, pending] = useActionState(saveProduct, undefined);

  return (
    <form action={action}>
      {product && <input type="hidden" name="id" value={product.id} />}
      {state?.error && <p className="msg err" role="alert">{state.error}</p>}
      <div className="pform">
        <div className="card">
          <div className="field">
            <label htmlFor="name">Product name</label>
            <input className="input" id="name" name="name" defaultValue={product?.name} required maxLength={150} />
          </div>
          <div className="field">
            <label htmlFor="categoryId">Category</label>
            <select className="input" id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} required>
              <option value="" disabled>Choose a category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="hint">Need a new one? <Link href="/admin/categories">Manage categories</Link></span>
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea className="input" id="description" name="description" defaultValue={product?.description} maxLength={2000} />
            <span className="hint">Shown on the product card and in the product popup.</span>
          </div>
          <label className="switch">
            <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} />
            Show on website
          </label>
        </div>
        <div className="card upload-col">
          <span className="label" style={{ display: "block", marginBottom: 8 }}>Product image</span>
          <ImageUpload name="imageUrl" defaultUrl={product?.imageUrl} />
        </div>
      </div>
      <div className="form-foot">
        <Link className="btn ghost" href="/admin/products">Cancel</Link>
        <button className="btn" disabled={pending}>{pending ? "Saving…" : product ? "Save changes" : "Add product"}</button>
      </div>
    </form>
  );
}
