// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth`;

export async function proxy(request: NextRequest) {
  // Extract the token from cookies
  const token = request.cookies.get('stride_token')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/register', '/'];

  const isPublicPath = publicPaths.includes(pathname);

  if (!isPublicPath) {
    let isValid = false;

    // If we have a token, check it against the API
    if (token) {
      try {
        const response = await fetch(`${API_URL}/check`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        isValid = response.ok; // set to true
      } catch (error) {
        isValid = false;
      }
    }

    // If no token OR token is invalid -> Redirect & Delete Cookie
    if (!token || !isValid) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);

      const response = NextResponse.redirect(loginUrl);

      // delete if corrupted token
      if (token) {
        response.cookies.delete('stride_token');
      }

      return response;
    }
  }

  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/workspaces', request.url));
  }

  return NextResponse.next();
}

// Configg
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