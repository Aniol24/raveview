import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { supabaseServer } from "@/lib/supabase-server"
import { AvatarUploader } from "@/components/avatar-uploader"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await supabaseServer()

  const userRes = await supabase.auth.getUser()
  if (userRes.error || !userRes.data.user) redirect("/login")

  const user = userRes.data.user

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle()

  const { data: myReviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, set_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const safeReviews = myReviews ?? []

  // Load sets referenced by those reviews
  let setsById: Record<string, any> = {}

  if (safeReviews.length > 0) {
    const uniqueIds = [
      ...new Set(safeReviews.map((r) => r.set_id).filter(Boolean)),
    ]

    if (uniqueIds.length > 0) {
      const { data: sets } = await supabase
        .from("dj_sets")
        .select("id, title, artist_name, thumbnail_url, platform")
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
    .map((p: string) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-5">
            <AvatarUploader
              currentAvatarUrl={profile?.avatar_url ?? undefined}
              displayName={displayName}
            />

            <div>
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-sm text-muted-foreground">@{profile?.username}</p>

              {profile?.created_at && (
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
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-semibold">{safeReviews.length}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Reseñas
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* STATS */}
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

        {/* LISTA DE RESEÑAS */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Tus reseñas</h2>

          {safeReviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aún no has dejado ninguna reseña. Ve a cualquier set y deja la primera ⭐
            </p>
          ) : (
            <div className="space-y-6">
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
        </div>
      </main>
    </div>
  )
}
