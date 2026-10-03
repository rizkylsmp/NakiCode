import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch } from "../../../services/api-client";
import { AdminOutreachSection } from "../AdminOutreachSection";
vi.mock("../../../services/api-client", () => ({ apiGet: vi.fn(), apiPatch: vi.fn(), apiPost: vi.fn(), apiDelete: vi.fn(), getApiErrorMessage: (_error: unknown, fallback: string) => fallback }));
const lead = { id: 1, business_name: "Bisnis Uji", category: "Jasa", city: "Kota Uji", external_key: "fixture.example", source_url: "https://fixture.example", evidence_url: "https://fixture.example/services", contact_url: "https://fixture.example/contact", observation: "Informasi layanan bisnis uji.", opportunity: "Halaman layanan dengan design yang jelas.", score: 3, draft_message: "Halo, boleh berdiskusi tentang design website? https://nakicode.xyz/", status: "reviewed", whatsapp_number: null, notes: null, checked_at: null, updated_at: "2026-01-01T01:00:00.000Z" };
beforeEach(() => { vi.restoreAllMocks(); vi.mocked(apiGet).mockResolvedValue({ leads: [lead] }); vi.mocked(apiDelete).mockResolvedValue({}); });
describe("research-only outreach", () => {
  it("offers registered niches with no prospects and hides filtered detail", async () => {
    vi.mocked(apiGet).mockImplementation(async path => path === "/api/categories/niches" ? { niches: [{ name: "Laundry" }, { name: "Shipping" }] } : { leads: [{ ...lead, category: "Jasa laundry" }] });
    render(<AdminOutreachSection />);
    await screen.findByRole("heading", { name: "Bisnis Uji" });
    expect(screen.getByRole("option", { name: "Shipping" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Filter niche" }), { target: { value: "Ekspedisi (Courier/Shipping)" } });
    expect(screen.queryByRole("heading", { name: "Bisnis Uji" })).not.toBeInTheDocument();
    expect(screen.getByText("Belum ada prospek yang cocok dengan filter.")).toBeInTheDocument();
  });
  it("keeps niche controls available while loading and after a load error", async () => {
    let rejectLoad!: (error: Error) => void;
    vi.mocked(apiGet).mockImplementation(path => path === "/api/categories/niches" ? Promise.resolve({ niches: [{ name: "Laundry" }] }) : new Promise((_resolve, reject) => { rejectLoad = reject; }));
    render(<AdminOutreachSection />);
    expect(screen.getByText("Memuat prospek...")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filter niche" })).toBeInTheDocument();
    await act(async () => rejectLoad(new Error("fixture")));
    expect(screen.getByText("Gagal memuat prospek.")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Laundry" })).toBeInTheDocument();
  });
  it("combines niche and status filters and supports unclassified prospects", async () => {
    vi.mocked(apiGet).mockImplementation(async path => path === "/api/categories/niches" ? { niches: [] } : { leads: [{ ...lead, category: "Jasa laundry" }, { ...lead, id: 2, business_name: "Cargo Uji", category: "Ekspedisi cargo", status: "new" }, { ...lead, id: 3, business_name: "Umum Uji" }] });
    render(<AdminOutreachSection />);
    await screen.findByRole("heading", { name: "Bisnis Uji" });
    fireEvent.change(screen.getByRole("combobox", { name: "Filter niche" }), { target: { value: "Ekspedisi (Courier/Shipping)" } });
    expect(screen.getByRole("button", { name: /Cargo Uji/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bisnis Uji/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Filter status" }), { target: { value: "reviewed" } });
    expect(screen.getByText("Belum ada prospek yang cocok dengan filter.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Filter niche" }), { target: { value: "unclassified" } });
    expect(screen.getByRole("button", { name: /Umum Uji/ })).toBeInTheDocument();
  });
  it("labels prospects from their category and searches by the registered niche", async () => {
    vi.mocked(apiGet).mockImplementation(async (path) => path === "/api/categories/niches" ? { niches: [{ name: "Laundry" }] } : { leads: [{ ...lead, category: "Jasa laundry" }] });
    render(<AdminOutreachSection />);
    await screen.findByRole("heading", { name: "Bisnis Uji" });
    const list = screen.getByRole("region", { name: "Daftar prospek" });
    expect(list).toHaveTextContent("Laundry");
    expect(screen.getByRole("region", { name: "Detail prospek" })).toHaveTextContent("Niche:");
    fireEvent.change(screen.getByRole("textbox", { name: "Cari prospek" }), { target: { value: "Laundry" } });
    expect(screen.getByRole("button", { name: /Bisnis Uji/ })).toBeInTheDocument();
  });
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
    const user = userEvent.setup();
    vi.mocked(apiPatch).mockResolvedValue({ lead: { ...lead, whatsapp_number: "6280000000000" } });
    render(<AdminOutreachSection />);
    await screen.findByRole("heading", { name: "Bisnis Uji" });
    expect(screen.queryByText(/Persetujuan WhatsApp|Kredensial Cloud API|dijadwalkan otomatis/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Waktu persetujuan|URL bukti persetujuan/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Buka WhatsApp|Kirim template WhatsApp|Siap kirim/)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Nomor WhatsApp"), "6280000000000");
    await user.click(screen.getByRole("button", { name: "Simpan perubahan" }));
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
