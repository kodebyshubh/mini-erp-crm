import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Product } from "../../api/types";

interface LineItem {
  productId: string;
  quantity: string;
  unitCost: string;
}

export default function PurchaseOrderNew() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: "1", unitCost: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/products", { params: { pageSize: 100 } }).then((res) => setProducts(res.data.data));
  }, []);

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: "1", unitCost: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const validItems = items.filter((it) => it.productId && Number(it.quantity) > 0);
    if (!supplierName.trim() || validItems.length === 0) {
      setError("Supplier name and at least one product are required");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/purchase-orders", {
        supplierName,
        items: validItems.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitCost: it.unitCost ? Number(it.unitCost) : undefined,
        })),
      });
      navigate(`/purchase-orders/${res.data.id}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>New purchase order</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <label className="field">
          <span>Supplier name *</span>
          <input className="input" required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
        </label>

        <h2>Products</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit cost (optional)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>
                  <select
                    className="input"
                    value={item.productId}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="defaults to unit price"
                    value={item.unitCost}
                    onChange={(e) => updateItem(index, "unitCost", e.target.value)}
                  />
                </td>
                <td>
                  {items.length > 1 && (
                    <button type="button" className="btn btn-ghost" onClick={() => removeItem(index)}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" className="btn btn-ghost" onClick={addItem}>
          + Add product
        </button>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create purchase order"}
          </button>
        </div>
      </form>
    </div>
  );
}
