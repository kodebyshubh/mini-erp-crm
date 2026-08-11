import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Paginated, StockMovement } from "../../api/types";
import { StatusBadge } from "../../components/StatusBadge";
import { PaginationBar } from "../../components/PaginationBar";

export default function StockLog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<Paginated<StockMovement> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  useEffect(() => {
    api
      .get("/products/stock-movements", { params: { page } })
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
        <h1>Stock movement log</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Reason</th>
                <th>Reference</th>
                <th>By</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.product?.name} ({m.product?.sku})
                  </td>
                  <td>
                    <StatusBadge status={m.movementType} />
                  </td>
                  <td>{m.quantity}</td>
                  <td>{m.reason}</td>
                  <td>{m.reference || "-"}</td>
                  <td>{m.createdBy?.name}</td>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No stock movements yet.
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
