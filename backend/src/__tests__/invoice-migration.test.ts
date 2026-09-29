import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Connection } from "mysql2/promise";
import { describe, expect, it, vi } from "vitest";
import { runRuntimeMigrations } from "../runtime-migrations";

describe("invoice migration compatibility", () => {
  it.each([false, true])("keeps old invoice data and handles an already updated schema (%s)", async (updated) => {
    const source = readFileSync(join(process.cwd(), "src/runtime-migrations.ts"), "utf8");
    const previous = [...source.matchAll(/id: "([^"]+)"/g)].map((match) => ({ id: match[1] }))
      .filter((row) => row.id !== "027_stage_invoices_and_order_email_deliveries");
    const query = vi.fn(async (sql: string, params?: string[]) => {
      if (sql.includes("SELECT id FROM schema_migrations")) return [previous];
      if (sql.includes("INFORMATION_SCHEMA.COLUMNS")) return [updated ? [{ COLUMN_NAME: "stage" }] : []];
      if (sql.includes("INFORMATION_SCHEMA.STATISTICS")) {
        return [(params?.[1] === "uniq_invoice_order_stage" ? updated : !updated) ? [{ INDEX_NAME: params?.[1] }] : []];
      }
      return [{ affectedRows: 1 }];
    });
    await runRuntimeMigrations({ query } as unknown as Connection);
    const commands = query.mock.calls.map((call) => call[0]);
    expect(commands.some((sql) => /DELETE FROM invoices|DROP TABLE invoices/.test(sql))).toBe(false);
    expect(commands.some((sql) => sql.includes("CREATE TABLE IF NOT EXISTS order_email_deliveries"))).toBe(true);
    expect(commands.some((sql) => sql.includes("ADD UNIQUE KEY uniq_invoice_order_stage"))).toBe(!updated);
  });
});
