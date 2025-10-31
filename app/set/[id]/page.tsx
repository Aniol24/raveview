"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { RatingStars } from "@/components/rating-stars"
import { ReviewCard } from "@/components/review-card"
import { ReviewForm } from "@/components/review-form"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Sparkles, Play } from "lucide-react"
import type { DjSet } from "@/types"
import { getThumbnailUrl, niceMonth, formatDuration } from "@/lib/platform"
import { useSoundCloudThumb } from "@/hooks/use-soundcloud-thumb"
import { PlatformBadge } from "@/components/platform-badge"
import { supabaseBrowser } from "@/lib/supabase-client"

type ReviewRow = {
  rating: number
  comment: string | null
  was_present: boolean
  created_at: string
  profiles: { username: string | null } | null
}

export default function SetDetailPage() {
  const params = useParams()
  const setId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setData, setSetData] = useState<DjSet | null>(null)
  const [reviews, setReviews] = useState<Array<{
    userName: string
    rating: number
    comment: string
    date: string
    wasPresent: boolean
  }>>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data: setRow, error: setErr } = await supabaseBrowser
          .from("dj_sets_public")
          .select("*")
          .eq("id", setId)
          .maybeSingle()

        if (setErr) throw new Error(setErr.message)
        if (!setRow) {
          throw new Error("No se encontró este set.")
        }

        const djset: DjSet = {
          id: setRow.id,
          title: setRow.title,
          artist: setRow.artist,
          url: setRow.url,
          platform: setRow.platform,
          durationSec: setRow.durationSec ?? undefined,
          uploadedAt: setRow.uploadedAt ?? undefined,
          rating: typeof setRow.rating === "number" ? setRow.rating : 0,
          reviewCount: typeof setRow.reviewCount === "number" ? setRow.reviewCount : 0,
          thumbnailUrl: undefined, 
        }
        if (!cancelled) setSetData(djset)

        const { data: revRows, error: revErr } = await supabaseBrowser
          .from("reviews")
          .select("rating, comment, was_present, created_at, profiles:profiles(username)")
          .eq("set_id", setId)
          .order("created_at", { ascending: false })

        if (revErr) throw new Error(revErr.message)

        const mapped =
          (revRows as ReviewRow[]).map((r) => ({
            userName: r.profiles?.username ?? "Anónimo",
            rating: r.rating,
            comment: r.comment ?? "",
            wasPresent: r.was_present,
            date: new Date(r.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          })) ?? []

        if (!cancelled) setReviews(mapped)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Error cargando el set")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (setId) load()
    return () => {
      cancelled = true
    }
  }, [setId])

  const ytThumb = useMemo(
    () =>
      getThumbnailUrl({
        platform: setData?.platform,
        url: setData?.url,
        thumbnailUrl: setData?.thumbnailUrl,
      }),
    [setData?.platform, setData?.url, setData?.thumbnailUrl]
  )

  const { thumb: scThumb } = useSoundCloudThumb(
    setData?.platform === "soundcloud" && !setData?.thumbnailUrl ? setData?.url : undefined
  )

  const finalThumb = useMemo(() => {
    if (!setData) return undefined
    return (
      setData.thumbnailUrl ??
      (setData.platform === "youtube"
        ? ytThumb
        : setData.platform === "soundcloud"
        ? scThumb
        : undefined)
    )
  }, [setData, ytThumb, scThumb])

  const avgRating = useMemo(() => {
    if (setData?.rating) return setData.rating
    if (!reviews.length) return 0
    const sum = reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0)
    return sum / reviews.length
  }, [reviews, setData?.rating])

  const presentCount = useMemo(
    () => reviews.filter((r) => r.wasPresent).length,
    [reviews]
  )

  const prettyDate = setData?.uploadedAt ? niceMonth(setData.uploadedAt) : "—"
  const prettyDuration = setData?.durationSec ? formatDuration(setData.durationSec) : null
  const aspect = setData?.platform === "youtube" ? "15 / 9" : "1 / 1"

  const handleSubmitReview = (review: { rating: number; comment: string; wasPresent: boolean }) => {
    const newReview = {
      userName: "Anónimo",
      rating: review.rating,
      comment: review.comment,
      wasPresent: review.wasPresent,
      date: new Date().toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }
    setReviews((prev) => [newReview, ...prev])
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/2 rounded bg-muted" />
            <div className="h-64 w-full rounded bg-muted" />
            <div className="h-4 w-1/3 rounded bg-muted" />
          </div>
        ) : error ? (
          <div className="text-destructive">⚠️ {error}</div>
        ) : !setData ? (
          <div>No encontrado.</div>
        ) : (
          <>
            <div className="mb-8 grid gap-6 sm:grid-cols-12">
              <div className="sm:col-span-8 relative">
                <div className="relative h-[300px] sm:h-[350px] overflow-hidden rounded-xl bg-muted">
                  <div className="relative w-full h-full" style={{ aspectRatio: aspect }}>
                    {finalThumb ? (
                      <img
                        src={finalThumb}
                        alt={`${setData.title} – ${setData.artist}`}
                        className="absolute inset-0 h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted">
                        <span className="text-sm">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <PlatformBadge platform={setData.platform} />
                      {prettyDuration ? (
                        <Badge variant="secondary" className="bg-secondary">
                          {prettyDuration}
                        </Badge>
                      ) : null}
                      {setData.uploadedAt ? (
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          {prettyDate}
                        </Badge>
                      ) : null}
                    </div>

                    <h1 className="mb-1 text-3xl sm:text-4xl font-bold">{setData.title}</h1>
                    <p className="text-lg sm:text-xl text-muted-foreground">{setData.artist}</p>

                    <div className="mt-4">
                      <a
                        href={setData.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow hover:bg-primary/80 transition-colors"
                      >
                        <Play className="h-4 w-4" />
                        Go Listen
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-4 grid gap-4">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="font-medium">{prettyDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Reseñas</p>
                    <p className="font-medium">{setData.reviewCount ?? reviews.length} reseñas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Asistieron</p>
                    <p className="font-medium">{presentCount} personas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Valoración Media</p>
                    <RatingStars rating={avgRating} size="lg" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <ReviewForm onSubmit={handleSubmitReview} />
            </div>

            <div>
              <h2 className="mb-6 text-2xl font-bold">Reseñas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {reviews.map((review, idx) => (
                  <div key={`${review.userName}-${review.date}-${idx}`} className="h-full">
                    <ReviewCard {...review} />
                  </div>
                ))}
                {!reviews.length && (
                  <p className="text-muted-foreground">Aún no hay reseñas. ¡Sé el primero!</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
