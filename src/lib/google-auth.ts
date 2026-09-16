import { GOOGLE_CLIENT_ID, PHOTOS_PICKER_SCOPE } from "@/lib/config";
import type { GoogleTokenClient } from "@/types/google-gsi";

export function waitForGoogleIdentity(timeoutMs = 12000) {
  return new Promise<NonNullable<Window["google"]>>((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.google?.accounts?.oauth2) {
        resolve(window.google);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(
          new Error(
            "No cargó el inicio de sesión de Google. Recarga la página.",
          ),
        );
        return;
      }
      window.setTimeout(tick, 150);
    };
    tick();
  });
}

export async function requestPhotosPickerToken() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      "Falta NEXT_PUBLIC_GOOGLE_CLIENT_ID. Mientras tanto usa el modo demo.",
    );
  }
  const google = await waitForGoogleIdentity();
  return new Promise<string>((resolve, reject) => {
    const client: GoogleTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: PHOTOS_PICKER_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(
              response.error_description ||
                response.error ||
                "Google no concedió acceso al Picker.",
            ),
          );
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(
          new Error(
            error.message || "Se canceló el acceso a Google Fotos.",
          ),
        );
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}
