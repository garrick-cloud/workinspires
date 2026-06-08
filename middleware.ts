import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/app\/([^/]+)\/dashboard/);
  if (!match) return NextResponse.next();

  const requestedSlug = match[1];
  const headerSlugs =
    request.headers.get('x-workinspires-company-slugs') ?? request.headers.get('x-workinspires-company-slug');
  const cookieSlugs =
    request.cookies.get('workinspires_company_slugs')?.value ?? request.cookies.get('workinspires_company_slug')?.value;
  const envSlugs = process.env.WORKINSPIRES_AUTHORIZED_COMPANY_SLUGS;
  const authorizedSlugs = [headerSlugs, cookieSlugs, envSlugs]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((slug) => slug.trim())
    .filter(Boolean);

  if (authorizedSlugs.length > 0 && !authorizedSlugs.includes(requestedSlug)) {
    return new NextResponse('Access restricted: company slug is outside your authorized profile.', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:companySlug/dashboard/:path*'],
};
