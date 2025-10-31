export type Platform = "youtube" | "soundcloud"

export interface DjSet {
  id: string
  title: string
  artist: string
  url: string
  platform: Platform
  durationSec?: number
  uploadedAt?: string
  rating?: number
  reviewCount?: number
  thumbnailUrl?: string
}
