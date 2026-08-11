import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";

const emptyForm = { name: "", sku: "", category: "", unitPrice: "", stock: "0", minStock: "0", location: "" };

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"IN" | "OUT">("IN");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const res = await api.get(`/products/${id}`);
    const p = res.data;
    setForm({
      name: p.name ?? "",
      sku: p.sku ?? "",
      category: p.category ?? "",
      unitPrice: String(p.unitPrice ?? ""),
      stock: String(p.stock ?? 0),
      minStock: String(p.minStock ?? 0),
      location: p.location ?? "",
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        category: form.category || undefined,
        unitPrice: Number(form.unitPrice),
        location: form.location || undefined,
        ...(isEdit ? {} : { stock: Number(form.stock), minStock: Number(form.minStock) }),
        ...(isEdit ? { minStock: Number(form.minStock) } : {}),
      };
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      navigate("/products");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAdjustStock(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setAdjustError(null);
    setAdjustSubmitting(true);
    try {
      await api.post(`/products/${id}/stock-movements`, {
        quantity: Number(adjustQty),
        movementType: adjustType,
        reason: adjustReason,
      });
      setAdjustQty("");
      setAdjustReason("");
      await load();
    } catch (err) {
      setAdjustError(apiErrorMessage(err));
    } finally {
      setAdjustSubmitting(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? "Edit product" : "Add product"}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Product name *</span>
          <input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </label>
        <label className="field">
          <span>SKU / code *</span>
          <input className="input" required value={form.sku} onChange={(e) => update("sku", e.target.value)} />
        </label>
        <label className="field">
          <span>Category</span>
          <input className="input" value={form.category} onChange={(e) => update("category", e.target.value)} />
        </label>
        <label className="field">
          <span>Unit price *</span>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.unitPrice}
            onChange={(e) => update("unitPrice", e.target.value)}
          />
        </label>
        {!isEdit && (
          <label className="field">
            <span>Opening stock</span>
            <input
              className="input"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => update("stock", e.target.value)}
            />
          </label>
        )}
        <label className="field">
          <span>Minimum stock alert qty</span>
          <input
            className="input"
            type="number"
            min="0"
            value={form.minStock}
            onChange={(e) => update("minStock", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Location / warehouse</span>
          <input className="input" value={form.location} onChange={(e) => update("location", e.target.value)} />
        </label>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>

      {isEdit && (
        <div className="card">
          <h2>Adjust stock</h2>
          <p className="text-muted">Current stock: {form.stock ? form.stock : "-"}</p>
          {adjustError && <div className="alert alert-error">{adjustError}</div>}
          <form className="stock-adjust-form" onSubmit={handleAdjustStock}>
            <select className="input" value={adjustType} onChange={(e) => setAdjustType(e.target.value as "IN" | "OUT")}>
              <option value="IN">Stock IN</option>
              <option value="OUT">Stock OUT</option>
            </select>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="Quantity"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
            />
            <input
              className="input"
              placeholder="Reason"
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={adjustSubmitting}>
              Record movement
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
