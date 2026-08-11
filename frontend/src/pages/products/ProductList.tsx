import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Paginated, Product } from "../../api/types";
import { PaginationBar } from "../../components/PaginationBar";

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<Paginated<Product> | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [lowStock, setLowStock] = useState(searchParams.get("lowStock") === "true");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") ?? "1", 10);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/products", { params: { page, search: search || undefined, lowStock: lowStock || undefined } })
      .then((res) => !cancelled && setResult(res.data))
      .catch((err) => !cancelled && setError(apiErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, search, lowStock]);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    setSearchParams(params);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <Link className="btn btn-primary" to="/products/new">
          Add product
        </Link>
      </div>

      <div className="filters-bar">
        <input
          className="input"
          placeholder="Search by name or SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateParams({ search, page: "1" })}
        />
        <button className="btn btn-ghost" onClick={() => updateParams({ search, page: "1" })}>
          Search
        </button>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => {
              setLowStock(e.target.checked);
              updateParams({ lowStock: e.target.checked ? "true" : "", page: "1" });
            }}
          />
          Low stock only
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p>Loading...</p>}

      {result && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit price</th>
                <th>Stock</th>
                <th>Min stock</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((p) => (
                <tr key={p.id} className={p.stock <= p.minStock ? "row-warning" : ""}>
                  <td>
                    <Link to={`/products/${p.id}/edit`}>{p.name}</Link>
                  </td>
                  <td>{p.sku}</td>
                  <td>{p.category || "-"}</td>
                  <td>{Number(p.unitPrice).toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>{p.minStock}</td>
                  <td>{p.location || "-"}</td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PaginationBar pagination={result.pagination} onPageChange={(p) => updateParams({ page: String(p) })} />
        </>
      )}

      <div className="card">
        <div className="page-header">
          <h2>Stock movement log</h2>
          <Link className="btn btn-ghost" to="/products/stock-log">
            View full log
          </Link>
        </div>
      </div>
    </div>
  );
}
