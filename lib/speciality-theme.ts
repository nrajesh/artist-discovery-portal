/**
 * Speciality Theming Service
 *
 * Provides colour theme data for artist speciality labels (admin-seeded palette).
 * Used to apply speciality-based visual theming to artist profile cards
 * and profile pages throughout the portal.
 *
 * Requirements: 4.5, 4.6, 5.2, 5.3, 5.4
 */

// ---------------------------------------------------------------------------
// Palette - must match prisma/seed.ts exactly
// ---------------------------------------------------------------------------

export const SPECIALITY_PALETTE: Record<
  string,
  { primaryColor: string; textColor: string }
> = {
  Vocal:              { primaryColor: '#7C3AED', textColor: '#FFFFFF' },
  Violin:             { primaryColor: '#B45309', textColor: '#FFFFFF' },
  Mridangam:          { primaryColor: '#B91C1C', textColor: '#FFFFFF' },
  Veena:              { primaryColor: '#047857', textColor: '#FFFFFF' },
  Flute:              { primaryColor: '#0369A1', textColor: '#FFFFFF' },
  Ghatam:             { primaryColor: '#92400E', textColor: '#FFFFFF' },
  Kanjira:            { primaryColor: '#BE185D', textColor: '#FFFFFF' },
  Thavil:             { primaryColor: '#7E22CE', textColor: '#FFFFFF' },
  Nadaswaram:         { primaryColor: '#C2410C', textColor: '#FFFFFF' },
  'Violin (South Indian)': { primaryColor: '#A16207', textColor: '#FFFFFF' },
  Morsing:            { primaryColor: '#065F46', textColor: '#FFFFFF' },
  Tavil:              { primaryColor: '#1D4ED8', textColor: '#FFFFFF' },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpecialityThemeResult {
  /** CSS value: solid colour or linear-gradient */
  background: string;
  /** Contrast-safe text colour for the background */
  textColor: string;
  /** Primary colour of the first matched speciality (for borders, icons, etc.) */
  accentColor: string;
}

/** Neutral fallback used when no speciality names match the palette. */
const FALLBACK: SpecialityThemeResult = {
  background: '#6B7280',
  textColor: '#FFFFFF',
  accentColor: '#6B7280',
};

/** Avatar / card accent when an artist has no speciality rows yet (matches profile fallback). */
export const DEFAULT_ARTIST_ACCENT_COLOR = '#92400E';

// ---------------------------------------------------------------------------
// Pure function
// ---------------------------------------------------------------------------

/**
 * Hero / card backgrounds from stored speciality colours (same source as UI pills).
 * - One speciality → solid fill
 * - Several → diagonal gradient across distinct colours so multi-instrumentalists don’t look identical to single-speciality peers who share the same first instrument.
 */
export function getThemeFromArtistSpecialities(
  specs: { name: string; color: string }[],
): SpecialityThemeResult {
  if (specs.length === 0) {
    return {
      background: DEFAULT_ARTIST_ACCENT_COLOR,
      textColor: '#FFFFFF',
      accentColor: DEFAULT_ARTIST_ACCENT_COLOR,
    };
  }

  const colors = specs.map((s) => s.color.trim()).filter(Boolean);
  const distinct = [...new Set(colors)];
  const accentColor = colors[0] ?? DEFAULT_ARTIST_ACCENT_COLOR;

  if (distinct.length === 1) {
    const c = distinct[0]!;
    return {
      background: c,
      textColor: '#FFFFFF',
      accentColor: c,
    };
  }

  return {
    background: `linear-gradient(135deg, ${distinct.join(', ')})`,
    textColor: '#FFFFFF',
    accentColor,
  };
}

/**
 * Derive a CSS colour theme from a list of speciality names.
 *
 * - Empty / no matches → neutral grey fallback
 * - Exactly 1 match    → solid `primaryColor` as background
 * - 2+ matches         → `linear-gradient(135deg, …)` across all matched primary colours
 *
 * Unknown speciality names are silently ignored.
 */
export function getThemeForSpecialities(
  specialityNames: string[],
): SpecialityThemeResult {
  // Collect palette entries for each name that exists in the palette,
  // preserving the order supplied by the caller.
  const matched = specialityNames
    .map((name) => SPECIALITY_PALETTE[name])
    .filter((entry): entry is { primaryColor: string; textColor: string } =>
      entry !== undefined,
    );

  if (matched.length === 0) {
    return FALLBACK;
  }

  const accentColor = matched[0].primaryColor;

  if (matched.length === 1) {
    return {
      background: matched[0].primaryColor,
      textColor: matched[0].textColor,
      accentColor,
    };
  }

  // 2+ matches: build a CSS linear-gradient
  const stops = matched.map((e) => e.primaryColor).join(', ');
  return {
    background: `linear-gradient(135deg, ${stops})`,
    textColor: '#FFFFFF',
    accentColor,
  };
}
