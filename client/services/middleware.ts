import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the token in cookies
  const token = request.cookies.get('stride_token')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register');

  // 1. If trying to access a protected route without a token, redirect to login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If logged in and trying to access login/register, redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

// Routes to protect
export const config = {
  matcher: ['/home/:path*', '/dashboard/:path*', '/profile/:path*', '/login', '/register'],
};