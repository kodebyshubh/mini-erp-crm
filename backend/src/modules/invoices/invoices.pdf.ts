import PDFDocument from "pdfkit";
import { Response } from "express";

interface InvoicePdfData {
  invoiceNumber: string;
  createdAt: Date;
  customer: {
    name: string;
    businessName?: string | null;
    address?: string | null;
    gstNumber?: string | null;
    mobile: string;
  };
  challan: {
    challanNumber: string;
    items: {
      productNameSnapshot: string;
      productSkuSnapshot: string;
      quantity: number;
      unitPriceSnapshot: Prisma.Decimal | number | string;
      lineTotal: Prisma.Decimal | number | string;
    }[];
  };
  totalAmount: Prisma.Decimal | number | string;
}

// Minimal type shim so this file doesn't need a direct @prisma/client import
// just for the Decimal type - keeps the PDF layer decoupled from Prisma.
namespace Prisma {
  export type Decimal = { toFixed(dp?: number): string };
}

// Streams a simple, clean invoice PDF straight to the HTTP response.
export function renderInvoicePdf(res: Response, invoice: InvoicePdfData) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${invoice.invoiceNumber}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text("INVOICE", { align: "right" });
  doc.fontSize(10).text(invoice.invoiceNumber, { align: "right" });
  doc.text(new Date(invoice.createdAt).toLocaleDateString(), { align: "right" });
  doc.moveDown(1.5);

  doc.fontSize(12).text("Bill To:", { underline: true });
  doc.fontSize(10).text(invoice.customer.businessName || invoice.customer.name);
  if (invoice.customer.businessName) doc.text(invoice.customer.name);
  if (invoice.customer.address) doc.text(invoice.customer.address);
  doc.text(`Mobile: ${invoice.customer.mobile}`);
  if (invoice.customer.gstNumber) doc.text(`GSTIN: ${invoice.customer.gstNumber}`);
  doc.moveDown(0.5);
  doc.text(`Reference challan: ${invoice.challan.challanNumber}`);
  doc.moveDown(1);

  const tableTop = doc.y;
  const cols = { product: 50, sku: 220, qty: 320, price: 390, total: 470 };
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Product", cols.product, tableTop);
  doc.text("SKU", cols.sku, tableTop);
  doc.text("Qty", cols.qty, tableTop);
  doc.text("Unit Price", cols.price, tableTop);
  doc.text("Line Total", cols.total, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();
  doc.font("Helvetica");

  let y = tableTop + 22;
  for (const item of invoice.challan.items) {
    doc.text(item.productNameSnapshot, cols.product, y, { width: 160 });
    doc.text(item.productSkuSnapshot, cols.sku, y);
    doc.text(String(item.quantity), cols.qty, y);
    doc.text(Number(item.unitPriceSnapshot).toFixed(2), cols.price, y);
    doc.text(Number(item.lineTotal).toFixed(2), cols.total, y);
    y += 20;
  }

  doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
  doc.font("Helvetica-Bold").text(`Total: Rs. ${Number(invoice.totalAmount).toFixed(2)}`, cols.price, y + 15);

  doc.moveDown(4);
  doc.fontSize(8).font("Helvetica").fillColor("gray").text(
    "This is a system-generated invoice from the Mini ERP + CRM Operations Portal.",
    50,
    doc.page.height - 80,
    { align: "center", width: 495 }
  );

  doc.end();
}
