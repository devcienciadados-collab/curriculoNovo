export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/((?!api/resume/download|_next/static|_next/image|favicon.ico).*)"
  ],
};
