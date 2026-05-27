#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_URL="https://raw.githubusercontent.com/AlexGustafsson/systembolaget-api-data/main/data/stores.json"
SOURCE_API="https://api.github.com/repos/AlexGustafsson/systembolaget-api-data/commits?path=data/stores.json&per_page=1"
TMP_FILE="$(mktemp)"

cleanup() {
  rm -f "$TMP_FILE"
}
trap cleanup EXIT

curl -fsSL "$SOURCE_URL" -o "$TMP_FILE"

SOURCE_COMMIT="$(curl -fsSL "$SOURCE_API" | jq -r '.[0].sha')"
SOURCE_UPDATED_AT="$(curl -fsSL "$SOURCE_API" | jq -r '.[0].commit.committer.date')"
GENERATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

jq \
  --arg generatedAt "$GENERATED_AT" \
  --arg sourceCommit "$SOURCE_COMMIT" \
  --arg sourceUpdatedAt "$SOURCE_UPDATED_AT" \
  '{
    generatedAt: $generatedAt,
    source: {
      name: "AlexGustafsson/systembolaget-api-data",
      url: "https://github.com/AlexGustafsson/systembolaget-api-data",
      file: "data/stores.json",
      commit: $sourceCommit,
      sourceUpdatedAt: $sourceUpdatedAt,
      filter: "isAgent == false"
    },
    stores: [
      .[] | select(.isAgent == false) | {
        id: .siteId,
        name: (.displayName // .alias // "Systembolaget"),
        alias: (.alias // ""),
        address: (.streetAddress // .address // ""),
        city: (.city // ""),
        county: (.county // ""),
        lat: .position.latitude,
        lng: .position.longitude,
        mapLabel: ((.displayName // .alias // "Systembolaget") + ", " + (.city // ""))
      }
    ]
  }' "$TMP_FILE" > "$ROOT_DIR/data/systembolaget-stores.json"

jq '{stores:(.stores | length), source:.source.sourceUpdatedAt}' "$ROOT_DIR/data/systembolaget-stores.json"
