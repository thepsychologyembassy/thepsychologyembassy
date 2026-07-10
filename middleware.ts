import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Define the routes that strictly require authentication
  const protectedRoutes = ['/dashboard', '/counselor-portal', '/admin'];
  
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected) {
    // Check for the Supabase session cookies
    const authCookie = req.cookies.get('sb-access-token') || req.cookies.get('sb-refresh-token');
    
    // If no Supabase cookie is found, immediately redirect to login before rendering anything
    if (!authCookie) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Optimize the middleware to only run on relevant paths to save server resources
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/counselor-portal/:path*',
    '/admin/:path*'
  ]
};