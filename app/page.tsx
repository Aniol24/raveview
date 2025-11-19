"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import type { DjSet } from "@/lib/types"
import { FeedMasonry } from "@/components/feed-masonry"
import { supabaseBrowser } from "@/lib/supabase-client"
import wallpaper from "@/public/img/wallpaper.jpg"
import logoWhite from "@/public/logo/white.png"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sets, setSets] = useState<DjSet[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabaseBrowser
          .from("dj_sets_public")
          .select("*")
          .order("rating", { ascending: false })
          .order("reviewCount", { ascending: false })
          .order("uploadedAt", { ascending: false })
          .limit(20)

        if (error) throw new Error(error.message)

        const mapped: DjSet[] =
          data?.map((r: any) => ({
            id: r.id,
            title: r.title,
            artist: r.artist,
            url: r.url,
            platform: r.platform,
            durationSec: r.durationSec ?? undefined,
            uploadedAt: r.uploadedAt ?? undefined,
            rating: typeof r.rating === "number" ? r.rating : 0,
            reviewCount: typeof r.reviewCount === "number" ? r.reviewCount : 0,
            thumbnailUrl: undefined,
          })) ?? []

        if (!cancelled) setSets(mapped)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Error cargando el feed")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filteredSets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const base = [...sets]
    if (!q) return base
    return base.filter(
      (set) =>
        set.title.toLowerCase().includes(q) ||
        set.artist.toLowerCase().includes(q)
    )
  }, [searchQuery, sets])

  return (
    <div className="min-h-screen">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* ======= HERO con fondo y logo ======= */}
      <section className="relative h-[60vh] w-full overflow-hidden">
        {/* Imagen de fondo */}
        <Image
          src={wallpaper}
          alt="Raveview background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Degradado + blur inferior */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background backdrop-blur-sm" />

        {/* Contenido centrado */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <Image
            src={logoWhite}
            alt="Raveview Logo"
            width={180}
            height={180}
            className="mb-6 drop-shadow-lg"
            priority
          />
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">
            RAVEVIEW
          </h1>
        </div>
      </section>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-2">
        {/* BUSCADOR */}
        <div className="mb-10 max-w-md mx-auto">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por DJ o título del set..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Buscar sets"
            />
          </div>
        </div>

        {/* FEED */}
        <section className="max-w-screen-xl mx-auto">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-semibold">DJ Sets Destacados</h2>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando feed…</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-destructive">{error}</div>
          ) : filteredSets.length > 0 ? (
            <FeedMasonry sets={filteredSets} />
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No se encontraron sets que coincidan con tu búsqueda.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
