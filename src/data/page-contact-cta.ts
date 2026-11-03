import { parse } from 'yaml';
import rawYaml from './page-contact-cta.yaml?raw';

export type PageContactCtaConfig = {
  lines: string[];
  /** formUrl 未指定時のフォールバック（サイト内パスなど） */
  href: string;
  /** Google フォーム等。CTA は formUrl を優先 */
  formUrl?: string;
  buttonLabel: string;
};

type PageContactCtaYaml = {
  default: PageContactCtaConfig;
  placements?: Partial<Record<PageContactCtaPlacement, Partial<PageContactCtaConfig>>>;
};

/** page-contact-cta.yaml の placements キー（PageContactCta の placement prop） */
export type PageContactCtaPlacement =
  | 'classes'
  | 'education'
  | 'members'
  | 'school'
  | 'requestDetail';

const parsed = parse(rawYaml) as PageContactCtaYaml;

const defaultConfig: PageContactCtaConfig = {
  lines: [...parsed.default.lines],
  href: parsed.default.href,
  formUrl: parsed.default.formUrl,
  buttonLabel: parsed.default.buttonLabel,
};

/** 既定の本文行（後方互換・props 未指定時） */
export const pageContactCtaLines = defaultConfig.lines;

/** /contact/ ページ等で使う Google フォーム URL（yaml default.formUrl → href） */
export function getDefaultContactFormUrl(): string {
  return defaultConfig.formUrl ?? defaultConfig.href;
}

export function isExternalContactUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** CTA ボタンのリンク先（formUrl 優先） */
export function resolvePageContactCtaHref(config: PageContactCtaConfig): string {
  return config.formUrl ?? config.href;
}

export function getPageContactCta(placement?: PageContactCtaPlacement): PageContactCtaConfig {
  if (!placement) {
    return {
      lines: [...defaultConfig.lines],
      href: defaultConfig.href,
      formUrl: defaultConfig.formUrl,
      buttonLabel: defaultConfig.buttonLabel,
    };
  }

  const override = parsed.placements?.[placement];
  if (!override) {
    return getPageContactCta();
  }

  return {
    lines: override.lines ? [...override.lines] : [...defaultConfig.lines],
    href: override.href ?? defaultConfig.href,
    formUrl: override.formUrl ?? defaultConfig.formUrl,
    buttonLabel: override.buttonLabel ?? defaultConfig.buttonLabel,
  };
}
