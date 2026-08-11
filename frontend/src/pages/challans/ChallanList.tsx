import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Challan, Paginated } from "../../api/types";
import { StatusBadge } from "../../components/StatusBadge";
import { PaginationBar } from "../../components/PaginationBar";

export default function ChallanList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<Paginated<Challan> | null>(null);
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [error, setError] = useState<string | null>(null);
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  useEffect(() => {
    api
      .get("/challans", { params: { page, status: status || undefined } })
      .then((res) => setResult(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  }, [page, status]);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    setSearchParams(params);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Sales Challans</h1>
        <Link className="btn btn-primary" to="/challans/new">
          New challan
        </Link>
      </div>

      <div className="filters-bar">
        <select
          className="input"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            updateParams({ status: e.target.value, page: "1" });
          }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Challan #</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total qty</th>
                <th>Total amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/challans/${c.id}`}>{c.challanNumber}</Link>
                  </td>
                  <td>{c.customer?.businessName || c.customer?.name}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>{c.totalQuantity}</td>
                  <td>{Number(c.totalAmount).toFixed(2)}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    No challans found.
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
