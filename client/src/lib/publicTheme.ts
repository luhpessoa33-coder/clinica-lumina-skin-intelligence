import type { CSSProperties } from "react";
import type { PublicSiteTheme } from "@shared/publicSite";

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

function rgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function contrastText(hex: string) {
  const { r, g, b } = rgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.56 ? "#17201e" : "#ffffff";
}

/**
 * Applies the colors chosen by the SUPER ADM as scoped CSS variables. Both
 * public and protected screens consume the same palette without exposing it
 * as a global mutable browser setting.
 */
export function publicThemeStyle(theme: PublicSiteTheme): ThemeStyle {
  return {
    "--lumina-primary": theme.primary,
    "--lumina-secondary": theme.secondary,
    "--lumina-accent": theme.accent,
    "--lumina-background": theme.background,
    "--lumina-surface": theme.surface,
    "--lumina-text": theme.text,
    "--lumina-muted-text": theme.mutedText,
    "--lumina-on-primary": contrastText(theme.primary),
    "--lumina-on-secondary": contrastText(theme.secondary),
    "--lumina-on-accent": contrastText(theme.accent),
  };
}

export function isValidHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
