/* Dedicated transcript page.
   URL: /transcript.html?v={video_id}&t={seconds}
   Renders the sermon transcript as a full page (not a modal) so iOS's
   native scrolling Just Works. Replaces the in-modal transcript reader
   that fought iOS at every layer. */

(function () {
  'use strict';

  var API_BASE = 'https://sermon-search-api-8fok.onrender.com';

  var els = {};
  function $(id) { return document.getElementById(id); }

  function getParam(name) {
    var qs = new URLSearchParams(window.location.search);
    return qs.get(name);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function formatTimestamp(sec) {
    sec = Math.floor(sec || 0);
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return (h ? h + ':' + pad(m) : m) + ':' + pad(s);
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
    var s = String(raw || '');
    if (!/^\d{8}$/.test(s)) return '';
    var y = s.slice(0, 4), m = parseInt(s.slice(4, 6), 10), d = parseInt(s.slice(6, 8), 10);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (m < 1 || m > 12) return '';
    return months[m - 1] + ' ' + d + ', ' + y;
  }

  function render(data, focusSec) {
    var videoId = data.video_id;
    var segments = (data && data.segments) || [];

    // Header
    document.title = (data.title ? data.title + ' — Transcript' : 'Sermon transcript');
    els.title.textContent = data.title || 'Sermon transcript';

    var metaBits = [];
    if (data.publish_date) metaBits.push(formatPublishDate(data.publish_date));
    if (segments.length) {
      var last = segments[segments.length - 1];
      var dur = last.end_time != null ? last.end_time : last.end;
      if (dur) metaBits.push(formatDuration(dur));
    }
    if (focusSec) metaBits.push('starting at ' + formatTimestamp(focusSec));
    els.meta.textContent = metaBits.join(' · ');

    // Actions
    els.watch.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId) +
      '&t=' + Math.floor(focusSec || 0);
    els.actions.hidden = false;

    if (!segments.length) {
      els.body.innerHTML = '<div class="tx-empty">No transcript segments available.</div>';
      return;
    }

    // Group ~30s paragraphs (same shape as the old modal renderer).
    var GROUP_SECS = 30;
    var paragraphs = [];
    var current = null;
    segments.forEach(function (seg) {
      var s = seg.start_time != null ? seg.start_time : seg.start;
      var e = seg.end_time != null ? seg.end_time : seg.end;
      var text = (seg.text || '').trim();
      if (!text) return;
      if (!current || (s - current.start) >= GROUP_SECS) {
        current = { start: s, end: e, text: text };
        paragraphs.push(current);
      } else {
        current.end = e;
        current.text += ' ' + text;
      }
    });

    var focusTs = focusSec || 0;
    var html = paragraphs.map(function (p) {
      var isCurrent = focusTs >= p.start && focusTs <= (p.end || (p.start + GROUP_SECS));
      var classes = 'tx-segment' + (isCurrent ? ' is-current' : '');
      var ytHref = 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId) +
        '&t=' + Math.floor(p.start);
      return '<p class="' + classes + '" data-start="' + p.start + '">' +
        '<a class="tx-ts" href="' + escapeAttr(ytHref) +
          '" target="_blank" rel="noopener" title="Jump to ' + formatTimestamp(p.start) + ' on YouTube">' +
          formatTimestamp(p.start) +
        '</a> ' +
        escapeHtml(p.text) +
      '</p>';
    }).join('');
    els.body.innerHTML = html;

    // Defer scroll-to-current until after layout so the position is correct.
    requestAnimationFrame(function () {
      var target = els.body.querySelector('.tx-segment.is-current');
      if (target && target.scrollIntoView) {
        // Native page scroll on the document — works on every browser.
        var rect = target.getBoundingClientRect();
        var y = window.scrollY + rect.top - 80; // leave room above for the header
        window.scrollTo({ top: y, behavior: 'instant' in window ? 'instant' : 'auto' });
      }
    });
  }

  function bindElements() {
    els.title = $('tx-title');
    els.eyebrow = $('tx-eyebrow');
    els.meta = $('tx-meta');
    els.body = $('tx-body');
    els.back = $('tx-back');
    els.actions = $('tx-actions');
    els.watch = $('tx-watch');
    els.toTop = $('tx-totop');
  }

  function wire() {
    // If there's no history to go back to (direct navigation), fall back to
    // the reference viewer home rather than dead-ending.
    if (els.back) {
      els.back.addEventListener('click', function (e) {
        if (window.history.length <= 1) {
          e.preventDefault();
          window.location.href = '/reference-viewer.html';
        }
      });
    }

    // Floating back-to-top: show once scrolled roughly a screenful down.
    if (els.toTop) {
      els.toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      var SHOW_AFTER = 600;
      var ticking = false;
      function syncToTop() {
        ticking = false;
        els.toTop.classList.toggle('is-visible', window.scrollY > SHOW_AFTER);
      }
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; window.requestAnimationFrame(syncToTop); }
      }, { passive: true });
      syncToTop();
    }
  }

  function init() {
    bindElements();
    wire();

    var videoId = getParam('v');
    var startSec = parseFloat(getParam('t')) || 0;

    if (!videoId) {
      els.title.textContent = 'No sermon specified';
      els.body.innerHTML = '<div class="tx-empty">Please open a transcript from a sermon link.</div>';
      return;
    }

    fetch(API_BASE + '/transcript/' + encodeURIComponent(videoId))
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) { render(data, startSec); })
      .catch(function (err) {
        els.title.textContent = 'Transcript unavailable';
        els.body.innerHTML = '<div class="tx-empty">The transcript for this sermon isn\'t available yet.<br><small>' +
          escapeHtml(err.message) + '</small></div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
