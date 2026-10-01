import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { useAuth } from "../contexts/auth-context";
import { apiPost, getApiErrorMessage } from "../services/api-client";
import {
  clearClientInvitationToken,
  readClientInvitationToken,
} from "../utils/client-invitation";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../utils/user-session";

type Invitation = {
  customerName: string;
  emailHint: string;
  projectTitle: string;
  expiresAt: string;
  existingAccount: boolean;
};
export function ClientInvitationPage() {
  const [token] = useState(readClientInvitationToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["client-invitation"],
    queryFn: () =>
      apiPost<Invitation>("/api/auth/client-invitations/inspect", { token }),
    enabled: Boolean(token),
    retry: false,
    gcTime: 0,
    staleTime: 0,
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.data || !acceptTerms) return;
    if (!query.data.existingAccount && password !== confirmPassword) {
      setStatus("Konfirmasi password tidak cocok.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const result = await apiPost<{
        token: string;
        user: { username: string; role: string };
        orderId: number;
      }>("/api/auth/client-invitations/claim", {
        token,
        acceptTerms,
        ...(query.data.existingAccount ? {} : { password }),
      });
      localStorage.setItem(userTokenKey, result.token);
      localStorage.setItem(userUsernameKey, result.user.username);
      localStorage.setItem(userRoleKey, result.user.role);
      window.dispatchEvent(new Event(userSessionEvent));
      clearClientInvitationToken();
      navigate(`/pesanan-saya?orderId=${result.orderId}`, { replace: true });
    } catch (error) {
      setStatus(
        getApiErrorMessage(error, "Undangan tidak dapat diproses. Coba lagi."),
      );
      await query.refetch();
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <Helmet>
        <title>Client invitation | Naki Code</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      <Header />
      <main
        id="main-content"
        className="mx-auto w-full max-w-xl px-4 py-12 sm:py-20"
      >
        <section className="rounded-2xl border border-naki-steel bg-white p-5 sm:p-8">
          <h1 className="text-2xl font-bold text-naki-primary">
            Undangan pesanan
          </h1>
          <p className="mt-2 text-sm text-naki-smoke">
            Buat akun untuk melacak progres dan pembayaran pesananmu.
          </p>
          {!token ? (
            <p role="alert" className="mt-6 text-sm text-red-600">
              Tautan undangan tidak valid.
            </p>
          ) : query.isPending ? (
            <p role="status" className="mt-6">
              Memuat undangan...
            </p>
          ) : query.error ? (
            <p role="alert" className="mt-6 text-sm text-red-600">
              {getApiErrorMessage(
                query.error,
                "Undangan tidak tersedia atau sudah digunakan.",
              )}
            </p>
          ) : query.data ? (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="rounded-xl bg-naki-frost p-4 text-sm text-naki-primary">
                <p data-no-translate>{query.data.customerName}</p>
                <p data-no-translate className="mt-1 font-semibold">
                  {query.data.projectTitle}
                </p>
                <p className="mt-1 text-naki-smoke" data-no-translate>
                  {query.data.emailHint}
                </p>
              </div>
              {query.data.existingAccount ? (
                <>
                  <p className="text-sm text-naki-smoke">
                    Email ini sudah terdaftar. Login ke akun tersebut; password
                    tidak akan diubah.
                  </p>
                  {!auth.isAuthenticated || auth.isAdmin ? (
                    <Link
                      className="inline-flex min-h-11 items-center rounded-lg bg-naki-primary px-4 text-white"
                      to="/login?next=%2Fclient-invitation"
                    >
                      Login ke akun klien
                    </Link>
                  ) : (
                    <p className="text-sm text-naki-smoke">
                      Pesanan hanya bisa diterima oleh akun dengan email yang
                      sesuai.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-naki-primary">
                    Password baru
                    <input
                      required
                      minLength={8}
                      maxLength={200}
                      autoComplete="new-password"
                      type="password"
                      className="mt-2 w-full rounded-lg border border-naki-steel bg-white p-3"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                  <label className="block text-sm font-medium text-naki-primary">
                    Konfirmasi password
                    <input
                      required
                      minLength={8}
                      maxLength={200}
                      autoComplete="new-password"
                      type="password"
                      className="mt-2 w-full rounded-lg border border-naki-steel bg-white p-3"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                    />
                  </label>
                  <p className="text-xs text-naki-smoke">
                    Gunakan password unik minimal 8 karakter dengan kombinasi
                    yang kuat.
                  </p>
                </>
              )}
              <label className="flex items-start gap-3 text-sm text-naki-smoke">
                <input
                  className="mt-1 size-4 shrink-0"
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                />
                <span>
                  Saya menyetujui{" "}
                  <Link
                    className="underline"
                    to="/syarat-ketentuan"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Syarat dan Ketentuan
                  </Link>{" "}
                  dan{" "}
                  <Link
                    className="underline"
                    to="/kebijakan-privasi"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Kebijakan Privasi
                  </Link>
                  .
                </span>
              </label>
              {status && (
                <p role="alert" className="text-sm text-red-600">
                  {status}
                </p>
              )}
              <button
                disabled={
                  saving ||
                  !acceptTerms ||
                  (query.data.existingAccount &&
                    (!auth.isAuthenticated || auth.isAdmin))
                }
                type="submit"
                className="min-h-11 w-full rounded-lg bg-naki-primary px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Memproses..."
                  : query.data.existingAccount
                    ? "Terima pesanan"
                    : "Buat akun dan lihat pesanan"}
              </button>
            </form>
          ) : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
