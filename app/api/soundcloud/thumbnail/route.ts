import { NextResponse } from "next/server"

const ALLOWED_HOSTS = new Set(["soundcloud.com", "m.soundcloud.com"])
const PRIVATE_HOSTS = new Set(["localhost", "127.0.0.1"])

function isPrivateHost(host: string) {
  if (PRIVATE_HOSTS.has(host)) return true
  return /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scUrl = searchParams.get("url")
  if (!scUrl) {
    return NextResponse.json({ error: "Missing `url` param" }, { status: 400 })
  }

  let u: URL
  try {
    u = new URL(scUrl)
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }
  const host = u.hostname.toLowerCase()
  if (!ALLOWED_HOSTS.has(host) || isPrivateHost(host)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(u.toString())}`,
      { next: { revalidate: 60 * 60 * 24 }, headers: { "User-Agent": "RAVEVIEW thumbnail resolver" } }
    )
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error", status: res.status }, { status: 502 })
    }
    const data = await res.json()
    const thumb = data?.thumbnail_url ?? null
    return NextResponse.json({ thumbnail_url: thumb })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 })
  }
}
