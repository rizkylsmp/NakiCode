import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Naki Code UI error", error, errorInfo);

    // A new deploy changes asset hashes; clients holding a stale index.html
    // request chunks that no longer exist. Reload once to pull the new build.
    if (
      /Failed to fetch dynamically imported module|error loading dynamically imported module|MIME type/i.test(
        error.message,
      )
    ) {
      if (!sessionStorage.getItem("naki-chunk-reloaded")) {
        sessionStorage.setItem("naki-chunk-reloaded", "1");
        window.location.reload();
        return;
      }
    }

    if (import.meta.env.VITE_SENTRY_DSN) {
      void import("@sentry/react").then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="naki-frosted-grid grid min-h-screen place-items-center px-5 text-center text-naki-primary">
          <div className="max-w-md rounded-xl border border-naki-steel bg-naki-frost p-8 shadow-naki-card">
            {/* Error Icon */}
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-naki-steel">
              <svg
                className="text-naki-secondary"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            
            <p className="mt-5 text-sm font-black uppercase tracking-wide text-naki-secondary">
              Terjadi Kesalahan
            </p>
            <h1 className="mt-2 text-3xl font-black">Halaman gagal dimuat</h1>
            <p className="mt-4 text-sm font-semibold leading-7 text-naki-smoke">
              Terjadi error saat memuat halaman. Error sudah dilaporkan ke tim kami. 
              Coba refresh halaman atau kembali ke katalog.
            </p>
            
            <div className="mt-6 grid gap-3">
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg bg-naki-secondary px-5 text-sm font-black text-naki-frost transition hover:bg-naki-primary"
                onClick={() => window.location.reload()}
                type="button"
              >
                Refresh Halaman
              </button>
              <a
                className="inline-flex h-11 items-center justify-center rounded-lg border border-naki-steel px-5 text-sm font-black text-naki-primary transition hover:border-naki-secondary hover:text-naki-secondary"
                href="/"
              >
                Kembali ke Home
              </a>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
