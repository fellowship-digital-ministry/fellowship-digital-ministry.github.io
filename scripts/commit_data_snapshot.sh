#!/usr/bin/env bash
# Commit a refreshed data directory and push it, used by the scheduled
# workflows after a data script has exited successfully.
#
#   scripts/commit_data_snapshot.sh <path> <commit message>
#
# Stages everything under <path> (modified, new and deleted files), commits
# only that path, and pushes. If the push is rejected because the branch
# moved (e.g. the local ingest pushed meanwhile), it rebases the commit onto
# the remote branch and tries again. A rebase conflict aborts and fails the
# job rather than publishing a merged guess.
#
# This replaces an earlier "git stash; git pull --rebase; git add; commit;
# git stash pop" sequence, which stashed the refreshed files before staging
# them: modified files were never committed, only brand-new ones were, and
# the real refresh was restored to the runner's working tree after the push.
#
# Environment: PUSH_REMOTE (origin), PUSH_BRANCH (main), PUSH_ATTEMPTS (3)
set -euo pipefail

DATA_PATH="${1:?usage: commit_data_snapshot.sh <path> <commit message>}"
MESSAGE="${2:?usage: commit_data_snapshot.sh <path> <commit message>}"
REMOTE="${PUSH_REMOTE:-origin}"
BRANCH="${PUSH_BRANCH:-main}"
ATTEMPTS="${PUSH_ATTEMPTS:-3}"

git add -A -- "$DATA_PATH"
if git diff --cached --quiet -- "$DATA_PATH"; then
  echo "No changes under $DATA_PATH; nothing to commit."
  exit 0
fi

git commit --quiet -m "$MESSAGE" --only -- "$DATA_PATH"
git show --stat --format='Committed %h: %s' HEAD

for ((attempt = 1; attempt <= ATTEMPTS; attempt++)); do
  if git push "$REMOTE" "HEAD:$BRANCH"; then
    echo "Pushed to $REMOTE/$BRANCH."
    exit 0
  fi
  echo "Push rejected (attempt $attempt/$ATTEMPTS); rebasing onto $REMOTE/$BRANCH."
  if ! git pull --rebase "$REMOTE" "$BRANCH"; then
    git rebase --abort 2>/dev/null || true
    echo "ERROR: rebase onto $REMOTE/$BRANCH conflicted; not pushing." >&2
    exit 1
  fi
done

echo "ERROR: could not push after $ATTEMPTS attempts." >&2
exit 1
