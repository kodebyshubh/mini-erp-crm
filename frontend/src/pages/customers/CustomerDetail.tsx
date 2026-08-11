import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Customer } from "../../api/types";
import { StatusBadge } from "../../components/StatusBadge";

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddFollowUp(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/customers/${id}/follow-ups`, { note, followUpDate: followUpDate || undefined });
      setNote("");
      setFollowUpDate("");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!customer) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>{customer.name}</h1>
        <Link className="btn btn-primary" to={`/customers/${id}/edit`}>
          Edit customer
        </Link>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h2>Details</h2>
          <dl className="detail-list">
            <dt>Business name</dt>
            <dd>{customer.businessName || "-"}</dd>
            <dt>Mobile</dt>
            <dd>{customer.mobile}</dd>
            <dt>Email</dt>
            <dd>{customer.email || "-"}</dd>
            <dt>GST number</dt>
            <dd>{customer.gstNumber || "-"}</dd>
            <dt>Type</dt>
            <dd>{customer.customerType}</dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={customer.status} />
            </dd>
            <dt>Address</dt>
            <dd>{customer.address || "-"}</dd>
            <dt>Follow-up date</dt>
            <dd>{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : "-"}</dd>
            <dt>Notes</dt>
            <dd>{customer.notes || "-"}</dd>
          </dl>
        </div>

        <div className="card">
          <h2>Follow-up notes</h2>
          <form className="follow-up-form" onSubmit={handleAddFollowUp}>
            <textarea
              className="input"
              placeholder="Add a follow-up note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
            <div className="follow-up-form-row">
              <input
                className="input"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                Add note
              </button>
            </div>
          </form>

          <ul className="follow-up-list">
            {(customer.followUps ?? []).map((f) => (
              <li key={f.id}>
                <p>{f.note}</p>
                <span className="text-muted">
                  {f.createdBy?.name} &middot; {new Date(f.createdAt).toLocaleString()}
                  {f.followUpDate && ` • next follow-up: ${new Date(f.followUpDate).toLocaleDateString()}`}
                </span>
              </li>
            ))}
            {(customer.followUps ?? []).length === 0 && <p className="text-muted">No follow-up notes yet.</p>}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2>Recent challans</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Challan #</th>
              <th>Status</th>
              <th>Total qty</th>
              <th>Total amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(customer.challans ?? []).map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/challans/${c.id}`}>{c.challanNumber}</Link>
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>{c.totalQuantity}</td>
                <td>{Number(c.totalAmount).toFixed(2)}</td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {(customer.challans ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="empty-cell">
                  No challans yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
