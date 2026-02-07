import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  json,
  boolean
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Simulações de importação
 */
export const simulations = mysqlTable("simulations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  regime: mysqlEnum("regime", ["simples-nacional", "lucro-real", "lucro-presumido"]).default("lucro-real").notNull(),
  ttd: mysqlEnum("ttd", ["none", "409", "410"]).default("none").notNull(),
  incoterm: varchar("incoterm", { length: 10 }).default("FOB").notNull(),
  cambio: decimal("cambio", { precision: 10, scale: 4 }).notNull(),
  freteInternacionalDolar: decimal("freteInternacionalDolar", { precision: 12, scale: 2 }).default("0"),
  seguroInternacionalDolar: decimal("seguroInternacionalDolar", { precision: 12, scale: 2 }).default("0"),
  ratioMethod: mysqlEnum("ratioMethod", ["cif", "peso", "volume", "valor"]).default("cif").notNull(),
  taxRatesJson: text("taxRatesJson"), // JSON com alíquotas customizadas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = typeof simulations.$inferInsert;

/**
 * Itens de importação dentro de uma simulação
 */
export const simulationItems = mysqlTable("simulationItems", {
  id: int("id").autoincrement().primaryKey(),
  simulationId: int("simulationId").notNull(),
  ncm: varchar("ncm", { length: 8 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  unitWeight: decimal("unitWeight", { precision: 12, scale: 4 }).notNull(), // kg
  unitVolume: decimal("unitVolume", { precision: 12, scale: 4 }).notNull(), // m³
  unitValueUsd: decimal("unitValueUsd", { precision: 12, scale: 2 }).notNull(),
  // Alíquotas específicas da NCM
  ii: decimal("ii", { precision: 5, scale: 4 }).notNull(), // 0.35 = 35%
  ipi: decimal("ipi", { precision: 5, scale: 4 }).notNull(),
  pis: decimal("pis", { precision: 5, scale: 4 }).notNull(),
  cofins: decimal("cofins", { precision: 5, scale: 4 }).notNull(),
  // Cálculos resultantes
  totalWeightKg: decimal("totalWeightKg", { precision: 14, scale: 4 }),
  totalVolumeM3: decimal("totalVolumeM3", { precision: 14, scale: 4 }),
  totalValueUsd: decimal("totalValueUsd", { precision: 14, scale: 2 }),
  valorAduaneiro: decimal("valorAduaneiro", { precision: 14, scale: 2 }),
  ii_value: decimal("ii_value", { precision: 14, scale: 2 }), // II em BRL
  ipi_value: decimal("ipi_value", { precision: 14, scale: 2 }), // IPI em BRL
  pis_value: decimal("pis_value", { precision: 14, scale: 2 }), // PIS em BRL
  cofins_value: decimal("cofins_value", { precision: 14, scale: 2 }), // COFINS em BRL
  icms_value: decimal("icms_value", { precision: 14, scale: 2 }), // ICMS em BRL
  precoUnitarioCif: decimal("precoUnitarioCif", { precision: 14, scale: 2 }), // Preço unitário CIF
  precoDesembaracado: decimal("precoDesembaracado", { precision: 14, scale: 2 }), // Preço desembaraçado no Brasil
  fatorImportacao: decimal("fatorImportacao", { precision: 10, scale: 4 }), // Fator de importação
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SimulationItem = typeof simulationItems.$inferSelect;
export type InsertSimulationItem = typeof simulationItems.$inferInsert;

/**
 * Cache de NCMs consultadas na API Siscomex
 */
export const ncmCache = mysqlTable("ncmCache", {
  id: int("id").autoincrement().primaryKey(),
  ncm: varchar("ncm", { length: 8 }).notNull().unique(),
  description: varchar("description", { length: 255 }).notNull(),
  ii: decimal("ii", { precision: 5, scale: 4 }).notNull(),
  ipi: decimal("ipi", { precision: 5, scale: 4 }).notNull(),
  pis: decimal("pis", { precision: 5, scale: 4 }).notNull(),
  cofins: decimal("cofins", { precision: 5, scale: 4 }).notNull(),
  rawDataJson: text("rawDataJson"), // Dados brutos da API Siscomex
  expiresAt: timestamp("expiresAt").notNull(), // Expiração em 24h
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NCMCache = typeof ncmCache.$inferSelect;
export type InsertNCMCache = typeof ncmCache.$inferInsert;

/**
 * Histórico de consultas de NCM
 */
export const ncmQueryHistory = mysqlTable("ncmQueryHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ncm: varchar("ncm", { length: 8 }).notNull(),
  description: varchar("description", { length: 255 }),
  source: mysqlEnum("source", ["api", "cache"]).notNull(),
  success: boolean("success").default(true).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NCMQueryHistory = typeof ncmQueryHistory.$inferSelect;
export type InsertNCMQueryHistory = typeof ncmQueryHistory.$inferInsert;
