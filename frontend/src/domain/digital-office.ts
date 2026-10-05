export type OfficeAgentId = "strategy" | "research" | "creative" | "operations";
export type OfficeTask = {
  agentId: OfficeAgentId;
  title: string;
  status: "queued" | "running" | "done";
  steps: string[];
};
export type OfficeMission = {
  id: string;
  instruction: string;
  priority: string;
  status:
    | "planned"
    | "queued"
    | "running"
    | "cancelled"
    | "failed"
    | "complete"
    | "reviewed";
  tasks: OfficeTask[];
  report: string;
  error?: string;
};
export const officeAgents: {
  id: OfficeAgentId;
  name: string;
  label: string;
  role: string;
}[] = [
  {
    id: "strategy",
    name: "Strategy Agent",
    label: "Strategi",
    role: "Tujuan dan prioritas",
  },
  {
    id: "research",
    name: "Research Agent",
    label: "Riset",
    role: "Data dan pertanyaan riset",
  },
  {
    id: "creative",
    name: "Creative Agent",
    label: "Kreatif",
    role: "Konten dan arah design",
  },
  {
    id: "operations",
    name: "Operations Agent",
    label: "Operasional",
    role: "Checklist dan handoff",
  },
];
