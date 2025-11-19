"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

import { fetchSetMetadata, createSet } from "./actions"
import { supabaseBrowser } from "@/lib/supabase-client"

const urlSchema = z.object({
  url: z.string().url("Pon una URL válida de YouTube o SoundCloud"),
})

function normalizeScShort(raw: string) {
  return raw.replace("://on.soundcloud.com/", "://soundcloud.com/")
}

function clientCanonicalizeUrl(raw: string) {
  try {
    const u = new URL(normalizeScShort(raw.trim()))
    ;["utm_source", "utm_medium", "utm_campaign", "si", "time_continue", "t"].forEach((p) =>
      u.searchParams.delete(p)
    )
    return u.toString()
  } catch {
    return raw.trim()
  }
}

export default function NewSetPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const form = useForm<z.infer<typeof urlSchema>>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "" },
  })

  // 🔒 CLIENT-SIDE PROTECTION
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle()

      if (!profile?.is_admin) {
        router.push("/")
        return
      }

      setIsAdmin(true)
    }

    checkAdmin()
  }, [router])

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const onContinue = () => {
    const raw = form.getValues("url") || ""
    const parsed = urlSchema.safeParse({ url: raw })

    if (!parsed.success) {
      form.setError("url", {
        type: "manual",
        message: parsed.error.flatten().fieldErrors.url?.[0] || "URL inválida",
      })
      return
    }

    const canonical = clientCanonicalizeUrl(parsed.data.url)

    startTransition(async () => {
      try {
        const meta = await fetchSetMetadata(canonical)

        const created = await createSet({
          title: meta.title || "Untitled set",
          artist: meta.artist || "Unknown artist",
          url: canonical,
          platform: meta.platform,
          thumbnailUrl: meta.thumbnailUrl || undefined,
          uploadedAt: meta.uploadedAt || undefined,
          durationSec: meta.durationSec || undefined,
        })

        router.push(`/set/${created.id}`)
      } catch (e) {
        console.error(e)
        alert("No se pudo procesar el set. Revisa la URL o inténtalo de nuevo.")
      }
    })
  }

  const onUrlKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onContinue()
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold tracking-tight">Añadir nuevo set</h1>
        <p className="text-muted-foreground mt-1">
          Pega la URL del set (YouTube o SoundCloud). Si ya existe, te llevamos. Si no, lo creamos por ti ;)
        </p>

        <Separator className="my-6" />

        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="flex-1">
            <Input
              id="url"
              placeholder="https://www.youtube.com/watch?v=..."
              {...form.register("url")}
              onKeyDown={onUrlKeyDown}
            />
            {form.formState.errors.url?.message ? (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.url.message}</p>
            ) : null}
          </div>

          <div>
            <Button type="button" onClick={onContinue} disabled={isPending || !form.watch("url")}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando…
                </>
              ) : (
                "Ir"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
