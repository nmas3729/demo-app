"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import BookingFlow from "./booking-flow";

type AppTab = "home" | "trips" | "profile" | "help";
type AppScreen = "welcome" | "app" | "login" | "register";
type IconName = "arrow" | "calendar" | "car" | "help" | "home" | "lock" | "mail" | "person" | "route";

type DemoSession = {
  accountName: string;
  email: string;
  accountType: string;
  accountStatus: string;
  isDemo: boolean;
};

type LoginResult = { ok: true } | { ok: false; message: string };
type LogoutResult = LoginResult;

const DEMO_SESSION_KEY = "sihleb-demo-session";
const DEMO_CREDENTIALS = {
  email: "demo@sihleb.co.za",
  password: "Demo1234!",
};
const demoAccount: DemoSession = {
  accountName: "SihleB Demo Passenger",
  email: DEMO_CREDENTIALS.email,
  accountType: "Passenger",
  accountStatus: "Active",
  isDemo: true,
};

const SESSION_RESTORING = "__restoring__";
const SESSION_STORAGE_ERROR = "__storage_error__";
const sessionListeners = new Set<() => void>();

function parseDemoSession(snapshot: string): DemoSession | null {
  if (!snapshot || snapshot === SESSION_RESTORING || snapshot === SESSION_STORAGE_ERROR) return null;
  try {
    const value = JSON.parse(snapshot) as Partial<DemoSession>;
    if (!value.accountName || !value.email) return null;
    return {
      accountName: value.accountName,
      email: value.email,
      accountType: value.accountType || "Passenger",
      accountStatus: value.accountStatus || "Active",
      isDemo: value.isDemo !== false,
    };
  } catch {
    return null;
  }
}

function subscribeToDemoSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function getDemoSessionSnapshot() {
  try {
    return window.localStorage.getItem(DEMO_SESSION_KEY) || "";
  } catch {
    return SESSION_STORAGE_ERROR;
  }
}

function getServerDemoSessionSnapshot() {
  return SESSION_RESTORING;
}

function notifyDemoSessionChange() {
  sessionListeners.forEach((listener) => listener());
}

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "arrow":
      return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "calendar":
      return <svg {...props}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></svg>;
    case "car":
      return <svg {...props}><path d="m5 11 1.6-4.1A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.4L19 11M4 11h16a1 1 0 0 1 1 1v5H3v-5a1 1 0 0 1 1-1ZM6 17v2M18 17v2M6.5 14h.01M17.5 14h.01" /></svg>;
    case "help":
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.8 1.3-1.8 2.7M12 17h.01" /></svg>;
    case "home":
      return <svg {...props}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V10Z" /></svg>;
    case "lock":
      return <svg {...props}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>;
    case "mail":
      return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
    case "person":
      return <svg {...props}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
    case "route":
      return <svg {...props}><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a3 3 0 0 0 3-3v-3a3 3 0 0 1 3-3h1" /></svg>;
  }
}

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className={`flex size-11 items-center justify-center rounded-[15px] text-sm font-bold tracking-tight ${
        inverse ? "bg-white text-[#173b36]" : "bg-[#173b36] text-white"
      }`}>
        SB
      </span>
      <span className={`flex flex-col leading-none ${inverse ? "text-white" : "text-[#182b3d]"}`}>
        <span className="text-[16px] font-bold tracking-[-0.04em]">SihleB</span>
        <span className={`mt-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] ${
          inverse ? "text-white/65" : "text-[#77858f]"
        }`}>
          Shuttle
        </span>
      </span>
    </span>
  );
}

function EmptyState({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-dashed border-[#d6dfd7] bg-white px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[#eef3ee] text-[#527566]">
        <Icon name={icon} className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-[#203740]">{title}</h3>
      <p className="mt-2 max-w-[250px] text-sm leading-6 text-[#78868c]">{description}</p>
    </div>
  );
}

function HomeTab({ onBook, customer }: { onBook: () => void; customer: DemoSession | null }) {
  return (
    <div className="space-y-7">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a66e35]">Customer dashboard</p>
        <h1 className="mt-2 text-[1.7rem] font-semibold leading-tight tracking-[-0.045em] text-[#182b3d]">
          {customer ? `Welcome, ${customer.accountName}` : "Welcome to SihleB"}
        </h1>
        <p className="mt-2 text-sm text-[#74818a]">Your journeys, all in one place.</p>
        {customer?.isDemo && (
          <span className="mt-3 inline-flex rounded-full bg-[#fff3dc] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b642a]">
            Demo account · Passenger
          </span>
        )}
      </section>

      <section className="overflow-hidden rounded-[26px] bg-[#173b36] p-5 text-white">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-[#e5bd7f]">
          <Icon name="car" />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-[-0.035em]">Where would you like to go?</h2>
        <p className="mt-2 text-sm leading-6 text-white/70">Plan a comfortable ride for your next journey.</p>
        <button
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#173b36] transition hover:bg-[#f3ead9]"
          onClick={onBook}
          type="button"
        >
          Book a shuttle <Icon name="arrow" className="size-4" />
        </button>
        <p className="mt-3 text-center text-[11px] text-white/60">Plan your journey and review the details before proceeding.</p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#203740]">Upcoming journeys</h2>
          <span className="text-xs font-medium text-[#78868c]">0 journeys</span>
        </div>
        <EmptyState
          description="When you have a booking, your journey details and status will appear here."
          icon="calendar"
          title="No upcoming journeys"
        />
      </section>
    </div>
  );
}

function TripsTab() {
  const [journeyView, setJourneyView] = useState<"upcoming" | "previous">("upcoming");

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a66e35]">Your travel</p>
      <h1 className="mt-2 text-[1.7rem] font-semibold tracking-[-0.045em] text-[#182b3d]">My journeys</h1>
      <p className="mt-2 text-sm leading-6 text-[#74818a]">Upcoming and previous journeys will be listed here.</p>
      <div className="mt-7 flex rounded-xl bg-[#e9eee9] p-1">
        <button
          aria-pressed={journeyView === "upcoming"}
          className={`flex-1 rounded-lg py-2.5 text-center text-xs font-semibold transition-colors ${journeyView === "upcoming" ? "bg-white text-[#315d50] shadow-sm" : "text-[#78868c]"}`}
          onClick={() => setJourneyView("upcoming")}
          type="button"
        >
          Upcoming
        </button>
        <button
          aria-pressed={journeyView === "previous"}
          className={`flex-1 rounded-lg py-2.5 text-center text-xs font-semibold transition-colors ${journeyView === "previous" ? "bg-white text-[#315d50] shadow-sm" : "text-[#78868c]"}`}
          onClick={() => setJourneyView("previous")}
          type="button"
        >
          Previous
        </button>
      </div>
      <div className="mt-5">
        <EmptyState
          description={journeyView === "upcoming"
            ? "There are no upcoming journeys to show yet. Your bookings will appear here."
            : "Completed journeys will appear here after your first trip."}
          icon="route"
          title={journeyView === "upcoming" ? "Nothing booked yet" : "No previous journeys"}
        />
      </div>
    </section>
  );
}

function ProfileTab({
  onNavigate,
  customer,
  onLogout,
}: {
  onNavigate: (screen: AppScreen) => void;
  customer: DemoSession | null;
  onLogout: () => LogoutResult;
}) {
  const [logoutError, setLogoutError] = useState("");

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a66e35]">Your account</p>
      <h1 className="mt-2 text-[1.7rem] font-semibold tracking-[-0.045em] text-[#182b3d]">Profile</h1>
      {customer ? (
        <div className="mt-6 rounded-[22px] border border-[#e7ebe6] bg-white p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#eaf0eb] text-[#315d50]"><Icon name="person" /></span>
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-[#fff3dc] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8b642a]">Demo account</span>
              <h2 className="mt-2 break-words text-sm font-semibold text-[#203740]">{customer.accountName}</h2>
              <p className="mt-1 break-all text-xs text-[#78868c]">{customer.email}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 border-t border-[#edf0ec] pt-4 text-xs">
            <div className="flex justify-between gap-3"><dt className="text-[#78868c]">Account type</dt><dd className="font-semibold text-[#203740]">{customer.accountType}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#78868c]">Status</dt><dd className="font-semibold text-[#315d50]">{customer.accountStatus}</dd></div>
          </dl>
          {logoutError && <p className="mt-4 text-xs font-medium text-[#a43d32]" role="alert">{logoutError}</p>}
          <button
            className="mt-5 min-h-12 w-full rounded-xl border border-[#e0e6e1] text-sm font-semibold text-[#7b453d] transition hover:bg-[#fbf2f0]"
            onClick={() => {
              const result = onLogout();
              if (!result.ok) setLogoutError(result.message);
            }}
            type="button"
          >
            Log out of demo account
          </button>
          <p className="mt-3 text-center text-[10px] leading-4 text-[#89958f]">Temporary demonstration session · not production authentication</p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-4 rounded-[22px] border border-[#e7ebe6] bg-white p-5">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#eaf0eb] text-[#315d50]"><Icon name="person" /></span>
            <div>
              <h2 className="text-sm font-semibold text-[#203740]">Guest account</h2>
              <p className="mt-1 text-xs text-[#78868c]">Sign in to manage your details.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <button
              className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-[#e7ebe6] bg-white px-4 text-sm font-semibold text-[#354b50] transition hover:bg-[#f9faf8]"
              onClick={() => onNavigate("login")}
              type="button"
            >
              <span className="flex items-center gap-3"><Icon name="lock" className="size-[18px] text-[#527566]" /> Log in</span>
              <Icon name="arrow" className="size-4 text-[#89958f]" />
            </button>
            <button
              className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-[#e7ebe6] bg-white px-4 text-sm font-semibold text-[#354b50] transition hover:bg-[#f9faf8]"
              onClick={() => onNavigate("register")}
              type="button"
            >
              <span className="flex items-center gap-3"><Icon name="person" className="size-[18px] text-[#527566]" /> Create an account</span>
              <Icon name="arrow" className="size-4 text-[#89958f]" />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function HelpTab() {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a66e35]">We&apos;re here to help</p>
      <h1 className="mt-2 text-[1.7rem] font-semibold tracking-[-0.045em] text-[#182b3d]">Help & support</h1>
      <p className="mt-2 text-sm leading-6 text-[#74818a]">Questions about SihleB Shuttle? Get in touch with our team.</p>
      <div className="mt-7 space-y-3">
        <div className="flex min-h-[72px] items-center gap-4 rounded-2xl border border-[#e7ebe6] bg-white px-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#eef3ee] text-[#527566]"><Icon name="mail" /></span>
          <span>
            <span className="block text-sm font-semibold text-[#203740]">Email support</span>
            <span className="mt-1 block text-xs text-[#78868c]">Support contact to be confirmed</span>
          </span>
        </div>
        <div className="rounded-2xl border border-[#e7ebe6] bg-white p-4">
          <div className="flex items-center gap-3 text-[#527566]">
            <Icon name="help" />
            <h2 className="text-sm font-semibold text-[#203740]">Frequently asked questions</h2>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#78868c]">Helpful answers will be added as customer support is set up.</p>
        </div>
      </div>
    </section>
  );
}

function WelcomeScreen({
  notice,
  onNavigate,
}: {
  notice: string;
  onNavigate: (screen: AppScreen) => void;
}) {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#173b36] px-6 py-10 text-white">
      <section className="w-full max-w-md text-center">
        <BrandMark inverse />
        <div className="mt-12 rounded-[30px] bg-white p-6 text-left text-[#203740] shadow-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a66e35]">South African shuttle travel</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.05em]">Comfortable journeys, made simple.</h1>
          <p className="mt-3 text-sm leading-6 text-[#74818a]">Plan a trip, review your details and keep your journey information in one place.</p>
          {notice && <p className="mt-4 rounded-xl bg-[#fff3dc] px-3 py-3 text-xs leading-5 text-[#7d602d]" role="alert">{notice}</p>}
          <button
            className="mt-6 flex min-h-14 w-full items-center justify-center rounded-xl bg-[#173b36] text-sm font-semibold text-white"
            onClick={() => onNavigate("login")}
            type="button"
          >
            Log in
          </button>
          <button
            className="mt-3 flex min-h-14 w-full items-center justify-center rounded-xl border border-[#dfe6e0] text-sm font-semibold text-[#315d50]"
            onClick={() => onNavigate("register")}
            type="button"
          >
            Create an account
          </button>
          <button
            className="mt-3 w-full py-3 text-xs font-semibold text-[#78868c]"
            onClick={() => onNavigate("app")}
            type="button"
          >
            Continue as guest
          </button>
        </div>
      </section>
    </main>
  );
}

function AuthScreen({
  screen,
  onBack,
  onLogin,
  onNavigate,
}: {
  screen: Exclude<AppScreen, "welcome" | "app">;
  onBack: () => void;
  onLogin: (email: string, password: string) => LoginResult;
  onNavigate: (screen: AppScreen) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isRegister = screen === "register";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRegister) {
      setError("Demo registration is available in the next step. Use the demo login below.");
      return;
    }
    const result = onLogin(email, password);
    if (!result.ok) setError(result.message);
  }

  return (
    <main className="min-h-[100svh] bg-[#f3f5f2] px-5 py-6">
      <div className="mx-auto max-w-md">
        <button className="mb-8 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#315d50]" onClick={onBack} type="button">
          <Icon name="arrow" className="size-4 rotate-180" /> Back
        </button>
        <BrandMark />
        <section className="mt-8 rounded-[26px] border border-[#e7ebe6] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a66e35]">{isRegister ? "New account" : "Welcome back"}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#182b3d]">{isRegister ? "Create an account" : "Log in"}</h1>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block text-xs font-semibold text-[#465860]" htmlFor="email">
              Email address
              <input className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e0] px-3.5 text-sm outline-none focus:border-[#527566]" id="email" onChange={(event) => setEmail(event.currentTarget.value)} type="email" value={email} />
            </label>
            <label className="block text-xs font-semibold text-[#465860]" htmlFor="password">
              Password
              <input className="mt-2 h-12 w-full rounded-xl border border-[#dfe6e0] px-3.5 text-sm outline-none focus:border-[#527566]" id="password" onChange={(event) => setPassword(event.currentTarget.value)} type="password" value={password} />
            </label>
            {error && <p className="text-xs font-medium text-[#b34438]" role="alert">{error}</p>}
            <button className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#173b36] text-sm font-semibold text-white" type="submit">
              {isRegister ? "Create demo account" : "Log in"}
            </button>
          </form>
          {!isRegister && (
            <div className="mt-5 rounded-xl bg-[#edf3ee] p-3 text-xs leading-5 text-[#52655b]">
              Demo account: <strong>{DEMO_CREDENTIALS.email}</strong><br />
              Password: <strong>{DEMO_CREDENTIALS.password}</strong>
            </div>
          )}
          <button className="mt-5 w-full text-center text-xs font-semibold text-[#315d50]" onClick={() => onNavigate(isRegister ? "login" : "register")} type="button">
            {isRegister ? "Already have an account? Log in" : "Need an account? Create one"}
          </button>
        </section>
      </div>
    </main>
  );
}

const tabs: { id: AppTab; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "trips", label: "My trips", icon: "route" },
  { id: "profile", label: "Profile", icon: "person" },
  { id: "help", label: "Help", icon: "help" },
];

export default function CustomerApp() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [bookingOpen, setBookingOpen] = useState(false);
  const sessionSnapshot = useSyncExternalStore(
    subscribeToDemoSession,
    getDemoSessionSnapshot,
    getServerDemoSessionSnapshot,
  );
  const customer = parseDemoSession(sessionSnapshot);
  const sessionRestored = sessionSnapshot !== SESSION_RESTORING;
  const sessionError = sessionSnapshot === SESSION_STORAGE_ERROR
    ? "The saved demo session could not be read. You can continue as a guest or log in again."
    : "";
  const activeScreen = screen === "welcome" && customer ? "app" : screen;

  function login(email: string, password: string): LoginResult {
    if (
      email.trim().toLowerCase() !== DEMO_CREDENTIALS.email ||
      password !== DEMO_CREDENTIALS.password
    ) {
      return { ok: false, message: "The email or password is incorrect." };
    }

    try {
      window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoAccount));
    } catch {
      return { ok: false, message: "The demo session could not be saved. Check browser storage and try again." };
    }

    notifyDemoSessionChange();
    setActiveTab("home");
    setScreen("app");
    return { ok: true };
  }

  function logout(): LogoutResult {
    try {
      window.localStorage.removeItem(DEMO_SESSION_KEY);
    } catch {
      return { ok: false, message: "The demo session could not be cleared. Please try logging out again." };
    }

    notifyDemoSessionChange();
    setBookingOpen(false);
    setActiveTab("home");
    setScreen("welcome");
    return { ok: true };
  }

  if (!sessionRestored) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#102d2b] px-6 text-white">
        <div className="text-center">
          <BrandMark inverse />
          <p className="mt-5 text-xs text-white/65" role="status">Restoring your session…</p>
        </div>
      </main>
    );
  }

  if (activeScreen === "welcome") {
    return <WelcomeScreen notice={sessionError} onNavigate={setScreen} />;
  }

  if (activeScreen !== "app") {
    return (
      <AuthScreen
        onBack={() => setScreen("welcome")}
        onLogin={login}
        onNavigate={setScreen}
        screen={activeScreen}
      />
    );
  }

  if (bookingOpen) {
    return <BookingFlow onClose={() => setBookingOpen(false)} />;
  }

  return (
    <div className="min-h-[100svh] bg-[#f3f5f2] pb-28 pt-[env(safe-area-inset-top)]">
      <header className="sticky top-0 z-20 border-b border-[#e9ece8] bg-[#f3f5f2]/95 px-5 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <BrandMark />
          <button
            aria-label="Open profile"
            className="flex size-10 items-center justify-center rounded-full border border-[#e2e8e3] bg-white text-[#315d50] transition hover:bg-[#eaf0eb]"
            onClick={() => setActiveTab("profile")}
            type="button"
          >
            <Icon name="person" className="size-[18px]" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
        {activeTab === "home" && <HomeTab customer={customer} onBook={() => setBookingOpen(true)} />}
        {activeTab === "trips" && <TripsTab />}
        {activeTab === "profile" && <ProfileTab customer={customer} onLogout={logout} onNavigate={setScreen} />}
        {activeTab === "help" && <HelpTab />}
      </main>

      <nav
        aria-label="Customer navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e5eae5] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 pt-2">
          {tabs.map((tab) => (
            <button
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors ${
                activeTab === tab.id ? "text-[#315d50]" : "text-[#87938e] hover:text-[#52675c]"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon name={tab.icon} className="size-[19px]" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
