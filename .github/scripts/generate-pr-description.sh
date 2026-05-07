#!/bin/bash
set -e

# Get diff and commits
git diff "$BASE_SHA"..."$HEAD_SHA" -- . \
  ':!package-lock.json' \
  ':!*.lock' \
  | head -c 8000 > /tmp/diff.txt

git log "$BASE_SHA"..."$HEAD_SHA" \
  --pretty=format:"- %s (%an)" \
  | head -50 > /tmp/commits.txt

# Build user message
USER_MSG=$(cat << EOF
Write a PR description using ONLY this format, no code blocks:

## 📋 Summary
Brief explanation of what this PR does and why.

## ✅ Changes
- Bullet list of what changed in plain English only.

## 🚀 Pre-deployment Tasks
Only include this section if .env.example was modified. List any new env variables needed before deploying. If no .env.example changes, skip this section entirely.

---
Commits:
$(cat /tmp/commits.txt)

Diff (context only, do not show in output):
$(cat /tmp/diff.txt)
EOF
)

# Build Gemini request payload
jq -n --arg msg "$USER_MSG" '{
  "contents": [
    {
      "parts": [
        {
          "text": $msg
        }
      ]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 1024,
    "temperature": 0.4
  },
  "systemInstruction": {
    "parts": [
      {
        "text": "You write clean GitHub PR descriptions in Markdown. Never include code blocks or raw code in the output."
      }
    ]
  }
}' > /tmp/final_prompt.json

# Call Gemini API
RESPONSE=$(curl -s \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/final_prompt.json)

echo "API Response: $RESPONSE"

# Extract description
DESCRIPTION=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text')

if [ "$DESCRIPTION" = "null" ] || [ -z "$DESCRIPTION" ]; then
  echo "Failed to generate description"
  exit 1
fi

# Update PR
gh pr edit "$PR_NUMBER" --body "$DESCRIPTION"
echo "PR description updated successfully!"