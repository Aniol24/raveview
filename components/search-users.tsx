"use client"

import { useState } from "react"
import { supabaseBrowser } from "@/lib/supabase-client"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import FollowButton from "@/components/follow-button"

export default function SearchUsers({ currentUserId }: { currentUserId: string }) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const search = async (value: string) => {
    setQ(value)

    if (!value.trim()) {
      setResults([])
      return
    }

    setLoading(true)

    const { data } = await supabaseBrowser
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .or(`display_name.ilike.%${value}%,username.ilike.%${value}%`)
      .neq("id", currentUserId)
      .limit(10)

    setResults(data || [])
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar usuarios..."
        value={q}
        onChange={(e) => search(e.target.value)}
      />

      {loading && (
        <p className="text-sm text-muted-foreground">Buscando...</p>
      )}

      <div className="space-y-3">
        {results.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between py-1"
          >
            <div className="flex items-center gap-3">
              {/* Avatar clickable */}
              <a href={`/profile/${u.username}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={u.avatar_url || ""} />
                  <AvatarFallback>
                    {u.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </a>

              {/* Name + Username */}
              <div>
                <a
                  href={`/profile/${u.username}`}
                  className="font-medium hover:underline"
                >
                  {u.display_name}
                </a>
                <p className="text-sm text-muted-foreground">@{u.username}</p>
              </div>
            </div>

            <FollowButton targetUserId={u.id} isFollowingInitial={false} />
          </div>
        ))}
      </div>
    </div>
  )
}
