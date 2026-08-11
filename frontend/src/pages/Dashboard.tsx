import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Summary {
  customers: number;
  products: number;
  lowStockProducts: number;
  draftChallans: number;
  confirmedChallansToday: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [customers, products, lowStock, draftChallans, confirmed] = await Promise.all([
          api.get("/customers", { params: { pageSize: 1 } }),
          api.get("/products", { params: { pageSize: 1 } }),
          api.get("/products", { params: { pageSize: 1, lowStock: true } }),
          api.get("/challans", { params: { pageSize: 1, status: "DRAFT" } }),
          api.get("/challans", { params: { pageSize: 1, status: "CONFIRMED" } }),
        ]);
        setSummary({
          customers: customers.data.pagination.total,
          products: products.data.pagination.total,
          lowStockProducts: lowStock.data.pagination.total,
          draftChallans: draftChallans.data.pagination.total,
          confirmedChallansToday: confirmed.data.pagination.total,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name}</h1>
        <p className="text-muted">Role: {user?.role}</p>
      </div>

      {loading && <p>Loading summary...</p>}

      {summary && (
        <div className="stat-grid">
          <Link to="/customers" className="stat-card">
            <div className="stat-value">{summary.customers}</div>
            <div className="stat-label">Customers</div>
          </Link>
          <Link to="/products" className="stat-card">
            <div className="stat-value">{summary.products}</div>
            <div className="stat-label">Products</div>
          </Link>
          <Link to="/products?lowStock=true" className="stat-card stat-card-warning">
            <div className="stat-value">{summary.lowStockProducts}</div>
            <div className="stat-label">Low stock products</div>
          </Link>
          <Link to="/challans?status=DRAFT" className="stat-card">
            <div className="stat-value">{summary.draftChallans}</div>
            <div className="stat-label">Draft challans</div>
          </Link>
          <Link to="/challans?status=CONFIRMED" className="stat-card">
            <div className="stat-value">{summary.confirmedChallansToday}</div>
            <div className="stat-label">Confirmed challans</div>
          </Link>
        </div>
      )}

      <div className="card">
        <h2>Quick actions</h2>
        <div className="quick-actions">
          <Link className="btn btn-primary" to="/customers/new">
            Add customer
          </Link>
          <Link className="btn btn-primary" to="/products/new">
            Add product
          </Link>
          <Link className="btn btn-primary" to="/challans/new">
            New sales challan
          </Link>
          <Link className="btn btn-primary" to="/purchase-orders/new">
            New purchase order
          </Link>
        </div>
      </div>
    </div>
  );
}
