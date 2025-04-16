import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    // Create a response object
    const response = NextResponse.next();

    // Add cache control headers to prevent stale session states
    response.headers.set('Cache-Control', 'no-store, max-age=0');

    // Create supabase client using middleware client
    const supabase = createMiddlewareClient({ req: request, res: response });

    // Check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Middleware session error:', sessionError);
    }

    const requestUrl = new URL(request.url);
    
    // Check if the request is for the admin area
    if (requestUrl.pathname.startsWith('/admin')) {
      // If there's no session, redirect to login with the original URL as redirect parameter
      if (!session) {
        console.log(`Middleware: No session found for protected route: ${requestUrl.pathname}`);
        
        // Create the URL to redirect to after login
        const redirectUrl = new URL('/login', request.url);
        
        // Add the original URL as a searchParam (for redirecting back after login)
        redirectUrl.searchParams.set('redirect', requestUrl.pathname);
        
        // Create a response that redirects to the login page
        return NextResponse.redirect(redirectUrl);
      }
      
      // User has a session, allow access to admin routes
      return response;
    }
    
    // For non-admin routes, always allow access
    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    // If there's an error in the middleware, allow access but log the error
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/admin/:path*']
}; 