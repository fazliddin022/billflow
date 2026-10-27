import {
  pgTable, uuid, text, integer,
  boolean, timestamp, pgEnum, doublePrecision,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "manager", "accountant"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "bank_transfer", "card", "online"]);
export const currencyEnum = pgEnum("currency", ["USD", "UZS", "EUR", "RUB"]);

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  image: text("image"),
  role: roleEnum("role").default("accountant").notNull(),
  companyName: text("company_name"),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  companyName: text("company_name"),
  taxId: text("tax_id"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  currency: currencyEnum("currency").default("USD").notNull(),
  subtotal: integer("subtotal").default(0).notNull(),
  taxRate: doublePrecision("tax_rate").default(0),
  taxAmount: integer("tax_amount").default(0),
  discount: integer("discount").default(0),
  total: integer("total").default(0).notNull(),
  notes: text("notes"),
  terms: text("terms"),
  issueDate: timestamp("issue_date").defaultNow(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice items
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").default(1).notNull(),
  unitPrice: integer("unit_price").notNull(),
  amount: integer("amount").notNull(),
  order: integer("order").default(0),
});

// Payments
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  method: paymentMethodEnum("method").default("bank_transfer").notNull(),
  reference: text("reference"),
  notes: text("notes"),
  paidAt: timestamp("paid_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;