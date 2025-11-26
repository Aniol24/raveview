"use client"

import { useState, useTransition } from "react"
import { supabaseBrowser } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function FollowButton({
  targetUserId,
  isFollowingInitial,
}: {
  targetUserId: string
  isFollowingInitial: boolean
}) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial)
  const [isPending, startTransition] = useTransition()

  const toggleFollow = () => {
    startTransition(async () => {
      const { data: auth } = await supabaseBrowser.auth.getUser()
      const user = auth?.user
      if (!user) return

      if (isFollowing) {
        const { error } = await supabaseBrowser
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)

        if (!error) {
          setIsFollowing(false)
          router.refresh()  
        }
      } else {
        const { error } = await supabaseBrowser
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          })

        if (!error) {
          setIsFollowing(true)
          router.refresh() 
        }
      }
    })
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      onClick={toggleFollow}
      disabled={isPending}
    >
      {isPending ? "..." : isFollowing ? "Siguiendo" : "Seguir"}
    </Button>
  )
}
