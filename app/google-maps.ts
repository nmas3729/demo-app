import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const googleMapsConfigured = Boolean(apiKey);

let mapsPromise: Promise<void> | undefined;

export function loadGoogleMaps(): Promise<void> {
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps is not configured."));
  }

  if (!mapsPromise) {
    setOptions({ key: apiKey, language: "en", region: "ZA", v: "weekly" });
    mapsPromise = Promise.all([
      importLibrary("maps"),
      importLibrary("places"),
    ])
      .then(() => undefined)
      .catch((error: unknown) => {
        mapsPromise = undefined;
        throw error;
      });
  }

  return mapsPromise;
}
