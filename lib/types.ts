export type Platform = "youtube" | "soundcloud" | "mixcloud";

export interface SetDTO {
  id: string;
  url: string;
  platform: Platform;
  externalId: string;
  title: string;
  channelOrArtist: string;
  description?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  recordedAtDate?: string;
  createdAt: string;
  avgRating: number;
  reviewCount: number;
  wasThereCount: number;
  tags: string[];
  oembedHtml?: string; // para incrustar
}

export interface ReviewDTO {
  id: string;
  setId: string;
  userId: string;
  rating: number; // 0.5–5
  body: string;
  wasThere: boolean;
  createdAt: string;
  user: {
    handle: string;
    displayName: string;
    avatarUrl?: string;
  };
}
