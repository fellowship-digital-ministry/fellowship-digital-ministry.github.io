/**
 * Featured Passage widget — homepage.
 *
 * Picks a Bible chapter deterministically by today's UTC date from chapters
 * cited at least N times in the publicly available sermon collection.
 * Displays verse 1 as the anchor text, with the chapter reference and a
 * count of sermons that cite the chapter.
 *
 * Tone: this is the visitor's own study aid. The card says "Featured
 * passage" + "From the sermons" rather than "Verse of the day from our
 * church" — the site is a personal project and doesn't claim to curate
 * or endorse on the church's behalf.
 */
(function () {
  'use strict';

  const CONTAINER_ID = 'daily-verse-widget';
  const MIN_CITATIONS = 2;  // only passages preached on, not mentioned once

  // Parse a chapter reference like "Romans 12" or "1 Corinthians 13"
  // Returns null for verse-specific refs (we don't have any in the current
  // index, but if the format ever changes those would parse as null here
  // rather than misrender).
  function parseChapterReference(ref) {
    const m = ref.match(/^([1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)?)\s+(\d+)$/);
    if (!m) return null;
    const book = m[1].trim();
    return {
      raw: ref,
      book,
      file: book.replace(/\s+/g, ''),  // "1 John" → "1John" for KJV filenames
      chapter: parseInt(m[2], 10),
    };
  }

  // Today's UTC day-of-year (0-365). Stable across the day.
  function dayOfYearUTC() {
    const now = new Date();
    const start = Date.UTC(now.getUTCFullYear(), 0, 1);
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.floor((today - start) / 86400000);
  }

  async function pickChapter() {
    const res = await fetch('/assets/data/analytics/references_index.json');
    if (!res.ok) throw new Error('failed to load references_index.json');
    const idx = await res.json();

    const candidates = [];
    for (const [ref, count] of Object.entries(idx)) {
      if (count < MIN_CITATIONS) continue;
      const parsed = parseChapterReference(ref);
      if (parsed) candidates.push(Object.assign(parsed, { count }));
    }
    if (!candidates.length) return null;

    // Sort by raw ref string for stable ordering across loads
    candidates.sort((a, b) => a.raw.localeCompare(b.raw));
    return candidates[dayOfYearUTC() % candidates.length];
  }

  async function fetchAnchorVerse(parsed) {
    const res = await fetch(`/assets/data/Bible-kjv-master/${parsed.file}.json`);
    if (!res.ok) return null;
    const book = await res.json();
    const chapter = (book.chapters || []).find((c) => parseInt(c.chapter, 10) === parsed.chapter);
    if (!chapter || !(chapter.verses || []).length) return null;
    // Verse 1 is the anchor — readers click through to read the rest
    return { number: 1, text: chapter.verses[0].text };
  }

  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  function render(container, parsed, anchor) {
    const sermonWord = parsed.count === 1 ? 'sermon' : 'sermons';
    container.innerHTML = `
      <aside class="daily-verse-card" aria-label="Featured passage from the sermon collection">
        <div class="daily-verse-label">Featured passage</div>
        <blockquote class="daily-verse-text">${escapeHTML(anchor.text)}</blockquote>
        <div class="daily-verse-meta">
          <cite class="daily-verse-ref">${escapeHTML(parsed.raw)}:${anchor.number} (KJV)</cite>
          <a class="daily-verse-link" href="${new URL('reference-viewer.html', document.baseURI).pathname}">
            ${parsed.count} ${sermonWord} on this passage →
          </a>
        </div>
      </aside>
    `;
  }

  async function init() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;
    try {
      const parsed = await pickChapter();
      if (!parsed) { container.remove(); return; }
      const anchor = await fetchAnchorVerse(parsed);
      if (!anchor) { container.remove(); return; }
      render(container, parsed, anchor);
    } catch (err) {
      // Silent failure — the widget is supplementary; don't pollute the page
      console.warn('Featured passage widget skipped:', err);
      container.remove();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
