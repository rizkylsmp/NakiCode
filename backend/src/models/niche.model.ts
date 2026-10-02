import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { pool } from "../db";

export class NicheError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function findNiches() {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT niches.id, niches.name, COUNT(designs.id) AS designCount
    FROM niches LEFT JOIN designs ON designs.niche_id = niches.id
    GROUP BY niches.id, niches.name ORDER BY niches.name, niches.id`);
  return rows.map(row => ({ id: Number(row.id), name: String(row.name), designCount: Number(row.designCount) }));
}
export async function findNicheDesignSlugs(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id, slug FROM designs WHERE niche_id = ?", [id]);
  return rows.map(row => ({ id: Number(row.id), slug: String(row.slug) }));
}
export async function resolveNiche(name: string, executor: Pick<PoolConnection, "query"> = pool) {
  if (!name.trim()) return null;
  const [rows] = await executor.query<RowDataPacket[]>("SELECT id, name FROM niches WHERE name = ? LIMIT 1", [name.trim()]);
  if (!rows[0]) throw new NicheError(400, "Niche tidak tersedia. Tambahkan melalui menu Kategori.");
  return { id: Number(rows[0].id), name: String(rows[0].name) };
}
export async function saveNiche(name: string, id?: number) {
  try {
    const [result] = id === undefined
      ? await pool.query<ResultSetHeader>("INSERT INTO niches (name) VALUES (?)", [name.trim()])
      : await pool.query<ResultSetHeader>("UPDATE niches SET name = ? WHERE id = ?", [name.trim(), id]);
    if (id !== undefined && !result.affectedRows) throw new NicheError(404, "Niche tidak ditemukan.");
    return findNiches();
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new NicheError(409, "Niche sudah tersedia.");
    throw error;
  }
}
export async function deleteNiche(id: number) {
  try {
    const [result] = await pool.query<ResultSetHeader>("DELETE FROM niches WHERE id = ?", [id]);
    if (!result.affectedRows) throw new NicheError(404, "Niche tidak ditemukan.");
    return findNiches();
  } catch (error) {
    if ((error as { code?: string }).code === "ER_ROW_IS_REFERENCED_2") throw new NicheError(409, "Niche masih digunakan oleh design.");
    throw error;
  }
}
