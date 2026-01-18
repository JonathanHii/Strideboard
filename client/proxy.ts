// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Extract the token from cookies
  const token = request.cookies.get('stride_token')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/register', '/'];

  const isPublicPath = publicPaths.includes(pathname);

  //  If the user is NOT on a public page and HAS NO token -> Redirect to login
  if (!isPublicPath && !token) {
    const loginUrl = new URL('/login', request.url);

    // This allows the login page to know where the user was trying to go
    loginUrl.searchParams.set('from', pathname);

    return NextResponse.redirect(loginUrl);
  }

  // If the user HAS a token and tries to access the login page -> Redirect to 
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/workspaces', request.url));
  }

  // Allow the request to proceed for all other cases
  return NextResponse.next();
}

// Configuration to determine where this logic runs
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, svgs, etc) <-- ADD THIS LOGIC
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};