import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "LEAD",
  followUpDate: "",
  notes: "",
};

export default function CustomerForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    api.get(`/customers/${id}`).then((res) => {
      const c = res.data;
      setForm({
        name: c.name ?? "",
        mobile: c.mobile ?? "",
        email: c.email ?? "",
        businessName: c.businessName ?? "",
        gstNumber: c.gstNumber ?? "",
        customerType: c.customerType ?? "RETAIL",
        address: c.address ?? "",
        status: c.status ?? "LEAD",
        followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : "",
        notes: c.notes ?? "",
      });
      setLoading(false);
    });
  }, [id]);

  function update<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = { ...form, followUpDate: form.followUpDate || undefined, email: form.email || undefined };
      if (isEdit) {
        await api.put(`/customers/${id}`, payload);
        navigate(`/customers/${id}`);
      } else {
        const res = await api.post("/customers", payload);
        navigate(`/customers/${res.data.id}`);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? "Edit customer" : "Add customer"}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Customer name *</span>
          <input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </label>
        <label className="field">
          <span>Mobile number *</span>
          <input className="input" required value={form.mobile} onChange={(e) => update("mobile", e.target.value)} />
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </label>
        <label className="field">
          <span>Business name</span>
          <input className="input" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
        </label>
        <label className="field">
          <span>GST number (optional)</span>
          <input className="input" value={form.gstNumber} onChange={(e) => update("gstNumber", e.target.value)} />
        </label>
        <label className="field">
          <span>Customer type</span>
          <select className="input" value={form.customerType} onChange={(e) => update("customerType", e.target.value)}>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <label className="field">
          <span>Follow-up date</span>
          <input
            className="input"
            type="date"
            value={form.followUpDate}
            onChange={(e) => update("followUpDate", e.target.value)}
          />
        </label>
        <label className="field field-wide">
          <span>Address</span>
          <textarea className="input" value={form.address} onChange={(e) => update("address", e.target.value)} />
        </label>
        <label className="field field-wide">
          <span>Notes</span>
          <textarea className="input" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </label>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
