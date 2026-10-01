import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiPost } from "../../../services/api-client";
import { CreateClientOrderModal } from "../CreateClientOrderModal";
import { LanguageProvider } from "../../../i18n/language";
vi.mock("../../../services/api-client", () => ({ apiPost: vi.fn(), getApiErrorMessage: (_error: unknown, fallback: string) => fallback }));
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });
function fill() {
  fireEvent.change(screen.getByLabelText("Nama klien"), { target: { value: "QA Client" } });
  fireEvent.change(screen.getByLabelText("Email klien"), { target: { value: "qa@example.com" } });
  fireEvent.change(screen.getByLabelText("Kontak WhatsApp"), { target: { value: "628123456" } });
  fireEvent.change(screen.getByLabelText("Judul project"), { target: { value: "Company website" } });
  fireEvent.change(screen.getByLabelText("Brief project"), { target: { value: "Build a company website" } });
}
describe("external client order form", () => {
  it("uses the six budget ranges and explains the copy-link fallback when email fails", async () => {
    vi.mocked(apiPost).mockResolvedValue({ order: { id: 1 }, invitationUrl: "https://example.com/client-invitation#token=private", existingAccount: false, emailSent: false, expiresAt: "2026-10-04" });
    const created = vi.fn();
    render(<LanguageProvider><CreateClientOrderModal onClose={vi.fn()} onCreated={created} /></LanguageProvider>);
    expect(screen.getAllByRole("option")).toHaveLength(8);
    expect(screen.getByLabelText("Budget")).toHaveValue("< Rp 1Jt");
    fill(); fireEvent.click(screen.getByRole("button", { name: "Buat order dan undangan" }));
    await waitFor(() => expect(created).toHaveBeenCalledOnce());
    expect(screen.getByText("Email gagal dikirim. Salin tautan untuk dikirim manual ke klien.")).toBeInTheDocument();
    expect(screen.getByLabelText("Tautan klien")).toHaveValue("https://example.com/client-invitation#token=private");
  });
  it("keeps client input when creation fails", async () => {
    vi.mocked(apiPost).mockRejectedValue(new Error("Network failed"));
    render(<CreateClientOrderModal onClose={vi.fn()} onCreated={vi.fn()} />);
    fill(); fireEvent.click(screen.getByRole("button", { name: "Buat order dan undangan" }));
    await screen.findByText("Gagal membuat order klien. Coba lagi.");
    expect(screen.getByLabelText("Judul project")).toHaveValue("Company website");
    expect(screen.getByRole("button", { name: "Buat order dan undangan" })).toBeEnabled();
  });
});
