"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { googleMapsConfigured, loadGoogleMaps } from "./google-maps";

type BookingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type VehicleType = "Sedan" | "SUV" | "MPV" | "Minibus";
type TripType = "one-way" | "return";

type BookingDraft = {
  pickup: string;
  destination: string;
  travelDate: string;
  pickupTime: string;
  tripType: TripType;
  returnDate: string;
  returnTime: string;
  adults: number;
  children: number;
  infants: number;
  vehicle: VehicleType | "";
  babySeats: number;
  additionalLuggage: number;
  trailer: boolean;
  flightNumber: string;
  pickupInstructions: string;
  accessibilityRequirements: string;
  firstName: string;
  surname: string;
  email: string;
  mobile: string;
  additionalPassengers: string;
};

type DraftField = keyof BookingDraft;
type DraftErrors = Partial<Record<DraftField, string>>;

const stepNames = ["Journey", "Passengers", "Vehicle", "Requirements", "Passenger", "Review", "Quote"];
const vehicles: { name: VehicleType; description: string }[] = [
  { name: "Sedan", description: "A private, comfortable option for everyday journeys." },
  { name: "SUV", description: "Extra cabin space for a relaxed ride." },
  { name: "MPV", description: "Flexible seating for families and small groups." },
  { name: "Minibus", description: "A shared ride option for larger parties." },
];

const initialDraft: BookingDraft = {
  pickup: "",
  destination: "",
  travelDate: "",
  pickupTime: "",
  tripType: "one-way",
  returnDate: "",
  returnTime: "",
  adults: 1,
  children: 0,
  infants: 0,
  vehicle: "",
  babySeats: 0,
  additionalLuggage: 0,
  trailer: false,
  flightNumber: "",
  pickupInstructions: "",
  accessibilityRequirements: "",
  firstName: "",
  surname: "",
  email: "",
  mobile: "",
  additionalPassengers: "",
};

function Icon({ name, className = "size-5" }: { name: "arrow" | "car" | "close" | "map" | "pin"; className?: string }) {
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
    case "car":
      return <svg {...props}><path d="m5 11 1.6-4.1A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.4L19 11M4 11h16a1 1 0 0 1 1 1v5H3v-5a1 1 0 0 1 1-1ZM6 17v2M18 17v2M6.5 14h.01M17.5 14h.01" /></svg>;
    case "close":
      return <svg {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "map":
      return <svg {...props}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /></svg>;
    case "pin":
      return <svg {...props}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  }
}

function Field({
  id,
  label,
  children,
  error,
  optional = false,
}: {
  id: string;
  label: string;
  children: ReactNode;
  error?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[#465860]" htmlFor={id}>
        {label}{optional && <span className="ml-1 font-normal text-[#89958f]">· Optional</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-[#b34438]" role="alert">{error}</p>}
    </div>
  );
}

const inputClass = "h-12 w-full rounded-xl border border-[#dfe6e0] bg-white px-3.5 text-sm text-[#203740] outline-none transition placeholder:text-[#9aa6a1] focus:border-[#527566] focus:ring-4 focus:ring-[#527566]/10";
const textAreaClass = "min-h-24 w-full resize-y rounded-xl border border-[#dfe6e0] bg-white px-3.5 py-3 text-sm text-[#203740] outline-none transition placeholder:text-[#9aa6a1] focus:border-[#527566] focus:ring-4 focus:ring-[#527566]/10";

function GooglePlacesSuggestions({
  label,
  onSelect,
}: {
  label: string;
  onSelect: (value: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const [loading, setLoading] = useState(googleMapsConfigured);
  const [message, setMessage] = useState("");

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!googleMapsConfigured || !hostRef.current) return;
    let active = true;
    let autocomplete: google.maps.places.PlaceAutocompleteElement | undefined;

    void loadGoogleMaps()
      .then(async () => {
        if (!active || !hostRef.current) return;
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");
        autocomplete = new PlaceAutocompleteElement({ includedRegionCodes: ["za"] });
        autocomplete.placeholder = `Search suggestions for ${label.toLowerCase()}`;
        autocomplete.requestedRegion = "za";
        autocomplete.style.width = "100%";
        autocomplete.style.minHeight = "44px";
        autocomplete.setAttribute("aria-label", `Search ${label.toLowerCase()} suggestions`);
        autocomplete.addEventListener("gmp-select", async (event) => {
          try {
            const place = event.placePrediction.toPlace();
            await place.fetchFields({ fields: ["formattedAddress", "location"] });
            if (place.formattedAddress) {
              onSelectRef.current(place.formattedAddress);
              setMessage("");
            } else {
              setMessage("That result did not include an address. Enter the location manually.");
            }
          } catch {
            setMessage("Suggestions are unavailable right now. Enter the location manually.");
          }
        });
        hostRef.current.replaceChildren(autocomplete);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          setMessage("Suggestions could not load. Enter the location manually.");
        }
      });

    return () => {
      active = false;
      autocomplete?.remove();
    };
  }, [label]);

  if (!googleMapsConfigured) {
    return (
      <p className="mt-2 text-[11px] leading-5 text-[#78868c]">
        Address suggestions are not configured. You can enter the location manually.
      </p>
    );
  }

  return (
    <div className="mt-2">
      {loading && <p className="mb-1.5 text-[11px] text-[#78868c]" role="status">Loading address suggestions…</p>}
      <div className="overflow-hidden rounded-xl border border-[#dfe6e0] bg-white px-2" ref={hostRef} />
      {message && <p className="mt-1.5 text-xs text-[#8b5a24]" role="status">{message}</p>}
    </div>
  );
}

function MapPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (location: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(googleMapsConfigured);
  const [mapError, setMapError] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!googleMapsConfigured || !mapRef.current) return;
    let marker: google.maps.Marker | undefined;
    let clickListener: google.maps.MapsEventListener | undefined;
    let active = true;

    void loadGoogleMaps()
      .then(async () => {
        if (!active || !mapRef.current) return;
        const { Map } = await google.maps.importLibrary("maps");
        const map = new Map(mapRef.current, {
          center: { lat: -29, lng: 24 },
          zoom: 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        marker = new google.maps.Marker({ map });
        clickListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          const point = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          setCoordinates(point);
          marker?.setPosition(point);
        });
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          setMapError("The map could not be loaded. You can still enter the address manually.");
        }
      });

    return () => {
      active = false;
      clickListener?.remove();
      marker?.setMap(null);
    };
  }, []);

  return (
    <div
      aria-labelledby="map-picker-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#102d2b]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-t-[28px] bg-[#f7f8f5] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a66e35]">Map selection</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#182b3d]" id="map-picker-title">Choose a point on the map</h2>
          </div>
          <button aria-label="Close map" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#52655b]" onClick={onClose} type="button">
            <Icon name="close" className="size-4" />
          </button>
        </div>
        {!googleMapsConfigured ? (
          <div className="mt-5 rounded-2xl border border-[#e1e7e1] bg-white p-5">
            <Icon name="map" className="size-6 text-[#527566]" />
            <p className="mt-3 text-sm font-semibold text-[#203740]">Map service not configured</p>
            <p className="mt-2 text-xs leading-5 text-[#78868c]">
              Add a restricted Google Maps browser key and rebuild to enable map selection. You can continue by entering an address manually.
            </p>
          </div>
        ) : (
          <>
            <div className="relative mt-5 h-72 overflow-hidden rounded-2xl bg-[#e8eeea]">
              <div aria-label="Map of South Africa. Tap to place a pickup or destination pin." className="size-full" ref={mapRef} role="application" />
              {loading && <div className="absolute inset-0 flex items-center justify-center bg-[#e8eeea]/90 text-sm text-[#52655b]" role="status">Loading map…</div>}
              {mapError && <p className="absolute inset-x-3 bottom-3 rounded-xl bg-white/95 p-3 text-xs leading-5 text-[#8b5a24]" role="alert">{mapError}</p>}
            </div>
            {coordinates && (
              <p className="mt-3 text-xs text-[#52655b]" aria-live="polite">
                Map pin: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
              </p>
            )}
            <p className="mt-3 text-[11px] leading-5 text-[#78868c]">Tap the map to place a pin. The selection is saved as coordinates.</p>
            <button
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#173b36] px-4 text-sm font-semibold text-white transition hover:bg-[#245247] disabled:cursor-not-allowed disabled:bg-[#9aa9a2]"
              disabled={!coordinates}
              onClick={() => {
                if (!coordinates) return;
                onSelect(`Map pin ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`);
                onClose();
              }}
              type="button"
            >
              Use this map pin
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LocationField({
  id,
  label,
  value,
  error,
  onChange,
  onMapSelect,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onMapSelect: (value: string) => void;
}) {
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <>
      <Field id={id} label={label} error={error}>
        <div className="relative">
          <Icon name="pin" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#778980]" />
          <input
            aria-invalid={Boolean(error)}
            autoComplete="street-address"
            className={`${inputClass} pl-10`}
            id={id}
            onChange={(event) => onChange(event.currentTarget.value)}
            placeholder="Enter an address or landmark"
            value={value}
          />
        </div>
        <GooglePlacesSuggestions label={label} onSelect={onChange} />
        <button
          className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-[#315d50] transition hover:bg-[#edf2ed]"
          onClick={() => setMapOpen(true)}
          type="button"
        >
          <Icon name="map" className="size-4" /> Choose on map
        </button>
      </Field>
      {mapOpen && <MapPicker onClose={() => setMapOpen(false)} onSelect={onMapSelect} />}
    </>
  );
}

function StepHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a66e35]">{eyebrow}</p>
      <h1 className="mt-2 text-[1.65rem] font-semibold leading-tight tracking-[-0.045em] text-[#182b3d]">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#74818a]">{description}</p>
    </div>
  );
}

function SectionCard({ children, title, onEdit }: { children: ReactNode; title: string; onEdit?: () => void }) {
  return (
    <section className="rounded-2xl border border-[#e5eae5] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#203740]">{title}</h2>
        {onEdit && <button className="text-xs font-semibold text-[#315d50]" onClick={onEdit} type="button">Edit</button>}
      </div>
      {children}
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-[#78868c]">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-[#203740]">{value || "Not provided"}</dd>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "Not selected";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

function formatPassengers(draft: BookingDraft) {
  return `${draft.adults} adult${draft.adults === 1 ? "" : "s"}, ${draft.children} child${draft.children === 1 ? "" : "ren"}, ${draft.infants} infant${draft.infants === 1 ? "" : "s"}`;
}

function CountControl({
  label,
  value,
  onChange,
  minimum = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#e5eae5] bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-[#203740]">{label}</p>
        <p className="mt-1 text-xs text-[#78868c]">{label === "Adults" ? "Age 13+" : label === "Children" ? "Ages 2–12" : "Under 2"}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          aria-label={`Remove one ${label.toLowerCase()}`}
          className="flex size-9 items-center justify-center rounded-full border border-[#dfe6e0] text-lg text-[#315d50] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={value <= minimum}
          onClick={() => onChange(Math.max(minimum, value - 1))}
          type="button"
        >
          −
        </button>
        <span aria-live="polite" className="min-w-5 text-center text-sm font-semibold text-[#203740]">{value}</span>
        <button
          aria-label={`Add one ${label.toLowerCase()}`}
          className="flex size-9 items-center justify-center rounded-full border border-[#dfe6e0] text-lg text-[#315d50]"
          onClick={() => onChange(value + 1)}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function BookingFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<BookingStep>(1);
  const [draft, setDraft] = useState<BookingDraft>(initialDraft);
  const [errors, setErrors] = useState<DraftErrors>({});

  function update<K extends DraftField>(field: K, value: BookingDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateStep() {
    const nextErrors: DraftErrors = {};
    if (step === 1) {
      if (!draft.pickup.trim()) nextErrors.pickup = "Enter a pickup location.";
      if (!draft.destination.trim()) nextErrors.destination = "Enter a destination.";
      if (!draft.travelDate) nextErrors.travelDate = "Choose a travel date.";
      else {
        const travelDate = new Date(`${draft.travelDate}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (Number.isNaN(travelDate.getTime()) || travelDate < today) nextErrors.travelDate = "Choose today or a future date.";
      }
      if (!draft.pickupTime) nextErrors.pickupTime = "Choose a pickup time.";
      if (draft.tripType === "return") {
        if (!draft.returnDate) nextErrors.returnDate = "Choose a return date.";
        if (!draft.returnTime) nextErrors.returnTime = "Choose a return time.";
        if (draft.travelDate && draft.returnDate) {
          const outbound = new Date(`${draft.travelDate}T${draft.pickupTime || "00:00"}`);
          const returning = new Date(`${draft.returnDate}T${draft.returnTime || "00:00"}`);
          if (returning < outbound) nextErrors.returnDate = "The return must be after the outbound journey.";
        }
      }
    }
    if (step === 2 && draft.adults < 1) nextErrors.adults = "At least one adult is required.";
    if (step === 3 && !draft.vehicle) nextErrors.vehicle = "Select a vehicle category to continue.";
    if (step === 5) {
      if (!draft.firstName.trim()) nextErrors.firstName = "Enter the passenger’s first name.";
      if (!draft.surname.trim()) nextErrors.surname = "Enter the passenger’s surname.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) nextErrors.email = "Enter a valid email address.";
      if (!/^\+?[\d\s()-]{7,20}$/.test(draft.mobile.trim())) nextErrors.mobile = "Enter a valid mobile number.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function continueToNextStep() {
    if (!validateStep()) return;
    setStep((current) => Math.min(7, current + 1) as BookingStep);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (step === 1) {
      onClose();
      return;
    }
    setStep((current) => Math.max(1, current - 1) as BookingStep);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editStep(target: BookingStep) {
    setStep(target);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const stepContent = (() => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <LocationField id="pickup" label="Pickup location" value={draft.pickup} error={errors.pickup} onChange={(value) => update("pickup", value)} onMapSelect={(value) => update("pickup", value)} />
          <LocationField id="destination" label="Destination" value={draft.destination} error={errors.destination} onChange={(value) => update("destination", value)} onMapSelect={(value) => update("destination", value)} />
          <div className="grid grid-cols-2 gap-3">
            <Field id="travel-date" label="Travel date" error={errors.travelDate}>
              <input aria-invalid={Boolean(errors.travelDate)} className={inputClass} id="travel-date" onChange={(event) => update("travelDate", event.currentTarget.value)} type="date" value={draft.travelDate} />
            </Field>
            <Field id="pickup-time" label="Pickup time" error={errors.pickupTime}>
              <input aria-invalid={Boolean(errors.pickupTime)} className={inputClass} id="pickup-time" onChange={(event) => update("pickupTime", event.currentTarget.value)} type="time" value={draft.pickupTime} />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-[#465860]">Journey type</legend>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#e9eee9] p-1">
              {(["one-way", "return"] as const).map((tripType) => (
                <button
                  aria-pressed={draft.tripType === tripType}
                  className={`min-h-11 rounded-lg text-sm font-semibold transition-colors ${draft.tripType === tripType ? "bg-white text-[#315d50] shadow-sm" : "text-[#78868c]"}`}
                  key={tripType}
                  onClick={() => update("tripType", tripType)}
                  type="button"
                >
                  {tripType === "one-way" ? "One way" : "Return"}
                </button>
              ))}
            </div>
          </fieldset>
          {draft.tripType === "return" && (
            <div className="grid grid-cols-2 gap-3">
              <Field id="return-date" label="Return date" error={errors.returnDate}>
                <input aria-invalid={Boolean(errors.returnDate)} className={inputClass} id="return-date" onChange={(event) => update("returnDate", event.currentTarget.value)} type="date" value={draft.returnDate} />
              </Field>
              <Field id="return-time" label="Return pickup time" error={errors.returnTime}>
                <input aria-invalid={Boolean(errors.returnTime)} className={inputClass} id="return-time" onChange={(event) => update("returnTime", event.currentTarget.value)} type="time" value={draft.returnTime} />
              </Field>
            </div>
          )}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-3">
          <CountControl label="Adults" minimum={0} value={draft.adults} onChange={(value) => update("adults", value)} />
          {errors.adults && <p className="text-xs font-medium text-[#b34438]" role="alert">{errors.adults}</p>}
          <CountControl label="Children" value={draft.children} onChange={(value) => update("children", value)} />
          <CountControl label="Infants" value={draft.infants} onChange={(value) => update("infants", value)} />
          <p className="rounded-xl bg-[#eaf0eb] p-3 text-xs leading-5 text-[#52655b]">At least one adult must travel. Passenger capacity will be confirmed with the selected vehicle.</p>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <button
              aria-pressed={draft.vehicle === vehicle.name}
              className={`w-full rounded-2xl border p-4 text-left transition ${draft.vehicle === vehicle.name ? "border-[#527566] bg-[#eef4ee] ring-2 ring-[#527566]/15" : "border-[#e2e8e3] bg-white hover:border-[#bacbbd]"}`}
              key={vehicle.name}
              onClick={() => update("vehicle", vehicle.name)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e8eee8] text-[#315d50]"><Icon name="car" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#203740]">{vehicle.name}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${draft.vehicle === vehicle.name ? "bg-[#d9e7dc] text-[#315d50]" : "bg-[#f0f2ef] text-[#78868c]"}`}>
                      {draft.vehicle === vehicle.name ? "Selected" : "Select"}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#78868c]">{vehicle.description}</span>
                </span>
              </div>
              <span className="mt-4 grid grid-cols-2 gap-2 border-t border-[#e4e9e4] pt-3 text-[10px] leading-4 text-[#78868c]">
                <span>Passenger capacity <strong className="block font-semibold text-[#52655b]">To be confirmed</strong></span>
                <span>Luggage capacity <strong className="block font-semibold text-[#52655b]">To be confirmed</strong></span>
              </span>
            </button>
          ))}
          {errors.vehicle && <p className="text-xs font-medium text-[#b34438]" role="alert">{errors.vehicle}</p>}
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="baby-seats" label="Baby seats" optional>
              <input className={inputClass} id="baby-seats" min="0" onChange={(event) => update("babySeats", Math.max(0, Number.parseInt(event.currentTarget.value, 10) || 0))} step="1" type="number" value={draft.babySeats} />
            </Field>
            <Field id="additional-luggage" label="Extra luggage" optional>
              <input className={inputClass} id="additional-luggage" min="0" onChange={(event) => update("additionalLuggage", Math.max(0, Number.parseInt(event.currentTarget.value, 10) || 0))} step="1" type="number" value={draft.additionalLuggage} />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-[#465860]">Trailer required?</legend>
            <div className="grid grid-cols-2 gap-2">
              {[false, true].map((required) => (
                <button
                  aria-pressed={draft.trailer === required}
                  className={`min-h-11 rounded-xl border text-sm font-semibold transition-colors ${draft.trailer === required ? "border-[#527566] bg-[#eaf0eb] text-[#315d50]" : "border-[#dfe6e0] bg-white text-[#78868c]"}`}
                  key={String(required)}
                  onClick={() => update("trailer", required)}
                  type="button"
                >
                  {required ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </fieldset>
          <Field id="flight-number" label="Flight number" optional>
            <input className={inputClass} id="flight-number" onChange={(event) => update("flightNumber", event.currentTarget.value)} placeholder="Add if this is an airport pickup" value={draft.flightNumber} />
          </Field>
          <Field id="pickup-instructions" label="Special pickup instructions" optional>
            <textarea className={textAreaClass} id="pickup-instructions" onChange={(event) => update("pickupInstructions", event.currentTarget.value)} placeholder="Entrance, meeting point, or other details" value={draft.pickupInstructions} />
          </Field>
          <Field id="accessibility" label="Accessibility requirements" optional>
            <textarea className={textAreaClass} id="accessibility" onChange={(event) => update("accessibilityRequirements", event.currentTarget.value)} placeholder="Tell us about any assistance or access needs" value={draft.accessibilityRequirements} />
          </Field>
        </div>
      );
    }

    if (step === 5) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="first-name" label="First name" error={errors.firstName}>
              <input aria-invalid={Boolean(errors.firstName)} autoComplete="given-name" className={inputClass} id="first-name" onChange={(event) => update("firstName", event.currentTarget.value)} value={draft.firstName} />
            </Field>
            <Field id="surname" label="Surname" error={errors.surname}>
              <input aria-invalid={Boolean(errors.surname)} autoComplete="family-name" className={inputClass} id="surname" onChange={(event) => update("surname", event.currentTarget.value)} value={draft.surname} />
            </Field>
          </div>
          <Field id="email" label="Email address" error={errors.email}>
            <input aria-invalid={Boolean(errors.email)} autoComplete="email" className={inputClass} id="email" onChange={(event) => update("email", event.currentTarget.value)} type="email" value={draft.email} />
          </Field>
          <Field id="mobile" label="Mobile number" error={errors.mobile}>
            <input aria-invalid={Boolean(errors.mobile)} autoComplete="tel" className={inputClass} id="mobile" onChange={(event) => update("mobile", event.currentTarget.value)} placeholder="+27" type="tel" value={draft.mobile} />
          </Field>
          <Field id="additional-passengers" label="Additional passenger details" optional>
            <textarea className={textAreaClass} id="additional-passengers" onChange={(event) => update("additionalPassengers", event.currentTarget.value)} placeholder="Names or notes for other passengers" value={draft.additionalPassengers} />
          </Field>
          <p className="rounded-xl bg-[#eaf0eb] p-3 text-xs leading-5 text-[#52655b]">These details stay on this device for this booking draft and are not submitted.</p>
        </div>
      );
    }

    if (step === 6) {
      return (
        <div className="space-y-3">
          <SectionCard title="Journey details" onEdit={() => editStep(1)}>
            <dl className="divide-y divide-[#edf0ec]">
              <SummaryLine label="Pickup" value={draft.pickup} />
              <SummaryLine label="Destination" value={draft.destination} />
              <SummaryLine label="Travel date" value={formatDate(draft.travelDate)} />
              <SummaryLine label="Pickup time" value={draft.pickupTime} />
              <SummaryLine label="Journey" value={draft.tripType === "return" ? "Return" : "One way"} />
              {draft.tripType === "return" && <SummaryLine label="Return" value={`${formatDate(draft.returnDate)} · ${draft.returnTime}`} />}
            </dl>
          </SectionCard>
          <SectionCard title="Passengers & vehicle" onEdit={() => editStep(2)}>
            <dl className="divide-y divide-[#edf0ec]">
              <SummaryLine label="Passengers" value={formatPassengers(draft)} />
              <SummaryLine label="Vehicle category" value={draft.vehicle} />
            </dl>
            <button className="mt-2 text-xs font-semibold text-[#315d50]" onClick={() => editStep(3)} type="button">Edit vehicle</button>
          </SectionCard>
          <SectionCard title="Additional requirements" onEdit={() => editStep(4)}>
            <dl className="divide-y divide-[#edf0ec]">
              <SummaryLine label="Baby seats" value={String(draft.babySeats)} />
              <SummaryLine label="Extra luggage" value={String(draft.additionalLuggage)} />
              <SummaryLine label="Trailer" value={draft.trailer ? "Required" : "No"} />
              <SummaryLine label="Flight number" value={draft.flightNumber} />
              <SummaryLine label="Pickup instructions" value={draft.pickupInstructions} />
              <SummaryLine label="Accessibility" value={draft.accessibilityRequirements} />
            </dl>
          </SectionCard>
          <SectionCard title="Lead passenger" onEdit={() => editStep(5)}>
            <dl className="divide-y divide-[#edf0ec]">
              <SummaryLine label="Name" value={`${draft.firstName} ${draft.surname}`.trim()} />
              <SummaryLine label="Email" value={draft.email} />
              <SummaryLine label="Mobile" value={draft.mobile} />
              <SummaryLine label="Other passengers" value={draft.additionalPassengers} />
            </dl>
          </SectionCard>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#173b36] p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e5bd7f]">Quotation status</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">Pricing is not available yet</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">Your journey details are ready to review. A SihleB quote can be shown when route rates and service charges are configured.</p>
        </div>
        <SectionCard title="Journey summary">
          <dl className="divide-y divide-[#edf0ec]">
            <SummaryLine label="Route" value={`${draft.pickup} → ${draft.destination}`} />
            <SummaryLine label="Date & time" value={`${formatDate(draft.travelDate)} · ${draft.pickupTime}`} />
            <SummaryLine label="Journey type" value={draft.tripType === "return" ? `Return · ${formatDate(draft.returnDate)} ${draft.returnTime}` : "One way"} />
            <SummaryLine label="Passengers" value={formatPassengers(draft)} />
            <SummaryLine label="Vehicle" value={draft.vehicle} />
          </dl>
          <button className="mt-2 text-xs font-semibold text-[#315d50]" onClick={() => editStep(6)} type="button">Edit booking review</button>
        </SectionCard>
        <SectionCard title="Pricing breakdown">
          <dl className="divide-y divide-[#edf0ec]">
            <SummaryLine label="Journey fare" value="To be calculated" />
            <SummaryLine label="Additional services" value="To be confirmed" />
            <SummaryLine label="Estimated total" value="Not available" />
          </dl>
        </SectionCard>
        <p className="rounded-xl border border-[#eadfcb] bg-[#fbf6ed] p-3 text-xs leading-5 text-[#72592f]" role="status">
          This is a quotation placeholder, not a price offer. No booking or quote request has been submitted.
        </p>
      </div>
    );
  })();

  const title = step === 1 ? "Where are you going?" : step === 2 ? "Who is travelling?" : step === 3 ? "Choose a vehicle" : step === 4 ? "Anything else we should know?" : step === 5 ? "Passenger information" : step === 6 ? "Review your journey" : "Your quotation";
  const description = step === 1 ? "Add your pickup, destination and travel times." : step === 2 ? "Tell us how many people are travelling." : step === 3 ? "Choose the vehicle category that suits your trip." : step === 4 ? "Add any requirements to help us plan your ride." : step === 5 ? "Who should we contact about this journey?" : step === 6 ? "Check your details. You can edit any section before continuing." : "Review the trip details and quotation status.";

  return (
    <div className="min-h-[100svh] bg-[#f3f5f2] pb-32 pt-[env(safe-area-inset-top)]">
      <header className="sticky top-0 z-20 border-b border-[#e5eae5] bg-[#f3f5f2]/95 px-5 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-[13px] bg-[#173b36] text-xs font-bold text-white">SB</span>
            <div>
              <p className="text-sm font-bold text-[#182b3d]">SihleB Shuttle</p>
              <p className="text-[10px] text-[#78868c]">Plan a journey</p>
            </div>
          </div>
          <button aria-label="Exit booking" className="flex size-10 items-center justify-center rounded-full border border-[#e2e8e3] bg-white text-[#52655b]" onClick={onClose} type="button">
            <Icon name="close" className="size-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 pb-8 pt-5">
        <div aria-label={`Step ${step} of 7: ${stepNames[step - 1]}`} className="mb-6">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-[#78868c]">
            <span>Step {step} of 7</span>
            <span>{stepNames[step - 1]}</span>
          </div>
          <div aria-hidden="true" className="grid grid-cols-7 gap-1">
            {stepNames.map((name, index) => (
              <span className={`h-1 rounded-full ${index < step ? "bg-[#315d50]" : "bg-[#dfe6e0]"}`} key={name} />
            ))}
          </div>
        </div>

        <StepHeading description={description} eyebrow={`Step ${step} · ${stepNames[step - 1]}`} title={title} />
        <div className="mt-6">{stepContent}</div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e5eae5] bg-white/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md gap-3">
          <button
            className="min-h-12 flex-1 rounded-xl border border-[#dfe6e0] bg-white px-4 text-sm font-semibold text-[#52655b] transition hover:bg-[#f5f7f4]"
            onClick={goBack}
            type="button"
          >
            {step === 1 ? "Back" : "Previous"}
          </button>
          {step < 7 ? (
            <button
              className="flex min-h-12 flex-[1.35] items-center justify-center gap-2 rounded-xl bg-[#173b36] px-4 text-sm font-semibold text-white transition hover:bg-[#245247]"
              onClick={continueToNextStep}
              type="button"
            >
              {step === 6 ? "View quotation" : "Continue"} <Icon name="arrow" className="size-4" />
            </button>
          ) : (
            <button
              className="min-h-12 flex-[1.35] rounded-xl bg-[#173b36] px-4 text-sm font-semibold text-white transition hover:bg-[#245247]"
              onClick={onClose}
              type="button"
            >
              Return to dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
