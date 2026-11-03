/**
 * :hover ルールを @media (hover: hover) and (pointer: fine) 内へ移す。
 * :focus-visible との複合セレクタは hover 側だけを分離する。
 */
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const target = path.join(process.cwd(), 'src/styles/global.css');
const css = fs.readFileSync(target, 'utf8');

const HOVER_MEDIA = '(hover: hover) and (pointer: fine)';

function isHoverMedia(atRule) {
  return (
    atRule.type === 'atrule' &&
    atRule.name === 'media' &&
    atRule.params.includes('hover: hover')
  );
}

function wrapRuleInHoverMedia(rule) {
  if (rule.parent && isHoverMedia(rule.parent)) return;

  const media = postcss.atRule({ name: 'media', params: HOVER_MEDIA });
  rule.replaceWith(media);
  media.append(rule);
}

const result = postcss()
  .use({
    postcssPlugin: 'wrap-hover-media',
    Rule(rule) {
      const hoverSelectors = rule.selectors.filter((s) => s.includes(':hover'));
      if (hoverSelectors.length === 0) return;

      const restSelectors = rule.selectors.filter((s) => !s.includes(':hover'));

      if (restSelectors.length > 0) {
        const hoverRule = postcss.rule({ selectors: hoverSelectors });
        for (const node of rule.nodes) {
          hoverRule.append(node.clone());
        }
        wrapRuleInHoverMedia(hoverRule);
        rule.before(hoverRule);
        rule.selectors = restSelectors;
        return;
      }

      wrapRuleInHoverMedia(rule);
    },
  })
  .process(css, { from: target });

result.root.raws.indent = '  ';
fs.writeFileSync(target, result.css);

console.log('Updated', target);
