import { useEffect, useRef, useState } from "react";
import { GoogleBrandIcon } from "../ui/BrandIcons";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
};

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type: "standard";
              theme: "outline";
              size: "large";
              text: "continue_with";
              shape: "pill";
              logo_alignment: "left";
              locale: "id";
              width: number;
            },
          ) => void;
        };
      };
    };
  }
}

const googleScriptId = "google-identity-services";
let initializedClientId: string | null = null;
let activeCredentialHandler: ((credential: string) => void) | null = null;
let activeErrorHandler: ((message: string) => void) | null = null;

function initializeGoogleIdentity(
  clientId: string,
  onCredential: (credential: string) => void,
  onError: (message: string) => void,
) {
  const googleId = window.google?.accounts.id;
  if (!googleId) return null;

  activeCredentialHandler = onCredential;
  activeErrorHandler = onError;

  if (initializedClientId !== clientId) {
    googleId.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          activeCredentialHandler?.(response.credential);
        } else {
          activeErrorHandler?.("Google tidak mengirim kredensial login.");
        }
      },
    });
    initializedClientId = clientId;
  }

  return googleId;
}

export function GoogleSignInButton({
  disabled = false,
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(Boolean(window.google));
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (!clientId || window.google) {
      setIsReady(Boolean(window.google));
      return;
    }

    const existingScript = document.getElementById(
      googleScriptId,
    ) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");
    const handleLoad = () => setIsReady(true);
    const handleError = () =>
      onError("Layanan Google belum dapat dimuat. Silakan coba lagi.");

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    if (!existingScript) {
      script.id = googleScriptId;
      script.src = "https://accounts.google.com/gsi/client?hl=id";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [clientId, onError]);

  useEffect(() => {
    const container = containerRef.current;

    if (!clientId || !container || !isReady || !window.google || disabled) {
      return;
    }

    const googleId = initializeGoogleIdentity(clientId, onCredential, onError);
    if (!googleId) return;

    const render = () => {
      container.replaceChildren();
      googleId.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        locale: "id",
        width: Math.max(220, Math.min(400, container.clientWidth)),
      });
    };

    render();
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(render);
    resizeObserver?.observe(container);

    return () => {
      resizeObserver?.disconnect();
      if (activeCredentialHandler === onCredential) {
        activeCredentialHandler = null;
      }
      if (activeErrorHandler === onError) {
        activeErrorHandler = null;
      }
    };
  }, [clientId, disabled, isReady, onCredential, onError]);

  if (!clientId) {
    return (
      <button
        className="naki-auth-google-action flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-full border border-naki-steel bg-naki-page-bg text-sm font-semibold text-naki-smoke"
        disabled
        type="button"
        title="Atur VITE_GOOGLE_CLIENT_ID untuk mengaktifkan login Google"
      >
        <GoogleBrandIcon className="size-5" />
        Lanjutkan dengan Google
      </button>
    );
  }

  return (
    <div
      className={`relative flex min-h-11 w-full items-center justify-center overflow-hidden rounded-full ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
      aria-busy={!isReady}
    >
      {!isReady ? (
        <div className="naki-auth-google-action absolute inset-0 flex items-center justify-center gap-3 rounded-full border border-naki-steel bg-naki-page-bg text-sm font-semibold text-naki-smoke">
          <GoogleBrandIcon className="size-5" />
          <span>Memuat Google...</span>
        </div>
      ) : null}
      <div className="flex w-full justify-center" ref={containerRef} />
    </div>
  );
}
