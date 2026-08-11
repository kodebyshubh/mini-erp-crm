import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api/client";
import { Invoice } from "../../api/types";

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api
      .get(`/invoices/${id}`)
      .then((res) => setInvoice(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  }, [id]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice?.invoiceNumber ?? "invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!invoice) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Invoice {invoice.invoiceNumber}</h1>
        <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? "Preparing PDF..." : "Download PDF"}
        </button>
      </div>

      <div className="card">
        <dl className="detail-list">
          <dt>Customer</dt>
          <dd>
            {invoice.customer?.name} {invoice.customer?.businessName ? `(${invoice.customer.businessName})` : ""}
          </dd>
          <dt>Reference challan</dt>
          <dd>{invoice.challan?.challanNumber}</dd>
          <dt>Date</dt>
          <dd>{new Date(invoice.createdAt).toLocaleString()}</dd>
          <dt>Total amount</dt>
          <dd>{Number(invoice.totalAmount).toFixed(2)}</dd>
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
            {(invoice.challan?.items ?? []).map((item) => (
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
      </div>
    </div>
  );
}
