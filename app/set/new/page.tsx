"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

import { fetchSetMetadata, createSet, findSetByUrl } from "./actions"
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

async function clientFindSetByUrl(url: string): Promise<{ id: string } | null> {
  const { data, error } = await supabaseBrowser
    .from("dj_sets")
    .select("id")
    .eq("url", url)
    .maybeSingle()

  if (error && (error as any).code !== "PGRST116") {
    throw new Error(error.message)
  }
  return data ?? null
}


export default function NewSetPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof urlSchema>>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "" },
  })

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
        const existing = await clientFindSetByUrl(canonical)
        if (existing?.id) {
          router.push(`/set/${existing.id}`)
          return
        }

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
