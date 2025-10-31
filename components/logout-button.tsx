"use client"
import { supabaseBrowser } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()
  return (
    <Button variant="ghost" onClick={async () => {
      await supabaseBrowser.auth.signOut()
      router.push("/login")
      router.refresh()
    }}>
      Log Out
    </Button>
  )
}
