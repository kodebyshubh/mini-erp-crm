import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { PurchaseOrder } from "../../api/types";
import { StatusBadge } from "../../components/StatusBadge";

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api.get(`/purchase-orders/${id}`);
      setPo(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleReceive() {
    setActionError(null);
    setBusy(true);
    try {
      await api.post(`/purchase-orders/${id}/receive`);
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
      await api.post(`/purchase-orders/${id}/cancel`);
      await load();
    } catch (err) {
      setActionError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!po) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Purchase Order {po.poNumber}</h1>
        <StatusBadge status={po.status} />
      </div>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="card">
        <dl className="detail-list">
          <dt>Supplier</dt>
          <dd>{po.supplierName}</dd>
          <dt>Created</dt>
          <dd>{new Date(po.createdAt).toLocaleString()}</dd>
          {po.receivedAt && (
            <>
              <dt>Received</dt>
              <dd>{new Date(po.receivedAt).toLocaleString()}</dd>
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
              <th>Unit cost</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item) => (
              <tr key={item.id}>
                <td>{item.productNameSnapshot}</td>
                <td>{item.productSkuSnapshot}</td>
                <td>{item.quantity}</td>
                <td>{Number(item.unitCostSnapshot).toFixed(2)}</td>
                <td>{Number(item.lineTotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="challan-total">
          Total qty: {po.totalQuantity} &middot; Total amount: {Number(po.totalAmount).toFixed(2)}
        </p>
      </div>

      {po.status === "ORDERED" && (
        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleReceive} disabled={busy}>
            Mark as received (adds stock)
          </button>
          <button className="btn btn-ghost" onClick={handleCancel} disabled={busy}>
            Cancel purchase order
          </button>
        </div>
      )}
    </div>
  );
}
