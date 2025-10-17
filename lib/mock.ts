import { ReviewDTO, SetDTO } from "./types";

const mockSets: Record<string, SetDTO> = {
  "abc123": {
    id: "abc123",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    platform: "youtube",
    externalId: "dQw4w9WgXcQ",
    title: "DJ Example @ RAZZMATAZZ (Full Set)",
    channelOrArtist: "Dokku",
    description: "High-energy UKG/House set recorded live.",
    durationSeconds: 5400,
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    recordedAtDate: "2025-05-20",
    createdAt: new Date().toISOString(),
    avgRating: 4.4,
    reviewCount: 12,
    wasThereCount: 3,
    tags: ["UKG", "House", "Live"],
    // Demo: iframe básico; luego usaremos oEmbed real
    oembedHtml:
      '<iframe width="100%" height="400" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video" frameborder="0" allowfullscreen></iframe>',
  },
};

let mockReviews: ReviewDTO[] = [
  {
    id: "r1",
    setId: "abc123",
    userId: "u1",
    rating: 4.5,
    body: "Selección brutal, mezcla muy limpia y energía constante.",
    wasThere: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    user: {
      handle: "maria",
      displayName: "María",
      avatarUrl: undefined,
    },
  },
];

export async function fetchSetById(id: string): Promise<SetDTO | null> {
  await new Promise((r) => setTimeout(r, 200)); // simular red
  return mockSets[id] ?? null;
}

export async function fetchReviewsForSet(id: string): Promise<ReviewDTO[]> {
  await new Promise((r) => setTimeout(r, 200));
  return mockReviews.filter((r) => r.setId === id);
}

export async function createReview(input: {
  setId: string;
  userId: string; 
  rating: number;
  body: string;
  wasThere: boolean;
}): Promise<ReviewDTO> {
  await new Promise((r) => setTimeout(r, 300));
  const newR: ReviewDTO = {
    id: crypto.randomUUID(),
    setId: input.setId,
    userId: input.userId,
    rating: input.rating,
    body: input.body,
    wasThere: input.wasThere,
    createdAt: new Date().toISOString(),
    user: {
      handle: "you",
      displayName: "You",
      avatarUrl: undefined,
    },
  };
  mockReviews.unshift(newR);
  return newR;
}
