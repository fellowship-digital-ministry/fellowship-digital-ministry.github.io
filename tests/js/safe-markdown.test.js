// Checks the AI-answer sanitization boundary (assets/js/safe-markdown.js)
// using the same marked version the site loads and the vendored DOMPurify.
//
//   cd tests/js && npm ci && npm test
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..', '..');
const createSafeMarkdown = require(path.join(ROOT, 'assets/js/safe-markdown.js'));
const createDOMPurify = require(path.join(ROOT, 'assets/js/lib/purify.min.js'));

// Same shape as getBibleReferenceRegex() in search.js, reduced for the test.
const BIBLE_REF = /\b(?:Romans|John|Genesis)\s+\d+(?::\d+(?:-\d+)?)?/g;

function setup({ withPurifier = true } = {}) {
  const { window } = new JSDOM('<!doctype html><body></body>');
  const DOMPurify = withPurifier ? createDOMPurify(window) : undefined;
  const sm = createSafeMarkdown({ window, marked, DOMPurify });
  return { window, sm };
}

// Parse the output the way the page does and report anything executable.
function dangerous(window, html) {
  const host = window.document.createElement('div');
  host.innerHTML = html;
  const found = [];
  for (const el of host.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    if (['script', 'iframe', 'object', 'embed', 'style', 'form', 'svg', 'math'].includes(tag)) found.push(`<${tag}>`);
    for (const attr of el.attributes) {
      if (/^on/i.test(attr.name)) found.push(`${tag}[${attr.name}]`);
      if (/^(href|src|action|formaction|xlink:href)$/i.test(attr.name) && /^\s*(javascript|vbscript|data):/i.test(attr.value)) {
        found.push(`${tag}[${attr.name}=${attr.value}]`);
      }
    }
  }
  return found;
}

const PAYLOADS = [
  '<img src=x onerror="alert(1)">',
  '<script>alert(1)</script>',
  '[click me](javascript:alert(1))',
  '<a href="javascript:alert(1)">x</a>',
  '<iframe src="https://example.invalid"></iframe>',
  '<svg><script>alert(1)</script></svg>',
  '<details open ontoggle=alert(1)>',
  '<div style="background:url(javascript:alert(1))">x</div>',
  '<form action="https://example.invalid"><input name=q></form>',
  '**Answer** <img src=x onerror=alert(1)> see Romans 3:23',
];

test('marked alone passes dangerous HTML through (the boundary being guarded)', () => {
  const { window } = setup();
  assert.ok(dangerous(window, marked.parse(PAYLOADS[0])).length > 0);
  assert.ok(dangerous(window, marked.parse(PAYLOADS[2])).length > 0);
});

for (const payload of PAYLOADS) {
  test(`renderMarkdown neutralises: ${payload}`, () => {
    const { window, sm } = setup();
    assert.deepStrictEqual(dangerous(window, sm.renderMarkdown(payload)), []);
  });
}

test('renderMarkdown keeps useful Markdown', () => {
  const { window, sm } = setup();
  const md = [
    '## Heading',
    '',
    'Some **bold** and *italic* text with a [link](https://www.youtube.com/watch?v=abc).',
    '',
    '1. first',
    '2. second',
    '',
    '> a quote',
    '',
    '`code`',
  ].join('\n');
  const host = window.document.createElement('div');
  host.innerHTML = sm.renderMarkdown(md);
  assert.ok(host.querySelector('h2'));
  assert.ok(host.querySelector('strong'));
  assert.ok(host.querySelector('em'));
  assert.ok(host.querySelector('ol > li'));
  assert.ok(host.querySelector('blockquote'));
  assert.ok(host.querySelector('code'));
  assert.strictEqual(host.querySelector('a').getAttribute('href'), 'https://www.youtube.com/watch?v=abc');
});

test('highlightText wraps references without re-parsing escaped markup', () => {
  const { window, sm } = setup();
  // Inline code renders as escaped text; a naive innerHTML-based highlighter
  // would turn this back into a live <img onerror> element.
  const html = sm.renderMarkdown('`<img src=x onerror=alert(1)>` Romans 3:23 and John 3:16');
  const out = sm.highlightText(html, BIBLE_REF, 'bible-reference');
  assert.deepStrictEqual(dangerous(window, out), []);
  const host = window.document.createElement('div');
  host.innerHTML = out;
  const refs = [...host.querySelectorAll('span.bible-reference')].map((s) => s.textContent);
  assert.deepStrictEqual(refs, ['Romans 3:23', 'John 3:16']);
  assert.match(host.textContent, /<img src=x onerror=alert\(1\)>/);
});

test('sanitizeHtml keeps the classes and buttons the chat UI relies on', () => {
  const { window, sm } = setup();
  const out = sm.sanitizeHtml('<div class="error-container"><p>Oops</p><button class="retry-button" onclick="x()">Try again</button></div>');
  const host = window.document.createElement('div');
  host.innerHTML = out;
  assert.ok(host.querySelector('div.error-container > button.retry-button'));
  assert.deepStrictEqual(dangerous(window, out), []);
});

test('without DOMPurify the output is escaped text, never raw HTML', () => {
  const { window, sm } = setup({ withPurifier: false });
  for (const payload of PAYLOADS) {
    assert.deepStrictEqual(dangerous(window, sm.renderMarkdown(payload)), [], payload);
    assert.deepStrictEqual(dangerous(window, sm.sanitizeHtml(payload)), [], payload);
  }
  assert.strictEqual(sm.isSanitizerAvailable(), false);
});

test('search.js renders answers only through SafeMarkdown', () => {
  const src = fs.readFileSync(path.join(ROOT, 'assets/js/search.js'), 'utf8');
  assert.ok(!/marked\.parse\s*\(/.test(src), 'search.js must not call marked.parse directly');
  assert.match(src, /SafeMarkdown\.renderMarkdown\(/);
  const layout = fs.readFileSync(path.join(ROOT, '_layouts/default.html'), 'utf8');
  const purify = layout.indexOf('/assets/js/lib/purify.min.js');
  const safe = layout.indexOf('/assets/js/safe-markdown.js');
  const search = layout.indexOf('/assets/js/search.js');
  assert.ok(purify !== -1 && safe !== -1 && purify < safe && safe < search, 'layout must load purify, then safe-markdown, before search.js');
});
