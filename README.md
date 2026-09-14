# Fellowship Digital Ministry

An unofficial, independent project for exploring the publicly available
sermons of Fellowship Baptist Church (Oakton, VA): ask questions about what
has been preached, read full transcripts, and see where each Bible passage
has come up. It was built independently by Ryan Wolfslayer for his church.
It is not officially affiliated with or endorsed by Fellowship Baptist
Church.

Live site: <https://fellowship-digital-ministry.github.io>

This repository is the **public website** (a static Jekyll site on GitHub
Pages). Transcription, search, and answer generation live in a separate
repository, [`sermon-library`](https://github.com/fellowship-digital-ministry/sermon-library).

---

## What a visitor can do

| Page | What it does | Where its data comes from |
|---|---|---|
| **Home** (`index.html`) | Introduction, links to the tools, and the church's service times and location | Static page |
| **Chat** (`search.html`) | Ask a question in plain language. The answer is built from sermon excerpts, with a sources panel that links to the video at the right timestamp, clickable Bible references, and a print/save option. English answers stream in as they are written. Spanish and Chinese answers arrive all at once. | Sermon API: `POST /answer/stream`, `POST /answer`, `GET /transcript/{id}` |
| **Transcripts** (`transcripts.html`) | Browse and filter every transcribed sermon, newest first | Static `assets/data/sermons_catalog.json` (no API call) |
| **Transcript** (`transcript.html?v={video_id}&t={seconds}`) | Full-page transcript with timestamps, a link to the video (or audio), and the sermon's study notes | Transcript from the API `GET /transcript/{id}`. Notes from `sermons_catalog.json` |
| **Bible References** (`reference-viewer.html`) | Most-referenced chapters, browse by book, and a chapter/verse view with the KJV text and every sermon that cites it. State lives in the URL hash (`#john/3/16`) | Static `assets/data/bible/`, `Bible-kjv-master/`, `bible-headings/`, `bible-red-letter/`. The "recent sermons" list comes from the API `GET /sermons?limit=8` |

The Transcripts page and most of the Bible References page are fully static.
They work even when the API is asleep. Only the Chat, the transcript text, and
the recent-sermons list need the API.

---

## How it fits together

```
 YouTube (church channel, public videos)
        │
        ▼
 ┌──────────────────────────── sermon-library repo ────────────────────────────┐
 │ Ingest (bin/run_ingest.sh, scheduled twice daily on the maintainer's        │
 │ machine): discover new videos → Whisper transcription → chunk + embed        │
 │ (OpenAI text-embedding-3-small) → Pinecone index → Bible-reference           │
 │ extraction → AI study notes / summaries                                     │
 │                                                                              │
 │ Sermon API (FastAPI, api/, hosted on Render)                                 │
 │   /search, /answer, /answer/stream  semantic retrieval from Pinecone, then   │
 │                                     answer generation through OpenRouter     │
 │   /transcript/{id}, /sermons        transcripts and sermon metadata          │
 │   /bible/stats, /bible/books[/…]    Bible-reference statistics               │
 └───────┬──────────────────────────────────────┬───────────────────────────────┘
         │ static exports committed to this repo │ live HTTPS calls from the browser
         ▼                                       ▼
 ┌──────────────────────── this repo (GitHub Pages / Jekyll) ──────────────────┐
 │ assets/data/sermons_catalog.json   ← built by sermon-library               │
 │                                      tools/build_sermon_catalog.py         │
 │ assets/data/bible/                 ← scripts/fetch_bible_data.py (from API) │
 │ HTML pages + assets/js/*           → call the API for chat and transcripts  │
 └──────────────────────────────────────────────────────────────────────────────┘
```

### Static frontend (this repo)

Plain HTML pages rendered by Jekyll with one layout (`_layouts/default.html`),
vanilla JavaScript in `assets/js/`, and CSS in `assets/css/`. There is no
build step beyond what GitHub Pages does. Third-party code loaded in the
browser: marked 12.0.2 and Papa Parse 5.3.2 from jsDelivr, plus DOMPurify
3.4.15, which is vendored in `assets/js/lib/`.

### Sermon, transcript, and catalog data

- **Transcripts** are made with Whisper from the church's public sermon
  recordings (mostly YouTube videos, plus some audio-only sermons from the
  church website) and stored in `sermon-library`. The site fetches them
  through the API.
- **`assets/data/sermons_catalog.json`**: the list of transcribed sermons
  (video id, title, date, duration, link, AI-generated description and
  study notes; audio-only entries also carry `source` and `audio_url`).
  `sermon-library` builds it and commits it here.
- **`assets/data/bible/`**: a static copy of the API's Bible-reference data
  (`bible_stats.json`, `bible_books.json`, `books/{Book}.json`) and a
  `manifest.json` that records when it last changed, its counts, and that it
  is a complete snapshot.
- **`assets/data/Bible-kjv-master/`**: the KJV text, one JSON file per book
  (third-party dataset; see its own LICENSE).
- **`assets/data/bible-headings/`, `bible-red-letter/`**: section headings
  and red-letter spans for the reading view, generated once by
  `scripts/generate_bible_overlays.py` (an AI-assisted, metered tool that
  is not scheduled).
- **`assets/data/analytics/references_index.json`**: used by the Chat page
  to enrich Bible-reference chips.

### Backend API (sermon-library)

Base URL: `https://sermon-search-api-8fok.onrender.com`. It is hard-coded in
`assets/js/search.js`, `assets/js/transcript-page.js`,
`assets/js/reference-viewer.js` and both workflows. `api_url` in
`_config.yml` is not used. Render's free tier sleeps when idle, so
`.github/workflows/keep_api_warm.yml` pings `GET /` every 10 minutes. The
Chat page retries once after a cold-start failure.

Endpoints this site calls:

| Endpoint | Used by |
|---|---|
| `GET /` | Chat (connection check), keep-warm workflow |
| `POST /answer/stream` (Server-Sent Events) | Chat, English |
| `POST /answer` | Chat, Spanish / Chinese |
| `GET /transcript/{video_id}` | Transcript page, Chat transcript viewer |
| `GET /search` | Chat "find sermons" mode (code path kept; no longer offered in the UI) |
| `GET /sermons?limit=8` | Bible References, recent sermons |
| `GET /bible/stats`, `/bible/books`, `/bible/books/{book}` | `scripts/fetch_bible_data.py` only (not the browser) |

### Semantic retrieval and answer generation (sermon-library)

A question is embedded and matched against transcript chunks in a Pinecone
index. The strongest matches, along with the sermon titles, dates, and
timestamps, are sent to a language model through OpenRouter. The model
writes an answer grounded in those excerpts, and the matching excerpts come
back as sources. The models are set by environment variables in
`sermon-library` (see `api/utils.py`). A shared daily budget caps the free
answers. When it runs out, visitors can continue with their own OpenRouter
key (see below).

In the browser, answers are Markdown. They are rendered by
`assets/js/safe-markdown.js`, which runs marked and then sanitizes the
result with DOMPurify before anything reaches the page. Model output is
treated as untrusted.

### Scheduled data exports

| Job | Where it runs | What it updates |
|---|---|---|
| Local ingest, `sermon-library/bin/run_ingest.sh` (twice daily) | Maintainer's machine | Rebuilds and commits `assets/data/sermons_catalog.json`, then runs this repo's `scripts/fetch_bible_data.py` and commits `assets/data/bible/`. This is the primary refresh. |
| `.github/workflows/fetch_bible_data.yml` (daily 08:00 UTC, or manual) | GitHub Actions | Same Bible-data refresh as a backup path. GitHub disables scheduled workflows in inactive repositories; re-enable it from the Actions tab if you rely on it. |
| `.github/workflows/keep_api_warm.yml` (every 10 min) | GitHub Actions | Nothing; only keeps the API awake |

`scripts/fetch_bible_data.py` publishes **complete snapshots only**. It
retries each request with bounded concurrency. It checks that the stats
total, the book list, and every per-book count agree. It refuses a
snapshot that suddenly loses books or more than 10% of its references,
unless `FETCH_ALLOW_SHRINK=1` is set. Files are written only after all of
that passes. If anything fails, it writes nothing and exits with status 1,
so the workflow fails visibly instead of committing a partial mix.
`assets/data/bible/manifest.json` shows when the data last changed.

---

## Your own OpenRouter key (optional)

When the shared daily budget is used up, the Chat page offers to use a key
from the visitor's own OpenRouter account. Exactly what happens to it:

- **Stored:** only in the visitor's browser. By default it goes in
  `sessionStorage` and is gone when the tab closes. If "Remember on this
  device" is ticked, it goes in `localStorage` and stays until removed.
  Keys saved by earlier versions of the page are in `localStorage` and are
  treated as remembered. If browser storage is blocked, the key is kept in
  memory until the page reloads.
- **Sent:** with every answer request, in the `X-OpenRouter-Key` header, to
  the sermon API on Render. The backend uses it to call OpenRouter for that
  one request. The browser never talks to OpenRouter directly, so the key
  does pass through the backend and the Render hosting platform.
- **Kept by the backend:** in `sermon-library` the key is only used to build
  a per-request OpenRouter client (`build_openrouter_client`). The
  application code does not write it to storage or logs. Operators should
  keep it that way (see "Maintainer notes").
- **Removed:** the "remove" button next to "Using your key" deletes it from
  both storages. Clearing the site's data in browser settings also removes
  it.
- The site never logs the key to the console.

Chat history (the last 10 questions and answers) is also saved in the
visitor's browser (`localStorage`, `fellowship-chat-v1`) so a reload does
not lose the conversation. "Clear" deletes it. Questions are sent to the API
to be answered.

---

## Repository layout

```
.
├── index.html                  Home
├── search.html                 Chat
├── transcripts.html            Transcript list
├── transcript.html             Single transcript (?v=<video_id>&t=<seconds>)
├── reference-viewer.html       Bible References
├── _config.yml                 Jekyll settings
├── _layouts/default.html       The one layout; loads the shared scripts
├── _includes/                  header.html (navigation), footer.html
├── _data/analytics/            Legacy pre-computed analytics (not read by any page)
├── assets/
│   ├── css/                    style.css, style-additions.css, mobile-*.css,
│   │                           search.css, reference-viewer.css,
│   │                           transcript-page.css, transcripts-page.css
│   ├── images/                 Logo
│   ├── js/
│   │   ├── search.js           Chat page: API client, streaming, sources, key handling
│   │   ├── safe-markdown.js    Markdown → sanitized HTML for AI answers
│   │   ├── lib/purify.min.js   DOMPurify (vendored) + its licence
│   │   ├── transcripts-page.js Transcript list
│   │   ├── transcript-page.js  Single transcript page
│   │   ├── reference-viewer.js Bible References page
│   │   ├── bible-references.js Makes Bible references clickable
│   │   ├── mobile-header.js    Mobile navigation
│   │   └── claude-interface.js, enhanced-sermon-chat.js,
│   │       bible-sources-panel.js, mobile-keyboard.js
│   │                           Earlier chat code, no longer loaded by any page
│   └── data/                   Static data (see "Sermon, transcript, and catalog data")
├── scripts/
│   ├── fetch_bible_data.py     Refresh assets/data/bible/ from the API (complete snapshots only)
│   ├── commit_data_snapshot.sh Commit + push a data directory safely (used by the workflow)
│   ├── generate_bible_overlays.py  One-off, metered: KJV headings / red-letter overlays
│   └── process_existing_metadata.py Legacy analytics export (not scheduled)
├── tests/
│   ├── test_fetch_bible_data.py    Completeness / failure semantics of the fetcher
│   ├── test_commit_snapshot.sh     Reproduces the old workflow bug; checks the new commit step
│   └── js/                         Sanitization and key-storage checks (node --test + jsdom)
├── requirements.txt            Python deps for scripts/
├── Gemfile                     github-pages gem for local Jekyll
└── .github/workflows/          fetch_bible_data.yml, keep_api_warm.yml
```

---

## Local development and checks

Preview the site (needs Ruby and Bundler):

```bash
bundle install
bundle exec jekyll serve      # http://localhost:4000
```

Run the checks:

```bash
# Python: fetcher completeness and failure behaviour
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m unittest discover -s tests

# Shell: data commit/push logic against throwaway local git repos
bash tests/test_commit_snapshot.sh

# JavaScript: answer sanitization and API-key storage
cd tests/js && npm ci && npm test
```

Refresh the Bible data by hand (writes nothing unless the snapshot is
complete):

```bash
.venv/bin/python scripts/fetch_bible_data.py && git status assets/data/bible
```

### Maintainer notes

- The ingest pipeline, API, rate limiting and key forwarding are in
  `sermon-library`. Changes to request headers, endpoints, or response
  shapes need a matching change there.
- Never add logging of request headers in the API; `X-OpenRouter-Key`
  carries visitors' keys.

---

## Licensing and rights

Different parts of this project are in different positions. Nothing here
grants rights the project does not hold.

- **This repository's own code and documentation:** the `LICENSE` file is
  CC0 1.0 Universal.
- **Sermons (audio, video, and spoken content):** these belong to their
  speakers and/or the church. They are not covered by this repository's
  license. As the site says, all sermon content remains the intellectual
  property of the respective speakers. The site links to the public videos
  and does not host them.
- **Transcripts, sermon metadata, AI-generated descriptions and study notes,
  and Bible-reference data:** these are derived from the sermons. No license
  has been established for them beyond the site's statement that the tool is
  for personal study. Do not assume the CC0 file covers them.
- **KJV text** (`assets/data/Bible-kjv-master/`): third-party dataset under
  its own LICENSE file in that folder.
- **Third-party libraries:** DOMPurify (Apache-2.0 / MPL-2.0, license in
  `assets/js/lib/`). marked (MIT) and Papa Parse (MIT) are loaded from
  jsDelivr.
- Church names and marks belong to the church. Their use here only
  identifies whose public sermons are indexed.
