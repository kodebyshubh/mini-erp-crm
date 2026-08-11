import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Challan } from "../../api/types";
import { StatusBadge } from "../../components/StatusBadge";

export default function ChallanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api.get(`/challans/${id}`);
      setChallan(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirm() {
    setActionError(null);
    setBusy(true);
    try {
      await api.post(`/challans/${id}/confirm`);
      await load();
    } catch (err) {
      setActionError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setActionError(null);
    setBusy(true);
    try {
      await api.post(`/challans/${id}/cancel`);
      await load();
    } catch (err) {
      setActionError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateInvoice() {
    setActionError(null);
    setBusy(true);
    try {
      const res = await api.post("/invoices", { challanId: id });
      navigate(`/invoices/${res.data.id}`);
    } catch (err) {
      setActionError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!challan) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Challan {challan.challanNumber}</h1>
        <StatusBadge status={challan.status} />
      </div>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="card">
        <dl className="detail-list">
          <dt>Customer</dt>
          <dd>
            {challan.customer?.name} {challan.customer?.businessName ? `(${challan.customer.businessName})` : ""}
          </dd>
          <dt>Created</dt>
          <dd>{new Date(challan.createdAt).toLocaleString()}</dd>
          {challan.confirmedAt && (
            <>
              <dt>Confirmed</dt>
              <dd>{new Date(challan.confirmedAt).toLocaleString()}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="card">
        <h2>Products</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>
            {challan.items.map((item) => (
              <tr key={item.id}>
                <td>{item.productNameSnapshot}</td>
                <td>{item.productSkuSnapshot}</td>
                <td>{item.quantity}</td>
                <td>{Number(item.unitPriceSnapshot).toFixed(2)}</td>
                <td>{Number(item.lineTotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="challan-total">
          Total qty: {challan.totalQuantity} &middot; Total amount: {Number(challan.totalAmount).toFixed(2)}
        </p>
      </div>

      <div className="form-actions">
        {challan.status === "DRAFT" && (
          <>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={busy}>
              Confirm challan (deducts stock)
            </button>
            <button className="btn btn-ghost" onClick={handleCancel} disabled={busy}>
              Cancel challan
            </button>
          </>
        )}
        {challan.status === "CONFIRMED" && (
          <>
            {challan.invoice ? (
              <button className="btn btn-primary" onClick={() => navigate(`/invoices/${challan.invoice!.id}`)}>
                View invoice {challan.invoice.invoiceNumber}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleGenerateInvoice} disabled={busy}>
                Generate invoice
              </button>
            )}
            <button className="btn btn-ghost" onClick={handleCancel} disabled={busy}>
              Cancel challan (reverses stock)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
