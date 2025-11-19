"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { RatingStars } from "@/components/rating-stars"
import { ReviewCard } from "@/components/review-card"
import { ReviewForm } from "@/components/review-form"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Sparkles, Play } from "lucide-react"
import type { DjSet } from "@/lib/types"
import { getThumbnailUrl, niceMonth, formatDuration } from "@/lib/platform"
import { useSoundCloudThumb } from "@/hooks/use-soundcloud-thumb"
import { PlatformBadge } from "@/components/platform-badge"
import { supabaseBrowser } from "@/lib/supabase-client"

type ReviewRow = {
  rating: number
  comment: string | null
  was_present: boolean
  created_at: string
  user_id: string
  profiles: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
}

export default function SetDetailPage() {
  const params = useParams()
  const setId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [setData, setSetData] = useState<DjSet | null>(null)

  const [reviews, setReviews] = useState<
    Array<{
      userId: string
      userName: string
      avatarUrl: string | null
      rating: number
      comment: string
      date: string
      wasPresent: boolean
    }>
  >([])


  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const { data: { user } } = await supabaseBrowser.auth.getUser()
        if (!cancelled) setCurrentUserId(user?.id ?? null)

        const { data: setRow, error: setErr } = await supabaseBrowser
          .from("dj_sets_public")
          .select("*")
          .eq("id", setId)
          .maybeSingle()

        if (setErr) throw new Error(setErr.message)
        if (!setRow) throw new Error("No se encontró este set.")

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
          .select(`
            rating,
            comment,
            was_present,
            created_at,
            user_id,
            profiles:profiles (
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("set_id", setId)
          .order("created_at", { ascending: false })

        if (revErr) throw new Error(revErr.message)

        const mapped =
          (revRows as ReviewRow[]).map((r) => ({
            userId: r.user_id,
            userName:
              r.profiles?.display_name ??
              r.profiles?.username ??
              "Anónimo",
            avatarUrl: r.profiles?.avatar_url ?? null,
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


  const userReview = useMemo(() => {
    if (!currentUserId) return null
    return reviews.find((r) => r.userId === currentUserId) ?? null
  }, [reviews, currentUserId])

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
    return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
  }, [reviews, setData?.rating])

  const presentCount = useMemo(
    () => reviews.filter((r) => r.wasPresent).length,
    [reviews]
  )

  const prettyDate = setData?.uploadedAt ? niceMonth(setData.uploadedAt) : "—"
  const prettyDuration = setData?.durationSec ? formatDuration(setData.durationSec) : null
  const aspect = setData?.platform === "youtube" ? "15 / 9" : "1 / 1"


  const handleSubmitReview = async (review: {
    rating: number
    comment: string
    wasPresent: boolean
  }) => {
    if (userReview) {
      alert("Ya has publicado una reseña en este set.")
      return
    }

    try {
      const { data: { user }, error: userErr } = await supabaseBrowser.auth.getUser()
      if (userErr) throw new Error(userErr.message)
      if (!user) throw new Error("Debes estar logueado para reseñar.")

      const { data: profile, error: profileErr } = await supabaseBrowser
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      if (profileErr) throw new Error(profileErr.message)

      const { error: insertErr } = await supabaseBrowser
        .from("reviews")
        .insert({
          set_id: setId,
          user_id: user.id,
          rating: review.rating,
          comment: review.comment,
          was_present: review.wasPresent,
        })

      if (insertErr) throw new Error(insertErr.message)

      const newReview = {
        userId: user.id,
        userName: profile?.display_name ?? profile?.username ?? "Tú",
        avatarUrl: profile?.avatar_url ?? null,
        rating: review.rating,
        comment: review.comment,
        wasPresent: review.wasPresent,
        date: new Date().toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      }

      setReviews(prev => [newReview, ...prev])

    } catch (err: any) {
      console.error("Error guardando reseña:", err)
      alert(err.message)
    }
  }


  const handleUpdateReview = async (updated: {
    rating: number
    comment: string
    wasPresent: boolean
  }) => {
    if (!currentUserId) return

    try {
      const { error } = await supabaseBrowser
        .from("reviews")
        .update({
          rating: updated.rating,
          comment: updated.comment,
          was_present: updated.wasPresent,
          updated_at: new Date().toISOString()
        })
        .eq("set_id", setId)
        .eq("user_id", currentUserId)

      if (error) throw new Error(error.message)

      setReviews(prev =>
        prev.map(r =>
          r.userId === currentUserId
            ? {
                ...r,
                rating: updated.rating,
                comment: updated.comment,
                wasPresent: updated.wasPresent,
                date: new Date().toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              }
            : r
        )
      )

      alert("Reseña actualizada correctamente.")

    } catch (e: any) {
      console.error("Error editando reseña:", e.message)
      alert("Error editando reseña: " + e.message)
    }
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
              <div className="sm:col-span-8">
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
                      {prettyDuration && (
                        <Badge variant="secondary">{prettyDuration}</Badge>
                      )}
                      {setData.uploadedAt && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          {prettyDate}
                        </Badge>
                      )}
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
                <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="font-medium">{prettyDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Reseñas</p>
                    <p className="font-medium">{reviews.length} reseñas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Asistieron</p>
                    <p className="font-medium">{presentCount} personas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valoración Media</p>
                    <RatingStars rating={avgRating} size="lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* FORMULARIO */}
            <div className="mb-8">
              {userReview ? (
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="mb-3 text-muted-foreground">
                    Ya has publicado una reseña. Puedes editarla aquí:
                  </p>

                  <ReviewForm
                    onSubmit={handleUpdateReview}
                    initialData={{
                      rating: userReview.rating,
                      comment: userReview.comment,
                      wasPresent: userReview.wasPresent
                    }}
                    isEditing
                  />
                </div>
              ) : (
                <ReviewForm onSubmit={handleSubmitReview} />
              )}
            </div>

            {/* LISTA DE REVIEWS */}
            <div>
              <h2 className="mb-6 text-2xl font-bold">Reseñas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((review, idx) => (
                  <ReviewCard
                    key={idx}
                    userName={review.userName}
                    avatarUrl={review.avatarUrl}
                    rating={review.rating}
                    comment={review.comment}
                    wasPresent={review.wasPresent}
                    date={review.date}
                  />
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
