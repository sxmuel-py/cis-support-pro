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
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
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
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
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

  // Skip getting the session and setting cookies if it's an internal next.js request
  // (e.g. Server Action POST requests which already handle auth internally)
  const isServerAction = request.headers.get("next-action") !== null;
  const isInternalRsc = request.headers.get("rsc") === "1";

  // If it's a server action or internal RSC request, skip the token refresh check here
  // because the Server Action itself will validate auth using getCachedSession().
  if (isServerAction || isInternalRsc) {
    return response;
  }

  // Use getSession to refresh the session without hitting the API rate limit on every request
  // getUser() makes a network request, getSession() only makes a request if the token is expired
  const { data: { session } } = await supabase.auth.getSession()

  // If user is on a protected route but not logged in, we could redirect here,
  // but we'll let the layouts handle it more specifically.
  
  return response
}
