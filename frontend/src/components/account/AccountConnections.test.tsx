import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountConnections } from "./AccountConnections";
const post = vi.hoisted(() => vi.fn());
vi.mock("../../services/api-client", () => ({
  apiPost: post,
  getApiErrorMessage: (_: unknown, message: string) => message,
}));
const profile = {
  id: 7,
  username: "client",
  email: "client@example.com",
  role: "user" as const,
  googleLinked: true,
  emailVerifiedAt: "2026-10-03",
  emailVerificationSentAt: null,
};
beforeEach(() => vi.clearAllMocks());
describe("AccountConnections", () => {
  it("requires password and acknowledgement before unbinding", () => {
    render(<AccountConnections profile={profile} onUpdate={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Lepas koneksi" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Password konfirmasi unbind"), {
      target: { value: "password" },
    });
    expect(
      screen.getByRole("button", { name: "Lepas koneksi" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: "Lepas koneksi" })).toBeEnabled();
  });
  it("updates the profile and clears the password after email removal", async () => {
    const update = vi.fn();
    const detached = { ...profile, email: "", googleLinked: false };
    post.mockResolvedValue({
      user: detached,
      message: "Koneksi akun berhasil dilepas.",
    });
    render(<AccountConnections profile={profile} onUpdate={update} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "email" },
    });
    expect(
      screen.getByText(/Reset password dan pengiriman invoice/),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Password konfirmasi unbind"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Lepas koneksi" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith(detached));
    expect(post).toHaveBeenCalledWith("/api/auth/user/me/unbind", {
      target: "email",
      currentPassword: "password",
      acknowledge: true,
    });
    expect(screen.getByLabelText("Password konfirmasi unbind")).toHaveValue("");
  });
  it("keeps the profile on failure and clears sensitive input", async () => {
    post.mockRejectedValue(new Error("failed"));
    const update = vi.fn();
    render(<AccountConnections profile={profile} onUpdate={update} />);
    fireEvent.change(screen.getByLabelText("Password konfirmasi unbind"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Lepas koneksi" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Gagal melepas koneksi akun.",
      ),
    );
    expect(update).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Password konfirmasi unbind")).toHaveValue("");
  });
  it("disables already detached connections", () => {
    render(
      <AccountConnections
        profile={{ ...profile, email: "", googleLinked: false }}
        onUpdate={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Lepas koneksi" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Koneksi ini sudah tidak terhubung."),
    ).toBeInTheDocument();
  });
});
