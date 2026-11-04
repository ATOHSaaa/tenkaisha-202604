import { visit } from 'unist-util-visit';

function applyBase(path, baseUrl) {
  if (!path || /^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('mailto:')) {
    return path;
  }
  if (path.startsWith('#')) return path;

  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const root = base.endsWith('/') ? base.slice(0, -1) : base;

  if (path.startsWith('/')) {
    let internal = path;
    if (root) {
      for (;;) {
        if (internal === root || internal === `${root}/`) {
          internal = '/';
          break;
        }
        if (internal.startsWith(`${root}/`)) {
          internal = internal.slice(root.length) || '/';
          continue;
        }
        break;
      }
    }
    return root ? `${root}${internal}` : internal;
  }
  return `${base}${path}`;
}

/** Markdown 内の /images/... 等に site base を付与（GitHub Pages 用） */
export function rehypeWithBase({ base = '/' } = {}) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img' && typeof node.properties?.src === 'string') {
        node.properties.src = applyBase(node.properties.src, base);
      }
      if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
        const href = node.properties.href;
        if (href.startsWith('/') && !href.startsWith('//')) {
          node.properties.href = applyBase(href, base);
        }
      }
    });
  };
}
