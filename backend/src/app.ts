import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import customerRoutes from "./modules/customers/customers.routes";
import productRoutes from "./modules/products/products.routes";
import challanRoutes from "./modules/challans/challans.routes";
import purchaseOrderRoutes from "./modules/purchaseOrders/purchaseOrders.routes";
import invoiceRoutes from "./modules/invoices/invoices.routes";

export const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => res.status(200).json({ status: "ok", time: new Date().toISOString() }));

app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/challans", challanRoutes);
app.use("/purchase-orders", purchaseOrderRoutes);
app.use("/invoices", invoiceRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
