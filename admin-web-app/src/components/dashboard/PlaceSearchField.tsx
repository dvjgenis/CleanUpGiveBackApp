"use client";

/**
 * Heatmap / map place search (fullscreen county map):
 * - Always-on free path: Photon → Nominatim via `/api/place-search` (no Google required).
 * - Optional: Google Places Autocomplete when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set.
 * - Search / Enter resolves through the same free chain when Google isn't used / fails.
 */
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  boundsFromFlat,
  hasGoogleMapsKey,
  loadPlacesScript,
  type PlaceSelection,
  type PlacesAutocomplete,
} from "@/lib/google-places";
import type { PlaceHit } from "@/lib/place-search";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: PlaceSelection) => void;
  placeholder?: string;
  /** Bias results toward this viewport without excluding outsiders. */
  viewboxBounds?: [number, number, number, number];
  showSubmitButton?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
};

async function fetchPlaceHits(
  query: string,
  viewboxBounds: [number, number, number, number] | undefined,
  limit: number,
  signal?: AbortSignal,
): Promise<PlaceHit[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (viewboxBounds) {
    const [minLng, minLat, maxLng, maxLat] = viewboxBounds;
    params.set("minLng", String(minLng));
    params.set("minLat", String(minLat));
    params.set("maxLng", String(maxLng));
    params.set("maxLat", String(maxLat));
  }
  const res = await fetch(`/api/place-search?${params.toString()}`, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as { hits?: PlaceHit[] };
  return data.hits ?? [];
}

export function PlaceSearchField({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Search for an address or place",
  viewboxBounds,
  showSubmitButton = false,
  className,
  inputClassName,
  id,
}: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<PlacesAutocomplete | null>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  onPlaceSelectedRef.current = onPlaceSelected;

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceHit[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Google is optional only — free Photon→Nominatim path is the durable default.
  const useGoogle = hasGoogleMapsKey() && !scriptFailed;

  useEffect(() => {
    if (!hasGoogleMapsKey() || !inputRef.current) return;
    let cancelled = false;

    loadPlacesScript()
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return;
        const bounds = boundsFromFlat(viewboxBounds);
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
          types: ["geocode"],
          componentRestrictions: { country: "us" },
          ...(bounds ? { bounds, strictBounds: false } : {}),
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();
          if (lat == null || lng == null) {
            setError("Pick a suggestion that includes a map location.");
            return;
          }
          const label = place.formatted_address ?? place.name ?? inputRef.current?.value ?? "";
          onChange(label);
          setError(null);
          onPlaceSelectedRef.current({ label, latitude: lat, longitude: lng });
        });
        autocompleteRef.current = autocomplete;
      })
      .catch(() => {
        if (!cancelled) setScriptFailed(true);
      });

    return () => {
      cancelled = true;
      autocompleteRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const bounds = boundsFromFlat(viewboxBounds);
    if (bounds && autocompleteRef.current?.setBounds) {
      autocompleteRef.current.setBounds(bounds);
    }
  }, [viewboxBounds]);

  // Free typeahead (Photon → Nominatim) whenever Google isn't active.
  useEffect(() => {
    if (useGoogle) return;
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const hits = await fetchPlaceHits(q, viewboxBounds, 6, controller.signal);
          if (controller.signal.aborted) return;
          setSuggestions(hits);
          setOpen(hits.length > 0);
          setActiveIndex(-1);
        } catch {
          if (!controller.signal.aborted) {
            setSuggestions([]);
            setOpen(false);
          }
        }
      })();
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value, viewboxBounds, useGoogle]);

  function pickSuggestion(hit: PlaceHit) {
    onChange(hit.label);
    setOpen(false);
    setSuggestions([]);
    setError(null);
    onPlaceSelected({
      label: hit.label,
      latitude: hit.latitude,
      longitude: hit.longitude,
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;

    if (!useGoogle && activeIndex >= 0 && suggestions[activeIndex]) {
      pickSuggestion(suggestions[activeIndex]);
      return;
    }
    if (!useGoogle && suggestions.length === 1) {
      pickSuggestion(suggestions[0]);
      return;
    }

    setSearching(true);
    setError(null);
    setOpen(false);
    try {
      // Always resolve via free chain on submit (works with or without Google).
      const hits = await fetchPlaceHits(q, viewboxBounds, 1);
      const top = hits[0];
      if (!top) {
        setError(`No results for "${q}"`);
        return;
      }
      onChange(top.label);
      onPlaceSelected({
        label: top.label,
        latitude: top.latitude,
        longitude: top.longitude,
      });
    } catch {
      setError("Place search is temporarily unavailable — try again in a moment.");
    } finally {
      setSearching(false);
    }
  }

  const inputClass =
    inputClassName ??
    "w-full h-11 px-md rounded-full border border-border-outline bg-bg-app font-body text-[13px] text-text-primary placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className={showSubmitButton ? "flex items-center gap-sm w-full" : "relative w-full"}>
        <div className={showSubmitButton ? "relative flex-1 min-w-0" : "relative w-full"}>
          <input
            ref={inputRef}
            id={id}
            type="search"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setError(null);
            }}
            onFocus={() => {
              if (!useGoogle && suggestions.length > 0) setOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={(e) => {
              if (useGoogle || !open || suggestions.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-autocomplete={useGoogle ? undefined : "list"}
            aria-controls={useGoogle ? undefined : listId}
            aria-expanded={useGoogle ? undefined : open}
            role={useGoogle ? undefined : "combobox"}
            autoComplete="off"
            className={inputClass}
          />
          {!useGoogle && open && suggestions.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              aria-label="Place suggestions"
              className="absolute left-0 right-0 top-[calc(100%+4px)] z-[11000] max-h-72 overflow-y-auto rounded-md border border-border-outline bg-bg-app shadow-bar-top"
            >
              {suggestions.map((hit, index) => (
                <li key={`${hit.label}-${hit.latitude}-${hit.longitude}`} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickSuggestion(hit);
                    }}
                    className={`w-full min-h-11 px-md py-xs text-left font-body text-[13px] text-text-primary hover:bg-bg-surface-elevated ${
                      index === activeIndex ? "bg-bg-surface-elevated" : ""
                    }`}
                  >
                    {hit.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {showSubmitButton && (
          <button
            type="submit"
            disabled={searching || !value.trim()}
            className="shrink-0 h-11 px-md rounded-full border border-border-outline bg-bg-app font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-xs font-body text-[12px] text-[#ba1a1a]" role="alert">
          {error}
        </p>
      )}
      {hasGoogleMapsKey() && scriptFailed && (
        <p className="mt-xs font-body text-[12px] text-text-tertiary">
          Google suggestions unavailable — using free place search instead.
        </p>
      )}
    </form>
  );
}
