import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  KeyRound,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserPen,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { apiDelete, apiGet, apiPatch, getApiErrorMessage } from "../api-client";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { ProfileSkeleton } from "../components/skeletons/ProfileSkeleton";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "../user-session";

type UserProfile = {
  id: number;
  username: string;
  email: string;
  role?: "user" | "admin";
  emailVerifiedAt: string | null;
  emailVerificationSentAt: string | null;
};

type UserProfileResponse = {
  user: UserProfile;
};

type ProfileUpdateResponse = {
  message: string;
  user: UserProfile;
};

type DeleteAccountResponse = {
  message: string;
};

const defaultProfileForm = {
  username: "",
};

const defaultPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const defaultDeleteAccountForm = {
  currentPassword: "",
  confirmEmail: "",
};

const deleteAccountConfirmationText = "saya yakin akan menghapus akun ini";

export function UserProfilePage() {
  const navigate = useNavigate();
  const [userToken, setUserToken] = useState(() =>
    window.localStorage.getItem(userTokenKey),
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState(defaultProfileForm);
  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm);
  const [deleteAccountForm, setDeleteAccountForm] = useState(
    defaultDeleteAccountForm,
  );
  const [status, setStatus] = useState("Memuat profil akun...");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteDialogConfirmation, setDeleteDialogConfirmation] = useState("");

  useEffect(() => {
    function syncUserSession() {
      setUserToken(window.localStorage.getItem(userTokenKey));
    }

    window.addEventListener(userSessionEvent, syncUserSession);
    window.addEventListener("storage", syncUserSession);

    return () => {
      window.removeEventListener(userSessionEvent, syncUserSession);
      window.removeEventListener("storage", syncUserSession);
    };
  }, []);

  useEffect(() => {
    if (!userToken) {
      setProfile(null);
      setStatus("Login user diperlukan untuk melihat profil.");
      return;
    }

    void loadProfile();
  }, [userToken]);

  useEffect(() => {
    if (!isDeleteDialogOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDeleteDialogOpen]);

  async function loadProfile() {
    setIsLoading(true);
    setStatus("Memuat profil akun...");

    try {
      const data = await apiGet<UserProfileResponse>("/api/auth/user/me");
      setProfile(data.user);
      setProfileForm({ username: data.user.username });
      window.localStorage.setItem(userRoleKey, data.user.role ?? "user");
      setStatus("Profil akun berhasil dimuat.");
    } catch {
      setStatus("Gagal memuat profil. Silakan login ulang.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userToken || !profile) {
      setStatus("Login user diperlukan.");
      return;
    }

    const nextUsername = profileForm.username.trim();

    if (!nextUsername) {
      setStatus("Nama user wajib diisi.");
      return;
    }

    setIsSavingProfile(true);
    setStatus("Menyimpan nama akun...");

    try {
      const data = await apiPatch<ProfileUpdateResponse>("/api/auth/user/me", {
        username: nextUsername,
      });
      setProfile(data.user);
      setProfileForm({ username: data.user.username });
      window.localStorage.setItem(userUsernameKey, data.user.username);
      window.localStorage.setItem(userRoleKey, data.user.role ?? "user");
      window.dispatchEvent(new Event(userSessionEvent));
      setStatus("Nama akun berhasil diperbarui.");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal menyimpan profil."));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userToken || !profile) {
      setStatus("Login user diperlukan.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setStatus("Password baru minimal 6 karakter.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus("Konfirmasi password belum sama.");
      return;
    }

    setIsSavingPassword(true);
    setStatus("Menyimpan password baru...");

    try {
      const data = await apiPatch<ProfileUpdateResponse>("/api/auth/user/me", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setProfile(data.user);
      setPasswordForm(defaultPasswordForm);
      setStatus("Password berhasil diperbarui.");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal menyimpan password."));
    } finally {
      setIsSavingPassword(false);
    }
  }

  function submitDeleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userToken || !profile) {
      setStatus("Login user diperlukan.");
      return;
    }

    if (!deleteAccountForm.currentPassword) {
      setStatus("Password aktif wajib diisi untuk hapus akun.");
      return;
    }

    if (
      deleteAccountForm.confirmEmail.trim().toLowerCase() !==
      profile.email.toLowerCase()
    ) {
      setStatus("Konfirmasi email harus sama dengan email akun aktif.");
      return;
    }

    setIsDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    if (isDeletingAccount) {
      return;
    }

    setIsDeleteDialogOpen(false);
    setDeleteDialogConfirmation("");
  }

  async function confirmDeleteAccount() {
    if (!userToken || !profile) {
      setStatus("Login user diperlukan.");
      closeDeleteDialog();
      return;
    }

    if (
      deleteDialogConfirmation.trim().toLowerCase() !==
      deleteAccountConfirmationText
    ) {
      setStatus(
        "Ketik kalimat konfirmasi dengan benar sebelum menghapus akun.",
      );
      return;
    }

    setIsDeletingAccount(true);
    setStatus("Menghapus akun...");

    try {
      await apiDelete<DeleteAccountResponse>("/api/auth/user/me", {
        data: {
          currentPassword: deleteAccountForm.currentPassword,
          confirmEmail: deleteAccountForm.confirmEmail,
        },
      });

      clearUserSession();
      setProfile(null);
      setUserToken(null);
      setDeleteAccountForm(defaultDeleteAccountForm);
      setDeleteDialogConfirmation("");
      setIsDeleteDialogOpen(false);
      navigate("/login");
    } catch (error) {
      setStatus(getApiErrorMessage(error, "Gagal menghapus akun."));
    } finally {
      setIsDeletingAccount(false);
    }
  }

  function clearUserSession() {
    window.localStorage.removeItem(userTokenKey);
    window.localStorage.removeItem(userUsernameKey);
    window.localStorage.removeItem(userRoleKey);
    window.dispatchEvent(new Event(userSessionEvent));
  }

  function handleLogout() {
    clearUserSession();
    setProfile(null);
    setUserToken(null);
    navigate("/login");
  }

  if (!userToken) {
    return (
      <main className="naki-frosted-grid bg-naki-page-bg min-h-screen text-naki-primary">
        <Header />
        <section className="grid min-h-[76vh] place-items-center px-5 py-16 md:px-8 xl:px-12 2xl:px-16">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="bg-naki-primary px-6 py-7 text-naki-frost">
              <span className="grid size-12 place-items-center rounded-lg bg-naki-secondary">
                <UserRound size={22} />
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-tight text-naki-frost">
                Profil akun
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-naki-frost/80">
                Masuk untuk melihat akun terhubung, status verifikasi, pesanan,
                dan pengaturan keamanan.
              </p>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="rounded-xl bg-naki-frost p-4">
                <Mail className="text-naki-secondary" size={20} />
                <p className="mt-3 text-sm font-semibold">Email verification</p>
                <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
                  OTP email menjaga akun tetap terikat ke pemilik aslinya.
                </p>
              </div>
              <div className="rounded-xl bg-naki-frost p-4">
                <ShieldCheck className="text-naki-secondary" size={20} />
                <p className="mt-3 text-sm font-semibold">Account security</p>
                <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
                  Ubah password, pantau status akun, dan kelola sesi login.
                </p>
              </div>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-naki-frost transition hover:bg-naki-primary/90 sm:col-span-2"
                to="/login?next=%2Fakun-saya"
              >
                <KeyRound size={16} />
                Login user
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="naki-frosted-grid bg-naki-page-bg min-h-screen text-naki-primary">
      <Header />

      <section className="mx-auto max-w-7xl w-full px-5 py-8 md:px-8 xl:px-12 2xl:px-16">
        {/* Header bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-naki-secondary transition hover:text-naki-primary"
            to="/"
          >
            <ArrowLeft size={16} />
            Kembali ke storefront
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:text-naki-smoke"
              disabled={isLoading}
              onClick={() => void loadProfile()}
              type="button"
            >
              <RefreshCw size={16} />
              {isLoading ? "Memuat..." : "Refresh"}
            </button>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-naki-primary px-4 text-sm font-semibold text-naki-frost transition hover:bg-naki-primary/90"
              to="/pesanan-saya"
            >
              <ShoppingBag size={16} />
              Pesanan saya
            </Link>
          </div>
        </div>

        {isLoading ? (
          <ProfileSkeleton />
        ) : profile ? (
          <div className="mt-8 grid gap-6 md:grid-cols-[0.86fr_1.14fr]">
            {/* Left column */}
            <aside className="grid gap-5">
              {/* Profile card */}
              <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="bg-naki-primary p-6 md:p-7 text-naki-frost">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-naki-secondary text-naki-frost">
                        <UserRound size={28} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase text-naki-frost/70">
                          Akun aktif
                        </p>
                        <h1 className="mt-1 break-words text-3xl font-bold leading-tight text-naki-frost">
                          {profile.username}
                        </h1>
                        <p className="mt-2 break-words text-sm font-medium text-naki-frost/75">
                          {profile.email}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      isVerified={Boolean(profile.emailVerifiedAt)}
                    />
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <ProfileInfo label="Role" value={profile.role ?? "user"} />
                    <ProfileInfo
                      label="Verifikasi"
                      value={profile.emailVerifiedAt ? "Aktif" : "Pending"}
                    />
                    <ProfileInfo label="Login" value="Email / username" />
                  </div>
                </div>

                {/* Email verification footer */}
                <div className="bg-naki-frost p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-naki-primary">
                    <ShieldCheck size={17} />
                    Email verification
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
                    {profile.emailVerifiedAt
                      ? `Terverifikasi pada ${formatDate(profile.emailVerifiedAt)}.`
                      : "Akun ini belum diverifikasi."}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-naki-smoke">
                    {profile.emailVerificationSentAt
                      ? `Verifikasi terakhir dikirim pada ${formatDate(profile.emailVerificationSentAt)}.`
                      : "Belum ada riwayat pengiriman verifikasi."}
                  </p>
                </div>
              </section>

              {/* Account info card */}
              <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-naki-frost text-naki-secondary">
                    <Mail size={19} />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold leading-tight">Account bind</h2>
                    <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
                      Akun ini terikat ke email dan username untuk order,
                      rating, dan akses profil.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  <AccountRow label="Username" value={profile.username} />
                  <AccountRow label="Email" value={profile.email} />
                  <AccountRow
                    label="Status"
                    value={
                      profile.emailVerifiedAt
                        ? "Sudah terverifikasi"
                        : "Belum terverifikasi"
                    }
                  />
                </div>
                <button
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut size={16} />
                  Logout akun
                </button>
              </section>
            </aside>

            {/* Right column — settings forms */}
            <section className="grid gap-5">
              {/* Section header */}
              <div className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase text-naki-smoke">
                      Pengaturan akun
                    </p>
                    <h2 className="mt-1 text-2xl font-bold leading-tight">
                      Profil saya
                    </h2>
                  </div>
                  <p className="rounded-xl bg-naki-frost px-4 py-3 text-sm font-medium text-naki-smoke">
                    {status}
                  </p>
                </div>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-naki-smoke">
                  Kelola nama tampilan, password, dan opsi akun permanen dari
                  satu tempat.
                </p>
              </div>

              {/* Change username */}
              <FormPanel
                description="Nama ini dipakai di dashboard, profil, flow order, dan rating buyer."
                icon={<UserPen size={18} />}
                title="Ubah nama akun"
              >
                <form className="grid gap-4" onSubmit={submitProfile}>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-naki-smoke">Nama user</span>
                    <input
                      className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none transition focus:border-blue-400"
                      value={profileForm.username}
                      onChange={(event) =>
                        setProfileForm({ username: event.target.value })
                      }
                      required
                      type="text"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-naki-smoke">Email terdaftar</span>
                    <input
                      className="h-11 w-full rounded-lg border border-naki-steel bg-naki-frost px-3 text-sm text-naki-smoke outline-none cursor-default"
                      value={profile.email}
                      readOnly
                      type="email"
                    />
                  </label>
                  <button
                    className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-naki-frost transition hover:bg-naki-primary/90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
                    disabled={isSavingProfile}
                    type="submit"
                  >
                    <BadgeCheck size={16} />
                    {isSavingProfile ? "Menyimpan..." : "Simpan nama"}
                  </button>
                </form>
              </FormPanel>

              {/* Change password */}
              <FormPanel
                description="Gunakan password saat ini lalu set password baru minimal 6 karakter."
                icon={<ShieldCheck size={18} />}
                title="Ubah password"
              >
                <form className="grid gap-4" onSubmit={submitPassword}>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-naki-smoke">Password saat ini</span>
                      <input
                        className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none transition focus:border-blue-400"
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            currentPassword: event.target.value,
                          }))
                        }
                        required
                        type="password"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-naki-smoke">Password baru</span>
                      <input
                        className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none transition focus:border-blue-400"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            newPassword: event.target.value,
                          }))
                        }
                        minLength={6}
                        required
                        type="password"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-naki-smoke">Konfirmasi password</span>
                      <input
                        className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none transition focus:border-blue-400"
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        minLength={6}
                        required
                        type="password"
                      />
                    </label>
                  </div>
                  <button
                    className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-naki-primary px-5 text-sm font-semibold text-naki-frost transition hover:bg-naki-primary/90 disabled:cursor-not-allowed disabled:bg-naki-smoke"
                    disabled={isSavingPassword}
                    type="submit"
                  >
                    <KeyRound size={16} />
                    {isSavingPassword ? "Menyimpan..." : "Simpan password"}
                  </button>
                </form>
              </FormPanel>

              {/* Delete account */}
              <FormPanel
                description="Akun akan dihapus permanen. Data order dan rating tetap disimpan sebagai riwayat transaksi tanpa bind akun."
                icon={<Trash2 size={18} />}
                tone="danger"
                title="Delete account"
              >
                <form
                  className="grid gap-4"
                  autoComplete="off"
                  id="delete-account"
                  onSubmit={submitDeleteAccount}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-naki-smoke">Password aktif</span>
                      <input
                        className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none transition focus:border-blue-400"
                        autoComplete="new-password"
                        name="delete-account-current-password"
                        value={deleteAccountForm.currentPassword}
                        onChange={(event) =>
                          setDeleteAccountForm((current) => ({
                            ...current,
                            currentPassword: event.target.value,
                          }))
                        }
                        required
                        type="password"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-naki-smoke">Ketik email akun</span>
                      <input
                        className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none transition focus:border-blue-400"
                        autoComplete="off"
                        name="delete-account-confirm-email"
                        placeholder={profile.email}
                        value={deleteAccountForm.confirmEmail}
                        onChange={(event) =>
                          setDeleteAccountForm((current) => ({
                            ...current,
                            confirmEmail: event.target.value,
                          }))
                        }
                        required
                        type="email"
                      />
                    </label>
                  </div>
                  <button
                    className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-naki-frost transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-naki-smoke"
                    disabled={isDeletingAccount}
                    type="submit"
                  >
                    <Trash2 size={16} />
                    {isDeletingAccount ? "Menghapus..." : "Lanjut hapus akun"}
                  </button>
                </form>
              </FormPanel>
            </section>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm text-sm font-medium text-naki-smoke">
            {status}
          </div>
        )}
      </section>

      {profile && isDeleteDialogOpen ? (
        <DeleteAccountDialog
          email={profile.email}
          confirmationText={deleteDialogConfirmation}
          isDeleting={isDeletingAccount}
          onCancel={closeDeleteDialog}
          onConfirmationTextChange={setDeleteDialogConfirmation}
          onConfirm={() => void confirmDeleteAccount()}
        />
      ) : null}

      <Footer />
    </main>
  );
}

type ProfileInfoProps = {
  label: string;
  value: string;
};

type StatusBadgeProps = {
  isVerified: boolean;
};

function StatusBadge({ isVerified }: StatusBadgeProps) {
  return (
    <span className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-naki-frost/20 px-3 text-xs font-medium uppercase text-naki-frost">
      <BadgeCheck size={15} />
      {isVerified ? "Verified" : "Pending"}
    </span>
  );
}

function ProfileInfo({ label, value }: ProfileInfoProps) {
  return (
    <div className="rounded-xl bg-naki-frost p-3">
      <p className="text-xs font-medium uppercase text-naki-smoke">{label}</p>
      <p className="mt-1 text-sm font-semibold text-naki-primary">{value}</p>
    </div>
  );
}

function AccountRow({ label, value }: ProfileInfoProps) {
  return (
    <div className="flex flex-col gap-1 border-t border-naki-steel pt-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium uppercase text-naki-smoke">{label}</p>
      <p className="break-words text-sm font-medium text-naki-primary sm:text-right">
        {value}
      </p>
    </div>
  );
}

type FormPanelProps = {
  children: React.ReactNode;
  description: string;
  icon: React.ReactNode;
  title: string;
  tone?: "default" | "danger";
};

type DeleteAccountDialogProps = {
  confirmationText: string;
  email: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirmationTextChange: (value: string) => void;
  onConfirm: () => void;
};

function DeleteAccountDialog({
  confirmationText,
  email,
  isDeleting,
  onCancel,
  onConfirmationTextChange,
  onConfirm,
}: DeleteAccountDialogProps) {
  const isConfirmationValid =
    confirmationText.trim().toLowerCase() === deleteAccountConfirmationText;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-naki-primary/70 px-5 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-naki-steel bg-naki-frost p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-red-100 text-red-500">
              <CircleAlert size={21} />
            </span>
            <div>
              <h2
                className="text-2xl font-bold leading-tight text-naki-primary"
                id="delete-account-title"
              >
                Yakin hapus akun permanen?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
                Akun dengan email {email} akan dihapus dan sesi login akan
                berakhir.
              </p>
            </div>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-naki-steel bg-white text-naki-secondary transition hover:border-naki-smoke disabled:cursor-not-allowed"
            disabled={isDeleting}
            onClick={onCancel}
            type="button"
            aria-label="Tutup dialog"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <div className="rounded-xl bg-naki-frost p-4">
            <p className="text-sm font-semibold text-naki-primary">
              Sebelum lanjut, pastikan:
            </p>
            <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-naki-smoke">
              <li>Password aktif sudah benar.</li>
              <li>Email konfirmasi sudah sama dengan email akun.</li>
              <li>
                Ketik kalimat konfirmasi persis sebelum tombol hapus aktif.
              </li>
              <li>Aksi ini tidak bisa dibatalkan dari aplikasi.</li>
            </ul>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-naki-smoke">
              Ketik: {deleteAccountConfirmationText}
            </span>
            <input
              className="h-11 w-full rounded-lg border border-naki-steel bg-naki-page-bg px-3 text-sm outline-none transition focus:border-blue-400"
              autoComplete="off"
              name="delete-account-final-confirmation"
              value={confirmationText}
              onChange={(event) => onConfirmationTextChange(event.target.value)}
              placeholder={deleteAccountConfirmationText}
              type="text"
            />
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-naki-steel bg-white px-4 text-sm font-medium text-naki-primary transition hover:bg-naki-frost disabled:cursor-not-allowed disabled:text-naki-smoke"
              disabled={isDeleting}
              onClick={onCancel}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-naki-frost transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-naki-smoke"
              disabled={isDeleting || !isConfirmationValid}
              onClick={onConfirm}
              type="button"
            >
              <Trash2 size={16} />
              {isDeleting ? "Menghapus..." : "Ya, hapus permanen"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FormPanel({
  children,
  description,
  icon,
  title,
  tone = "default",
}: FormPanelProps) {
  const iconClass =
    tone === "danger"
      ? "bg-red-100 text-red-500"
      : "bg-naki-frost text-naki-secondary";
  const borderClass =
    tone === "danger" ? "border-red-200" : "";

  return (
    <section
      className={`rounded-2xl bg-white p-5 shadow-sm md:p-6 ${borderClass ? `border ${borderClass}` : ""}`}
    >
      <div className="mb-5 flex items-start gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${iconClass}`}
        >
          {icon}
        </span>
        <div>
          <h2 className="text-xl font-bold leading-tight">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-naki-smoke">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
