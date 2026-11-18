# SihleB Shuttle App

A mobile-first customer app built with Next.js, TypeScript, Tailwind CSS and Capacitor. It includes a branded welcome screen, a temporary demo login, registration screens, guest entry, a customer dashboard, a seven-step booking experience, profile navigation and help.

The demo login is client-side demonstration authentication only, not secure production authentication. It stores only demo account metadata in local storage; the password is never persisted. Booking submission is not connected, booking details stay in page state only, and the quotation screen is a placeholder rather than a price offer.

## Run locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the source checks with:

```bash
npm run lint
npm run build
```

The build produces a static Next.js export in `out/`, which is the web bundle used by Capacitor.

## Google Maps setup

Location suggestions and map pin selection use the Google Maps JavaScript API and Places API (New). To enable them, create a browser API key restricted to the app’s allowed origins and APIs, then provide it in `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-restricted-browser-key
```

Rebuild after changing the key with `npm run cap:sync`. `NEXT_PUBLIC_` values are included in the exported client bundle, so use only a browser-restricted key, never a service-account credential or private API secret. Without a key, manual location entry remains available and the map explains that it is not configured.

## Android and iOS

Both native Capacitor projects are in `android/` and `ios/`. Build the web app and synchronize its files to the native projects with:

```bash
npm run cap:sync
```

Open the native projects with:

```bash
npm run cap:open:android
npm run cap:open:ios
```

Android builds require Android Studio and the Android SDK. iOS builds require macOS and Xcode. The iOS project can be scaffolded on other platforms, but it cannot be built there.

## Architecture notes

Capacitor packages the static customer UI. The demo credentials are visible in the client bundle, and the local-storage session can be inspected or modified; this is not production authentication and must not be used for real customer data. Production authentication, booking, pricing and payment features need an appropriately secured API. Database credentials and payment secrets must stay on the server and out of the app bundle.
