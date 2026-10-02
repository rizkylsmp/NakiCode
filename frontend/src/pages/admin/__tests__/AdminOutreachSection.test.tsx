import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch } from "../../../services/api-client";
import { AdminOutreachSection } from "../AdminOutreachSection";
vi.mock("../../../services/api-client", () => ({ apiGet: vi.fn(), apiPatch: vi.fn(), apiPost: vi.fn(), apiDelete: vi.fn(), getApiErrorMessage: (_error: unknown, fallback: string) => fallback }));
const lead = { id: 1, business_name: "Bisnis Uji", category: "Jasa", city: "Kota Uji", external_key: "fixture.example", source_url: "https://fixture.example", evidence_url: "https://fixture.example/services", contact_url: "https://fixture.example/contact", observation: "Informasi layanan bisnis uji.", opportunity: "Halaman layanan dengan design yang jelas.", score: 3, draft_message: "Halo, boleh berdiskusi tentang design website? https://nakicode.xyz/", status: "reviewed", whatsapp_number: null, notes: null, checked_at: null, updated_at: "2026-01-01T01:00:00.000Z" };
beforeEach(() => { vi.restoreAllMocks(); vi.mocked(apiGet).mockResolvedValue({ leads: [lead] }); vi.mocked(apiDelete).mockResolvedValue({}); });
describe("research-only outreach", () => {
  it("keeps the bounded scroll panel and final prospect selectable", async () => {
    vi.mocked(apiGet).mockResolvedValue({ leads: Array.from({ length: 30 }, (_, index) => ({ ...lead, id: index + 1, business_name: `Bisnis Uji ${index + 1}` })) });
    render(<AdminOutreachSection />);
    const last = await screen.findByRole("button", { name: /Bisnis Uji 30/ });
    expect(screen.getByRole("region", { name: "Daftar prospek" })).toHaveClass("lg:h-[calc(100dvh-7rem)]", "lg:self-start", "flex-col");
    expect(last.parentElement).toHaveClass("min-h-0", "flex-1", "overflow-y-auto", "lg:max-h-none");
    fireEvent.click(last);
    expect(screen.getByRole("heading", { name: "Bisnis Uji 30" })).toBeInTheDocument();
  });
  it("saves a number without consent fields or sending controls", async () => {
    vi.mocked(apiPatch).mockResolvedValue({ lead: { ...lead, whatsapp_number: "6280000000000" } });
    render(<AdminOutreachSection />);
    await screen.findByRole("heading", { name: "Bisnis Uji" });
    expect(screen.queryByText(/Persetujuan WhatsApp|Kredensial Cloud API|dijadwalkan otomatis/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Waktu persetujuan|URL bukti persetujuan/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Buka WhatsApp|Kirim template WhatsApp|Siap kirim/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nomor WhatsApp"), { target: { value: "6280000000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));
    await screen.findByText("Perubahan tersimpan.");
    expect(apiPatch).toHaveBeenCalledWith("/api/admin/outreach/1", { status: "reviewed", draftMessage: lead.draft_message, notes: "", whatsappNumber: "6280000000000" });
  });
  it("cancels deletion without an API call", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AdminOutreachSection />);
    await screen.findByRole("heading", { name: "Bisnis Uji" });
    fireEvent.click(screen.getByRole("button", { name: "Hapus prospek" }));
    expect(apiDelete).not.toHaveBeenCalled();
  });
  it("deletes the selected prospect and selects the next", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(apiGet).mockResolvedValue({ leads: [lead, { ...lead, id: 2, business_name: "Bisnis Kedua" }] });
    render(<AdminOutreachSection />);
    await screen.findByRole("heading", { name: "Bisnis Uji" });
    fireEvent.click(screen.getByRole("button", { name: "Hapus prospek" }));
    await screen.findByRole("heading", { name: "Bisnis Kedua" });
    expect(apiDelete).toHaveBeenCalledWith("/api/admin/outreach/1");
    expect(screen.queryByRole("button", { name: /Bisnis Uji/ })).not.toBeInTheDocument();
  });
  it("shows the empty state after deleting the last prospect", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminOutreachSection />);
    await screen.findByRole("heading", { name: "Bisnis Uji" });
    fireEvent.click(screen.getByRole("button", { name: "Hapus prospek" }));
    await screen.findByText("Pilih prospek untuk melihat detailnya.");
    expect(screen.getByText("Belum ada prospek yang cocok dengan filter.")).toBeInTheDocument();
  });
  it("retains the prospect if deletion fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(apiDelete).mockRejectedValue(new Error("fixture"));
    render(<AdminOutreachSection />);
    await screen.findByRole("heading", { name: "Bisnis Uji" });
    fireEvent.click(screen.getByRole("button", { name: "Hapus prospek" }));
    await screen.findByText("Gagal menghapus prospek.");
    expect(screen.getByRole("heading", { name: "Bisnis Uji" })).toBeInTheDocument();
  });
});
