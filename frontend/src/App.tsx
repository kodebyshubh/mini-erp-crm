import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CustomerList from "./pages/customers/CustomerList";
import CustomerForm from "./pages/customers/CustomerForm";
import CustomerDetail from "./pages/customers/CustomerDetail";
import ProductList from "./pages/products/ProductList";
import ProductForm from "./pages/products/ProductForm";
import StockLog from "./pages/products/StockLog";
import ChallanList from "./pages/challans/ChallanList";
import ChallanNew from "./pages/challans/ChallanNew";
import ChallanDetail from "./pages/challans/ChallanDetail";
import PurchaseOrderList from "./pages/purchaseOrders/PurchaseOrderList";
import PurchaseOrderNew from "./pages/purchaseOrders/PurchaseOrderNew";
import PurchaseOrderDetail from "./pages/purchaseOrders/PurchaseOrderDetail";
import InvoiceList from "./pages/invoices/InvoiceList";
import InvoiceDetail from "./pages/invoices/InvoiceDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />

          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/:id/edit" element={<CustomerForm />} />

          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/stock-log" element={<StockLog />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />

          <Route path="/challans" element={<ChallanList />} />
          <Route path="/challans/new" element={<ChallanNew />} />
          <Route path="/challans/:id" element={<ChallanDetail />} />

          <Route element={<ProtectedRoute roles={["ADMIN", "WAREHOUSE"]} />}>
            <Route path="/purchase-orders" element={<PurchaseOrderList />} />
            <Route path="/purchase-orders/new" element={<PurchaseOrderNew />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
          </Route>

          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
        </Route>
      </Route>

      <Route path="*" element={<div className="page-error">Page not found.</div>} />
    </Routes>
  );
}
