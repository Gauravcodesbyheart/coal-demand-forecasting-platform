import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  real,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "analyst",
  "manager",
  "operator",
]);

export const coalGradeEnum = pgEnum("coal_grade", [
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
  "G9",
  "G10",
  "G11",
  "G12",
  "G13",
  "G14",
  "G15",
  "G16",
  "G17",
]);

export const shiftEnum = pgEnum("shift_type", ["A", "B", "C", "General"]);

export const sectorEnum = pgEnum("sector_type", [
  "Power",
  "Steel",
  "Cement",
  "Railways",
  "Others",
]);

export const notifTypeEnum = pgEnum("notif_type", [
  "demand_alert",
  "inventory_alert",
  "production_alert",
  "forecast_complete",
  "system",
]);

export const forecastStatusEnum = pgEnum("forecast_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

// ─── Users ───
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("operator"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Mines ───
export const mines = pgTable("mines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  capacity: real("capacity"), // MT per month
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Production Records ───
export const productionRecords = pgTable("production_records", {
  id: serial("id").primaryKey(),
  mineId: integer("mine_id").references(() => mines.id),
  date: date("date").notNull(),
  coalGrade: coalGradeEnum("coal_grade").notNull(),
  quantity: real("quantity").notNull(), // in tonnes
  shift: shiftEnum("shift").default("General"),
  productionCost: real("production_cost"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Dispatch Records ───
export const dispatchRecords = pgTable("dispatch_records", {
  id: serial("id").primaryKey(),
  mineId: integer("mine_id").references(() => mines.id),
  date: date("date").notNull(),
  coalGrade: coalGradeEnum("coal_grade").notNull(),
  quantity: real("quantity").notNull(),
  sector: sectorEnum("sector").default("Power"),
  destination: varchar("destination", { length: 255 }),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Inventory Records ───
export const inventoryRecords = pgTable("inventory_records", {
  id: serial("id").primaryKey(),
  mineId: integer("mine_id").references(() => mines.id),
  date: date("date").notNull(),
  coalGrade: coalGradeEnum("coal_grade").notNull(),
  openingStock: real("opening_stock").notNull(),
  closingStock: real("closing_stock").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Demand Records ───
export const demandRecords = pgTable("demand_records", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  coalGrade: coalGradeEnum("coal_grade").notNull(),
  sector: sectorEnum("sector").default("Power"),
  quantity: real("quantity").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Forecast Runs ───
export const forecastRuns = pgTable("forecast_runs", {
  id: serial("id").primaryKey(),
  status: forecastStatusEnum("status").notNull().default("pending"),
  modelUsed: varchar("model_used", { length: 100 }),
  horizonMonths: integer("horizon_months").notNull().default(3),
  metrics: jsonb("metrics"), // { mae, rmse, mape }
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ─── Forecasts (individual predictions) ───
export const forecasts = pgTable("forecasts", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").references(() => forecastRuns.id),
  forecastDate: date("forecast_date").notNull(),
  coalGrade: coalGradeEnum("coal_grade"),
  sector: sectorEnum("sector"),
  predictedQuantity: real("predicted_quantity").notNull(),
  confidenceLower: real("confidence_lower"),
  confidenceUpper: real("confidence_upper"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Recommendations ───
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").references(() => forecastRuns.id),
  type: varchar("type", { length: 50 }).notNull(), // 'gap_alert', 'surplus', 'production_increase'
  severity: varchar("severity", { length: 20 }).notNull(), // 'critical', 'warning', 'info'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Notifications ───
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: notifTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Audit Logs ───
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: integer("entity_id"),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
