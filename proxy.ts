import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  let res = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          req.cookies.set(name, value);
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set(name, value, options);
        },
        remove: (name, options) => {
          req.cookies.set(name, '');
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set(name, '', options);
        },
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  // 1. Check if they are trying to access the Admin portal
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    // If they aren't logged in, or their email is NOT the Head Admin, bounce them
    if (!user || user.email !== process.env.HEAD_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // 2. Check standard protected routes (Dashboard & Counselor Portal)
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/counselor-portal');

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  
  return res;
}

export const config = { 
  matcher: ['/dashboard/:path*', '/counselor-portal/:path*', '/admin/:path*'] 
};