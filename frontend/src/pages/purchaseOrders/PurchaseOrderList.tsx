import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Paginated, PurchaseOrder } from "../../api/types";
import { StatusBadge } from "../../components/StatusBadge";
import { PaginationBar } from "../../components/PaginationBar";

export default function PurchaseOrderList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<Paginated<PurchaseOrder> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  useEffect(() => {
    api
      .get("/purchase-orders", { params: { page } })
      .then((res) => setResult(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  }, [page]);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    setSearchParams(params);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Purchase Orders</h1>
        <Link className="btn btn-primary" to="/purchase-orders/new">
          New purchase order
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Total qty</th>
                <th>Total amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((po) => (
                <tr key={po.id}>
                  <td>
                    <Link to={`/purchase-orders/${po.id}`}>{po.poNumber}</Link>
                  </td>
                  <td>{po.supplierName}</td>
                  <td>
                    <StatusBadge status={po.status} />
                  </td>
                  <td>{po.totalQuantity}</td>
                  <td>{Number(po.totalAmount).toFixed(2)}</td>
                  <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PaginationBar pagination={result.pagination} onPageChange={(p) => updateParams({ page: String(p) })} />
        </>
      )}
    </div>
  );
}
