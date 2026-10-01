const invitationSessionKey = "naki-client-invitation";
let memoryToken = "";
// Remove the private token before analytics, error reporting or outgoing navigation.
export function prepareClientInvitation() {
  if (window.location.pathname !== "/client-invitation") return;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("token");
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    memoryToken = token;
    try {
      sessionStorage.setItem(invitationSessionKey, token);
      if (params.get("lang") === "en" || params.get("lang") === "id")
        localStorage.setItem("naki-language", params.get("lang")!);
    } catch {
      /* Keep the current invitation usable when browser storage is blocked. */
    }
  } else if (params.has("token")) {
    clearClientInvitationToken();
  }
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname,
  );
}
export function readClientInvitationToken() {
  try {
    return sessionStorage.getItem(invitationSessionKey) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}
export function clearClientInvitationToken() {
  memoryToken = "";
  try {
    sessionStorage.removeItem(invitationSessionKey);
  } catch {
    /* Storage is optional. */
  }
}
