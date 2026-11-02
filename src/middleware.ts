import { defineMiddleware } from 'astro:middleware';
import { needsTrailingSlashRedirect } from '../scripts/trailing-slash-redirect.mjs';

/** trailingSlash: 'always' と揃え、拡張子のないパスは末尾 / へ 301（本番・preview） */
export const onRequest = defineMiddleware((context, next) => {
  const { pathname, search } = context.url;

  const legacyStageSlug = pathname.match(/^\/stage\/stage-(\d{3})\/?$/);
  if (legacyStageSlug) {
    return context.redirect(`/stages/${legacyStageSlug[1]}/${search}`, 301);
  }

  const legacyEventsStage = pathname.match(/^\/events\/stage-(\d{3})\/?$/);
  if (legacyEventsStage) {
    return context.redirect(`/stages/${legacyEventsStage[1]}/${search}`, 301);
  }

  if (pathname === '/stage' || pathname.startsWith('/stage/')) {
    const rest = pathname === '/stage' ? '/' : pathname.slice('/stage'.length);
    return context.redirect(`/stages${rest}${search}`, 301);
  }

  if (!needsTrailingSlashRedirect(pathname)) {
    return next();
  }

  return context.redirect(`${pathname}/${search}`, 301);
});
