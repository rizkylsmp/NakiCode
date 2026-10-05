import { apiGet, apiPost, apiDelete } from "./api-client";
import type { OfficeMission } from "../domain/digital-office";
export type OfficeWorker = { id: string; name: string; online: boolean };
const base = "/api/admin/digital-office";
export const loadOffice = () =>
  apiGet<{ missions: OfficeMission[]; workers: OfficeWorker[] }>(base);
export const createMission = (instruction: string, priority: string) =>
  apiPost<{ mission: OfficeMission }>(`${base}/missions`, {
    instruction,
    priority,
  });
export const actOnMission = (id: string, action: "run" | "cancel" | "review") =>
  apiPost<{ mission: OfficeMission }>(`${base}/missions/${id}/${action}`);
export const pairWorker = () =>
  apiPost<{ worker: { id: string; name: string; token: string } }>(
    `${base}/workers`,
    { name: "Komputer CEO" },
  );
export const disconnectWorker = (id: string) =>
  apiDelete(`${base}/workers/${id}`);
