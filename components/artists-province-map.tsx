"use client";

import Link from "next/link";
import { ArtistMiniCard, type ArtistMiniCardArtist } from "@/components/artist-mini-card";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection } from "geojson";

const VIEW_W = 520;
const VIEW_H = 575;

/** Map GeoJSON label → `Artist.province` string (PDOK uses Fryslân; DB uses Friesland). */
function geoLabelToDbProvince(label: string): string {
  if (!label) return "";
  const aliases: Record<string, string> = {
    Fryslân: "Friesland",
  };
  return aliases[label] ?? label;
}

/** GeoJSON labels vs province strings stored on `Artist.province`. */
function lookupCount(naam: string, counts: Record<string, number>): number {
  if (!naam) return 0;
  const dbKey = geoLabelToDbProvince(naam);
  return counts[dbKey] ?? counts[naam] ?? 0;
}

/** Base tone must stay distinct from white cards (`bg-white`) or the map reads as empty. */
function fillForCount(count: number, maxPositive: number): string {
  if (count <= 0) return "#e7e2dc";
  const t = Math.min(1, count / maxPositive);
  const l = 88 - t * 43;
  return `hsl(28 72% ${l}%)`;
}

type ArtistsProvinceMapProps = {
  artistsByProvince: Record<string, ArtistMiniCardArtist[]>;
  countsByProvince: Record<string, number>;
  /** Same-origin path (e.g. `/geo/...`) or absolute URL to a FeatureCollection GeoJSON. */
  geoJsonHref: string;
};

function normalizeGeoJsonHref(href: string): string {
  const t = href.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")) return t;
  return `/${t.replace(/^\/+/, "")}`;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 6;

/** Cards per page in the province panel (fixed slot height keeps home layout predictable). */
const ARTISTS_PAGE_SIZE = 3;
/** Reserved height for exactly three mini-cards + gaps (~132px each). */
const CARDS_AREA_MIN_CLASS = "min-h-[396px]";

export function ArtistsProvinceMap({
  artistsByProvince,
  countsByProvince,
  geoJsonHref,
}: ArtistsProvinceMapProps) {
  const resolvedHref = useMemo(() => normalizeGeoJsonHref(geoJsonHref), [geoJsonHref]);
  const [fc, setFc] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hover, setHover] = useState<{ naam: string; count: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedDbProvince, setSelectedDbProvince] = useState<string | null>(null);
  const [artistPage, setArtistPage] = useState(0);
  const wheelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setArtistPage(0);
  }, [selectedDbProvince]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(resolvedHref);
        if (!res.ok) throw new Error(`Could not load map data (${res.status})`);
        const data = (await res.json()) as FeatureCollection;
        if (!cancelled) setFc(data);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load map");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedHref]);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((z + delta).toFixed(3)))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [fc]);

  const maxPositive = useMemo(() => {
    const vals = Object.values(countsByProvince).filter((n) => n > 0);
    return Math.max(1, ...vals);
  }, [countsByProvince]);

  const drawn = useMemo(() => {
    if (!fc?.features?.length) return [];
    const projection = geoMercator().fitSize([VIEW_W, VIEW_H], fc);
    const pathGen = geoPath(projection);
    return fc.features.map((f, i) => {
      const props = f.properties as Record<string, unknown> | null;
      const naam = String(props?.naam ?? props?.name ?? "");
      const ident = String(props?.identificatie ?? props?.code ?? i);
      const dbProvince = geoLabelToDbProvince(naam);
      const count = lookupCount(naam, countsByProvince);
      const d = pathGen(f as Feature);
      return {
        key: ident || String(i),
        naam,
        dbProvince,
        count,
        d: d ?? "",
        fill: fillForCount(count, maxPositive),
      };
    });
  }, [fc, countsByProvince, maxPositive]);

  const gTransform = useMemo(() => {
    const cx = VIEW_W / 2;
    const cy = VIEW_H / 2;
    return `translate(${cx},${cy}) scale(${zoom}) translate(${-cx},${-cy})`;
  }, [zoom]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, Number((z * 1.25).toFixed(3))));
  }, []);
  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, Number((z / 1.25).toFixed(3))));
  }, []);
  const zoomReset = useCallback(() => setZoom(1), []);

  const onProvinceClick = useCallback((dbProvince: string) => {
    if (!dbProvince) return;
    setSelectedDbProvince((prev) => (prev === dbProvince ? null : dbProvince));
  }, []);

  const selectedArtists = useMemo(() => {
    if (!selectedDbProvince) return [];
    const list = artistsByProvince[selectedDbProvince] ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [selectedDbProvince, artistsByProvince]);
  const selectedLabel = selectedDbProvince ?? "";
  const directoryHref = selectedDbProvince
    ? `/artists?province=${encodeURIComponent(selectedDbProvince)}`
    : "/artists";

  const artistPageCount = Math.max(1, Math.ceil(selectedArtists.length / ARTISTS_PAGE_SIZE));
  const artistPageSafe = Math.min(artistPage, artistPageCount - 1);
  const pagedArtists = selectedArtists.slice(
    artistPageSafe * ARTISTS_PAGE_SIZE,
    artistPageSafe * ARTISTS_PAGE_SIZE + ARTISTS_PAGE_SIZE,
  );

  useEffect(() => {
    setArtistPage((p) => Math.min(p, artistPageCount - 1));
  }, [artistPageCount]);

  if (loadError) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
        {loadError}
      </p>
    );
  }

  if (!fc) {
    return (
      <div
        className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50 text-sm text-stone-500"
        aria-busy="true"
        aria-live="polite"
      >
        Loading map…
      </div>
    );
  }

  const topCount = Math.max(0, ...Object.values(countsByProvince));

  const pathCount = drawn.filter((x) => x.d && x.d.length > 0).length;

  const mapCard = (
    <div
      ref={wheelRef}
      className="relative flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow-sm lg:min-h-0"
    >
      <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-stone-200 bg-white/95 p-1 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          className="min-h-9 min-w-9 rounded-md text-lg font-semibold leading-none text-stone-700 hover:bg-stone-100 disabled:opacity-40"
          aria-label="Zoom out"
          onClick={zoomOut}
          disabled={zoom <= ZOOM_MIN}
        >
          −
        </button>
        <button
          type="button"
          className="min-h-9 min-w-9 rounded-md text-lg font-semibold leading-none text-stone-700 hover:bg-stone-100 disabled:opacity-40"
          aria-label="Zoom in"
          onClick={zoomIn}
          disabled={zoom >= ZOOM_MAX}
        >
          +
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
          aria-label="Reset zoom"
          onClick={zoomReset}
        >
          Reset
        </button>
      </div>
      <div className="relative mx-auto min-h-[260px] w-full max-w-[420px] flex-1 lg:max-w-none lg:min-h-0">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="absolute inset-0 h-full w-full touch-manipulation"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Map of artist counts by province"
        >
          <title>Artists per province</title>
          <g transform={gTransform}>
            {drawn.map(({ key, naam, dbProvince, count, d, fill }) => {
              const selected = Boolean(selectedDbProvince && dbProvince && selectedDbProvince === dbProvince);
              return (
                <path
                  key={key}
                  d={d}
                  fill={fill}
                  stroke={selected ? "#b45309" : "#78716c"}
                  strokeWidth={selected ? 2.4 : 1.35}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className={`transition-colors duration-150 ${dbProvince ? "cursor-pointer" : "cursor-default"}`}
                  onMouseEnter={() => naam && setHover({ naam, count })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => dbProvince && onProvinceClick(dbProvince)}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {pathCount === 0 && fc.features.length > 0 && (
        <p className="absolute inset-x-0 bottom-0 bg-amber-50/95 px-3 py-2 text-center text-xs text-amber-950">
          Map outlines could not be drawn from this GeoJSON. Check CRS (expect WGS84 lon/lat) and geometry types.
        </p>
      )}
      {hover && (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-stone-900/90 px-3 py-2 text-xs text-white shadow-md">
          <span className="font-semibold">{hover.naam}</span>
          <span className="text-stone-300">
            {" "}
            · {hover.count} {hover.count === 1 ? "artist" : "artists"}
          </span>
        </div>
      )}
    </div>
  );

  const sidePanel = (
    <aside
      className={`flex min-h-[220px] min-w-0 flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm lg:h-full lg:min-h-0 ${selectedDbProvince && selectedArtists.length > 0 ? "lg:min-h-[560px]" : ""}`}
      aria-live="polite"
      aria-label="Artists in selected province"
    >
      {!selectedDbProvince ? (
        <p className="text-sm leading-relaxed text-stone-600">
          Tap a province to see who&apos;s listed - your scene might be lighter than you think. Join and help fill the map.
        </p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-stone-800">{selectedLabel}</h3>
              <p className="mt-0.5 text-xs text-stone-500">
                {selectedArtists.length}{" "}
                {selectedArtists.length === 1 ? "profile here" : "profiles here"}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
              onClick={() => setSelectedDbProvince(null)}
            >
              Clear
            </button>
          </div>
          {selectedArtists.length === 0 ? (
            <div className="mt-4 space-y-2 text-sm text-stone-600">
              <p>
                No one from this province is listed yet - you can be the first, and help talented musicians nearby discover
                each other.
              </p>
              <p className="text-xs text-stone-500">
                Claim your spot on the map; we&apos;ll show your profile here once you&apos;re live.
              </p>
            </div>
          ) : (
            <>
              <div
                className={`mt-3 flex flex-col gap-3 ${CARDS_AREA_MIN_CLASS} justify-start`}
                aria-live="polite"
              >
                {pagedArtists.map((a) => (
                  <ArtistMiniCard key={a.slug} artist={a} showProvince={false} />
                ))}
              </div>
              {artistPageCount > 1 && (
                <div className="mt-3 flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={artistPageSafe <= 0}
                    onClick={() => setArtistPage((p) => Math.max(0, p - 1))}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-stone-500">
                    Page {artistPageSafe + 1} of {artistPageCount}
                  </span>
                  <button
                    type="button"
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={artistPageSafe >= artistPageCount - 1}
                    onClick={() => setArtistPage((p) => Math.min(artistPageCount - 1, p + 1))}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
          <div className="mt-auto border-t border-stone-100 pt-3">
            {selectedArtists.length === 0 ? (
              <Link
                href="/register"
                className="text-sm font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
              >
                Join the portal →
              </Link>
            ) : (
              <Link
                href={directoryHref}
                className="text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900"
              >
                Browse everyone in this province →
              </Link>
            )}
          </div>
        </>
      )}
    </aside>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <div
          className={`flex min-h-0 w-full flex-col ${selectedDbProvince && selectedArtists.length > 0 ? "lg:min-h-[560px]" : "lg:min-h-[360px]"}`}
        >
          {mapCard}
        </div>
        {sidePanel}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
        <span>
          Warmer colours mean more musicians listed there (scale on this screen:{" "}
          <strong className="font-medium text-stone-700">0</strong>
          -
          <strong className="font-medium text-stone-700">{topCount}</strong>). Zoom with +/− or scroll.
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-14 rounded-sm bg-gradient-to-r from-stone-100 to-amber-800/70" aria-hidden />
          <span className="sr-only">Legend from low to high count</span>
        </span>
      </div>
    </div>
  );
}
