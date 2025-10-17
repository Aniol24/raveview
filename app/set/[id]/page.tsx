import { notFound } from "next/navigation";
import { fetchReviewsForSet, fetchSetById } from "@/lib/mock";
import { IframeEmbed } from "@/components/iframe-embed";
import { SetHeader } from "@/components/set-header";
import { StatsBar } from "@/components/stats-bar";
import { ReviewForm } from "@/components/review-form";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default async function SetPage({ params }: { params: { id: string } }) {
  const set = await fetchSetById(params.id);
  if (!set) return notFound();

  const reviews = await fetchReviewsForSet(params.id);

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
      {/* Embed */}
      <IframeEmbed html={set.oembedHtml} />

      {/* Header + stats */}
      <div className="space-y-3">
        <SetHeader
          title={set.title}
          channelOrArtist={set.channelOrArtist}
          tags={set.tags}
          durationSeconds={set.durationSeconds}
        />
        <StatsBar
          avgRating={set.avgRating}
          reviewCount={set.reviewCount}
          wasThereCount={set.wasThereCount}
        />
      </div>

      {/* Review form */}
      <section aria-labelledby="review-form-title" className="space-y-2">
        <h2 id="review-form-title" className="text-lg font-medium">
          Write a review
        </h2>
        <ReviewForm setId={set.id} />
      </section>

      {/* Reviews list */}
      <section aria-labelledby="reviews-title" className="space-y-3">
        <h2 id="reviews-title" className="text-lg font-medium">
          Recent reviews
        </h2>

        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sé la primera persona en reseñar este set.</p>
          ) : (
            reviews.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={r.user.avatarUrl} />
                    <AvatarFallback>{r.user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{r.user.displayName}</span>
                      <span className="text-muted-foreground">@{r.user.handle}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>⭐ {r.rating.toFixed(1)}</span>
                      {r.wasThere && (
                        <>
                          <Separator orientation="vertical" className="h-4" />
                          <span title="Assisted">🎟️ I was there</span>
                        </>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{r.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
