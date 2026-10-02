import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch, apiPost } from "../../../services/api-client";
import { AdminOutreachSection } from "../AdminOutreachSection";

vi.mock("../../../services/api-client", () => ({
  apiGet: vi.fn(), apiPatch: vi.fn(), apiPost: vi.fn(),
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));
const lead = {
  id: 1, business_name: "Bisnis Uji", category: "Jasa", city: "Kota Uji",
  external_key: "fixture.example", source_url: "https://fixture.example",
  evidence_url: "https://fixture.example/services", contact_url: "https://fixture.example/contact",
  observation: "Informasi layanan bisnis uji.", opportunity: "Halaman layanan dengan design yang jelas.",
  score: 3, draft_message: "Halo, boleh berdiskusi tentang design website? & terima kasih.",
  status: "reviewed", whatsapp_number: "+6280000000000", opt_in_at: "2026-01-01T01:00:00.000Z",
  opt_in_source: "https://fixture.example/consent", notes: null, sent_at: null,
  last_error: null, checked_at: null, updated_at: "2026-01-01T01:00:00.000Z",
};
beforeEach(() => {
  vi.mocked(apiGet).mockResolvedValue({ leads: [lead], whatsappConfigured: false });
});

describe("manual outreach WhatsApp", () => {
  it("lets the prospect list fill the bounded desktop panel and keeps the final prospect selectable", async () => {
    vi.mocked(apiGet).mockResolvedValue({ leads: Array.from({ length: 30 }, (_, index) => ({ ...lead, id: index + 1, business_name: `Bisnis Uji ${index + 1}` })), whatsappConfigured: false });
    render(<AdminOutreachSection />);
    const last = await screen.findByRole("button", { name: /Bisnis Uji 30/ });
    const panel = screen.getByRole("region", { name: "Daftar prospek" });
    expect(panel).toHaveClass("lg:h-[calc(100dvh-7rem)]", "lg:self-start", "flex-col");
    expect(last.parentElement).toHaveClass("min-h-0", "flex-1", "overflow-y-auto", "lg:max-h-none");
    fireEvent.click(last);
    expect(screen.getByRole("heading", { name: "Bisnis Uji 30" })).toBeInTheDocument();
  });
  it("opens an encoded draft without Cloud API or a send/status mutation", async () => {
    render(<AdminOutreachSection />);
    const link = await screen.findByRole("link", { name: "Buka WhatsApp" });
    const url = new URL(link.getAttribute("href")!);
    expect(url.pathname).toBe("/6280000000000");
    expect(url.searchParams.get("text")).toBe(lead.draft_message);
    fireEvent.change(screen.getByLabelText("Draf pesan"), { target: { value: "Halo, ide design baru & diskusi?" } });
    expect(new URL(link.getAttribute("href")!).searchParams.get("text")).toBe("Halo, ide design baru & diskusi?");
    fireEvent.click(link);
    expect(apiPost).not.toHaveBeenCalled();
    expect(apiPatch).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("reviewed");
  });

  it.each([
    { opt_in_at: null }, { opt_in_source: null }, { whatsapp_number: null },
    { opt_in_at: "2099-01-01T01:00:00.000Z" }, { status: "do_not_contact" },
    { status: "sending" }, { status: "ready" },
  ])("blocks opening a draft when consent or status is unsuitable: %j", async (override) => {
    vi.mocked(apiGet).mockResolvedValue({ leads: [{ ...lead, ...override }], whatsappConfigured: false });
    render(<AdminOutreachSection />);
    await screen.findByRole("heading", { name: "Bisnis Uji" });
    expect(screen.queryByRole("link", { name: "Buka WhatsApp" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buka WhatsApp" })).toBeDisabled();
  });

  it("requires saving a changed recipient before opening WhatsApp", async () => {
    render(<AdminOutreachSection />);
    await screen.findByRole("link", { name: "Buka WhatsApp" });
    fireEvent.change(screen.getByLabelText("Nomor WhatsApp"), { target: { value: "6280000000001" } });
    expect(screen.getByRole("button", { name: "Buka WhatsApp" })).toBeDisabled();
    vi.mocked(apiPatch).mockResolvedValue({ lead: { ...lead, whatsapp_number: "6280000000001" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Buka WhatsApp" })).toHaveAttribute("href", expect.stringContaining("/6280000000001?")));
  });
});
