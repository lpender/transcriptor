# 005 — MCP ingests script text in the paste format; files never cross MCP

- Date: 2026-09-30
- Status: Accepted (decided by the loop; Lee may overrule)

## Context

Scripts arrive as PDFs, photos and docs, each with its own extraction
quirks. The user's AI can read all of them. See `docs/design/mcp-ingest.md`.

## Decision

The MCP server takes script text in the app's one format (`NAME: speech`
per line, `***` breaks), validates it hard and reports speakers with line
counts. PDFs are converted by the user's AI, never on the server. Sound
files go through the web UI; MCP only assigns them to scenes. Remote MCP
on the API Worker; OAuth 2.1 for claude.ai, bearer tokens for CLIs.

## Alternatives rejected

- Server-side PDF parsing — every script differs; `convert.py` is one
  PDF's fixes, not a parser.
- Base64 audio over MCP — an AI has no audio files to send.
- Token-in-URL for claude.ai — leaks in logs; OAuth is what connectors expect.

## Consequences

- One parser (`parseScript`) serves paste and MCP.
- `convert.py` stays as this show's tool, not product code.
- An OAuth spike is queued before the build.
