
export function getPrimaryColor(fallback = "#1677ff") {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim()
  return value || fallback
}

export function softPalette(primary: string) {
  return [
    primary,
    "color-mix(in srgb, var(--primary) 70%, #13c2c2)",
    "color-mix(in srgb, var(--primary) 55%, #722ed1)",
    "color-mix(in srgb, var(--primary) 45%, #fa8c16)",
  ]
}
