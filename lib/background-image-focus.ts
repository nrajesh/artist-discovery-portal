export const BACKGROUND_IMAGE_FOCUS_DEFAULTS = {
  backgroundImageFocusX: 50,
  backgroundImageFocusY: 50,
  backgroundImageZoom: 100,
} as const;

export const MIN_BACKGROUND_IMAGE_ZOOM = 100;
export const MAX_BACKGROUND_IMAGE_ZOOM = 220;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export type BackgroundImageFocus = {
  backgroundImageFocusX: number;
  backgroundImageFocusY: number;
  backgroundImageZoom: number;
};

export function normalizeBackgroundImageFocus(
  focus?: Partial<BackgroundImageFocus> | null,
): BackgroundImageFocus {
  return {
    backgroundImageFocusX: clamp(
      focus?.backgroundImageFocusX ?? BACKGROUND_IMAGE_FOCUS_DEFAULTS.backgroundImageFocusX,
      0,
      100,
    ),
    backgroundImageFocusY: clamp(
      focus?.backgroundImageFocusY ?? BACKGROUND_IMAGE_FOCUS_DEFAULTS.backgroundImageFocusY,
      0,
      100,
    ),
    backgroundImageZoom: clamp(
      focus?.backgroundImageZoom ?? BACKGROUND_IMAGE_FOCUS_DEFAULTS.backgroundImageZoom,
      MIN_BACKGROUND_IMAGE_ZOOM,
      MAX_BACKGROUND_IMAGE_ZOOM,
    ),
  };
}

export function getBackgroundImageObjectPosition(focus: BackgroundImageFocus): string {
  return `${focus.backgroundImageFocusX}% ${focus.backgroundImageFocusY}%`;
}

export function getBackgroundImageScale(focus: BackgroundImageFocus): number {
  return focus.backgroundImageZoom / 100;
}
