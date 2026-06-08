import {
  activateAuthTabSession,
  clearAuthTabSession,
  clearLegacySupabaseStorage,
} from "@/lib/auth-cookies";

type AppRouter = {
  push: (href: string) => void;
  refresh: () => void;
};

/** Déconnexion serveur (cookies effacés) puis redirection. */
export async function signOutAndRedirect(
  router?: AppRouter,
  redirectTo = "/",
) {
  clearLegacySupabaseStorage();
  clearAuthTabSession();

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    // Rediriger même si l'API échoue
  }

  router?.push(redirectTo);
  router?.refresh();
}

/** À appeler après chaque connexion réussie (même onglet). */
export function markAuthSessionActive() {
  clearLegacySupabaseStorage();
  activateAuthTabSession();
}
