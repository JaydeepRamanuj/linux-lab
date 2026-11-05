// Rehype plugin: turns a top-level "## Under the hood" section into a <details> block, collapsed by default
// (guides plan §3, "Two depths"). Everything from that heading up to the next h2 (or the end) moves inside.
// It works without JavaScript, and documents without that heading (every scenario) are left untouched.
import type { Element, ElementContent, Root, RootContent } from 'hast';

export const UNDER_THE_HOOD = 'Under the hood';

function textOf(node: RootContent | ElementContent): string {
  if (node.type === 'text') return node.value;
  if ('children' in node) return (node.children as (RootContent | ElementContent)[]).map(textOf).join('');
  return '';
}

const isH2 = (node: RootContent): node is Element => node.type === 'element' && node.tagName === 'h2';

export default function rehypeUnderTheHood() {
  return (tree: Root) => {
    const start = tree.children.findIndex((n) => isH2(n) && textOf(n).trim() === UNDER_THE_HOOD);
    if (start === -1) return;
    let end = tree.children.findIndex((n, i) => i > start && isH2(n));
    if (end === -1) end = tree.children.length;

    const [heading, ...body] = tree.children.slice(start, end) as [Element, ...ElementContent[]];
    const details: Element = {
      type: 'element',
      tagName: 'details',
      properties: { className: ['deeper'] },
      children: [
        { type: 'element', tagName: 'summary', properties: {}, children: [heading] },
        { type: 'element', tagName: 'div', properties: { className: ['deeper-body'] }, children: body }
      ]
    };
    tree.children.splice(start, end - start, details);
  };
}
