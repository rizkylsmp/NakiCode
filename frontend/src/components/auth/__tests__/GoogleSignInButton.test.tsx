import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleSignInButton } from "../GoogleSignInButton";
import { LanguageProvider } from "../../../i18n/language";
import { LanguageSwitch } from "../../layout/LanguageSwitch";

describe("GoogleSignInButton", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
    delete window.google;
    delete (globalThis as { ResizeObserver?: typeof ResizeObserver })
      .ResizeObserver;
  });

  it("initializes Google Identity once when the button is resized", async () => {
    vi.stubEnv(
      "VITE_GOOGLE_CLIENT_ID",
      "google-client-id.apps.googleusercontent.com",
    );
    const initialize = vi.fn();
    const renderButton = vi.fn();
    window.google = {
      accounts: { id: { initialize, renderButton } },
    };

    let resizeCallback: ResizeObserverCallback | undefined;
    globalThis.ResizeObserver = class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }

      disconnect() {}
      observe() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;

    render(<GoogleSignInButton onCredential={vi.fn()} onError={vi.fn()} />);

    await waitFor(() => expect(initialize).toHaveBeenCalledOnce());
    expect(renderButton).toHaveBeenCalledOnce();

    resizeCallback?.([], {} as ResizeObserver);

    expect(initialize).toHaveBeenCalledOnce();
    expect(renderButton).toHaveBeenCalledTimes(2);
  });
  it("updates the Google button locale without initializing the client again", async () => {
    localStorage.clear();
    vi.stubEnv(
      "VITE_GOOGLE_CLIENT_ID",
      "language-client-id.apps.googleusercontent.com",
    );
    const initialize = vi.fn();
    const renderButton = vi.fn();
    window.google = { accounts: { id: { initialize, renderButton } } };
    render(
      <LanguageProvider>
        <LanguageSwitch />
        <GoogleSignInButton onCredential={vi.fn()} onError={vi.fn()} />
      </LanguageProvider>,
    );
    await waitFor(() => expect(initialize).toHaveBeenCalledOnce());
    expect(renderButton.mock.calls.at(-1)?.[1].locale).toBe("id");
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    await waitFor(() =>
      expect(renderButton.mock.calls.at(-1)?.[1].locale).toBe("en"),
    );
    expect(initialize).toHaveBeenCalledOnce();
  });
});
