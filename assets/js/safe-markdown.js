/**
 * SafeMarkdown - the sanitization boundary for AI answers.
 *
 * Answers come back from the model as Markdown. marked.js turns that into
 * HTML but passes raw HTML through untouched (and keeps javascript: links),
 * so model output such as <img src=x onerror=...> would otherwise reach
 * innerHTML and run in this page, where it could read localStorage.
 *
 * Every model-derived string must go through renderMarkdown() (or
 * sanitizeHtml() for HTML we assemble) before touching the DOM. Sanitizing
 * uses the vendored DOMPurify in assets/js/lib/. If DOMPurify is missing,
 * the text is shown escaped rather than rendered.
 *
 * Browser: loaded as a plain script, exposes window.SafeMarkdown.
 * Node tests: module.exports is the factory; pass { window, marked, DOMPurify }.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory;
  } else {
    root.SafeMarkdown = factory({ window: root });
  }
}(typeof window !== 'undefined' ? window : this, function createSafeMarkdown(env) {
  'use strict';

  var win = env.window;

  var PURIFY_CONFIG = {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'textarea', 'select', 'option', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style'],
    ALLOW_DATA_ATTR: false,
  };

  function getMarked() {
    var m = env.marked || win.marked;
    return m && typeof m.parse === 'function' ? m : null;
  }

  function getPurifier() {
    var p = env.DOMPurify || win.DOMPurify;
    return p && typeof p.sanitize === 'function' && p.isSupported !== false ? p : null;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Sanitize an HTML string. Without DOMPurify, returns it escaped. */
  function sanitizeHtml(html) {
    var purifier = getPurifier();
    if (!purifier) return escapeHtml(html);
    return purifier.sanitize(String(html), PURIFY_CONFIG);
  }

  /** Render model Markdown to sanitized HTML. */
  function renderMarkdown(text) {
    if (!text) return '';
    var marked = getMarked();
    if (marked && getPurifier()) {
      return sanitizeHtml(marked.parse(String(text), { breaks: true, gfm: true }));
    }
    // Minimal fallback (CDN blocked, offline, ...): escape, then line breaks + bold
    return escapeHtml(text)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  /**
   * Wrap regex matches found in the text content of `html` in
   * <span class="className">. Works on an inert document and builds text
   * nodes, so text that merely looks like markup (e.g. "&lt;img ...&gt;")
   * is never re-parsed as HTML.
   */
  function highlightText(html, regex, className) {
    var flags = regex.flags.indexOf('g') === -1 ? regex.flags + 'g' : regex.flags;
    var pattern = new RegExp(regex.source, flags);
    var doc = win.document.implementation.createHTMLDocument('');
    var body = doc.body;
    body.innerHTML = html;

    var walker = doc.createTreeWalker(body, win.NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var node;
    while ((node = walker.nextNode())) textNodes.push(node);

    textNodes.forEach(function (textNode) {
      var value = textNode.nodeValue;
      pattern.lastIndex = 0;
      var match;
      var last = 0;
      var parts = [];
      while ((match = pattern.exec(value)) !== null) {
        if (match[0] === '') { pattern.lastIndex++; continue; }
        if (match.index > last) parts.push(doc.createTextNode(value.slice(last, match.index)));
        var span = doc.createElement('span');
        span.className = className;
        span.textContent = match[0];
        parts.push(span);
        last = match.index + match[0].length;
      }
      if (!parts.length) return;
      if (last < value.length) parts.push(doc.createTextNode(value.slice(last)));
      parts.forEach(function (part) { textNode.parentNode.insertBefore(part, textNode); });
      textNode.parentNode.removeChild(textNode);
    });
    return body.innerHTML;
  }

  return {
    escapeHtml: escapeHtml,
    sanitizeHtml: sanitizeHtml,
    renderMarkdown: renderMarkdown,
    highlightText: highlightText,
    isSanitizerAvailable: function () { return !!getPurifier(); },
  };
}));
