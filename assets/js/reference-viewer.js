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
  var HEADINGS_URL = function (slug) { return '/assets/data/bible-headings/' + slug + '.json'; };
  var RED_LETTER_URL = function (slug) { return '/assets/data/bible-red-letter/' + slug + '.json'; };
  var API_BASE = 'https://sermon-search-api-8fok.onrender.com';
  var TRANSCRIPT_URL = function (videoId) { return API_BASE + '/transcript/' + encodeURIComponent(videoId); };
  var SERMONS_URL = API_BASE + '/sermons?limit=8';

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

  // Chapter counts per book (KJV). Static Bible data, never changes.
  // Used by the jump picker to render the chapter grid without fetching the
  // full KJV file for every book.
  var CHAPTER_COUNTS = {
    Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
    Joshua: 24, Judges: 21, Ruth: 4,
    '1Samuel': 31, '2Samuel': 24, '1Kings': 22, '2Kings': 25,
    '1Chronicles': 29, '2Chronicles': 36,
    Ezra: 10, Nehemiah: 13, Esther: 10,
    Job: 42, Psalms: 150, Proverbs: 31, Ecclesiastes: 12, SongofSolomon: 8,
    Isaiah: 66, Jeremiah: 52, Lamentations: 5, Ezekiel: 48, Daniel: 12,
    Hosea: 14, Joel: 3, Amos: 9, Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3,
    Habakkuk: 3, Zephaniah: 3, Haggai: 2, Zechariah: 14, Malachi: 4,
    Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28,
    Romans: 16, '1Corinthians': 16, '2Corinthians': 13,
    Galatians: 6, Ephesians: 6, Philippians: 4, Colossians: 4,
    '1Thessalonians': 5, '2Thessalonians': 3,
    '1Timothy': 6, '2Timothy': 4, Titus: 3, Philemon: 1,
    Hebrews: 13, James: 5,
    '1Peter': 5, '2Peter': 3,
    '1John': 5, '2John': 1, '3John': 1, Jude: 1, Revelation: 22
  };

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
      'filip': 'Philippians', 'filipi': 'Philippians', 'filipians': 'Philippians', 'filippians': 'Philippians',
      'col': 'Colossians',
      '1thess': '1 Thessalonians', '1th': '1 Thessalonians', '2thess': '2 Thessalonians', '2th': '2 Thessalonians',
      '1tim': '1 Timothy', '1ti': '1 Timothy', '2tim': '2 Timothy', '2ti': '2 Timothy',
      'tit': 'Titus', 'phlm': 'Philemon', 'phm': 'Philemon',
      'heb': 'Hebrews', 'jas': 'James', 'jm': 'James',
      '1pet': '1 Peter', '1pt': '1 Peter', '2pet': '2 Peter', '2pt': '2 Peter',
      '1jn': '1 John', '1jhn': '1 John', '2jn': '2 John', '3jn': '3 John',
      'jud': 'Jude', 'jude': 'Jude', 'rev': 'Revelation', 'revelations': 'Revelation', 're': 'Revelation', 'rv': 'Revelation',
      'eccle': 'Ecclesiastes', 'ecclesiastics': 'Ecclesiastes',
      'songs': 'Song of Solomon', 'songofsongs': 'Song of Solomon'
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
    transcriptCache: {},
    headingsCache: {},
    redLetterCache: {}
  };

  var els = {};

  function $(id) { return document.getElementById(id); }

  function bindElements() {
    els.lookupForm = $('lookup-form');
    els.lookupInput = $('lookup-input');
    els.lookupHint = $('lookup-hint');
    els.lookupSuggestions = $('lookup-suggestions');
    els.otList = $('ot-list');
    els.ntList = $('nt-list');
    els.detail = $('detail-panel');
    els.detailBack = $('detail-back');
    els.detailTitle = $('detail-title');
    els.detailSub = $('detail-sub');
    els.verseTextBlock = $('verse-text-block');
    els.verseTextBody = $('verse-text-body');
    els.occurrences = $('occurrences');
    els.heroSection = document.querySelector('.refv-hero');
    els.browseSection = document.querySelector('.refv-browse');
    els.recentSection = $('recent-section');
    els.recentList = $('recent-list');
    els.videoModal = $('video-modal');
    els.videoModalFrame = $('video-modal-frame');
    els.videoModalTitle = $('video-modal-title');
    els.videoModalClose = $('video-modal-close');
    els.transcriptModal = $('transcript-modal');
    els.transcriptModalBody = $('transcript-modal-body');
    els.transcriptModalTitle = $('transcript-modal-title');
    els.transcriptModalSub = $('transcript-modal-sub');
    els.transcriptModalClose = $('transcript-modal-close');
    els.transcriptModalTop = $('transcript-modal-top');
    els.sermonsModal = $('sermons-modal');
    els.sermonsModalBody = $('sermons-modal-body');
    els.sermonsModalTitle = $('sermons-modal-title');
    els.sermonsModalClose = $('sermons-modal-close');
    els.pickerModal = $('picker-modal');
    els.pickerModalClose = $('picker-modal-close');
    els.pickerSearch = $('picker-search');
    els.pickerBooks = $('picker-books');
    els.pickerChapters = $('picker-chapters');
  }

  // ============================================================
  // Lookup parser  ("Romans 8", "John 3:16", "1 Cor 13", "Ps 23:1")
  // ============================================================

  // Split raw input into bookPart + chapter/verse. Tolerates partial input.
  function splitLookup(raw) {
    if (!raw) return null;
    var s = raw.trim();
    var verse = null, chapter = null;
    var m = s.match(/^(.+?)\s*[:.]\s*(\d+)\s*$/);
    if (m) {
      verse = parseInt(m[2], 10);
      s = m[1];
    }
    var m2 = s.match(/^(.+?)\s+(\d+)\s*$/);
    if (m2) {
      chapter = parseInt(m2[2], 10);
      s = m2[1];
    }
    return { bookPart: s.trim(), chapter: chapter, verse: verse };
  }

  function parseLookup(raw) {
    var parts = splitLookup(raw);
    if (!parts || !parts.bookPart) return null;
    var key = parts.bookPart.replace(/\s+/g, '').toLowerCase();
    var book = BOOK_INDEX[key];
    if (!book) {
      // Fall back to fuzzy: best autocomplete hit wins.
      var hits = searchBooks(parts.bookPart, 1);
      if (hits.length) book = hits[0].book;
    }
    if (!book) return null;
    return { book: book, chapter: parts.chapter, verse: parts.verse };
  }

  // ============================================================
  // Book search (powers autocomplete + fuzzy fallback)
  // ============================================================

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = new Array(b.length + 1);
    var curr = new Array(b.length + 1);
    for (var j = 0; j <= b.length; j++) prev[j] = j;
    for (var i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (var k = 1; k <= b.length; k++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(k - 1) ? 0 : 1;
        curr[k] = Math.min(curr[k - 1] + 1, prev[k] + 1, prev[k - 1] + cost);
      }
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[b.length];
  }

  // Returns ranked matches: [{ book, score, matchedKey }, ...]
  // Lower score = better. Score buckets:
  //   0 = exact, 1 = prefix, 2 = substring, 3+ = fuzzy (distance)
  function searchBooks(query, limit) {
    if (limit == null) limit = 6;
    if (!query) return [];
    var qRaw = query.toLowerCase().trim();
    if (!qRaw) return [];
    var q = qRaw.replace(/\s+/g, '');
    if (!q) return [];

    var seen = {};
    var hits = [];

    BIBLE_BOOKS.forEach(function (book) {
      var name = book.display.toLowerCase();
      var nameKey = name.replace(/\s+/g, '');
      var score = -1;
      if (nameKey === q) score = 0;
      else if (nameKey.indexOf(q) === 0) score = 1;
      else if (nameKey.indexOf(q) !== -1) score = 2;
      else if (q.length >= 3) {
        var window = nameKey.slice(0, q.length);
        var d = levenshtein(q, window);
        var maxAllowed = q.length <= 4 ? 1 : 2;
        if (d <= maxAllowed) score = 3 + d;
      }
      if (score >= 0 && !seen[book.slug]) {
        seen[book.slug] = true;
        hits.push({ book: book, score: score, matchedName: book.display });
      }
    });

    // Aliases (short forms) for cases like "ps", "1cor", "filip".
    // Only adds books not already matched, and only on prefix.
    Object.keys(BOOK_INDEX).forEach(function (alias) {
      var book = BOOK_INDEX[alias];
      if (!book || seen[book.slug]) return;
      if (alias.indexOf(q) === 0) {
        seen[book.slug] = true;
        hits.push({ book: book, score: 1.5, matchedName: book.display });
      }
    });

    hits.sort(function (a, b) {
      if (a.score !== b.score) return a.score - b.score;
      return BIBLE_BOOKS.indexOf(a.book) - BIBLE_BOOKS.indexOf(b.book);
    });
    return hits.slice(0, limit);
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
  // Rendering: browse panel (OT + NT chips)
  // ============================================================

  // ============================================================
  // Recent sermons (home page block, optional — degrades silently)
  // ============================================================

  function renderRecentSermons() {
    if (!els.recentList) return;
    fetch(SERMONS_URL)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var sermons = (data && data.sermons) || [];
        if (!sermons.length) return;
        var html = sermons.map(function (s) {
          var date = formatPublishDate(s.publish_date);
          var passageGuess = extractPassageFromTitle(s.title);
          var ytUrl = s.url || ('https://www.youtube.com/watch?v=' + s.video_id);
          var readBtn = passageGuess
            ? '<a class="refv-recent-btn refv-recent-btn-read" href="#' +
                encodeURIComponent(passageGuess.book.slug) + '/' +
                passageGuess.chapter + '">Read ' + escapeHtml(passageGuess.label) + '</a>'
            : '';
          return '<li class="refv-recent-item">' +
            '<div class="refv-recent-meta">' +
              (date ? '<span class="refv-recent-date">' + date + '</span>' : '') +
            '</div>' +
            '<div class="refv-recent-title">' + escapeHtml(s.title || 'Sermon') + '</div>' +
            '<div class="refv-recent-actions">' +
              readBtn +
              '<button type="button" class="refv-recent-btn" data-action="transcript" ' +
                'data-video="' + escapeAttr(s.video_id) + '" data-ts="0" ' +
                'data-title="' + escapeAttr(s.title || 'Sermon') + '">Read transcript</button>' +
              '<a class="refv-recent-btn" href="' + escapeAttr(ytUrl) +
                '" target="_blank" rel="noopener">YouTube ↗</a>' +
            '</div>' +
          '</li>';
        }).join('');
        els.recentList.innerHTML = html;
        els.recentSection.hidden = false;
        // Wire transcript buttons (same handler shape as occurrence cards).
        Array.prototype.forEach.call(
          els.recentList.querySelectorAll('[data-action="transcript"]'),
          function (btn) {
            btn.addEventListener('click', function () {
              openTranscriptModal(
                btn.getAttribute('data-video'),
                parseFloat(btn.getAttribute('data-ts')) || 0,
                btn.getAttribute('data-title')
              );
            });
          }
        );
      })
      .catch(function () {
        // API down or hasn't redeployed yet — just leave section hidden.
      });
  }

  // Try to pull a passage citation out of a sermon title. Pastor's titles
  // typically end with the passage, e.g.  '"To Save Sinners" 1 Timothy 1:12-17'
  // → returns {book, chapter, label}. Returns null on no match.
  function extractPassageFromTitle(title) {
    if (!title) return null;
    // Strip leading "quoted" portion + trim
    var s = title.replace(/^[^"]*"[^"]*"\s*/, '').trim();
    if (!s) s = title;
    // Match BookName (with optional leading number) + chapter + optional verse range
    var m = s.match(/((?:[IiVv]+\s+|[123]\s+)?[A-Z][a-zA-Z]+(?:\s+of\s+[A-Z][a-zA-Z]+)?)\s+(\d+)(?::\d+(?:-\d+)?)?/);
    if (!m) return null;
    var bookKey = m[1].trim().toLowerCase().replace(/\s+/g, '');
    // Handle Roman numeral prefixes
    bookKey = bookKey.replace(/^i(?=[a-z])/, '1').replace(/^ii(?=[a-z])/, '2').replace(/^iii(?=[a-z])/, '3');
    var book = BOOK_INDEX[bookKey];
    if (!book) return null;
    var chapter = parseInt(m[2], 10);
    return { book: book, chapter: chapter, label: book.display + ' ' + chapter };
  }

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
        var refClass = c > 0 ? ' has-refs' : ' no-refs';
        var countLabel = c > 0 ? (c + (c === 1 ? ' ref' : ' refs')) : 'no refs yet';
        var aria = book.display + ', ' + countLabel;
        return '<li><button class="refv-book-chip' + refClass + '" data-book="' + book.slug +
          '" type="button" aria-label="' + escapeAttr(aria) + '">' +
          '<span class="refv-book-chip-name">' + escapeHtml(book.display) + '</span>' +
          '<span class="refv-book-chip-count" aria-hidden="true">' +
            (c > 0 ? c : '·') +
          '</span>' +
          '</button></li>';
      }).join('');
      target.innerHTML = html;
      target.setAttribute('aria-busy', 'false');
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
    els.browseSection.hidden = false;
    if (els.recentSection && els.recentList && els.recentList.children.length) {
      els.recentSection.hidden = false;
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function showDetail(book, chapter, verse) {
    els.heroSection.hidden = true;
    els.browseSection.hidden = true;
    if (els.recentSection) els.recentSection.hidden = true;
    els.detail.hidden = false;
    els.verseTextBlock.hidden = true;
    els.occurrences.innerHTML = '<div class="refv-loading">Loading…</div>';
    els.detailTitle.textContent = book.display + (chapter ? ' ' + chapter : '') + (verse ? ':' + verse : '');
    // Subtitle is empty by default in chapter view — the reading itself + the
    // burgundy verse dots tell the story. We only set a hint for the
    // book-only landing (a chapter grid).
    els.detailSub.textContent = chapter
      ? ''
      : 'Pick a chapter to begin reading.';

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

    // Whole-chapter view: load KJV + headings + red-letter overlays in
    // parallel, then render. Overlays degrade gracefully — if the file's
    // missing the page just renders without that layer.
    els.occurrences.innerHTML = '<div class="refv-loading">Loading chapter…</div>';
    Promise.all([
      loadKjvBook(book),
      loadHeadings(book),
      loadRedLetter(book)
    ]).then(function (results) {
      var kjvData = results[0];
      var headings = results[1];
      var redLetter = results[2];
      var kjvChapter = readKjvChapter(kjvData, chapter);
      var chHeadings = (headings && headings[String(chapter)]) || [];
      var chRedLetter = (redLetter && redLetter[String(chapter)]) || [];
      renderChapterReading(book, chapter, refs, kjvChapter, chHeadings, chRedLetter);
    }).catch(function () {
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

  function renderChapterReading(book, chapter, refs, kjvChapter, headings, redLetter) {
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

    // The chapter itself, in paragraph flow. Section headings (if any)
    // break the flow into editor-style sections; Jesus's spoken words
    // (if any) render in red.
    var bibleHtml = '';
    if (kjvChapter && Array.isArray(kjvChapter.verses) && kjvChapter.verses.length) {
      bibleHtml = '<section class="refv-bible-reading" aria-label="' +
        escapeAttr(book.display + ' ' + chapter + ', King James Version') + '">';
      bibleHtml += renderVersesAsParagraphs(kjvChapter.verses, byVerse, headings || [], redLetter || []);
      bibleHtml += '</section>';
    }

    var emptyNote = hasAnyRefs ? '' :
      '<div class="refv-empty refv-reading-empty">No sermons in the library reference ' +
        book.display + ' ' + chapter + ' yet.</div>';

    // Pagination placeholders — we render the strips once neighbors resolve
    // (async, since the prev book's chapter count may need a fetch).
    var topNavHtml = '<div class="refv-chapter-nav refv-chapter-nav-top" id="chapter-nav-top"></div>';
    var bottomNavHtml = '<div class="refv-chapter-nav refv-chapter-nav-bottom" id="chapter-nav-bottom"></div>';

    els.occurrences.innerHTML = topNavHtml + bibleHtml + emptyNote + bottomNavHtml;

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

      // Top: compact arrows around a clickable "Book N ▾" jump trigger.
      var jumpLabel = escapeHtml(book.display + ' ' + chapter);
      topEl.innerHTML =
        '<div class="refv-chapter-nav-row">' +
          navButton(prev, 'prev', false) +
          '<button type="button" class="refv-chapter-nav-jump" id="chapter-nav-jump"' +
            ' aria-haspopup="dialog" aria-label="Jump to another book or chapter">' +
            jumpLabel + ' <span class="refv-chapter-nav-jump-caret" aria-hidden="true">▾</span>' +
          '</button>' +
          navButton(next, 'next', false) +
        '</div>';

      // Bottom: bigger "continue reading" style buttons
      bottomEl.innerHTML =
        '<div class="refv-chapter-nav-row refv-chapter-nav-row-big">' +
          navButton(prev, 'prev', true) +
          navButton(next, 'next', true) +
        '</div>';

      // Wire prev/next clicks
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

      // Wire jump trigger
      var jumpBtn = document.getElementById('chapter-nav-jump');
      if (jumpBtn) {
        jumpBtn.addEventListener('click', function () {
          openPicker(book, chapter);
        });
      }
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

  // Walk verses inserting (a) section headings at their `before_verse`
  // anchors, (b) red-letter spans around Jesus's spoken-word substrings,
  // and (c) paragraph breaks every ~5 verses within a heading-section.
  // Headings always start a new paragraph block (printed-Bible feel).
  function renderVersesAsParagraphs(verses, byVerse, headings, redLetter) {
    var GROUP_SIZE = 5;
    var headingAt = {};
    (headings || []).forEach(function (h) { headingAt[h.before_verse] = h.title; });
    var redAt = {};
    (redLetter || []).forEach(function (r) { redAt[r.verse] = r.segments; });

    var out = [];
    var currentPara = [];
    var sinceHeading = 0;

    function flushPara() {
      if (currentPara.length) {
        out.push('<p class="refv-bible-para">' + currentPara.join(' ') + '</p>');
        currentPara = [];
      }
    }

    verses.forEach(function (v) {
      var n = parseInt(v.verse, 10);

      // Insert heading before this verse if there is one.
      if (headingAt[n]) {
        flushPara();
        out.push('<h3 class="refv-bible-heading">' + escapeHtml(headingAt[n]) + '</h3>');
        sinceHeading = 0;
      }

      // Verse number element (quiet sup; burgundy + dot when has sermons).
      var hits = byVerse[n];
      var has = hits && hits.length > 0;
      var numEl;
      if (has) {
        var label = 'Verse ' + n + ' — ' + hits.length +
          (hits.length === 1 ? ' sermon' : ' sermons');
        numEl = '<sup class="refv-vnum has-refs" data-verse="' + n +
          '" role="button" tabindex="0" aria-label="' + escapeAttr(label) + '">' +
          n + '<span class="refv-vdot" aria-hidden="true"></span></sup>';
      } else {
        numEl = '<sup class="refv-vnum" id="verse-' + n + '">' + n + '</sup>';
      }

      // Verse text — apply red-letter wrapping if Jesus speaks here.
      var textHtml = redAt[n]
        ? renderVerseTextWithRedLetter(v.text || '', redAt[n])
        : escapeHtml(v.text || '');

      currentPara.push(numEl + ' ' + textHtml);
      sinceHeading += 1;

      // Within a heading-section, group ~5 verses per paragraph.
      if (sinceHeading >= GROUP_SIZE) {
        flushPara();
        sinceHeading = 0;
      }
    });
    flushPara();
    return out.join('');
  }

  // Wrap each speech segment in a red-letter span, leaving narrative intro
  // text in regular type. Segments are {intro, speech}; we locate `speech`
  // as a substring of the verse text and split around it.
  function renderVerseTextWithRedLetter(text, segments) {
    if (!segments || !segments.length || !text) return escapeHtml(text);
    var positions = [];
    segments.forEach(function (seg) {
      var sp = (seg && seg.speech || '').trim();
      if (!sp) return;
      var idx = text.indexOf(sp);
      if (idx === -1) {
        // Try whitespace-normalized fallback (model may have collapsed spaces)
        var spNorm = sp.replace(/\s+/g, ' ');
        var textNorm = text.replace(/\s+/g, ' ');
        var normIdx = textNorm.indexOf(spNorm);
        if (normIdx === -1) return;
        // Translate normalized index back is tricky; just skip in this case.
        return;
      }
      positions.push({ start: idx, end: idx + sp.length });
    });
    if (!positions.length) return escapeHtml(text);
    positions.sort(function (a, b) { return a.start - b.start; });
    // Merge any overlapping spans.
    var merged = [positions[0]];
    for (var i = 1; i < positions.length; i++) {
      var prev = merged[merged.length - 1];
      var cur = positions[i];
      if (cur.start <= prev.end) {
        prev.end = Math.max(prev.end, cur.end);
      } else {
        merged.push(cur);
      }
    }
    var out = '';
    var cursor = 0;
    merged.forEach(function (p) {
      if (p.start > cursor) out += escapeHtml(text.substring(cursor, p.start));
      out += '<span class="refv-red">' + escapeHtml(text.substring(p.start, p.end)) + '</span>';
      cursor = p.end;
    });
    if (cursor < text.length) out += escapeHtml(text.substring(cursor));
    return out;
  }

  // ---- Sermons modal ----

  function openSermonsModal(opts) {
    if (!state.currentChapter) return;
    var cc = state.currentChapter;
    var bookDisplay = cc.book.display;
    var ch = cc.chapter;

    // Only entry point now is per-verse (clicking a verse number dot in the
    // chapter reading). The "all sermons in chapter" branch was removed
    // along with its toolbar trigger — kept the function signature
    // (opts.verse) so future callers can still target a specific verse.
    var verse = opts && opts.verse;
    var items = verse != null ? sortRefs(cc.byVerse[verse] || []) : [];
    var title = verse != null ? (bookDisplay + ' ' + ch + ':' + verse) : (bookDisplay + ' ' + ch);
    var body = items.length
      ? items.map(renderOccurrenceCard).join('')
      : '<div class="refv-empty">No sermons here yet.</div>';

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

  // ============================================================
  // Jump picker — book list (filterable) + chapter grid
  // ============================================================

  function openPicker(currentBook, currentChapter) {
    if (!els.pickerModal) return;
    state.pickerBook = currentBook;
    state.pickerChapter = currentChapter;
    state.pickerSelectedBook = currentBook; // book shown in the right pane
    renderPickerBooks('');
    renderPickerChapters(state.pickerSelectedBook);
    els.pickerSearch.value = '';
    els.pickerModal.hidden = false;
    els.pickerModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Focus the search after the modal paints so keyboard users can type-to-filter.
    requestAnimationFrame(function () {
      if (els.pickerSearch && els.pickerSearch.focus) {
        try { els.pickerSearch.focus({ preventScroll: true }); } catch (e) { els.pickerSearch.focus(); }
      }
    });
  }

  function closePicker() {
    if (!els.pickerModal) return;
    els.pickerModal.hidden = true;
    els.pickerModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function renderPickerBooks(filter) {
    if (!els.pickerBooks) return;
    var f = (filter || '').trim().toLowerCase().replace(/\s+/g, '');
    function matchBook(book) {
      if (!f) return true;
      var key = book.display.toLowerCase().replace(/\s+/g, '');
      return key.indexOf(f) !== -1;
    }
    var matches = BIBLE_BOOKS.filter(matchBook);
    if (!matches.length) {
      els.pickerBooks.innerHTML = '<p class="refv-picker-empty">No books match "' +
        escapeHtml(filter) + '".</p>';
      return;
    }
    // Single flat list — no <h4> section headers (they were colliding with
    // global style.css h-rules and producing overlap). The Old/New Testament
    // boundary is marked by a thin "New Testament" divider row injected
    // before the first NT book, only when the list actually crosses it.
    var rows = [];
    var ntDividerPlaced = false;
    matches.forEach(function (b) {
      if (b.testament === 'NT' && !ntDividerPlaced) {
        rows.push('<li class="refv-picker-divider" aria-hidden="true">New Testament</li>');
        ntDividerPlaced = true;
      }
      var n = CHAPTER_COUNTS[b.slug] || 0;
      var classes = 'refv-picker-book' +
        (state.pickerSelectedBook && state.pickerSelectedBook.slug === b.slug ? ' is-active' : '') +
        (state.pickerBook && state.pickerBook.slug === b.slug ? ' is-current' : '');
      rows.push(
        '<li><button type="button" class="' + classes + '" data-slug="' + b.slug + '">' +
          '<span class="refv-picker-book-name">' + escapeHtml(b.display) + '</span>' +
          '<span class="refv-picker-book-count">' + n + '</span>' +
        '</button></li>'
      );
    });
    // If results begin with NT (e.g., filter "joh" matches both Job and John,
    // both start with J — Job is OT — divider lands correctly above John).
    // If results are NT-only, divider still fires before the first row,
    // which provides a useful "New Testament" header on its own.
    els.pickerBooks.innerHTML = '<ul class="refv-picker-book-list">' + rows.join('') + '</ul>';
    Array.prototype.forEach.call(
      els.pickerBooks.querySelectorAll('.refv-picker-book'),
      function (btn) {
        btn.addEventListener('click', function () {
          var slug = btn.getAttribute('data-slug');
          var book = BOOK_INDEX[slug.toLowerCase()];
          if (!book) return;
          state.pickerSelectedBook = book;
          renderPickerBooks(els.pickerSearch.value);
          renderPickerChapters(book);
        });
      }
    );
  }

  function renderPickerChapters(book) {
    if (!els.pickerChapters || !book) return;
    var count = CHAPTER_COUNTS[book.slug] || 0;
    var currentSlug = state.pickerBook && state.pickerBook.slug;
    var currentCh = state.pickerChapter;
    var grid = '';
    for (var i = 1; i <= count; i++) {
      var isHere = currentSlug === book.slug && i === currentCh;
      grid += '<button type="button" class="refv-picker-chapter' +
        (isHere ? ' is-current' : '') +
        '" data-slug="' + book.slug + '" data-chapter="' + i + '">' + i + '</button>';
    }
    els.pickerChapters.innerHTML =
      '<div class="refv-picker-chapters-head">' +
        '<h4 class="refv-picker-chapters-title">' + escapeHtml(book.display) + '</h4>' +
        '<span class="refv-picker-chapters-meta">' + count +
          (count === 1 ? ' chapter' : ' chapters') + '</span>' +
      '</div>' +
      '<div class="refv-picker-chapter-grid">' + grid + '</div>';
    Array.prototype.forEach.call(
      els.pickerChapters.querySelectorAll('.refv-picker-chapter'),
      function (btn) {
        btn.addEventListener('click', function () {
          var slug = btn.getAttribute('data-slug');
          var ch = parseInt(btn.getAttribute('data-chapter'), 10);
          setHash([slug, ch]);
          closePicker();
          applyRoute();
        });
      }
    );
  }

  function renderOccurrenceCard(ref, index) {
    var sermonTitle = escapeHtml(ref.sermon_title || 'Sermon');
    var ts = formatTimestamp(ref.start_time);
    var url = ref.url || ('https://www.youtube.com/watch?v=' + (ref.video_id || '') + '&t=' + Math.floor(ref.start_time || 0));
    var refText = ref.reference_text || '';
    var ctx = ref.context || '';

    // Cards always render in a context that already names the reference
    // (the sermons modal title or the deep-link verse view), so the big
    // Bible badge is redundant — drop it and lead with the sermon title.
    // The implicit/explicit flag still matters: we show it as a small pill
    // on the meta line so readers know whether the verse was named aloud
    // or just quoted.
    var implicitTag = ref.is_implicit
      ? '<span class="refv-occ-meta-pill" title="The speaker quoted the verse without naming the citation">quoted</span>'
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
    // When present, the summary replaces the raw transcript snippet as the
    // primary content — but the snippet stays available behind a "Show
    // original quote" disclosure so readers can verify the summary.
    var summary = (ref.point_summary || '').trim();
    var summaryHtml = '';
    if (summary) {
      var quoteToggle = ctx
        ? '<details class="refv-occ-quote-toggle">' +
            '<summary><span class="refv-occ-quote-toggle-show">Show original quote</span>' +
            '<span class="refv-occ-quote-toggle-hide">Hide original quote</span></summary>' +
            '<blockquote class="refv-occ-context">' + highlighted + '</blockquote>' +
          '</details>'
        : '';
      summaryHtml = '<div class="refv-occ-summary">' +
        '<span class="refv-occ-summary-label">In this sermon</span>' +
        '<span class="refv-occ-summary-text">' + escapeHtml(summary) + '</span>' +
        '<div class="refv-occ-summary-footer">' +
          '<span class="refv-occ-summary-note">AI-generated</span>' +
          quoteToggle +
        '</div>' +
      '</div>';
    }

    // Only show the bare snippet when there's no AI summary (fallback).
    var snippetHtml = (!summary && ctx)
      ? '<blockquote class="refv-occ-context">' + highlighted + '</blockquote>'
      : '';

    return '<article class="refv-occ">' +
      '<h3 class="refv-occ-title">' + sermonTitle + '</h3>' +
      '<div class="refv-occ-meta">' +
        '<span class="refv-occ-meta-ts">' + ts + '</span>' +
        implicitTag +
      '</div>' +
      summaryHtml +
      snippetHtml +
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

  function kjvSlugFor(book) {
    // Bible-kjv-master uses CamelCase ("1Corinthians.json", "SongofSolomon.json").
    return book.dataSlug ? book.dataSlug.replace(/_/g, '') : book.slug;
  }

  function loadKjvBook(book) {
    var slug = kjvSlugFor(book);
    if (state.kjvCache[slug]) {
      return Promise.resolve(state.kjvCache[slug]);
    }
    return fetch(KJV_URL(slug))
      .then(function (r) { if (!r.ok) throw new Error('not ok'); return r.json(); })
      .then(function (d) { state.kjvCache[slug] = d; return d; });
  }

  function loadHeadings(book) {
    var slug = kjvSlugFor(book);
    if (state.headingsCache[slug] !== undefined) {
      return Promise.resolve(state.headingsCache[slug]);
    }
    return fetch(HEADINGS_URL(slug))
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) { state.headingsCache[slug] = d || {}; return state.headingsCache[slug]; })
      .catch(function () { state.headingsCache[slug] = {}; return {}; });
  }

  function loadRedLetter(book) {
    var slug = kjvSlugFor(book);
    if (state.redLetterCache[slug] !== undefined) {
      return Promise.resolve(state.redLetterCache[slug]);
    }
    return fetch(RED_LETTER_URL(slug))
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) { state.redLetterCache[slug] = d || {}; return state.redLetterCache[slug]; })
      .catch(function () { state.redLetterCache[slug] = {}; return {}; });
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
    var activeIndex = -1;
    var lastSuggestions = [];

    function navigateTo(book, chapter, verse) {
      els.lookupHint.textContent = '';
      els.lookupHint.classList.remove('is-error');
      var parts = [book.slug];
      if (chapter) parts.push(chapter);
      if (verse) parts.push(verse);
      setHash(parts);
      applyRoute();
    }

    function closeSuggestions() {
      activeIndex = -1;
      lastSuggestions = [];
      els.lookupSuggestions.hidden = true;
      els.lookupSuggestions.innerHTML = '';
      els.lookupInput.setAttribute('aria-expanded', 'false');
      els.lookupInput.removeAttribute('aria-activedescendant');
    }

    function highlightMatch(name, queryRaw) {
      var q = (queryRaw || '').trim();
      if (!q) return escapeHtml(name);
      // Match against the name ignoring spaces in the query.
      var qStrip = q.replace(/\s+/g, '').toLowerCase();
      var nameStrip = name.toLowerCase().replace(/\s+/g, '');
      var idx = nameStrip.indexOf(qStrip);
      if (idx < 0) return escapeHtml(name);
      // Walk the original name and mark the corresponding characters.
      var marked = '';
      var consumed = 0;
      var inMark = false;
      for (var i = 0; i < name.length; i++) {
        var ch = name.charAt(i);
        var isSpace = /\s/.test(ch);
        var pos = consumed;
        if (!isSpace) consumed++;
        var shouldMark = !isSpace && pos >= idx && pos < idx + qStrip.length;
        if (shouldMark && !inMark) { marked += '<mark>'; inMark = true; }
        if (!shouldMark && inMark) { marked += '</mark>'; inMark = false; }
        marked += escapeHtml(ch);
      }
      if (inMark) marked += '</mark>';
      return marked;
    }

    function renderSuggestions(suggestions, parts) {
      lastSuggestions = suggestions;
      activeIndex = -1;
      if (!suggestions.length) {
        els.lookupSuggestions.hidden = true;
        els.lookupSuggestions.innerHTML = '';
        els.lookupInput.setAttribute('aria-expanded', 'false');
        els.lookupInput.removeAttribute('aria-activedescendant');
        return;
      }
      var trailingRef = parts.chapter
        ? parts.chapter + (parts.verse ? ':' + parts.verse : '')
        : '';
      var html = suggestions.map(function (s, i) {
        var nameHtml = highlightMatch(s.book.display, parts.bookPart);
        var target = trailingRef
          ? '<span class="refv-lookup-suggestion-target">' + escapeHtml(trailingRef) + ' &rarr;</span>'
          : '';
        return '<li id="lookup-sg-' + i + '" class="refv-lookup-suggestion" role="option"' +
          ' data-index="' + i + '" aria-selected="false">' +
          '<span class="refv-lookup-suggestion-name">' + nameHtml + '</span>' +
          target +
          '</li>';
      }).join('');
      els.lookupSuggestions.innerHTML = html;
      els.lookupSuggestions.hidden = false;
      els.lookupInput.setAttribute('aria-expanded', 'true');
    }

    function setActive(idx) {
      var items = els.lookupSuggestions.querySelectorAll('.refv-lookup-suggestion');
      if (!items.length) return;
      if (idx < 0) idx = items.length - 1;
      if (idx >= items.length) idx = 0;
      activeIndex = idx;
      Array.prototype.forEach.call(items, function (el, i) {
        var active = i === idx;
        el.classList.toggle('is-active', active);
        el.setAttribute('aria-selected', active ? 'true' : 'false');
        if (active) {
          els.lookupInput.setAttribute('aria-activedescendant', el.id);
          if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
        }
      });
    }

    function pickSuggestion(idx) {
      var pick = lastSuggestions[idx];
      if (!pick) return false;
      var parts = splitLookup(els.lookupInput.value) || { bookPart: '', chapter: null, verse: null };
      if (parts.chapter) {
        navigateTo(pick.book, parts.chapter, parts.verse);
        closeSuggestions();
      } else {
        // Complete the book name; let the user keep typing (e.g. a chapter).
        els.lookupInput.value = pick.book.display + ' ';
        closeSuggestions();
        els.lookupInput.focus();
      }
      return true;
    }

    function updateSuggestions() {
      var raw = els.lookupInput.value;
      var parts = splitLookup(raw);
      if (!parts || !parts.bookPart || parts.bookPart.length < 1) {
        closeSuggestions();
        return;
      }
      var hits = searchBooks(parts.bookPart, 6);
      renderSuggestions(hits, parts);
    }

    els.lookupInput.addEventListener('input', updateSuggestions);
    els.lookupInput.addEventListener('focus', function () {
      if (els.lookupInput.value.trim()) updateSuggestions();
    });

    els.lookupInput.addEventListener('keydown', function (e) {
      var open = !els.lookupSuggestions.hidden && lastSuggestions.length;
      if (e.key === 'ArrowDown') {
        if (!open) { updateSuggestions(); return; }
        e.preventDefault();
        setActive(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        if (!open) return;
        e.preventDefault();
        setActive(activeIndex - 1);
      } else if (e.key === 'Enter') {
        if (open && activeIndex >= 0) {
          e.preventDefault();
          pickSuggestion(activeIndex);
        }
        // else: let the form submit normally (uses parseLookup fuzzy fallback).
      } else if (e.key === 'Escape') {
        if (open) { e.preventDefault(); closeSuggestions(); }
      } else if (e.key === 'Tab') {
        if (open && activeIndex >= 0) {
          // Complete the active suggestion in-place; don't navigate yet.
          var pick = lastSuggestions[activeIndex];
          if (pick) {
            var parts = splitLookup(els.lookupInput.value) || { chapter: null, verse: null };
            var v = pick.book.display +
              (parts.chapter ? ' ' + parts.chapter + (parts.verse ? ':' + parts.verse : '') : ' ');
            els.lookupInput.value = v;
            closeSuggestions();
            e.preventDefault();
          }
        }
      }
    });

    els.lookupSuggestions.addEventListener('mousedown', function (e) {
      // mousedown (not click) so the input's blur doesn't race-close the list.
      var li = e.target.closest('.refv-lookup-suggestion');
      if (!li) return;
      e.preventDefault();
      var idx = parseInt(li.getAttribute('data-index'), 10);
      pickSuggestion(idx);
    });

    document.addEventListener('click', function (e) {
      if (els.lookupSuggestions.hidden) return;
      if (e.target === els.lookupInput) return;
      if (els.lookupSuggestions.contains(e.target)) return;
      closeSuggestions();
    });

    els.lookupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // If a suggestion is highlighted, treat Enter as picking it.
      if (!els.lookupSuggestions.hidden && activeIndex >= 0) {
        pickSuggestion(activeIndex);
        return;
      }
      var raw = els.lookupInput.value;
      var parsed = parseLookup(raw);
      if (!parsed) {
        els.lookupHint.textContent = 'Try "Romans 8" or "John 3:16" — start typing for suggestions.';
        els.lookupHint.classList.add('is-error');
        return;
      }
      closeSuggestions();
      navigateTo(parsed.book, parsed.chapter, parsed.verse);
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
    if (els.transcriptModalTop) {
      els.transcriptModalTop.addEventListener('click', function () {
        // Scroll the transcript body to the top so the reader can study the
        // whole sermon from the beginning, not just from the citation point.
        if (els.transcriptModalBody) {
          els.transcriptModalBody.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
    if (els.pickerModalClose) {
      els.pickerModalClose.addEventListener('click', closePicker);
    }
    if (els.pickerModal) {
      els.pickerModal.addEventListener('click', function (e) {
        if (e.target === els.pickerModal) closePicker();
      });
    }
    if (els.pickerSearch) {
      els.pickerSearch.addEventListener('input', function () {
        renderPickerBooks(els.pickerSearch.value);
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!els.pickerModal.hidden) { closePicker(); return; }
      if (!els.transcriptModal.hidden) { closeTranscriptModal(); return; }
      if (!els.sermonsModal.hidden) { closeSermonsModal(); return; }
      if (!els.videoModal.hidden) { closeVideoModal(); return; }
    });
    window.addEventListener('hashchange', applyRoute);

    fetch(STATS_URL)
      .then(function (r) { if (!r.ok) throw new Error('not ok'); return r.json(); })
      .then(function (d) {
        state.stats = d;
        renderBrowse();
        applyRoute();
      })
      .catch(function () {
        renderBrowse();
        applyRoute();
      });

    // Recent sermons load independently — non-blocking, fails silently
    // if the API isn't ready yet.
    renderRecentSermons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
