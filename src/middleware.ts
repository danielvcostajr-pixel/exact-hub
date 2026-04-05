import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const publicPaths = ['/login', '/registro', '/api/auth/callback']
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  // Unauthenticated user trying to access a protected route
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated user on login page or root → redirect by role
  if (user && (pathname === '/login' || pathname === '/')) {
    // Fetch user profile to determine role
    const { data: profile } = await supabase
      .from('Usuario')
      .select('papel')
      .eq('id', user.id)
      .maybeSingle()

    const url = request.nextUrl.clone()
    if (profile?.papel === 'ADMIN') {
      url.pathname = '/admin'
    } else if (profile?.papel === 'CLIENTE') {
      url.pathname = '/cliente'
    } else {
      url.pathname = '/consultor'
    }
    return NextResponse.redirect(url)
  }

  // Protect admin routes — only ADMIN can access /admin/*
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('Usuario')
      .select('papel')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.papel !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/consultor'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
