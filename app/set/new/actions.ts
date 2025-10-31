"use server"

import { supabaseServer } from "@/lib/supabase-server"

type Platform = "youtube" | "soundcloud"


function detectPlatform(url: string): Platform | null {
  const u = url.toLowerCase()
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube"
  if (u.includes("soundcloud.com") || u.includes("on.soundcloud.com")) return "soundcloud"
  return null
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === "youtu.be") return u.pathname.slice(1)
    const v = u.searchParams.get("v")
    if (v) return v
    const m = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

function canonicalizeUrl(raw: string) {
  try {
    const u = new URL(raw)
    ;["utm_source","utm_medium","utm_campaign","si","time_continue","t"].forEach(p=>u.searchParams.delete(p))
    return u.toString()
  } catch { return raw }
}

function normalizeScShort(raw: string) {
  return raw.replace("://on.soundcloud.com/", "://soundcloud.com/")
}

function iso8601DurationToSeconds(iso?: string): number | undefined {
  if (!iso) return undefined
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso)
  if (!m) return undefined
  const h = parseInt(m[1] || "0", 10)
  const min = parseInt(m[2] || "0", 10)
  const s = parseInt(m[3] || "0", 10)
  return h * 3600 + min * 60 + s
}


const SC_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID
const SC_CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET

type ScToken = { access_token: string; expires_at: number }
let scTokenCache: ScToken | null = null

async function scGetToken(): Promise<string> {
  if (!SC_CLIENT_ID || !SC_CLIENT_SECRET) {
    throw new Error("Faltan SOUNDCLOUD_CLIENT_ID/SOUNDCLOUD_CLIENT_SECRET")
  }
  if (scTokenCache && Date.now() < scTokenCache.expires_at - 60_000) {
    return scTokenCache.access_token
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: SC_CLIENT_ID,
    client_secret: SC_CLIENT_SECRET,
  })

  const res = await fetch("https://api.soundcloud.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(`SoundCloud token error: ${res.status} ${msg}`)
  }
  const json = (await res.json()) as { access_token: string; expires_in: number }
  scTokenCache = {
    access_token: json.access_token,
    expires_at: Date.now() + (json.expires_in ?? 3600) * 1000,
  }
  return scTokenCache.access_token
}

async function scFetch(pathWithQuery: string) {
  const token = await scGetToken()
  const url = new URL(pathWithQuery, "https://api-v2.soundcloud.com")
  const res = await fetch(url.toString(), {
    headers: { Authorization: `OAuth ${token}` },
    next: { revalidate: 300 },
  })
  return res
}


function upscaleArtwork(url?: string | null): string | undefined {
  if (!url) return
  return url
    .replace(/-large\.(jpg|png)/, "-t500x500.$1")
    .replace(/-t300x300\.(jpg|png)/, "-t500x500.$1")
    .replace(/-crop\.(jpg|png)/, "-t500x500.$1")
}

function mapSoundCloudToSet(resource: any, inputUrl: string) {
  const kind = resource?.kind 
  const title: string =
    resource?.title ??
    (resource?.kind === "playlist" && resource?.tracks?.[0]?.title ? resource.tracks[0].title : "") ??
    ""

  const artist: string =
    resource?.user?.username ??
    resource?.publisher_metadata?.artist ??
    (resource?.tracks?.[0]?.user?.username ?? "") ??
    ""

  const uploadedAt: string | undefined = resource?.created_at
    ? String(resource.created_at).split("T")[0]
    : undefined

  let durationSec: number | undefined
  if (kind === "track") {
    durationSec = typeof resource?.duration === "number" ? Math.round(resource.duration / 1000) : undefined
  } else if (kind === "playlist" && Array.isArray(resource?.tracks)) {
    const totalMs = resource.tracks.reduce(
      (acc: number, t: any) => acc + (typeof t?.duration === "number" ? t.duration : 0),
      0
    )
    durationSec = totalMs ? Math.round(totalMs / 1000) : undefined
  }

  const thumb =
    upscaleArtwork(resource?.artwork_url) ||
    upscaleArtwork(resource?.visuals?.visuals?.[0]?.visual_url) ||
    upscaleArtwork(resource?.user?.avatar_url) ||
    undefined

  const canonicalUrl = resource?.permalink_url || inputUrl

  return {
    platform: "soundcloud" as const,
    platformId: String(resource?.id ?? canonicalUrl),
    url: canonicalUrl,
    title,
    artist,
    thumbnailUrl: thumb ?? "",
    durationSec,
    uploadedAt,
  }
}


export async function fetchSetMetadata(rawUrl: string) {
  const url = canonicalizeUrl(rawUrl)
  const platform = detectPlatform(url)
  if (!platform) throw new Error("Plataforma no soportada (YouTube o SoundCloud)")

  if (platform === "youtube") {
    const id = extractYoutubeId(url)
    if (!id) throw new Error("No se pudo extraer el ID de YouTube")

    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
      { next: { revalidate: 300 } }
    )
    if (!oembedRes.ok) throw new Error("No se pudieron obtener metadatos (oEmbed)")
    const oembed = await oembedRes.json()

    let durationSec: number | undefined
    let uploadedAt: string | undefined

    const apiKey = process.env.YOUTUBE_API_KEY
    if (apiKey) {
      const metaRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=contentDetails,snippet&key=${apiKey}`,
        { next: { revalidate: 300 } }
      )
      if (metaRes.ok) {
        const meta = await metaRes.json()
        const item = meta?.items?.[0]
        durationSec = iso8601DurationToSeconds(item?.contentDetails?.duration)
        uploadedAt = item?.snippet?.publishedAt ? String(item.snippet.publishedAt).split("T")[0] : undefined
      }
    }

    return {
      platform,
      platformId: id,
      url,
      title: oembed?.title ?? "",
      artist: oembed?.author_name ?? "",
      thumbnailUrl: oembed?.thumbnail_url ?? "",
      durationSec,
      uploadedAt,
    }
  }

  if (platform === "soundcloud") {
    const scUrl = normalizeScShort(url)

    const token = await scGetToken()
    const resolveRes = await fetch(
      `https://api.soundcloud.com/resolve?url=${encodeURIComponent(scUrl)}`,
      {
        headers: { Authorization: `OAuth ${token}` },
        next: { revalidate: 300 },
      }
    )

    if (!resolveRes.ok) {
      console.warn(`⚠️ Fallo al resolver scUrl ${scUrl}: ${resolveRes.status}`)
      const oembed = await fetch(
        `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(scUrl)}`,
        { next: { revalidate: 300 } }
      )
      if (!oembed.ok)
        throw new Error("No se pudieron obtener metadatos de SoundCloud (oEmbed)")
      const data = await oembed.json()

      const fullTitle = (data?.title as string) ?? ""
      let artist = (data?.author_name as string) || ""
      let title = fullTitle
      if (fullTitle.includes(" - ")) {
        const [a, ...rest] = fullTitle.split(" - ")
        artist = artist || a
        title = rest.join(" - ")
      }

      return {
        platform,
        platformId: scUrl,
        url: scUrl,
        title: title || fullTitle || "",
        artist,
        thumbnailUrl: (data?.thumbnail_url as string) ?? "",
        durationSec: undefined,
        uploadedAt: undefined,
      }
    }

    const resolved = await resolveRes.json()
    console.log("✅ SC resolved resource:", resolved)

    let resource = resolved
    if (resolved?.kind === "track") {
      const r = await scFetch(`/tracks/${resolved.id}`)
      if (r.ok) resource = await r.json()
    } else if (resolved?.kind === "playlist") {
      const r = await scFetch(`/playlists/${resolved.id}`)
      if (r.ok) resource = await r.json()
    }

    return mapSoundCloudToSet(resource, scUrl)
  }


  throw new Error("Plataforma no soportada")
}

async function ensureProfileExists(userId: string) {
  const supabase = supabaseServer()

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  if (existing?.id) return

  const { error: insErr } = await supabase
    .from("profiles")
    .insert({ id: userId })
  if (insErr && !(insErr as any).message?.includes("duplicate")) {
    throw new Error(insErr.message)
  }
}

export async function createSet(input: {
  title: string
  artist: string
  url: string
  platform: Platform
  thumbnailUrl?: string
  durationSec?: number
  uploadedAt?: string
}) {
  const supabase = supabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No estás autenticado.")

  await ensureProfileExists(user.id)

  const url = canonicalizeUrl(input.url)

  const { data: found } = await supabase
    .from("dj_sets")
    .select("id")
    .eq("url", url)
    .maybeSingle()

  if (found?.id) return { id: found.id }

  const { data, error } = await supabase
    .from("dj_sets")
    .insert({
      title: input.title,
      artist_name: input.artist,
      url,
      platform: input.platform,       
      duration_sec: input.durationSec ?? null,
      uploaded_at: input.uploadedAt ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) {
    const msg = error.message || ""
    const isDuplicate =
      (error as any).code === "23505" ||
      msg.includes("duplicate key value") ||
      msg.includes("url")
    if (isDuplicate) {
      const again = await supabase
        .from("dj_sets")
        .select("id")
        .eq("url", url)
        .maybeSingle()
      if (again.data?.id) return { id: again.data.id }
    }
    throw new Error(error.message)
  }

  return { id: data!.id }
}

export async function findSetByUrl(url: string): Promise<{ id: string } | null> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from("dj_sets")
    .select("id")
    .eq("url", url)
    .maybeSingle()

  if (error && (error as any).code !== "PGRST116") {
    throw new Error(error.message)
  }
  return data ?? null
}
