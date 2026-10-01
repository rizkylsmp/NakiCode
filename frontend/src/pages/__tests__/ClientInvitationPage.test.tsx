import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiPost } from "../../services/api-client";
import { ClientInvitationPage } from "../ClientInvitationPage";
import {
  clearClientInvitationToken,
  readClientInvitationToken,
} from "../../utils/client-invitation";
import { userTokenKey } from "../../utils/user-session";

vi.mock("../../components/layout/Header", () => ({ Header: () => null }));
vi.mock("../../components/layout/Footer", () => ({ Footer: () => null }));
vi.mock("../../contexts/auth-context", () => ({
  useAuth: () => ({ isAuthenticated: false, isAdmin: false }),
}));
vi.mock("../../services/api-client", () => ({
  apiPost: vi.fn(),
  getApiErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
}));
const invitation = {
  customerName: "QA Client",
  projectTitle: "Company site",
  emailHint: "qa***@example.com",
  expiresAt: "2026-10-04T00:00:00Z",
  existingAccount: false,
};
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  clearClientInvitationToken();
  sessionStorage.setItem("naki-client-invitation", "a".repeat(43));
});
function mount() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <HelmetProvider>
        <MemoryRouter initialEntries={["/client-invitation"]}>
          <Routes>
            <Route
              path="/client-invitation"
              element={<ClientInvitationPage />}
            />
            <Route path="/pesanan-saya" element={<p>Tracking pesanan</p>} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>,
  );
}
describe("client invitation page", () => {
  it("does not call the API without an invitation token", () => {
    clearClientInvitationToken();
    mount();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tautan undangan tidak valid.",
    );
    expect(apiPost).not.toHaveBeenCalled();
  });
  it("shows loading and then the invitation details", async () => {
    vi.mocked(apiPost).mockResolvedValue(invitation);
    mount();
    expect(screen.getByRole("status")).toHaveTextContent("Memuat undangan...");
    await screen.findByText("Company site");
    expect(
      screen.getByRole("button", { name: "Buat akun dan lihat pesanan" }),
    ).toBeDisabled();
  });
  it("explains an expired invitation without showing a claim form", async () => {
    vi.mocked(apiPost).mockRejectedValue(new Error("Undangan kedaluwarsa."));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Undangan kedaluwarsa.",
    );
    expect(screen.queryByLabelText("Password baru")).not.toBeInTheDocument();
  });
  it("requires existing clients to sign in rather than overwrite their password", async () => {
    vi.mocked(apiPost).mockResolvedValue({
      ...invitation,
      existingAccount: true,
    });
    mount();
    expect(
      await screen.findByRole("link", { name: "Login ke akun klien" }),
    ).toHaveAttribute("href", "/login?next=%2Fclient-invitation");
    expect(screen.queryByLabelText("Password baru")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Terima pesanan" }),
    ).toBeDisabled();
  });
  it("blocks mismatched passwords without claiming the order", async () => {
    vi.mocked(apiPost).mockResolvedValue(invitation);
    mount();
    fireEvent.change(await screen.findByLabelText("Password baru"), {
      target: { value: "Strong-example-password1!" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi password"), {
      target: { value: "Different-password1!" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "Buat akun dan lihat pesanan" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Konfirmasi password tidak cocok.",
    );
    expect(apiPost).toHaveBeenCalledTimes(1);
  });
  it("removes the invitation token and opens tracking after a successful claim", async () => {
    vi.mocked(apiPost)
      .mockResolvedValueOnce(invitation)
      .mockResolvedValueOnce({
        token: "signed-session",
        user: { username: "client", role: "user" },
        orderId: 23,
      });
    mount();
    fireEvent.change(await screen.findByLabelText("Password baru"), {
      target: { value: "Strong-example-password1!" },
    });
    fireEvent.change(screen.getByLabelText("Konfirmasi password"), {
      target: { value: "Strong-example-password1!" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: "Buat akun dan lihat pesanan" }),
    );
    await waitFor(() =>
      expect(screen.getByText("Tracking pesanan")).toBeInTheDocument(),
    );
    expect(localStorage.getItem(userTokenKey)).toBe("signed-session");
    expect(readClientInvitationToken()).toBe("");
    expect(apiPost).toHaveBeenLastCalledWith(
      "/api/auth/client-invitations/claim",
      {
        token: "a".repeat(43),
        acceptTerms: true,
        password: "Strong-example-password1!",
      },
    );
  });
});
