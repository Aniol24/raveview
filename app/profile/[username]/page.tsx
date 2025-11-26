import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { supabaseServer } from "@/lib/supabase-server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import FollowButton from "../../../components/follow-button"

export const dynamic = "force-dynamic"

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await supabaseServer()

  const { data: userRes } = await supabase.auth.getUser()
  const currentUser = userRes?.user ?? null

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at, followers_count, following_count")
    .eq("username", username)
    .maybeSingle()

  if (!profile || error) notFound()

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, set_id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })

  const safeReviews = reviews ?? []

  let setsById: Record<string, any> = {}

  if (safeReviews.length > 0) {
    const unique = [...new Set(safeReviews.map((r) => r.set_id))]
    const { data: sets } = await supabase
      .from("dj_sets")
      .select("id, title, artist_name, thumbnail_url, platform")
      .in("id", unique)

    if (sets) {
      setsById = sets.reduce((acc, set) => {
        acc[set.id] = set
        return acc
      }, {} as Record<string, any>)
    }
  }

  let isFollowing = false

  if (currentUser) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profile.id)
      .maybeSingle()

    isFollowing = !!followRow
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

        {/* === HEADER ESTILO INSTAGRAM === */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-10">

          {/* FOTO */}
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          {/* INFO */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>

            {/* Followers / Following estilo IG */}
            <div className="flex gap-4 mt-2 text-sm">
              <span className="font-semibold">{profile.followers_count}</span>
              <span className="text-muted-foreground">seguidores</span>

              <span className="font-semibold">{profile.following_count}</span>
              <span className="text-muted-foreground">seguidos</span>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Miembro desde{" "}
              {new Date(profile.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* BOTÓN SEGUIR A LA DERECHA */}
          {currentUser && currentUser.id !== profile.id && (
            <div className="ml-auto">
              <FollowButton
                targetUserId={profile.id}
                isFollowingInitial={isFollowing}
              />
            </div>
          )}
        </div>

        <Separator className="my-6" />

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
                    <div className="w-20 h-20 bg-muted flex items-center justify-center text-xs rounded-md">
                      IMG
                    </div>
                  )}

                  <div className="flex-1">
                    {/* TÍTULO */}
                    <a
                      href={`/set/${set.id}`}
                      className="font-semibold text-lg hover:underline"
                    >
                      {set?.title ?? "Set desconocido"}
                    </a>

                    {/* RATING */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-bold">
                        {Number(review.rating).toFixed(1).replace(".0", "")}
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
