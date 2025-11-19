import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { supabaseServer } from "@/lib/supabase-server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string }
}) {
  const supabase = await supabaseServer()

  // 1. Buscar perfil por username
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at")
    .eq("username", params.username)
    .maybeSingle()

  if (!profile || error) {
    notFound()
  }

  // 2. Traer reseñas del usuario
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, set_id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })

  const safeReviews = reviews ?? []

  // 3. Traer información básica de los sets que reseñó
  let setsById: Record<string, any> = {}

  if (safeReviews.length > 0) {
    const ids = safeReviews.map((r) => r.set_id).filter(Boolean)
    const unique = Array.from(new Set(ids))

    if (unique.length > 0) {
      const { data: sets } = await supabase
        .from("dj_sets")
        .select("id, title, artist_name, thumbnail_url, platform, url")
        .in("id", unique)

      if (sets) {
        setsById = sets.reduce((acc, set) => {
          acc[set.id] = set
          return acc
        }, {} as Record<string, any>)
      }
    }
  }

  const displayName =
    profile.display_name ||
    profile.username ||
    "Usuario"

  const initials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Miembro desde{" "}
              {new Date(profile.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-8">
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

        {/* LISTA DE RESEÑAS */}
        <h2 className="text-lg font-semibold mb-4">Reseñas de {displayName}</h2>

        {safeReviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Este usuario aún no ha dejado ninguna reseña.
          </p>
        ) : (
          <div className="space-y-4">
            {safeReviews.map((review) => {
              const set = setsById[review.set_id]

              return (
                <div
                  key={review.id}
                  className="flex gap-4 border rounded-lg bg-card p-4"
                >
                  {/* MINIATURA */}
                  {set?.thumbnail_url ? (
                    <img
                      src={set.thumbnail_url}
                      alt={set.title}
                      className="w-20 h-20 rounded-md object-cover bg-muted"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center text-xs">
                      IMG
                    </div>
                  )}

                  {/* INFO */}
                  <div className="flex-1">
                    {/* TÍTULO */}
                    <a
                      href={set ? `/set/${set.id}` : "#"}
                      className="font-semibold text-lg hover:underline"
                    >
                      {set?.title ?? "Set desconocido"}
                    </a>

                    {/* RATING */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-bold">
                        {typeof review.rating === "number"
                          ? review.rating.toFixed(1).replace(".0", "")
                          : review.rating}
                      </span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>

                    {/* COMENTARIO */}
                    {review.comment ? (
                      <p className="text-sm text-muted-foreground mt-2">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground mt-2">
                        Sin comentario
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}
