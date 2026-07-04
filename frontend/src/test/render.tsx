import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/auth-context";
import {
  userRoleKey,
  userTokenKey,
  userUsernameKey,
} from "../utils/user-session";
import type { ReactElement, ReactNode } from "react";

type TestAuth = {
  token?: string;
  username?: string;
  role?: "user" | "admin";
};

type RenderWithProvidersOptions = RenderOptions & {
  auth?: TestAuth | null;
  route?: string;
};

function seedAuth(auth: TestAuth | null | undefined) {
  window.localStorage.clear();

  if (!auth?.token) {
    return;
  }

  window.localStorage.setItem(userTokenKey, auth.token);
  window.localStorage.setItem(userUsernameKey, auth.username ?? "");
  window.localStorage.setItem(userRoleKey, auth.role ?? "user");
}

export function renderWithProviders(
  ui: ReactElement,
  { auth = null, route = "/", ...renderOptions }: RenderWithProvidersOptions = {},
) {
  seedAuth(auth);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>{children}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
