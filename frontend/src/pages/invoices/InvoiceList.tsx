import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Invoice, Paginated } from "../../api/types";
import { PaginationBar } from "../../components/PaginationBar";

export default function InvoiceList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<Paginated<Invoice> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  useEffect(() => {
    api
      .get("/invoices", { params: { page } })
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
        <h1>Invoices</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Total amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link to={`/invoices/${inv.id}`}>{inv.invoiceNumber}</Link>
                  </td>
                  <td>{inv.customer?.businessName || inv.customer?.name}</td>
                  <td>{Number(inv.totalAmount).toFixed(2)}</td>
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-cell">
                    No invoices yet. Generate one from a confirmed challan.
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
