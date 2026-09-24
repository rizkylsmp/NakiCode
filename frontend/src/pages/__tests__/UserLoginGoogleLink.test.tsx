import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render";
import { userTokenKey } from "../../utils/user-session";
import { UserLoginPage } from "../UserLoginPage";

const apiPost = vi.hoisted(() => vi.fn());

vi.mock("../../services/api-client", async () => {
  const actual = await vi.importActual<
    typeof import("../../services/api-client")
  >("../../services/api-client");

  return {
    ...actual,
    apiPost,
    getApiErrorData: (error: { response?: { data?: unknown } }) =>
      error.response?.data,
    getApiErrorMessage: (
      error: { response?: { data?: { message?: string } } },
      fallback: string,
    ) => error.response?.data?.message ?? fallback,
    getApiErrorStatus: (error: { response?: { status?: number } }) =>
      error.response?.status,
  };
});

vi.mock("../../components/auth/GoogleSignInButton", () => ({
  GoogleSignInButton: ({
    onCredential,
  }: {
    onCredential: (credential: string) => void;
  }) => (
    <button
      onClick={() => onCredential("g".repeat(120))}
      type="button"
    >
      Simulasikan login Google
    </button>
  ),
}));

describe("UserLoginPage Google account linking", () => {
  beforeEach(() => {
    apiPost.mockReset();
    window.localStorage.clear();
  });

  it("asks for the existing password and binds Google to the same account", async () => {
    const user = userEvent.setup();
    apiPost
      .mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            code: "GOOGLE_ACCOUNT_LINK_REQUIRED",
            message: "Konfirmasi akun lama",
          },
        },
      })
      .mockResolvedValueOnce({
        token: "linked-user-token",
        user: {
          id: 8,
          username: "buyer",
          email: "buyer@yahoo.com",
          role: "user",
        },
      });

    renderWithProviders(<UserLoginPage />, { route: "/login" });

    await user.click(
      screen.getByRole("button", { name: "Simulasikan login Google" }),
    );

    expect(
      await screen.findByText("Hubungkan akun Google"),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Password akun Naki Code"),
      "ExistingPassword123!",
    );
    await user.click(
      screen.getByRole("button", { name: "Hubungkan & masuk" }),
    );

    await waitFor(() =>
      expect(apiPost).toHaveBeenLastCalledWith(
        "/api/auth/user/google/link",
        {
          credential: "g".repeat(120),
          password: "ExistingPassword123!",
        },
      ),
    );
    expect(window.localStorage.getItem(userTokenKey)).toBe(
      "linked-user-token",
    );
  });
});
