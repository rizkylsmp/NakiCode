import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setUnauthorizedHandler } from "./api-client";
import {
  userRoleKey,
  userSessionEvent,
  userTokenKey,
  userUsernameKey,
} from "./user-session";

export type AuthRole = "user" | "admin";

type AuthState = {
  token: string | null;
  username: string;
  role: AuthRole;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  isAdmin: boolean;
  refresh: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readAuthState(): AuthState {
  const role = window.localStorage.getItem(userRoleKey);

  return {
    token: window.localStorage.getItem(userTokenKey),
    username: window.localStorage.getItem(userUsernameKey) ?? "",
    role: role === "admin" ? "admin" : "user",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => readAuthState());

  const refresh = useCallback(() => {
    setAuthState(readAuthState());
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(userTokenKey);
    window.localStorage.removeItem(userUsernameKey);
    window.localStorage.removeItem(userRoleKey);
    setAuthState(readAuthState());
    window.dispatchEvent(new Event(userSessionEvent));
  }, []);

  useEffect(() => {
    window.addEventListener(userSessionEvent, refresh);
    window.addEventListener("storage", refresh);
    setUnauthorizedHandler(logout);

    return () => {
      window.removeEventListener(userSessionEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [logout, refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      isAuthenticated: Boolean(authState.token),
      isAdmin: authState.role === "admin" && Boolean(authState.token),
      refresh,
      logout,
    }),
    [authState, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
