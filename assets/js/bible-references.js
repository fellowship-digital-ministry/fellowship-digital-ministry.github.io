---
---
/**
 * Bible References Helper
 *
 * Finds Bible references in page text and makes them clickable links to the
 * reference viewer. Handles both Arabic ("1 Corinthians") and Roman
 * ("I Corinthians", "II Timothy", "III John") book numbering, since the
 * sermon titles use Roman numerals.
 *
 * Exposes two helpers for dynamically injected content (the transcript page
 * fetches and renders after load, so the initial pass would miss it):
 *   window.linkifyBibleReferences(rootEl)  - link refs inside a subtree
 *   window.boldBibleReference(text) -> html - bold (not link) the ref in a
 *                                             title; titles read cleaner unlinked
 */
(function () {
  'use strict';

  // Books that can carry an ordinal prefix (1/2/3 or I/II/III).
  var NUMBERED = ['Samuel', 'Kings', 'Chronicles', 'Corinthians',
                  'Thessalonians', 'Timothy', 'Peter', 'John'];
  // Books without a prefix ("John" also appears here as the Gospel).
  var SINGLE = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
    'Psalm', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah',
    'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
    'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', 'Titus',
    'Philemon', 'Hebrews', 'James', 'Jude', 'Revelation'];

  // Longer ordinals first so "III" wins over "II"/"I".
  var ORD = '(?:III|II|I|1|2|3)';
  var BOOK = '(?:' + ORD + '\\s+(?:' + NUMBERED.join('|') + ')|(?:' + SINGLE.join('|') + '))';
  var REF = '\\b' + BOOK + '\\s+\\d+(?::\\d+(?:-\\d+)?)?';

  function makeRegex() { return new RegExp(REF, 'gi'); }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var ROMAN = { i: '1', ii: '2', iii: '3' };

  // "II Corinthians 2:5" -> "#2Corinthians/2/5" (Roman normalized to Arabic so
  // the link resolves the same as the Arabic-numbered data).
  function refViewerHashFor(refText) {
    var m = refText.trim().match(new RegExp('^(' + BOOK + ')\\s+(\\d+)(?::(\\d+))?', 'i'));
    if (!m) return '';
    var parts = m[1].trim().split(/\s+/);
    if (ROMAN[parts[0].toLowerCase()]) parts[0] = ROMAN[parts[0].toLowerCase()];
    var hash = '#' + parts.join('') + '/' + m[2];
    if (m[3]) hash += '/' + m[3];
    return hash;
  }

  // Link every reference inside `root` (default document.body).
  function linkify(root) {
    root = root || document.body;
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentNode;
        if (parent && (
          parent.nodeName === 'SCRIPT' || parent.nodeName === 'STYLE' ||
          parent.nodeName === 'CODE' || parent.nodeName === 'A' ||
          (parent.classList && parent.classList.contains('no-ref-links'))
        )) {
          return NodeFilter.FILTER_REJECT;
        }
        return (node.nodeValue && makeRegex().test(node.nodeValue))
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });

    var textNodes = [];
    var n;
    while ((n = walker.nextNode())) textNodes.push(n);

    textNodes.forEach(function (textNode) {
      var text = textNode.nodeValue;
      var frag = document.createDocumentFragment();
      var rx = makeRegex();
      var last = 0, match;
      while ((match = rx.exec(text)) !== null) {
        if (match.index > last) {
          frag.appendChild(document.createTextNode(text.substring(last, match.index)));
        }
        var ref = match[0];
        var a = document.createElement('a');
        a.href = '/reference-viewer.html' + refViewerHashFor(ref);
        a.className = 'bible-reference';
        a.textContent = ref;
        a.title = 'Open ' + ref + ' in the reference viewer';
        frag.appendChild(a);
        last = match.index + ref.length;
      }
      if (last > 0) {
        if (last < text.length) frag.appendChild(document.createTextNode(text.substring(last)));
        textNode.parentNode.replaceChild(frag, textNode);
      }
    });
  }

  // Bold (do NOT link) the reference inside a title string. Returns HTML.
  function boldBibleReference(text) {
    text = String(text == null ? '' : text);
    var rx = makeRegex();
    var out = '', last = 0, m;
    while ((m = rx.exec(text)) !== null) {
      out += escapeHtml(text.slice(last, m.index)) +
             '<strong class="scripture-ref">' + escapeHtml(m[0]) + '</strong>';
      last = m.index + m[0].length;
    }
    out += escapeHtml(text.slice(last));
    return out;
  }

  window.linkifyBibleReferences = linkify;
  window.boldBibleReference = boldBibleReference;

  // Initial pass over static page content.
  document.addEventListener('DOMContentLoaded', function () {
    linkify(document.body);
  });
})();
