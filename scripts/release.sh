#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/release.sh <version> (e.g., 1.0.0, 1.0.1, 1.1.0, 2.0.0)"
  exit 1
fi

NEW_VERSION="$1"

# Validate semantic version format (e.g. 1.0.0, 1.2.3)
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version '$NEW_VERSION' does not match semantic versioning format (major.minor.patch, e.g. 1.0.0)"
  exit 1
fi

TAG="v$NEW_VERSION"
CURRENT_BRANCH=$(git branch --show-current)

echo "Updating pyproject.toml to version $NEW_VERSION..."
sed -i -E "s/^version = \".*\"/version = \"$NEW_VERSION\"/" pyproject.toml

echo "Running tests..."
if command -v poetry >/dev/null 2>&1; then
  poetry run python -m unittest discover -s tests
fi

git add pyproject.toml
git commit -m "chore(release): release $TAG"
git tag -a "$TAG" -m "Release $TAG"

echo ""
echo "Successfully tagged $TAG on branch ${CURRENT_BRANCH:-master}!"
echo "To publish this release to GitHub, run:"
echo "  git push origin ${CURRENT_BRANCH:-master} --tags"
