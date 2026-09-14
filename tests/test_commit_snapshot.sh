#!/usr/bin/env bash
# Reproducible check of the data-refresh commit logic, against throwaway
# local git repositories (no network, nothing pushed anywhere real).
#
#   bash tests/test_commit_snapshot.sh
#
# Case 1 reproduces the old workflow step and shows it drops modified files.
# The other cases exercise scripts/commit_data_snapshot.sh.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT/scripts/commit_data_snapshot.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.invalid
export GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.invalid

fails=0
pass() { echo "ok   - $1"; }
fail() { echo "FAIL - $1"; fails=$((fails + 1)); }

# A bare "origin" with stats + two book files, and a fresh clone of it.
setup() {
  rm -rf "$WORK/case" && mkdir -p "$WORK/case"
  git init -q --bare -b main "$WORK/case/origin.git"
  git clone -q "$WORK/case/origin.git" "$WORK/case/runner" 2>/dev/null
  cd "$WORK/case/runner"
  git checkout -q -b main 2>/dev/null || true
  mkdir -p data/books
  echo '{"v":1}' > data/stats.json
  echo '{"v":1}' > data/books/Genesis.json
  echo '{"v":1}' > data/books/Obsolete.json
  git add -A && git commit -qm init && git push -q origin main
}

# What a successful refresh does to the working tree: modify, add, delete.
refresh() {
  echo '{"v":2}' > data/stats.json
  echo '{"v":2}' > data/books/Genesis.json
  echo '{"v":2}' > data/books/Jude.json
  rm data/books/Obsolete.json
}

remote_file() { git --git-dir="$WORK/case/origin.git" show "main:$1" 2>/dev/null || echo MISSING; }

# --- Case 1: the previous workflow step (verbatim logic) -----------------
setup; refresh
{
  git stash
  git pull --rebase origin main
  git add data
  if git diff --staged --quiet; then echo "No changes to commit"; else git commit -m "Update"; git push; fi
  git stash list | grep -q "stash" && git stash pop || echo "No stashed changes"
} >/dev/null 2>&1 || true
if [[ "$(remote_file data/stats.json)" == '{"v":1}' && "$(remote_file data/books/Jude.json)" == '{"v":2}' ]]; then
  pass "old workflow step reproduced: new file pushed, modified stats/books left out of the commit"
else
  fail "old workflow step did not behave as the audit described"
fi

# --- Case 2: new script publishes the complete refresh -------------------
setup; refresh
bash "$SCRIPT" data "Update data" >/dev/null
if [[ "$(remote_file data/stats.json)" == '{"v":2}' && "$(remote_file data/books/Genesis.json)" == '{"v":2}' \
   && "$(remote_file data/books/Jude.json)" == '{"v":2}' && "$(remote_file data/books/Obsolete.json)" == MISSING ]]; then
  pass "new script commits modified, added and deleted files together"
else
  fail "new script did not publish the complete refresh"
fi
[[ -z "$(git status --porcelain)" ]] && pass "runner working tree clean after push" || fail "runner left changes behind"

# --- Case 3: no changes -> no commit, exit 0 -----------------------------
setup
before="$(git rev-parse HEAD)"
if bash "$SCRIPT" data "Update data" >/dev/null && [[ "$(git --git-dir="$WORK/case/origin.git" rev-parse main)" == "$before" ]]; then
  pass "no-op refresh creates no commit"
else
  fail "no-op refresh committed or failed"
fi

# --- Case 4: remote moved on unrelated files -> rebase and push ----------
setup
git clone -q "$WORK/case/origin.git" "$WORK/case/other" 2>/dev/null
( cd "$WORK/case/other" && echo catalog > catalog.json && git add catalog.json && git commit -qm catalog && git push -q origin main )
refresh
if bash "$SCRIPT" data "Update data" >/dev/null 2>&1 \
   && [[ "$(remote_file catalog.json)" == catalog && "$(remote_file data/stats.json)" == '{"v":2}' ]]; then
  pass "rejected push is rebased onto the moved branch and retried"
else
  fail "push after remote moved did not succeed"
fi

# --- Case 5: remote changed the same file -> fail, publish nothing -------
setup
git clone -q "$WORK/case/origin.git" "$WORK/case/other" 2>/dev/null
( cd "$WORK/case/other" && echo '{"v":"other"}' > data/stats.json && git commit -qam other && git push -q origin main )
refresh
if bash "$SCRIPT" data "Update data" >/dev/null 2>&1; then
  fail "conflicting refresh reported success"
else
  if [[ "$(remote_file data/stats.json)" == '{"v":"other"}' && ! -d .git/rebase-merge && ! -d .git/rebase-apply ]]; then
    pass "conflict fails the job, leaves remote untouched and aborts the rebase"
  else
    fail "conflict left a half-finished rebase or changed the remote"
  fi
fi

echo
if (( fails )); then echo "$fails check(s) failed"; exit 1; fi
echo "all commit-snapshot checks passed"
