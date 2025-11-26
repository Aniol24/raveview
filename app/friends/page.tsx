import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { supabaseServer } from "@/lib/supabase-server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import SearchUsers from "@/components/search-users"

export const dynamic = "force-dynamic"

export default async function FriendsPage() {
  const supabase = await supabaseServer()

  // Auth check
  const { data: userRes } = await supabase.auth.getUser()
  if (!userRes?.user) redirect("/login")
  const user = userRes.user

  // Load who I follow
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)

  const friendIds = follows?.map((f) => f.following_id) ?? []

  // Load reviews + user profiles + sets
  let friendReviews: any[] = []
  let setsById: Record<string, any> = {}

  if (friendIds.length > 0) {
    const { data } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        set_id,
        profiles:profiles(id, display_name, username, avatar_url)
      `)
      .in("user_id", friendIds)
      .order("created_at", { ascending: false })
      .limit(20)

    friendReviews = data ?? []

    // Load SET info
    const uniqueSetIds = [...new Set(friendReviews.map((r) => r.set_id))]
    if (uniqueSetIds.length > 0) {
      const { data: sets } = await supabase
        .from("dj_sets")
        .select("id, title, artist_name, thumbnail_url, platform")
        .in("id", uniqueSetIds)

      if (sets) {
        setsById = sets.reduce((acc, set) => {
          acc[set.id] = set
          return acc
        }, {} as Record<string, any>)
      }
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* Page Header */}
        <h1 className="text-2xl font-bold mb-4">Amigos</h1>

        {/* Search Box */}
        <SearchUsers currentUserId={user.id} />

        <Separator className="my-8" />

        {/* Activity Feed */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Actividad reciente</h2>

          {friendReviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Tus amigos no han dejado reseñas todavía.
            </p>
          ) : (
            <div className="space-y-4">
              {friendReviews.map((review) => {
                const set = setsById[review.set_id]

                return (
                  <div
                    key={review.id}
                    className="flex gap-4 border rounded-lg bg-card p-4"
                  >
                    {/* SET THUMBNAIL */}
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

                    {/* CONTENT */}
                    <div className="flex-1">

                      {/* USER */}
                      <a
                        href={`/profile/${review.profiles?.username}`}
                        className="flex items-center gap-2 mb-1 hover:underline"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={review.profiles?.avatar_url || ""} />
                          <AvatarFallback>
                            {review.profiles?.display_name
                              ?.slice(0, 2)
                              .toUpperCase() ?? "??"}
                          </AvatarFallback>
                        </Avatar>

                        <span className="font-medium text-sm">
                          {review.profiles?.display_name}
                        </span>
                      </a>

                      {/* SET TITLE */}
                      <a
                        href={`/set/${set?.id}`}
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

                      {/* COMMENT */}
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
        </section>
      </main>
    </div>
  )
}
