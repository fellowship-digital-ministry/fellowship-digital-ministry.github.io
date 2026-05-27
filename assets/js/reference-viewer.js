/* Bible Reference Viewer — v2.
   Reads precomputed JSON in /assets/data/bible/ and renders:
   - hero stat strip + lookup form
   - top-20 most-referenced chapters
   - collapsed "browse all books" panel
   - detail view (chapter → list of sermon occurrences; verse → KJV text + occurrences)
   URL-hash routing keeps state shareable: #romans/8, #john/3/16, etc. */

(function () {
  'use strict';

  // ============================================================
  // Constants & lookup tables
  // ============================================================

  var STATS_URL = '/assets/data/bible/bible_stats.json';
  var BOOK_URL = function (slug) { return '/assets/data/bible/books/' + slug + '.json'; };
  var KJV_URL = function (slug) { return '/assets/data/Bible-kjv-master/' + slug + '.json'; };
  var API_BASE = 'https://sermon-search-api-8fok.onrender.com';
  var TRANSCRIPT_URL = function (videoId) { return API_BASE + '/transcript/' + encodeURIComponent(videoId); };

  // Canonical book order (KJV, 66 books). Mirrors the data filenames.
  var BIBLE_BOOKS = [
    { slug: 'Genesis', display: 'Genesis', testament: 'OT' },
    { slug: 'Exodus', display: 'Exodus', testament: 'OT' },
    { slug: 'Leviticus', display: 'Leviticus', testament: 'OT' },
    { slug: 'Numbers', display: 'Numbers', testament: 'OT' },
    { slug: 'Deuteronomy', display: 'Deuteronomy', testament: 'OT' },
    { slug: 'Joshua', display: 'Joshua', testament: 'OT' },
    { slug: 'Judges', display: 'Judges', testament: 'OT' },
    { slug: 'Ruth', display: 'Ruth', testament: 'OT' },
    { slug: '1Samuel', display: '1 Samuel', testament: 'OT', dataSlug: '1_Samuel' },
    { slug: '2Samuel', display: '2 Samuel', testament: 'OT', dataSlug: '2_Samuel' },
    { slug: '1Kings', display: '1 Kings', testament: 'OT', dataSlug: '1_Kings' },
    { slug: '2Kings', display: '2 Kings', testament: 'OT', dataSlug: '2_Kings' },
    { slug: '1Chronicles', display: '1 Chronicles', testament: 'OT', dataSlug: '1_Chronicles' },
    { slug: '2Chronicles', display: '2 Chronicles', testament: 'OT', dataSlug: '2_Chronicles' },
    { slug: 'Ezra', display: 'Ezra', testament: 'OT' },
    { slug: 'Nehemiah', display: 'Nehemiah', testament: 'OT' },
    { slug: 'Esther', display: 'Esther', testament: 'OT' },
    { slug: 'Job', display: 'Job', testament: 'OT' },
    { slug: 'Psalms', display: 'Psalms', testament: 'OT' },
    { slug: 'Proverbs', display: 'Proverbs', testament: 'OT' },
    { slug: 'Ecclesiastes', display: 'Ecclesiastes', testament: 'OT' },
    { slug: 'SongofSolomon', display: 'Song of Solomon', testament: 'OT', dataSlug: 'Song_of_Solomon' },
    { slug: 'Isaiah', display: 'Isaiah', testament: 'OT' },
    { slug: 'Jeremiah', display: 'Jeremiah', testament: 'OT' },
    { slug: 'Lamentations', display: 'Lamentations', testament: 'OT' },
    { slug: 'Ezekiel', display: 'Ezekiel', testament: 'OT' },
    { slug: 'Daniel', display: 'Daniel', testament: 'OT' },
    { slug: 'Hosea', display: 'Hosea', testament: 'OT' },
    { slug: 'Joel', display: 'Joel', testament: 'OT' },
    { slug: 'Amos', display: 'Amos', testament: 'OT' },
    { slug: 'Obadiah', display: 'Obadiah', testament: 'OT' },
    { slug: 'Jonah', display: 'Jonah', testament: 'OT' },
    { slug: 'Micah', display: 'Micah', testament: 'OT' },
    { slug: 'Nahum', display: 'Nahum', testament: 'OT' },
    { slug: 'Habakkuk', display: 'Habakkuk', testament: 'OT' },
    { slug: 'Zephaniah', display: 'Zephaniah', testament: 'OT' },
    { slug: 'Haggai', display: 'Haggai', testament: 'OT' },
    { slug: 'Zechariah', display: 'Zechariah', testament: 'OT' },
    { slug: 'Malachi', display: 'Malachi', testament: 'OT' },
    { slug: 'Matthew', display: 'Matthew', testament: 'NT' },
    { slug: 'Mark', display: 'Mark', testament: 'NT' },
    { slug: 'Luke', display: 'Luke', testament: 'NT' },
    { slug: 'John', display: 'John', testament: 'NT' },
    { slug: 'Acts', display: 'Acts', testament: 'NT' },
    { slug: 'Romans', display: 'Romans', testament: 'NT' },
    { slug: '1Corinthians', display: '1 Corinthians', testament: 'NT', dataSlug: '1_Corinthians' },
    { slug: '2Corinthians', display: '2 Corinthians', testament: 'NT', dataSlug: '2_Corinthians' },
    { slug: 'Galatians', display: 'Galatians', testament: 'NT' },
    { slug: 'Ephesians', display: 'Ephesians', testament: 'NT' },
    { slug: 'Philippians', display: 'Philippians', testament: 'NT' },
    { slug: 'Colossians', display: 'Colossians', testament: 'NT' },
    { slug: '1Thessalonians', display: '1 Thessalonians', testament: 'NT', dataSlug: '1_Thessalonians' },
    { slug: '2Thessalonians', display: '2 Thessalonians', testament: 'NT', dataSlug: '2_Thessalonians' },
    { slug: '1Timothy', display: '1 Timothy', testament: 'NT', dataSlug: '1_Timothy' },
    { slug: '2Timothy', display: '2 Timothy', testament: 'NT', dataSlug: '2_Timothy' },
    { slug: 'Titus', display: 'Titus', testament: 'NT' },
    { slug: 'Philemon', display: 'Philemon', testament: 'NT' },
    { slug: 'Hebrews', display: 'Hebrews', testament: 'NT' },
    { slug: 'James', display: 'James', testament: 'NT' },
    { slug: '1Peter', display: '1 Peter', testament: 'NT', dataSlug: '1_Peter' },
    { slug: '2Peter', display: '2 Peter', testament: 'NT', dataSlug: '2_Peter' },
    { slug: '1John', display: '1 John', testament: 'NT', dataSlug: '1_John' },
    { slug: '2John', display: '2 John', testament: 'NT', dataSlug: '2_John' },
    { slug: '3John', display: '3 John', testament: 'NT', dataSlug: '3_John' },
    { slug: 'Jude', display: 'Jude', testament: 'NT' },
    { slug: 'Revelation', display: 'Revelation', testament: 'NT' }
  ];

  // Index by lowercase display name + every known alias for the lookup parser.
  var BOOK_INDEX = (function () {
    var idx = {};
    function add(key, book) { idx[key.toLowerCase().replace(/\s+/g, '')] = book; }
    BIBLE_BOOKS.forEach(function (b) {
      add(b.display, b);
      add(b.slug, b);
      // Numbered books: "1st John", "first john", "i john"
      var m = b.display.match(/^(\d)\s+(.+)$/);
      if (m) {
        var n = m[1];
        var rest = m[2];
        var wordMap = { '1': 'first', '2': 'second', '3': 'third' };
        var romanMap = { '1': 'i', '2': 'ii', '3': 'iii' };
        var ordMap = { '1': '1st', '2': '2nd', '3': '3rd' };
        add(wordMap[n] + rest, b);
        add(romanMap[n] + rest, b);
        add(ordMap[n] + rest, b);
      }
    });
    // Common abbreviations
    var aliases = {
      'gen': 'Genesis', 'gn': 'Genesis', 'ex': 'Exodus', 'exod': 'Exodus',
      'lev': 'Leviticus', 'lv': 'Leviticus', 'num': 'Numbers', 'nm': 'Numbers',
      'deut': 'Deuteronomy', 'dt': 'Deuteronomy', 'josh': 'Joshua', 'jos': 'Joshua',
      'judg': 'Judges', 'jdg': 'Judges', 'ru': 'Ruth',
      '1sam': '1 Samuel', '1sm': '1 Samuel', '2sam': '2 Samuel', '2sm': '2 Samuel',
      '1kgs': '1 Kings', '1ki': '1 Kings', '2kgs': '2 Kings', '2ki': '2 Kings',
      '1chr': '1 Chronicles', '1ch': '1 Chronicles', '2chr': '2 Chronicles', '2ch': '2 Chronicles',
      'neh': 'Nehemiah', 'est': 'Esther', 'jb': 'Job',
      'ps': 'Psalms', 'psa': 'Psalms', 'psalm': 'Psalms',
      'prov': 'Proverbs', 'pr': 'Proverbs', 'prv': 'Proverbs',
      'eccl': 'Ecclesiastes', 'ecc': 'Ecclesiastes',
      'song': 'Song of Solomon', 'sos': 'Song of Solomon', 'canticles': 'Song of Solomon',
      'isa': 'Isaiah', 'is': 'Isaiah', 'jer': 'Jeremiah', 'jr': 'Jeremiah',
      'lam': 'Lamentations', 'ezek': 'Ezekiel', 'eze': 'Ezekiel', 'dan': 'Daniel', 'dn': 'Daniel',
      'hos': 'Hosea', 'jl': 'Joel', 'am': 'Amos', 'oba': 'Obadiah', 'obad': 'Obadiah',
      'jon': 'Jonah', 'mic': 'Micah', 'mc': 'Micah',
      'nah': 'Nahum', 'na': 'Nahum', 'hab': 'Habakkuk', 'hb': 'Habakkuk',
      'zeph': 'Zephaniah', 'zep': 'Zephaniah', 'hag': 'Haggai', 'hg': 'Haggai',
      'zech': 'Zechariah', 'zec': 'Zechariah', 'mal': 'Malachi', 'ml': 'Malachi',
      'matt': 'Matthew', 'mt': 'Matthew', 'mk': 'Mark', 'mrk': 'Mark', 'lk': 'Luke',
      'jn': 'John', 'jhn': 'John', 'ac': 'Acts',
      'rom': 'Romans', 'ro': 'Romans', 'rm': 'Romans',
      '1cor': '1 Corinthians', '1co': '1 Corinthians', '2cor': '2 Corinthians', '2co': '2 Corinthians',
      'gal': 'Galatians', 'eph': 'Ephesians', 'phil': 'Philippians', 'php': 'Philippians',
      'col': 'Colossians',
      '1thess': '1 Thessalonians', '1th': '1 Thessalonians', '2thess': '2 Thessalonians', '2th': '2 Thessalonians',
      '1tim': '1 Timothy', '1ti': '1 Timothy', '2tim': '2 Timothy', '2ti': '2 Timothy',
      'tit': 'Titus', 'phlm': 'Philemon', 'phm': 'Philemon',
      'heb': 'Hebrews', 'jas': 'James', 'jm': 'James',
      '1pet': '1 Peter', '1pt': '1 Peter', '2pet': '2 Peter', '2pt': '2 Peter',
      '1jn': '1 John', '1jhn': '1 John', '2jn': '2 John', '3jn': '3 John',
      'jud': 'Jude', 'jude': 'Jude', 'rev': 'Revelation', 're': 'Revelation', 'rv': 'Revelation'
    };
    Object.keys(aliases).forEach(function (k) {
      var b = BIBLE_BOOKS.find(function (x) { return x.display === aliases[k]; });
      if (b) idx[k] = b;
    });
    return idx;
  })();

  // The data files use underscores ("1_Corinthians"); the chapters JSON also
  // calls Psalms "Psalm" sometimes. Reconcile both ways.
  function dataSlugFor(book) {
    return book.dataSlug || book.slug;
  }
  function dataKeyCandidates(book) {
    // For lookups into bible_stats.books_count which uses underscored keys.
    var candidates = [dataSlugFor(book), book.display.replace(/\s+/g, '_')];
    if (book.display === 'Psalms') candidates.push('Psalm');
    return candidates;
  }

  // ============================================================
  // State + element refs
  // ============================================================

  var state = {
    stats: null,
    bookCache: {},
    kjvCache: {},
    transcriptCache: {}
  };

  var els = {};

  function $(id) { return document.getElementById(id); }

  function bindElements() {
    els.lookupForm = $('lookup-form');
    els.lookupInput = $('lookup-input');
    els.lookupHint = $('lookup-hint');
    els.statStrip = $('stat-strip');
    els.topList = $('top-list');
    els.otList = $('ot-list');
    els.ntList = $('nt-list');
    els.detail = $('detail-panel');
    els.detailBack = $('detail-back');
    els.detailTitle = $('detail-title');
    els.detailSub = $('detail-sub');
    els.verseTextBlock = $('verse-text-block');
    els.verseTextBody = $('verse-text-body');
    els.bibleGatewayLink = $('bible-gateway-link');
    els.occurrences = $('occurrences');
    els.heroSection = document.querySelector('.refv-hero');
    els.topSection = document.querySelector('.refv-top');
    els.browseSection = document.querySelector('.refv-browse');
    els.videoModal = $('video-modal');
    els.videoModalFrame = $('video-modal-frame');
    els.videoModalTitle = $('video-modal-title');
    els.videoModalClose = $('video-modal-close');
    els.transcriptModal = $('transcript-modal');
    els.transcriptModalBody = $('transcript-modal-body');
    els.transcriptModalTitle = $('transcript-modal-title');
    els.transcriptModalSub = $('transcript-modal-sub');
    els.transcriptModalClose = $('transcript-modal-close');
    els.sermonsModal = $('sermons-modal');
    els.sermonsModalBody = $('sermons-modal-body');
    els.sermonsModalTitle = $('sermons-modal-title');
    els.sermonsModalClose = $('sermons-modal-close');
  }

  // ============================================================
  // Lookup parser  ("Romans 8", "John 3:16", "1 Cor 13", "Ps 23:1")
  // ============================================================

  function parseLookup(raw) {
    if (!raw) return null;
    var s = raw.trim();
    // Pull off optional verse: ":" or " v" or " verse "
    var verse = null, chapter = null;
    var m = s.match(/^(.+?)\s*[:.]\s*(\d+)\s*$/);
    if (m) {
      verse = parseInt(m[2], 10);
      s = m[1];
    }
    // Now pull off chapter at end
    var m2 = s.match(/^(.+?)\s+(\d+)\s*$/);
    if (m2) {
      chapter = parseInt(m2[2], 10);
      s = m2[1];
    }
    var bookKey = s.replace(/\s+/g, '').toLowerCase();
    var book = BOOK_INDEX[bookKey];
    if (!book) return null;
    return { book: book, chapter: chapter, verse: verse };
  }

  // ============================================================
  // URL hash routing  (#romans/8, #john/3/16, ##)
  // ============================================================

  function setHash(parts) {
    var h = parts && parts.length ? '#' + parts.join('/') : '';
    if (window.location.hash !== h) {
      window.history.pushState(null, '', h || window.location.pathname);
    }
  }

  function readHash() {
    var h = window.location.hash.replace(/^#/, '');
    if (!h) return null;
    var parts = h.split('/').filter(Boolean);
    if (!parts.length) return null;
    var book = BOOK_INDEX[parts[0].toLowerCase()];
    if (!book) return null;
    return {
      book: book,
      chapter: parts[1] ? parseInt(parts[1], 10) : null,
      verse: parts[2] ? parseInt(parts[2], 10) : null
    };
  }

  function applyRoute() {
    var r = readHash();
    if (r && r.chapter) {
      showDetail(r.book, r.chapter, r.verse);
    } else if (r && !r.chapter) {
      // book-only: show the whole book's chapter grid
      showDetail(r.book, null, null);
    } else {
      showHome();
    }
  }

  // ============================================================
  // Rendering: stat strip
  // ============================================================

  function renderStatStrip() {
    var s = state.stats;
    if (!s) {
      els.statStrip.textContent = 'Library stats unavailable.';
      return;
    }
    var bookKeys = Object.keys(s.books_count || {}).filter(function (k) {
      // Drop the "processed_files" tracker that leaks into books_count.
      return k !== 'processed_files' && k !== 'unknown';
    });
    var coveredBooks = bookKeys.length;
    // Sermon count: derive from per-book unique video_ids would need fetches;
    // use total references for now.
    var total = s.total_references || 0;
    els.statStrip.innerHTML =
      'Pastor has preached from <strong>' + coveredBooks +
      ' of 66 books</strong> · <strong>' + total.toLocaleString() +
      '</strong> Bible references logged across the sermon library.';
  }

  // ============================================================
  // Rendering: top-N most-referenced chapters
  // ============================================================

  function renderTopList(limit) {
    limit = limit || 20;
    var s = state.stats;
    if (!s || !s.chapters_count) {
      els.topList.innerHTML = '<li class="refv-empty">No chapter data available.</li>';
      return;
    }
    // Flatten: [{book, chapter, count}], filtering junk.
    var flat = [];
    Object.keys(s.chapters_count).forEach(function (bookKey) {
      if (bookKey === 'processed_files') return;
      var book = bookFromDataKey(bookKey);
      if (!book) return;
      var chapters = s.chapters_count[bookKey];
      Object.keys(chapters).forEach(function (ch) {
        if (ch === 'unknown' || ch === 'None' || ch === 'null') return;
        var n = parseInt(ch, 10);
        if (isNaN(n)) return;
        flat.push({ book: book, chapter: n, count: chapters[ch] });
      });
    });
    flat.sort(function (a, b) { return b.count - a.count; });
    var top = flat.slice(0, limit);
    if (!top.length) {
      els.topList.innerHTML = '<li class="refv-empty">No chapter data available.</li>';
      return;
    }
    var html = top.map(function (item, i) {
      var label = item.book.display + ' ' + item.chapter;
      return '<li class="refv-top-item" data-book="' + item.book.slug +
             '" data-chapter="' + item.chapter +
             '" tabindex="0" role="button" aria-label="Open ' + label + '">' +
        '<span class="refv-top-rank">' + (i + 1) + '.</span>' +
        '<span class="refv-top-passage">' + label + '</span>' +
        '<span class="refv-top-count">' + item.count + ' refs</span>' +
        '</li>';
    }).join('');
    els.topList.innerHTML = html;
    Array.prototype.forEach.call(els.topList.children, function (el) {
      el.addEventListener('click', function () {
        var book = BOOK_INDEX[el.getAttribute('data-book').toLowerCase()];
        setHash([book.slug, el.getAttribute('data-chapter')]);
        applyRoute();
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });
  }

  function bookFromDataKey(key) {
    // bible_stats keys use underscores ("1_Timothy", "Song_of_Solomon"); a
    // couple are inconsistent ("Psalm" not "Psalms"). Try several mappings.
    var norm = key.toLowerCase().replace(/_/g, '');
    if (norm === 'psalm') norm = 'psalms';
    return BOOK_INDEX[norm] || null;
  }

  // ============================================================
  // Rendering: browse panel (OT + NT chips)
  // ============================================================

  function renderBrowse() {
    var s = state.stats || {};
    var counts = s.books_count || {};
    function countFor(book) {
      var keys = dataKeyCandidates(book);
      for (var i = 0; i < keys.length; i++) {
        if (counts[keys[i]] != null) return counts[keys[i]];
      }
      return 0;
    }
    function render(list, target) {
      var html = list.map(function (book) {
        var c = countFor(book);
        return '<li><button class="refv-book-chip" data-book="' + book.slug + '" type="button">' +
          '<span>' + book.display + '</span>' +
          '<span class="refv-book-chip-count">' + (c ? c + ' refs' : '—') + '</span>' +
          '</button></li>';
      }).join('');
      target.innerHTML = html;
      Array.prototype.forEach.call(target.querySelectorAll('.refv-book-chip'), function (el) {
        el.addEventListener('click', function () {
          var slug = el.getAttribute('data-book');
          setHash([slug]);
          applyRoute();
        });
      });
    }
    render(BIBLE_BOOKS.filter(function (b) { return b.testament === 'OT'; }), els.otList);
    render(BIBLE_BOOKS.filter(function (b) { return b.testament === 'NT'; }), els.ntList);
  }

  // ============================================================
  // Detail panel: load + render
  // ============================================================

  function showHome() {
    els.detail.hidden = true;
    els.heroSection.hidden = false;
    els.topSection.hidden = false;
    els.browseSection.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function showDetail(book, chapter, verse) {
    els.heroSection.hidden = true;
    els.topSection.hidden = true;
    els.browseSection.hidden = true;
    els.detail.hidden = false;
    els.verseTextBlock.hidden = true;
    els.occurrences.innerHTML = '<div class="refv-loading">Loading…</div>';
    els.detailTitle.textContent = book.display + (chapter ? ' ' + chapter : '') + (verse ? ':' + verse : '');
    els.detailSub.textContent = chapter
      ? (verse ? 'All sermons that touched this verse.' : 'All sermons that touched this chapter.')
      : 'Pick a chapter to see the sermons that touched it.';

    loadBook(book).then(function (data) {
      if (!chapter) {
        renderChapterGrid(book, data);
      } else {
        renderChapterOccurrences(book, chapter, verse, data);
      }
    }).catch(function () {
      els.occurrences.innerHTML = '<div class="refv-empty">Could not load references for ' + book.display + '.</div>';
    });

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function loadBook(book) {
    var slug = dataSlugFor(book);
    if (state.bookCache[slug]) {
      return Promise.resolve(state.bookCache[slug]);
    }
    return fetch(BOOK_URL(slug))
      .then(function (r) { if (!r.ok) throw new Error('not ok'); return r.json(); })
      .then(function (d) { state.bookCache[slug] = d; return d; });
  }

  function renderChapterGrid(book, data) {
    var chapters = data.chapters || {};
    var entries = Object.keys(chapters)
      .filter(function (k) { return k !== 'None' && k !== 'unknown' && !isNaN(parseInt(k, 10)); })
      .map(function (k) { return { chapter: parseInt(k, 10), count: chapters[k].length }; })
      .sort(function (a, b) { return a.chapter - b.chapter; });

    if (!entries.length) {
      els.occurrences.innerHTML = '<div class="refv-empty">No chapter-level references found for ' + book.display + '.</div>';
      return;
    }
    var html = '<ul class="refv-chapter-grid">' + entries.map(function (e) {
      return '<li><button class="refv-chapter-chip" data-chapter="' + e.chapter + '" type="button">' +
        '<span class="refv-chapter-chip-num">' + e.chapter + '</span>' +
        '<span class="refv-chapter-chip-count">' + e.count + '</span>' +
        '</button></li>';
    }).join('') + '</ul>';
    els.occurrences.innerHTML = html;
    Array.prototype.forEach.call(els.occurrences.querySelectorAll('.refv-chapter-chip'), function (el) {
      el.addEventListener('click', function () {
        setHash([book.slug, el.getAttribute('data-chapter')]);
        applyRoute();
      });
    });
  }

  function renderChapterOccurrences(book, chapter, verse, data) {
    var refs = (data.chapters && data.chapters[String(chapter)]) || [];

    if (verse) {
      // Single-verse view: KJV text on top, sermons for just that verse below.
      var vrefs = refs.filter(function (r) { return Number(r.verse) === Number(verse); });
      renderVerseText(book, chapter, verse);
      if (!vrefs.length) {
        els.occurrences.innerHTML = '<div class="refv-empty">No sermons in the library reference ' +
          book.display + ' ' + chapter + ':' + verse + ' yet.</div>';
        return;
      }
      vrefs = sortRefs(vrefs);
      els.occurrences.innerHTML = vrefs.map(renderOccurrenceCard).join('');
      wireOccurrenceButtons(els.occurrences);
      return;
    }

    // Whole-chapter view: read the KJV chapter, with badges on preached verses
    // and sermon cards grouped by verse below.
    els.occurrences.innerHTML = '<div class="refv-loading">Loading chapter…</div>';
    loadKjvBook(book).then(function (kjvData) {
      var kjvChapter = readKjvChapter(kjvData, chapter);
      renderChapterReading(book, chapter, refs, kjvChapter);
    }).catch(function () {
      // KJV unavailable; degrade to a flat sermon list.
      if (!refs.length) {
        els.occurrences.innerHTML = '<div class="refv-empty">No sermons in the library reference ' +
          book.display + ' ' + chapter + ' yet.</div>';
        return;
      }
      els.occurrences.innerHTML = sortRefs(refs).map(renderOccurrenceCard).join('');
      wireOccurrenceButtons(els.occurrences);
    });
  }

  function sortRefs(refs) {
    return refs.slice().sort(function (a, b) {
      return (a.video_id || '').localeCompare(b.video_id || '')
        || (a.start_time || 0) - (b.start_time || 0);
    });
  }

  function wireOccurrenceButtons(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('[data-action="watch"]'), function (el) {
      el.addEventListener('click', function () {
        openVideoModal(el.getAttribute('data-video'), parseFloat(el.getAttribute('data-ts')) || 0, el.getAttribute('data-title'));
      });
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-action="transcript"]'), function (el) {
      el.addEventListener('click', function () {
        openTranscriptModal(el.getAttribute('data-video'), parseFloat(el.getAttribute('data-ts')) || 0, el.getAttribute('data-title'));
      });
    });
  }

  function renderChapterReading(book, chapter, refs, kjvChapter) {
    // Group refs by verse. Verse-less refs land in a "chapter-level" bucket.
    var byVerse = {};
    refs.forEach(function (r) {
      var v = (r.verse != null && r.verse !== '' && !isNaN(parseInt(r.verse, 10)))
        ? parseInt(r.verse, 10) : 'chapter';
      if (!byVerse[v]) byVerse[v] = [];
      byVerse[v].push(r);
    });

    // Stash for the modal openers.
    state.currentChapter = {
      book: book,
      chapter: chapter,
      refs: refs,
      byVerse: byVerse
    };

    var hasAnyRefs = refs.length > 0;
    var versesWithRefs = Object.keys(byVerse).filter(function (k) {
      return k !== 'chapter';
    }).length;

    // Top toolbar: count + "All sermons" trigger. Keeps user in the reading
    // flow but gives them one click to see everything.
    var toolbarHtml = '';
    if (hasAnyRefs) {
      var summary = refs.length + ' reference' + (refs.length === 1 ? '' : 's') +
        ' across ' + versesWithRefs + ' verse' + (versesWithRefs === 1 ? '' : 's');
      toolbarHtml = '<div class="refv-reading-toolbar">' +
        '<span class="refv-reading-toolbar-stat">' + summary + '</span>' +
        '<button class="refv-reading-toolbar-btn" id="open-all-sermons" type="button">' +
          'All sermons in this chapter →' +
        '</button>' +
      '</div>';
    }

    // The chapter itself, in paragraph flow.
    var bibleHtml = '';
    if (kjvChapter && Array.isArray(kjvChapter.verses) && kjvChapter.verses.length) {
      bibleHtml = '<section class="refv-bible-reading" aria-label="' +
        escapeAttr(book.display + ' ' + chapter + ', King James Version') + '">';
      bibleHtml += renderVersesAsParagraphs(kjvChapter.verses, byVerse);
      bibleHtml += '</section>';
    }

    var emptyNote = hasAnyRefs ? '' :
      '<div class="refv-empty refv-reading-empty">No sermons in the library reference ' +
        book.display + ' ' + chapter + ' yet.</div>';

    // Pagination placeholders — we render the strips once neighbors resolve
    // (async, since the prev book's chapter count may need a fetch).
    var topNavHtml = '<div class="refv-chapter-nav refv-chapter-nav-top" id="chapter-nav-top"></div>';
    var bottomNavHtml = '<div class="refv-chapter-nav refv-chapter-nav-bottom" id="chapter-nav-bottom"></div>';

    els.occurrences.innerHTML = topNavHtml + toolbarHtml + bibleHtml + emptyNote + bottomNavHtml;

    // Wire verse-number clicks → open modal for that verse.
    Array.prototype.forEach.call(els.occurrences.querySelectorAll('.refv-vnum.has-refs'), function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var v = parseInt(el.getAttribute('data-verse'), 10);
        openSermonsModal({ verse: v });
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });

    var allBtn = document.getElementById('open-all-sermons');
    if (allBtn) {
      allBtn.addEventListener('click', function () { openSermonsModal({ all: true }); });
    }

    // Render chapter pagination once neighbors resolve.
    renderChapterNav(book, chapter);
  }

  function renderChapterNav(book, chapter) {
    Promise.all([
      getNeighborChapter(book, chapter, -1),
      getNeighborChapter(book, chapter, +1)
    ]).then(function (results) {
      var prev = results[0], next = results[1];
      var topEl = document.getElementById('chapter-nav-top');
      var bottomEl = document.getElementById('chapter-nav-bottom');
      if (!topEl || !bottomEl) return; // user navigated away

      // Top: compact arrows centered around the current chapter
      topEl.innerHTML =
        '<div class="refv-chapter-nav-row">' +
          navButton(prev, 'prev', false) +
          '<span class="refv-chapter-nav-here">' + escapeHtml(book.display + ' ' + chapter) + '</span>' +
          navButton(next, 'next', false) +
        '</div>';

      // Bottom: bigger "continue reading" style buttons
      bottomEl.innerHTML =
        '<div class="refv-chapter-nav-row refv-chapter-nav-row-big">' +
          navButton(prev, 'prev', true) +
          navButton(next, 'next', true) +
        '</div>';

      // Wire clicks
      Array.prototype.forEach.call(
        document.querySelectorAll('.refv-chapter-nav [data-nav-slug]'),
        function (el) {
          el.addEventListener('click', function (e) {
            e.preventDefault();
            setHash([el.getAttribute('data-nav-slug'), el.getAttribute('data-nav-chapter')]);
            applyRoute();
          });
        }
      );
    });
  }

  function navButton(target, dir, big) {
    var classes = 'refv-chapter-nav-btn refv-chapter-nav-btn-' + dir;
    if (big) classes += ' is-big';
    if (!target) {
      return '<span class="' + classes + ' is-disabled" aria-hidden="true">' +
        (dir === 'prev' ? '←' : '→') +
        (big ? '<span class="refv-chapter-nav-label">—</span>' : '') +
      '</span>';
    }
    var label = target.book.display + ' ' + target.chapter;
    var arrow = dir === 'prev' ? '←' : '→';
    if (big) {
      return '<button type="button" class="' + classes +
        '" data-nav-slug="' + target.book.slug +
        '" data-nav-chapter="' + target.chapter + '">' +
        (dir === 'prev' ? '<span class="refv-chapter-nav-arrow">' + arrow + '</span>' : '') +
        '<span class="refv-chapter-nav-label">' +
          '<span class="refv-chapter-nav-lead">' +
            (dir === 'prev' ? 'Previous' : 'Continue reading') +
          '</span>' +
          '<span class="refv-chapter-nav-target">' + escapeHtml(label) + '</span>' +
        '</span>' +
        (dir === 'next' ? '<span class="refv-chapter-nav-arrow">' + arrow + '</span>' : '') +
      '</button>';
    }
    return '<button type="button" class="' + classes +
      '" data-nav-slug="' + target.book.slug +
      '" data-nav-chapter="' + target.chapter +
      '" aria-label="Go to ' + escapeAttr(label) + '" title="' + escapeAttr(label) + '">' +
      arrow +
    '</button>';
  }

  // Group verses into paragraphs of ~5, mimicking printed-Bible flow.
  // Verse numbers ride inline as quiet superscripts; verses with sermon refs
  // become clickable (number + small bullet) without disrupting the prose.
  function renderVersesAsParagraphs(verses, byVerse) {
    var GROUP_SIZE = 5;
    var paragraphs = [];
    for (var i = 0; i < verses.length; i += GROUP_SIZE) {
      paragraphs.push(verses.slice(i, i + GROUP_SIZE));
    }
    return paragraphs.map(function (group) {
      var inner = group.map(function (v) {
        var n = parseInt(v.verse, 10);
        var hits = byVerse[n];
        var has = hits && hits.length > 0;
        var label = 'Verse ' + n + (has ? ' — ' + hits.length +
          (hits.length === 1 ? ' sermon' : ' sermons') : '');
        if (has) {
          return '<sup class="refv-vnum has-refs" data-verse="' + n +
            '" role="button" tabindex="0" aria-label="' + escapeAttr(label) + '">' +
            n + '<span class="refv-vdot" aria-hidden="true"></span></sup> ' +
            escapeHtml(v.text || '');
        }
        return '<sup class="refv-vnum" id="verse-' + n + '">' + n + '</sup> ' +
          escapeHtml(v.text || '');
      }).join(' ');
      return '<p class="refv-bible-para">' + inner + '</p>';
    }).join('');
  }

  // ---- Sermons modal ----

  function openSermonsModal(opts) {
    if (!state.currentChapter) return;
    var cc = state.currentChapter;
    var bookDisplay = cc.book.display;
    var ch = cc.chapter;

    var body, title;
    if (opts && opts.verse != null) {
      var items = sortRefs(cc.byVerse[opts.verse] || []);
      title = bookDisplay + ' ' + ch + ':' + opts.verse;
      body = items.length
        ? items.map(renderOccurrenceCard).join('')
        : '<div class="refv-empty">No sermons for this verse.</div>';
    } else {
      // "All sermons" view: grouped by verse, chapter-level at the end.
      title = bookDisplay + ' ' + ch + ' — all sermons';
      var verseKeys = Object.keys(cc.byVerse).filter(function (k) { return k !== 'chapter'; })
        .sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
      if (cc.byVerse['chapter']) verseKeys.push('chapter');
      body = verseKeys.map(function (vk) {
        var items = sortRefs(cc.byVerse[vk]);
        var groupLabel = vk === 'chapter'
          ? bookDisplay + ' ' + ch + ' (chapter-level references)'
          : bookDisplay + ' ' + ch + ':' + vk;
        return '<div class="refv-sermon-group">' +
          '<h4 class="refv-sermon-group-head">' +
            '<span class="refv-sermon-group-label">' + escapeHtml(groupLabel) + '</span>' +
            '<span class="refv-sermon-group-count">' + items.length +
              (items.length === 1 ? ' sermon' : ' sermons') + '</span>' +
          '</h4>' +
          items.map(renderOccurrenceCard).join('') +
        '</div>';
      }).join('');
      if (!body) body = '<div class="refv-empty">No sermons for this chapter.</div>';
    }

    els.sermonsModalTitle.textContent = title;
    els.sermonsModalBody.innerHTML = body;
    els.sermonsModalBody.scrollTop = 0;
    els.sermonsModal.hidden = false;
    els.sermonsModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    wireOccurrenceButtons(els.sermonsModalBody);
  }

  function closeSermonsModal() {
    els.sermonsModal.hidden = true;
    els.sermonsModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function renderOccurrenceCard(ref, index) {
    var sermonTitle = escapeHtml(ref.sermon_title || 'Sermon');
    var ts = formatTimestamp(ref.start_time);
    var url = ref.url || ('https://www.youtube.com/watch?v=' + (ref.video_id || '') + '&t=' + Math.floor(ref.start_time || 0));
    var refText = ref.reference_text || '';
    var ctx = ref.context || '';

    // Build a clean reference label from the structured fields rather than
    // the raw reference_text (which might be "Matthew chapter number one,
    // verse twenty-one"). This is the WHY-is-this-card-here signal.
    var bookDisplay = displayBookName(ref.book);
    var refBadge = bookDisplay;
    if (ref.chapter != null && ref.chapter !== '' && !isNaN(parseInt(ref.chapter, 10))) {
      refBadge += ' ' + ref.chapter;
      if (ref.verse != null && ref.verse !== '' && !isNaN(parseInt(ref.verse, 10))) {
        refBadge += ':' + ref.verse;
      }
    }
    var implicitTag = ref.is_implicit
      ? '<span class="refv-occ-badge-tag" title="The speaker quoted the verse without naming the citation">quoted</span>'
      : '';

    // Highlight the reference_text inside the context snippet if it's there.
    var highlighted;
    if (refText && ctx && ctx.toLowerCase().indexOf(refText.toLowerCase()) !== -1) {
      var re = new RegExp('(' + escapeRegex(refText) + ')', 'i');
      highlighted = escapeHtml(ctx).replace(re, '<span class="refv-occ-hl">$1</span>');
    } else {
      highlighted = escapeHtml(ctx);
    }

    // Optional AI footnote summary (study-Bible-style one-liner). Stored on
    // the ref as `point_summary` by tools/generate_reference_summaries.py.
    var summary = (ref.point_summary || '').trim();
    var summaryHtml = '';
    if (summary) {
      summaryHtml = '<div class="refv-occ-summary">' +
        '<span class="refv-occ-summary-label">In this sermon</span>' +
        '<span class="refv-occ-summary-text">' + escapeHtml(summary) + '</span>' +
        '<span class="refv-occ-summary-note">' +
          'AI-generated · always verify in the transcript or video below' +
        '</span>' +
      '</div>';
    }

    return '<article class="refv-occ">' +
      '<div class="refv-occ-badge">' +
        '<span class="refv-occ-badge-ref">' + escapeHtml(refBadge) + '</span>' +
        implicitTag +
      '</div>' +
      '<div class="refv-occ-sermon">' +
        '<span class="refv-occ-sermon-label">from sermon</span> ' +
        '<span class="refv-occ-sermon-title">' + sermonTitle + '</span>' +
        ' <span class="refv-occ-sermon-ts">· ' + ts + '</span>' +
      '</div>' +
      summaryHtml +
      (ctx ? '<blockquote class="refv-occ-context">' + highlighted + '</blockquote>' : '') +
      '<div class="refv-occ-actions">' +
        '<button class="refv-occ-btn is-primary" data-action="watch" data-video="' + escapeAttr(ref.video_id) +
          '" data-ts="' + (ref.start_time || 0) + '" data-title="' + escapeAttr(ref.sermon_title || 'Sermon') + '" type="button">' +
          '▶ Watch' +
        '</button>' +
        '<button class="refv-occ-btn" data-action="transcript" data-video="' + escapeAttr(ref.video_id) +
          '" data-ts="' + (ref.start_time || 0) + '" data-title="' + escapeAttr(ref.sermon_title || 'Sermon') + '" type="button">' +
          'Transcript' +
        '</button>' +
        '<a class="refv-occ-btn" href="' + escapeAttr(url) + '" target="_blank" rel="noopener">YouTube ↗</a>' +
      '</div>' +
    '</article>';
  }

  function displayBookName(rawBook) {
    if (!rawBook) return '';
    // Data is occasionally stored as "1_Corinthians" or "Song_of_Solomon".
    var s = String(rawBook).replace(/_/g, ' ');
    var b = BOOK_INDEX[s.toLowerCase().replace(/\s+/g, '')];
    return b ? b.display : s;
  }

  function renderVerseText(book, chapter, verse) {
    var gatewayBook = encodeURIComponent(book.display);
    els.bibleGatewayLink.href = 'https://www.biblegateway.com/passage/?search=' +
      gatewayBook + '+' + chapter + ':' + verse + '&version=KJV';
    els.verseTextBlock.hidden = false;
    els.verseTextBody.textContent = 'Loading…';

    loadKjvBook(book)
      .then(function (d) {
        els.verseTextBody.textContent = readKjvVerse(d, chapter, verse);
      })
      .catch(function () {
        els.verseTextBlock.hidden = true;
      });
  }

  function loadKjvBook(book) {
    // Bible-kjv-master uses CamelCase ("1Corinthians.json", "SongofSolomon.json").
    var kjvSlug = book.dataSlug ? book.dataSlug.replace(/_/g, '') : book.slug;
    if (state.kjvCache[kjvSlug]) {
      return Promise.resolve(state.kjvCache[kjvSlug]);
    }
    return fetch(KJV_URL(kjvSlug))
      .then(function (r) { if (!r.ok) throw new Error('not ok'); return r.json(); })
      .then(function (d) { state.kjvCache[kjvSlug] = d; return d; });
  }

  function readKjvVerse(data, chapter, verse) {
    var ch = readKjvChapter(data, chapter);
    if (!ch) return '(chapter ' + chapter + ' not found)';
    var v = ch.verses.find(function (x) { return String(x.verse) === String(verse); });
    return v && v.text ? v.text : '(verse ' + verse + ' not found)';
  }

  function readKjvChapter(data, chapter) {
    // Bible-kjv-master format: { book, chapters: [ { chapter: "1", verses: [...] } ] }
    if (!data || !Array.isArray(data.chapters)) return null;
    return data.chapters.find(function (c) { return String(c.chapter) === String(chapter); }) || null;
  }

  // Resolve prev/next chapter (chains across book boundaries).
  // Returns Promise<{book, chapter} | null>.
  function getNeighborChapter(book, chapter, direction) {
    return loadKjvBook(book).then(function (data) {
      var n = (data.chapters || []).length;
      var target = chapter + direction;
      if (target >= 1 && target <= n) {
        return { book: book, chapter: target };
      }
      // Cross-book: walk BIBLE_BOOKS for next non-empty book.
      var idx = -1;
      for (var i = 0; i < BIBLE_BOOKS.length; i++) {
        if (BIBLE_BOOKS[i].slug === book.slug) { idx = i; break; }
      }
      var nextIdx = idx + direction;
      if (idx < 0 || nextIdx < 0 || nextIdx >= BIBLE_BOOKS.length) return null;
      var nextBook = BIBLE_BOOKS[nextIdx];
      if (direction > 0) return { book: nextBook, chapter: 1 };
      // Going backward — need the previous book's last chapter.
      return loadKjvBook(nextBook).then(function (d2) {
        var lastN = (d2.chapters || []).length;
        return lastN ? { book: nextBook, chapter: lastN } : null;
      }).catch(function () { return null; });
    }).catch(function () { return null; });
  }

  // ============================================================
  // Video modal
  // ============================================================

  function openVideoModal(videoId, startSec, title) {
    if (!videoId) return;
    els.videoModalTitle.textContent = title || 'Sermon';
    var start = Math.floor(startSec || 0);
    els.videoModalFrame.innerHTML =
      '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(videoId) +
      '?start=' + start + '&autoplay=1" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>';
    els.videoModal.hidden = false;
    els.videoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeVideoModal() {
    els.videoModal.hidden = true;
    els.videoModal.setAttribute('aria-hidden', 'true');
    els.videoModalFrame.innerHTML = '';
    document.body.style.overflow = '';
  }

  // ============================================================
  // Transcript modal
  // ============================================================

  function openTranscriptModal(videoId, startSec, title) {
    if (!videoId) return;
    state.currentTranscript = { videoId: videoId, title: title, startSec: startSec };
    els.transcriptModalTitle.textContent = title || 'Sermon';
    els.transcriptModalSub.textContent = 'Loading…';
    els.transcriptModal.hidden = false;
    els.transcriptModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    var renderAndScroll = function (data) {
      renderTranscript(data, startSec, videoId);
      // Defer scroll so the layout has settled.
      requestAnimationFrame(function () {
        var target = els.transcriptModalBody.querySelector('.refv-transcript-segment.is-current');
        if (target && target.scrollIntoView) {
          target.scrollIntoView({ block: 'center', behavior: 'instant' in window ? 'instant' : 'auto' });
        }
      });
    };

    if (state.transcriptCache[videoId]) {
      renderAndScroll(state.transcriptCache[videoId]);
      return;
    }
    els.transcriptModalBody.innerHTML = '<p class="refv-loading">Loading transcript…</p>';
    fetch(TRANSCRIPT_URL(videoId))
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        state.transcriptCache[videoId] = data;
        renderAndScroll(data);
      })
      .catch(function (err) {
        els.transcriptModalSub.textContent = '';
        els.transcriptModalBody.innerHTML = '<div class="refv-empty">Transcript not available yet for this sermon.' +
          ' (' + escapeHtml(err.message) + ')</div>';
      });
  }

  function renderTranscript(data, focusSec, videoId) {
    var segments = (data && data.segments) || [];
    // Update sub-header with sermon metadata (date, duration, jump-position).
    var subBits = [];
    if (data && data.publish_date) {
      subBits.push(formatPublishDate(data.publish_date));
    }
    if (segments.length) {
      var last = segments[segments.length - 1];
      var dur = last.end_time != null ? last.end_time : last.end;
      if (dur) subBits.push(formatDuration(dur) + ' sermon');
    }
    subBits.push('starting at ' + formatTimestamp(focusSec));
    els.transcriptModalSub.textContent = subBits.join(' · ');

    if (!segments.length) {
      els.transcriptModalBody.innerHTML = '<div class="refv-empty">No transcript segments found.</div>';
      return;
    }
    // Group micro-segments into ~30s paragraphs for readability.
    var paragraphs = [];
    var current = null;
    var GROUP_SECS = 30;
    segments.forEach(function (seg) {
      var startVal = seg.start_time != null ? seg.start_time : seg.start;
      var endVal = seg.end_time != null ? seg.end_time : seg.end;
      var text = (seg.text || '').trim();
      if (!text) return;
      if (!current || (startVal - current.start) >= GROUP_SECS) {
        current = { start: startVal, end: endVal, text: text };
        paragraphs.push(current);
      } else {
        current.end = endVal;
        current.text += ' ' + text;
      }
    });

    var focusTs = focusSec || 0;
    var html = paragraphs.map(function (p) {
      var isCurrent = focusTs >= p.start && focusTs <= (p.end || (p.start + GROUP_SECS));
      var classes = 'refv-transcript-segment' + (isCurrent ? ' is-current' : '');
      var ytHref = 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId) +
        '&t=' + Math.floor(p.start);
      return '<p class="' + classes + '" data-start="' + p.start + '">' +
        '<a class="refv-transcript-ts" href="' + ytHref +
          '" target="_blank" rel="noopener" title="Jump to ' + formatTimestamp(p.start) + ' on YouTube">' +
          formatTimestamp(p.start) +
        '</a> ' +
        escapeHtml(p.text) +
      '</p>';
    }).join('');
    els.transcriptModalBody.innerHTML = html;
  }

  function formatDuration(sec) {
    sec = Math.floor(sec || 0);
    var m = Math.round(sec / 60);
    if (m >= 60) {
      var h = Math.floor(m / 60);
      var mm = m % 60;
      return h + 'h' + (mm ? ' ' + mm + 'm' : '');
    }
    return m + ' min';
  }

  function formatPublishDate(raw) {
    // Backend gives YYYYMMDD as int. Format as e.g. "May 25, 2025".
    var s = String(raw);
    if (!/^\d{8}$/.test(s)) return '';
    var y = s.slice(0, 4), m = parseInt(s.slice(4, 6), 10), d = parseInt(s.slice(6, 8), 10);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (m < 1 || m > 12) return '';
    return months[m - 1] + ' ' + d + ', ' + y;
  }

  function closeTranscriptModal() {
    els.transcriptModal.hidden = true;
    els.transcriptModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ============================================================
  // Lookup form
  // ============================================================

  function wireLookup() {
    els.lookupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = els.lookupInput.value;
      var parsed = parseLookup(raw);
      if (!parsed) {
        els.lookupHint.textContent = 'Sorry — couldn\'t parse "' + raw + '". Try "Romans 8" or "John 3:16".';
        els.lookupHint.classList.add('is-error');
        return;
      }
      els.lookupHint.textContent = '';
      els.lookupHint.classList.remove('is-error');
      var parts = [parsed.book.slug];
      if (parsed.chapter) parts.push(parsed.chapter);
      if (parsed.verse) parts.push(parsed.verse);
      setHash(parts);
      applyRoute();
    });
  }

  // ============================================================
  // Utility
  // ============================================================

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function escapeRegex(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function formatTimestamp(sec) {
    sec = Math.floor(sec || 0);
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return (h ? h + ':' + pad(m) : m) + ':' + pad(s);
  }

  // ============================================================
  // Boot
  // ============================================================

  function init() {
    bindElements();
    wireLookup();
    if (els.detailBack) {
      els.detailBack.addEventListener('click', function () {
        setHash([]);
        applyRoute();
      });
    }
    if (els.videoModalClose) {
      els.videoModalClose.addEventListener('click', closeVideoModal);
    }
    if (els.videoModal) {
      els.videoModal.addEventListener('click', function (e) {
        if (e.target === els.videoModal) closeVideoModal();
      });
    }
    if (els.transcriptModalClose) {
      els.transcriptModalClose.addEventListener('click', closeTranscriptModal);
    }
    if (els.transcriptModal) {
      els.transcriptModal.addEventListener('click', function (e) {
        if (e.target === els.transcriptModal) closeTranscriptModal();
      });
    }
    if (els.sermonsModalClose) {
      els.sermonsModalClose.addEventListener('click', closeSermonsModal);
    }
    if (els.sermonsModal) {
      els.sermonsModal.addEventListener('click', function (e) {
        if (e.target === els.sermonsModal) closeSermonsModal();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!els.transcriptModal.hidden) { closeTranscriptModal(); return; }
      if (!els.sermonsModal.hidden) { closeSermonsModal(); return; }
      if (!els.videoModal.hidden) { closeVideoModal(); return; }
    });
    window.addEventListener('hashchange', applyRoute);

    fetch(STATS_URL)
      .then(function (r) { if (!r.ok) throw new Error('not ok'); return r.json(); })
      .then(function (d) {
        state.stats = d;
        renderStatStrip();
        renderTopList(20);
        renderBrowse();
        applyRoute();
      })
      .catch(function () {
        els.statStrip.textContent = 'Library stats are temporarily unavailable.';
        els.topList.innerHTML = '<li class="refv-empty">Could not load passages.</li>';
        renderBrowse();
        applyRoute();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
