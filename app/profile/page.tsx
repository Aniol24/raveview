// app/profile/page.tsx
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { supabaseServer } from "@/lib/supabase-server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AvatarUploader } from "@/components/avatar-uploader"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await supabaseServer()

  // 1) usuario
  const userRes = await supabase.auth.getUser()
  if (userRes.error || !userRes.data.user) {
    redirect("/login")
  }
  const user = userRes.data.user

  // 2) perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at, is_admin")
    .eq("id", user.id)
    .maybeSingle()

  // 3) reviews del usuario (solo reviews)
  const { data: myReviews, error: revErr } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, dj_set_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // si hay error, ponemos array vacío y ya
  const safeReviews = myReviews ?? []

  // 4) si hay reviews, traemos los sets que corresponden
  let setsById: Record<string, any> = {}

  if (safeReviews.length > 0) {
    const ids = safeReviews.map((r) => r.dj_set_id).filter(Boolean)
    // quitamos duplicados
    const uniqueIds = Array.from(new Set(ids))

    if (uniqueIds.length > 0) {
      const { data: sets } = await supabase
        .from("dj_sets")
        .select("id, title, artist_name, thumbnail_url, platform, url")
        .in("id", uniqueIds)

      if (sets) {
        setsById = sets.reduce((acc, set) => {
          acc[set.id] = set
          return acc
        }, {} as Record<string, any>)
      }
    }
  }

  const displayName =
    profile?.display_name ||
    profile?.username ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuario"

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* ───── HEADER MEJORADO ───── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Avatar + info */}
          <div className="flex items-center gap-5">
          <AvatarUploader
            currentAvatarUrl={profile?.avatar_url ?? undefined}
            displayName={displayName}
          />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>

              {/* username */}
              {profile?.username ? (
                <p className="text-muted-foreground text-sm">@{profile.username}</p>
              ) : (
                <p className="text-muted-foreground text-sm">@{user.email?.split("@")[0]}</p>
              )}

              {/* fecha registro */}
              {profile?.created_at ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Se unió el{" "}
                  <span className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          {/* Stats resumidas arriba a la derecha (opcional) */}
          <div className="flex gap-6 sm:gap-8">
            <div className="text-center">
              <p className="text-2xl font-semibold">{safeReviews.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Reseñas
              </p>
            </div>
          </div>
        </div>


        <Separator className="my-6" />

        {/* stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Reseñas hechas</p>
            <p className="text-2xl font-semibold">{safeReviews.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Última reseña</p>
            <p className="text-sm text-muted-foreground">
              {safeReviews.length > 0
                ? new Date(safeReviews[0].created_at).toLocaleString("es-ES")
                : "—"}
            </p>
          </div>
        </div>

        {/* listado de reseñas */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Tus reseñas</h2>

          {safeReviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aún no has dejado ninguna reseña. Ve a cualquier set y deja la primera ⭐
            </p>
          ) : (
            <div className="space-y-4">
              {safeReviews.map((review) => {
                const set = review.dj_set_id ? setsById[review.dj_set_id] : null
                return (
                  <div
                    key={review.id}
                    className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row gap-4 justify-between"
                  >
                    <div className="flex gap-3">
                      {/* thumb del set si existe */}
                      {set?.thumbnail_url ? (
                        <img
                          src={set.thumbnail_url}
                          alt={set.title}
                          className="w-16 h-16 rounded-md object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-xs">
                          SET
                        </div>
                      )}
                      <div>
                        <a
                          href={set ? `/set/${set.id}` : "#"}
                          className={set ? "font-medium hover:underline" : "font-medium"}
                        >
                          {set?.title ?? "Set desconocido"}
                        </a>
                        <p className="text-sm text-muted-foreground">
                          {set?.artist_name ? set.artist_name : "Artista desconocido"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reseñado el {new Date(review.created_at).toLocaleDateString("es-ES")} a las{" "}
                          {new Date(review.created_at).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2">
                      {/* rating */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-semibold">
                          {typeof review.rating === "number"
                            ? review.rating.toFixed(1).replace(".0", "")
                            : review.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">/10</span>
                      </div>
                      {/* comentario */}
                      {review.comment ? (
                        <p className="text-sm text-muted-foreground max-w-md text-left sm:text-right">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Sin comentario</p>
                      )}
                      {/* plataforma */}
                      {set?.platform ? (
                        <Badge variant="outline" className="text-xs">
                          {set.platform}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
