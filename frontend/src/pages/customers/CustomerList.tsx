import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Customer, Paginated } from "../../api/types";
import { StatusBadge } from "../../components/StatusBadge";
import { PaginationBar } from "../../components/PaginationBar";

export default function CustomerList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<Paginated<Customer> | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") ?? "1", 10);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/customers", { params: { page, search: search || undefined, status: status || undefined } })
      .then((res) => {
        if (!cancelled) setResult(res.data);
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, search, status]);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    setSearchParams(params);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <Link className="btn btn-primary" to="/customers/new">
          Add customer
        </Link>
      </div>

      <div className="filters-bar">
        <input
          className="input"
          placeholder="Search by name, mobile, business, email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateParams({ search, page: "1" })}
        />
        <button className="btn btn-ghost" onClick={() => updateParams({ search, page: "1" })}>
          Search
        </button>
        <select
          className="input"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            updateParams({ status: e.target.value, page: "1" });
          }}
        >
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p>Loading...</p>}

      {result && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Business</th>
                <th>Mobile</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up date</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/customers/${c.id}`}>{c.name}</Link>
                  </td>
                  <td>{c.businessName || "-"}</td>
                  <td>{c.mobile}</td>
                  <td>{c.customerType}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    No customers found.
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
