import { NextResponse, type NextRequest } from "next/server";
import { getDynamicMiddlewareClient } from "@/lib/supabase/dynamic";

const PROTECTED_PREFIXES = ["/dashboard", "/users", "/settings", "/profile"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip identity headers an attacker may try to inject.
  const forwarded = new Headers(request.headers);
  forwarded.delete("x-user-id");
  forwarded.delete("x-user-email");
  forwarded.delete("x-user-name");
  forwarded.set("x-pathname", pathname);

  if (!isProtected(pathname)) {
    return NextResponse.next({ request: { headers: forwarded } });
  }

  const response = NextResponse.next({ request: { headers: forwarded } });

  const supabase = await getDynamicMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    const redirect = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  forwarded.set("x-user-id", user.id);
  if (user.email) forwarded.set("x-user-email", encodeURIComponent(user.email));
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  if (fullName) forwarded.set("x-user-name", encodeURIComponent(fullName));

  const finalResponse = NextResponse.next({ request: { headers: forwarded } });
  for (const cookie of response.cookies.getAll()) {
    finalResponse.cookies.set(cookie);
  }
  return finalResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
