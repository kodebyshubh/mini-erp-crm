import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Customer, Product } from "../../api/types";

interface LineItem {
  productId: string;
  quantity: string;
}

export default function ChallanNew() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", quantity: "1" }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "confirmed" | null>(null);

  useEffect(() => {
    api.get("/customers", { params: { pageSize: 100 } }).then((res) => setCustomers(res.data.data));
    api.get("/products", { params: { pageSize: 100 } }).then((res) => setProducts(res.data.data));
  }, []);

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: "1" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function productById(id: string) {
    return products.find((p) => p.id === id);
  }

  const estimatedTotal = items.reduce((sum, it) => {
    const product = productById(it.productId);
    const qty = Number(it.quantity) || 0;
    return sum + (product ? Number(product.unitPrice) * qty : 0);
  }, 0);

  async function submit(status: "DRAFT" | "CONFIRMED") {
    setError(null);
    if (!customerId) {
      setError("Please select a customer");
      return;
    }
    const validItems = items.filter((it) => it.productId && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      setError("Add at least one product with a quantity");
      return;
    }

    setSaving(status === "DRAFT" ? "draft" : "confirmed");
    try {
      const res = await api.post("/challans", {
        customerId,
        status,
        items: validItems.map((it) => ({ productId: it.productId, quantity: Number(it.quantity) })),
      });
      navigate(`/challans/${res.data.id}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(null);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit("DRAFT");
  }

  return (
    <div>
      <div className="page-header">
        <h1>New sales challan</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <label className="field">
          <span>Customer *</span>
          <select className="input" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.businessName ? `(${c.businessName})` : ""}
              </option>
            ))}
          </select>
        </label>

        <h2>Products</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Available stock</th>
              <th>Quantity</th>
              <th>Unit price</th>
              <th>Line total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const product = productById(item.productId);
              const qty = Number(item.quantity) || 0;
              return (
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
                  <td>{product ? product.stock : "-"}</td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    />
                  </td>
                  <td>{product ? Number(product.unitPrice).toFixed(2) : "-"}</td>
                  <td>{product ? (Number(product.unitPrice) * qty).toFixed(2) : "-"}</td>
                  <td>
                    {items.length > 1 && (
                      <button type="button" className="btn btn-ghost" onClick={() => removeItem(index)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button type="button" className="btn btn-ghost" onClick={addItem}>
          + Add product
        </button>

        <p className="challan-total">Estimated total: {estimatedTotal.toFixed(2)}</p>

        <div className="form-actions">
          <button className="btn btn-ghost" type="submit" disabled={saving !== null}>
            {saving === "draft" ? "Saving..." : "Save as draft"}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={saving !== null}
            onClick={() => submit("CONFIRMED")}
          >
            {saving === "confirmed" ? "Confirming..." : "Save & confirm (deducts stock)"}
          </button>
        </div>
      </form>
    </div>
  );
}
