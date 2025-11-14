import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PUBLIC_PREFIXES = ["/login", "/auth", "/api/auth", "/_next","/_next/image" ,"/favicon", "/api/public"]
const PUBLIC_EXACT = ["/","/hooks", "/api/soundcloud/thumbnail"] 

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const url = req.nextUrl
  const pathname = url.pathname

  const PUBLIC_PREFIXES = ["/login", "/auth", "/api/auth", "/_next", "/_next/image", "/favicon", "/api/public"]
  const PUBLIC_EXACT = ["/", "/hooks", "/api/soundcloud/thumbnail"]

  const isPublic =
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PUBLIC_EXACT.includes(pathname)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, opts) => {
          // VERY IMPORTANT: modify the response cookie
          res = NextResponse.next()
          res.cookies.set(name, value, opts)
        },
        remove: (name, opts) => {
          res = NextResponse.next()
          res.cookies.set(name, "", opts)
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!isPublic && !user) {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirectedFrom", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}


export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
}
