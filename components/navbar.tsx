"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Home, Users, PlusCircle, LogOut } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string | null
}



export function Navbar() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    let unsub: { data: { subscription: { unsubscribe: () => void } } } | null = null

    async function load() {
      setLoading(true)

      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      const { data: prof, error } = await supabaseBrowser
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      if (prof) {
        setProfile(prof)
        setLoading(false)
      } else {
        const display_name =
          (user.user_metadata as any)?.display_name ??
          user.email?.split("@")[0] ??
          "User"

        try {
          await supabaseBrowser
            .from("profiles")
            .insert({ id: user.id, display_name })
          setProfile({ id: user.id, display_name, avatar_url: null })
        } catch (err) {
          setProfile({ id: user.id, display_name, avatar_url: null })
        } finally {
          setLoading(false)
        }
      }
    }

    const sub = supabaseBrowser.auth.onAuthStateChange((_event) => {
      load()
    })
    unsub = sub

    load()

    return () => {
      unsub?.data.subscription.unsubscribe()
    }
  }, [])

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    await supabaseBrowser.auth.signOut().catch(() => {})
    setProfile(null)
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-colors hover:text-primary">
            <span className="text-xl font-bold tracking-tight">RAVEVIEW</span>
          </Link>

          {loading ? (
            <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
          ) : profile ? (
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Principal</span>
                </Button>
              </Link>

              <Link href="/friends">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Amigos</span>
                </Button>
              </Link>

              <Link href="/set/new">
                <Button variant="ghost" size="sm" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo set</span>
                </Button>
              </Link>

              <div className="flex items-center gap-3 ml-2">
                <Link href="/profile" className="inline-flex">
                  <Avatar className="h-9 w-9 border border-border hover:ring-2 hover:ring-primary transition-all">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                    ) : (
                      <AvatarFallback>
                        {profile.display_name?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={onLogout}
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">Iniciar Sesión</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
