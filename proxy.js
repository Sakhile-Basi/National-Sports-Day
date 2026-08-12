import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request) {
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/admin/login'

  let response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/scan'], // /register is deliberately NOT listed — public
}