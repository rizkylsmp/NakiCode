import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { useAuth } from "../contexts/auth-context";

export function NotFoundPage() {
  const { isAdmin } = useAuth();

  return (
    <main className="naki-frosted-grid min-h-screen text-naki-primary">
      <Header />
      <section className="grid min-h-[76vh] place-items-center px-5 py-12 md:px-8 xl:px-12 2xl:px-16">
        <div className="w-full max-w-md rounded-xl border border-naki-steel bg-naki-frost p-6 text-center shadow-naki-soft">
          <span className="mx-auto grid size-16 place-items-center rounded-lg bg-naki-warn text-naki-frost">
            <AlertTriangle size={28} />
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight text-naki-primary">
            404
          </h1>
          <p className="mt-3 text-lg font-semibold text-naki-smoke">
            Halaman tidak ditemukan
          </p>
          <p className="mt-2 text-sm font-medium text-naki-smoke">
            Halaman yang Anda cari tidak ada atau sudah dipindahkan.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
              to="/"
            >
              <ArrowLeft size={16} />
              Kembali ke Beranda
            </Link>
            {isAdmin && (
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-naki-steel px-5 text-sm font-black text-naki-primary transition hover:border-naki-smoke"
                to="/admin/dashboard"
              >
                Dashboard Admin
              </Link>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
