import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Next.js middleware doesn't fully support React.cache, 
  // but we only need to call getSession if the user is explicitly requesting a protected route
  // that isn't a static asset, or on aggressive prefetch. We'll proceed with getSession as normal,
  // but since we've disabled autoRefreshToken in client.ts and added getCachedSession to server actions,
  // the middleware check is one of the few places left that can hit rate limits.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // We'll proceed with getSession as normal.
  // getSession() only makes a request if the token is expired, 
  // so it won't hit rate limits on every pre-fetch.
  const { data: { session } } = await supabase.auth.getSession()

  // If user is on a protected route but not logged in, we could redirect here,
  // but we'll let the layouts handle it more specifically.
  
  return response
}
