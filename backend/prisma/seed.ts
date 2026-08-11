import { PrismaClient, Role, CustomerType, CustomerStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_PASSWORD = "Password123!";

async function upsertUser(name: string, email: string, role: Role) {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash, role },
  });
}

async function main() {
  console.log("Seeding database...");

  const admin = await upsertUser("Admin User", "admin@erp.test", Role.ADMIN);
  const sales = await upsertUser("Sales User", "sales@erp.test", Role.SALES);
  const warehouse = await upsertUser("Warehouse User", "warehouse@erp.test", Role.WAREHOUSE);
  const accounts = await upsertUser("Accounts User", "accounts@erp.test", Role.ACCOUNTS);

  const customer1 = await prisma.customer.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Rajesh Traders",
      mobile: "9876543210",
      email: "rajesh@traders.example",
      businessName: "Rajesh Traders Pvt Ltd",
      gstNumber: "27AAAAA0000A1Z5",
      customerType: CustomerType.WHOLESALE,
      address: "123 Market Road, Pune",
      status: CustomerStatus.ACTIVE,
      notes: "Regular bulk buyer, prefers monthly billing.",
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Priya Distributors",
      mobile: "9123456780",
      email: "priya@distributors.example",
      businessName: "Priya Distributors",
      customerType: CustomerType.DISTRIBUTOR,
      address: "45 Industrial Estate, Nashik",
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: "Interested in bulk stationery order, follow up next week.",
    },
  });

  const product1 = await prisma.product.upsert({
    where: { sku: "SKU-001" },
    update: {},
    create: {
      name: "A4 Copier Paper (Ream)",
      sku: "SKU-001",
      category: "Stationery",
      unitPrice: 320.0,
      stock: 500,
      minStock: 50,
      location: "Warehouse A - Rack 1",
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: "SKU-002" },
    update: {},
    create: {
      name: "Ballpoint Pens (Box of 50)",
      sku: "SKU-002",
      category: "Stationery",
      unitPrice: 450.0,
      stock: 200,
      minStock: 20,
      location: "Warehouse A - Rack 2",
    },
  });

  const product3 = await prisma.product.upsert({
    where: { sku: "SKU-003" },
    update: {},
    create: {
      name: "Steel Almirah",
      sku: "SKU-003",
      category: "Furniture",
      unitPrice: 8500.0,
      stock: 8,
      minStock: 5,
      location: "Warehouse B - Floor",
    },
  });

  await prisma.followUp.create({
    data: {
      customerId: customer2.id,
      note: "Called, customer wants a quote for 200 pen boxes.",
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdById: sales.id,
    },
  });

  console.log("Seed complete.");
  console.log("Test login credentials (password for all: %s):", TEST_PASSWORD);
  console.log("  Admin:     admin@erp.test");
  console.log("  Sales:     sales@erp.test");
  console.log("  Warehouse: warehouse@erp.test");
  console.log("  Accounts:  accounts@erp.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
