"""Generate two presentation overlays for the KJV Bible reading view:

1. Section headings (Scofield/ESV style) — per chapter, 2-5 short headings
   positioned at specific verses. Stored at
   /assets/data/bible-headings/{Book}.json

2. Red-letter spans — per chapter (gospels + Acts + Revelation only), which
   verses contain Jesus's spoken words and the exact speech substring vs
   narrative intro. Stored at /assets/data/bible-red-letter/{Book}.json

Source data: /assets/data/Bible-kjv-master/{Book}.json

Both overlays are pure presentation — they don't touch the sermon reference
data. Idempotent: skips chapters that already have output unless --force.
"""
import os
import sys
import json
import glob
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
from openai import OpenAI

KJV_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "data", "Bible-kjv-master")
HEADINGS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "data", "bible-headings")
RED_LETTER_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "data", "bible-red-letter")

# Books where Jesus speaks. Limits the red-letter pass.
RED_LETTER_BOOKS = {
    "Matthew", "Mark", "Luke", "John",
    "Acts",          # Christ speaks at conversion of Paul + commissioning
    "Revelation",    # "I am Alpha and Omega" + letters to the churches
}

DEFAULT_MODEL = "anthropic/claude-sonnet-4.6"


# ----------------------------------------------------------------------
# Headings
# ----------------------------------------------------------------------

HEADINGS_SYSTEM = (
    "You are an editor preparing section headings for a Bible reading. "
    "Your headings orient readers to the content of the verses that follow. "
    "Match the tone of the Scofield Reference Bible or ESV editorial "
    "headings: terse, plain, descriptive of what the text DOES or DESCRIBES, "
    "never theological commentary or interpretation. Use title case."
)

def headings_user_message(book, chapter_num, verses):
    verse_lines = "\n".join(f"{v['verse']}. {v['text']}" for v in verses)
    return f"""KJV {book} chapter {chapter_num}:

{verse_lines}

Propose 2-5 short section headings for this chapter. Each heading sits before a specific verse and announces the content of the verses that follow.

Rules:
- Be terse (typically 2-5 words). Title case.
- Describe what the text does ("Paul Greets the Romans", "The Beatitudes", "The Birth of Isaac"), not what it teaches ("Justified by Faith Alone").
- The first heading should be before verse 1 unless the chapter clearly continues a thought from the previous chapter.
- Long narrative chapters may want 4-5 headings; short or didactic chapters may want only 2.
- DO NOT include any verse text in the heading.

Output ONLY valid JSON:
{{"headings": [{{"before_verse": 1, "title": "..."}}, ...]}}
"""


# ----------------------------------------------------------------------
# Red letter
# ----------------------------------------------------------------------

RED_LETTER_SYSTEM = (
    "You identify the spoken words of Jesus Christ in KJV Bible text. Output "
    "structured JSON only. Be precise: return verbatim substrings from the "
    "verse text, never paraphrase."
)

def red_letter_user_message(book, chapter_num, verses):
    verse_lines = "\n".join(f"{v['verse']}. {v['text']}" for v in verses)
    return f"""KJV {book} chapter {chapter_num}:

{verse_lines}

Identify every verse where Jesus Christ is speaking. For each such verse, return the verbatim spoken-word substring(s).

Rules:
- "Spoken by Jesus" means: direct quoted speech from Jesus. Include indirect references only if introduced ("Jesus said unto them, ..." → the part after the comma).
- For each spoken segment, extract the exact substring from the verse text — do not modify, paraphrase, or modernize punctuation.
- If a verse contains both narrative ("And Jesus answered, saying,") and speech, only the speech portion goes in "speech".
- If a whole verse is Jesus's speech with no narrative, set "intro" to empty string.
- If a verse has multiple separate speech segments (speech, narrative interrupts, more speech), list them all under "segments".
- Skip verses with no Jesus-speech entirely.

Output ONLY valid JSON:
{{"verses": [
  {{"verse": 3, "segments": [{{"intro": "And Jesus answered him, saying,", "speech": "It is written, That man shall not live by bread alone, but by every word of God."}}]}},
  ...
]}}
"""


# ----------------------------------------------------------------------
# Shared
# ----------------------------------------------------------------------

def extract_json(text):
    """Strip markdown fences + trailing prose, return first {...}."""
    if not text:
        return None
    text = text.strip()
    if text.startswith("```"):
        # Drop opening ```json line and closing ``` line
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    # Find balanced object
    start = text.find("{")
    if start == -1:
        return None
    depth, in_str, esc = 0, False, False
    for i in range(start, len(text)):
        c = text[i]
        if esc: esc = False; continue
        if c == "\\": esc = True; continue
        if c == '"': in_str = not in_str; continue
        if in_str: continue
        if c == "{": depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    return None


def call_llm(client, model, system, user, max_tokens=1500):
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": user}],
        temperature=0.1,
        max_tokens=max_tokens,
    )
    raw = resp.choices[0].message.content or ""
    js = extract_json(raw)
    if not js:
        return None
    try:
        return json.loads(js)
    except json.JSONDecodeError:
        return None


def load_kjv_book(book_slug):
    """KJV repo uses CamelCase slugs (1Corinthians, SongofSolomon)."""
    path = os.path.join(KJV_DIR, f"{book_slug}.json")
    if not os.path.exists(path):
        return None
    return json.load(open(path))


def all_book_slugs():
    """All 66 KJV book files."""
    files = glob.glob(os.path.join(KJV_DIR, "*.json"))
    return sorted(os.path.basename(f).replace(".json", "") for f in files)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


# ----------------------------------------------------------------------
# Validation
# ----------------------------------------------------------------------

def validate_red_letter(result, verses_by_num):
    """Drop segments whose `speech` substring isn't actually in the verse."""
    if not isinstance(result, dict) or "verses" not in result:
        return None
    cleaned = []
    for v in result.get("verses", []):
        vnum = v.get("verse")
        verse_text = verses_by_num.get(str(vnum), {}).get("text", "")
        segs = v.get("segments") or []
        kept = []
        for seg in segs:
            speech = (seg.get("speech") or "").strip()
            if speech and speech in verse_text:
                kept.append({
                    "intro": (seg.get("intro") or "").strip(),
                    "speech": speech,
                })
            else:
                # Fuzzy fallback: maybe model normalized whitespace
                speech_norm = " ".join(speech.split())
                text_norm = " ".join(verse_text.split())
                if speech_norm and speech_norm in text_norm:
                    # Find the actual substring in the original
                    # Simple: just use the normalized form
                    kept.append({"intro": (seg.get("intro") or "").strip(), "speech": speech_norm})
        if kept:
            cleaned.append({"verse": vnum, "segments": kept})
    return {"verses": cleaned} if cleaned else {"verses": []}


def validate_headings(result, max_verse):
    if not isinstance(result, dict) or "headings" not in result:
        return None
    cleaned = []
    seen = set()
    for h in result.get("headings", []):
        bv = h.get("before_verse")
        title = (h.get("title") or "").strip()
        if not isinstance(bv, int) or bv < 1 or bv > max_verse: continue
        if not title or len(title) > 80: continue
        if bv in seen: continue
        seen.add(bv)
        cleaned.append({"before_verse": bv, "title": title})
    cleaned.sort(key=lambda h: h["before_verse"])
    return {"headings": cleaned} if cleaned else None


# ----------------------------------------------------------------------
# Per-book runners
# ----------------------------------------------------------------------

def process_book_headings(book_slug, client, model, force, max_workers):
    kjv = load_kjv_book(book_slug)
    if not kjv: return 0, 0
    book_name = kjv.get("book", book_slug)
    out_path = os.path.join(HEADINGS_DIR, f"{book_slug}.json")
    existing = {}
    if os.path.exists(out_path) and not force:
        try: existing = json.load(open(out_path))
        except: existing = {}

    chapters = kjv.get("chapters", [])
    todo = []
    for ch in chapters:
        chnum = str(ch.get("chapter"))
        if chnum in existing and existing[chnum]: continue
        todo.append(ch)
    if not todo:
        return 0, len(chapters)

    def run(ch):
        chnum = str(ch.get("chapter"))
        verses = ch.get("verses", [])
        if not verses: return chnum, None
        user = headings_user_message(book_name, chnum, verses)
        result = call_llm(client, model, HEADINGS_SYSTEM, user, max_tokens=600)
        if not result: return chnum, None
        max_v = max(int(v["verse"]) for v in verses if str(v.get("verse","")).isdigit())
        cleaned = validate_headings(result, max_v)
        return chnum, cleaned

    new_count = 0
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {ex.submit(run, c): c for c in todo}
        with tqdm(total=len(futures), desc=f"  {book_name}", leave=False) as bar:
            for fut in as_completed(futures):
                chnum, cleaned = fut.result()
                if cleaned:
                    existing[chnum] = cleaned["headings"]
                    new_count += 1
                bar.update(1)
                if new_count and new_count % 5 == 0:
                    save_json(out_path, existing)
    save_json(out_path, existing)
    return new_count, len(chapters) - new_count


def process_book_red_letter(book_slug, client, model, force, max_workers):
    if book_slug not in RED_LETTER_BOOKS:
        return 0, 0
    kjv = load_kjv_book(book_slug)
    if not kjv: return 0, 0
    book_name = kjv.get("book", book_slug)
    out_path = os.path.join(RED_LETTER_DIR, f"{book_slug}.json")
    existing = {}
    if os.path.exists(out_path) and not force:
        try: existing = json.load(open(out_path))
        except: existing = {}

    chapters = kjv.get("chapters", [])
    todo = []
    for ch in chapters:
        chnum = str(ch.get("chapter"))
        if chnum in existing: continue  # presence (even empty list) means done
        todo.append(ch)
    if not todo:
        return 0, len(chapters)

    def run(ch):
        chnum = str(ch.get("chapter"))
        verses = ch.get("verses", [])
        if not verses: return chnum, {"verses": []}
        verses_by_num = {str(v["verse"]): v for v in verses}
        user = red_letter_user_message(book_name, chnum, verses)
        result = call_llm(client, model, RED_LETTER_SYSTEM, user, max_tokens=2000)
        if not result: return chnum, {"verses": []}
        cleaned = validate_red_letter(result, verses_by_num)
        return chnum, cleaned or {"verses": []}

    new_count = 0
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {ex.submit(run, c): c for c in todo}
        with tqdm(total=len(futures), desc=f"  {book_name}", leave=False) as bar:
            for fut in as_completed(futures):
                chnum, cleaned = fut.result()
                existing[chnum] = cleaned["verses"]
                new_count += 1
                bar.update(1)
                if new_count and new_count % 5 == 0:
                    save_json(out_path, existing)
    save_json(out_path, existing)
    return new_count, len(chapters) - new_count


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=("headings", "red-letter", "both"), default="both")
    p.add_argument("--book", help="Process only this book (e.g. Matthew)")
    p.add_argument("--model", default=os.environ.get("OVERLAY_MODEL", DEFAULT_MODEL))
    p.add_argument("--max-workers", type=int, default=6)
    p.add_argument("--force", action="store_true", help="Re-generate even if output exists")
    args = p.parse_args()

    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        sys.exit("Error: OPENROUTER_API_KEY required")
    client = OpenAI(api_key=key, base_url="https://openrouter.ai/api/v1")

    books = [args.book] if args.book else all_book_slugs()
    print(f"Model: {args.model}\nWorkers: {args.max_workers}\nBooks: {len(books)}\n")

    if args.mode in ("headings", "both"):
        print("--- HEADINGS ---")
        total_new = total_kept = 0
        for b in books:
            nnew, nkept = process_book_headings(b, client, args.model, args.force, args.max_workers)
            if nnew: print(f"  {b}: +{nnew} new, {nkept} kept")
            total_new += nnew; total_kept += nkept
        print(f"Total: {total_new} new chapters, {total_kept} kept.\n")

    if args.mode in ("red-letter", "both"):
        print("--- RED LETTER ---")
        total_new = total_kept = 0
        for b in books:
            nnew, nkept = process_book_red_letter(b, client, args.model, args.force, args.max_workers)
            if nnew: print(f"  {b}: +{nnew} new, {nkept} kept")
            total_new += nnew; total_kept += nkept
        print(f"Total: {total_new} new chapters, {total_kept} kept.")


if __name__ == "__main__":
    main()
