// src/lib/spotId.ts
import type { Spot } from "./normalize"

export function spotIdOf(spot: Spot) {
  const base = `${spot.gu}|${spot.title}|${spot.addressText ?? ""}`.trim()
  return base
    .replaceAll("/", "_")
    .replaceAll("#", "_")
    .replaceAll("?", "_")
    .replaceAll("\\", "_")
    .slice(0, 400)
}
