---
name: google-workspace-agent-integration
description: Use when an AI agent needs Google Workspace via gws, APIs, rclone, or browser automation.
version: 1.0.0
author: Freedom Lab NYC
license: MIT
metadata:
  hermes:
    tags: [google-workspace, gws, gmail, drive, docs, sheets, calendar, meet, automation]
---

# Google Workspace Integration for AI Agents

A portable operating guide for connecting an AI agent to Gmail, Drive, Docs, Sheets, Calendar, Meet, and Workspace administration without baking one person's account, paths, IDs, or credentials into the workflow.

## Outcome

Use the smallest tool that can complete and verify the task:

| Need | Default tool | Use another tool when… |
|---|---|---|
| General Workspace API work | `gws` CLI | The operation needs precise API-specific logic or unsupported behavior. |
| Precise Docs/Sheets edits | Official Google API client | Range math, formatting, rich links, row insertion, or batch requests matter. |
| Large Drive folder copies | `rclone` | Use `gws` for metadata, small uploads, and API-native objects. |
| Gmail event triggers | Gmail `watch` + `history.list` | Polling is acceptable for a small, non-urgent workflow. |
| Meet attendance/captions | Dedicated browser identity + bounded automation | The Meet API can manage spaces/artifacts, but it does not replace an attendee. |
| Workspace organization settings | Admin console or Admin SDK | The setting is not exposed by an API or requires human administrator review. |
| API enablement | `gcloud services enable` | Use Cloud Console when CLI permissions are unavailable. |

## Primary tool: `gws`

[`googleworkspace/cli`](https://github.com/googleworkspace/cli) is the best general-purpose command surface we have used. It covers Workspace APIs through Google's Discovery Service, emits structured JSON, supports `--dry-run`, pagination, schema introspection, and bundled agent skills.

The project explicitly says it is **not an officially supported Google product** and is still pre-1.0. Pin a tested version for production automation.

### Install

```bash
# macOS or Linux with Homebrew
brew install googleworkspace-cli

# Cross-platform with Node.js 18+
npm install -g @googleworkspace/cli
```

### Authenticate

```bash
# One-time guided setup; requires gcloud
gws auth setup

# Later logins or narrower scope selection
gws auth login -s drive,gmail,sheets,docs,calendar

# Check state without exposing credentials
gws auth status
```

Do not run `gws auth export --unmasked` in an agent-visible log. Exported credentials are secrets.

### Discover commands instead of guessing

```bash
gws drive --help
gws schema drive.files.list
gws gmail --help
```

The CLI's command surface is generated dynamically. Inspect the live schema before writing unfamiliar requests.

### Read examples

```bash
# Drive metadata
gws drive files list \
  --params '{"pageSize":10,"fields":"files(id,name,mimeType,webViewLink)"}'

# Gmail message IDs
gws gmail users messages list \
  --params '{"userId":"me","maxResults":10,"q":"is:unread"}'

# Calendar events; include an explicit bounded window
gws calendar events list \
  --params '{"calendarId":"primary","timeMin":"2026-01-01T00:00:00Z","timeMax":"2026-01-08T00:00:00Z","singleEvents":true,"orderBy":"startTime"}'

# Sheets range; single quotes protect the ! from shell history expansion
gws sheets spreadsheets values get \
  --params '{"spreadsheetId":"SPREADSHEET_ID","range":"Sheet1!A1:D10"}'

# Fetch a Google Doc structure
gws docs documents get \
  --params '{"documentId":"DOCUMENT_ID"}'
```

### Upload example

```bash
gws drive files create \
  --json '{"name":"report.pdf"}' \
  --upload ./report.pdf
```

For write commands, use `--dry-run` when supported, review the resolved target and payload, then execute and read the result back.

## Agent operating contract

Apply this loop to every service:

1. **Confirm identity and scope.** Know which Google account, Cloud project, API scopes, and object IDs are in play. OAuth consent and API enablement are separate gates.
2. **Resolve the exact target.** Use stable IDs, not titles alone. Titles, names, and email subjects are not unique.
3. **Fetch current state.** Never overwrite a Doc, Sheet, Calendar event, or Drive folder from a stale local copy.
4. **Prepare the smallest mutation.** Preserve user-managed content, formatting, formulas, comments, review fields, and adjacent sections.
5. **Dry-run or render a diff.** Show the target, changed fields/ranges, and dedupe key before consequential writes.
6. **Apply once.** Make mutations idempotent. Store message IDs, event IDs, file IDs, hashes, or source URLs so retries do not duplicate work.
7. **Read back.** Verify the exact range, object, metadata, body, status, and link returned by Google.
8. **Verify the human surface when it matters.** API success does not prove the rendered Doc, Sheet, calendar, email draft, or Admin setting looks right.
9. **Return stable proof.** Report IDs/URLs and observable state, never tokens or raw credential files.

## Service playbooks

### Gmail

**Read/triage**

- Search narrowly with Gmail query syntax.
- List message IDs first; fetch full bodies only for relevant results.
- Preserve `messageId`, `threadId`, sender, subject, timestamp, and source query in downstream state.
- Treat quoted replies and signatures separately from new content when extracting facts.

**Draft/send**

- Default to creating a draft for review.
- Resolve recipients from an authoritative source.
- Before sending, display the exact recipient, subject, body, attachments, and thread target.
- Send only with explicit authorization or a pre-approved bounded policy.
- Read back the draft/sent message and verify thread placement.

**Event-driven inbox**

```text
Gmail users.watch
  → Pub/Sub notification containing a historyId
  → users.history.list from the last stored historyId
  → fetch only changed message IDs
  → idempotent processor
  → persist the new historyId
```

Renew `users.watch` before expiration and keep a bounded polling fallback. Pub/Sub is a wake-up signal, not the message payload. Never run an LLM over the entire inbox on every tick.

### Google Sheets

1. Read tab title, headers, numeric `sheetId`, target range, surrounding rows, formulas, and data validation.
2. Resolve duplicates through a stable identity column.
3. Use `values.update` for bounded cell changes.
4. Use `spreadsheets.batchUpdate` for row insertion, formatting, rich text, checkboxes, dimensions, or validation.
5. Copy existing formatting before writing values when adding a formatted row.
6. Read back exact rows and shifted section boundaries.

Avoid `values.append` on sparse or multi-section sheets unless the user truly wants the absolute table end. Google's table detection can choose the wrong placement.

### Google Docs

- Edit the existing Doc when one is already the working artifact.
- Fetch the current document structure immediately before editing.
- Use `documents.batchUpdate` for precise changes.
- Apply multiple text replacements from the bottom upward so earlier indices stay valid.
- Remember that Docs indices are UTF-16 code units, not Python character offsets.
- Preserve formatting and comments by making targeted requests; do not replace the entire body for a small change.
- Fetch the Doc again and verify text runs, links, styles, and section order.

Use a direct official Google API client when `gws` does not express the required range-level edit cleanly.

### Google Drive

**Small/API-native work:** use `gws` for search, metadata, permissions, Google-native file creation, and individual uploads.

**Large folder trees:** use `rclone` for retries, concurrency, resumability, and portable storage backends.

```bash
# Safer archive replication: local deletion does not delete remote files
rclone copy ./archive gdrive:Agent-Archive \
  --transfers 4 --checkers 8
```

Prefer `copy` to `sync` for archives unless remote deletion is explicitly intended. For a review handoff containing hundreds of small files, a verified ZIP can be much faster and easier to inspect than hundreds of Drive API calls.

After upload, list the destination, compare counts, and verify representative hashes or sizes where available.

### Google Calendar

- Use explicit ISO 8601 timestamps with a timezone offset or `Z`.
- Query a bounded time window and use `singleEvents=true` for expanded recurring instances when appropriate.
- Dedupe against source URL plus provider event/occurrence ID.
- Re-fetch immediately before RSVP or update.
- Change only owned fields. For an RSVP, preserve the rest of the event and update only the attendee's response.
- Read back the event ID, status, start/end, attendees, and `htmlLink`.

### Google Meet and transcripts

Treat these as separate capabilities:

1. **Calendar/API identity** for invitations, RSVP, Meet space settings, and transcript artifact discovery.
2. **Browser attendee identity** for actually joining a meeting and capturing live captions.

Use a dedicated browser profile/account, a transparent bot display name, explicit organizer rules, bounded join windows, and visible recording/transcription notice. Archive raw caption revisions before producing readable turns. A transcript delivery is complete only when its destination document is created and read back successfully.

### Workspace administration

First distinguish an organization setting from a user preference or document setting. Prefer the exact Admin console deep link plus the official Google Workspace Help page. Name the required administrator privilege and propagation delay. For identity, routing, security, retention, domain, or service-availability changes, confirm scope before mutating and verify the affected Workspace surface afterward.

### Slides and editable documents

Use the Slides API when the output must remain editable. Create content from structured source data, clone existing templates when preserving brand/layout matters, and verify rendered slides—not only API objects. For template documents, replace placeholders in a clone rather than rebuilding the file from extracted text.

## Authentication and security

### Use least privilege

- Request only the services and scopes required for the workflow.
- Separate identities/tokens for unrelated automations when practical.
- Use `drive.file` for apps that should access only files they create or that users explicitly open/share with that app.
- Use broader Drive scopes only when the workflow genuinely needs to enumerate existing Drive content.
- Service accounts are for server-to-server or administrator-delegated workflows; they are not a drop-in substitute for a human user's Drive OAuth identity.

### Protect credentials

- Keep OAuth client secrets, refresh tokens, service-account keys, and exported `gws` credentials outside Git.
- Use the OS keyring or a secret manager where possible.
- If a credential file is unavoidable, use an owner-only directory and mode `0600`.
- Never print token files, `gws auth export --unmasked`, authorization codes, cookies, or signed callback URLs into chat, logs, screenshots, docs, or commits.
- Revoke and rotate any credential that reaches a public artifact.

### Separate these failure classes

| Symptom | Likely cause |
|---|---|
| Login/consent fails | OAuth client, test-user, redirect, scope, or account issue |
| API returns `accessNotConfigured` / service disabled | API is not enabled in the Cloud project |
| API returns insufficient permission | Token lacks the required scope or user privilege |
| Object returns 404 | Wrong account, missing share, wrong ID, or deleted object |
| Browser works but API fails | Browser and API are authenticated as different identities |

Do not repeatedly re-run OAuth when the actual blocker is API enablement or object permissions.

## Boundaries outside core Workspace

Google Analytics, Search Console, Site Verification, and Cloud project administration require their own APIs, roles, and scopes. A working Gmail/Drive token does not imply access to them. Treat them as adjacent Google integrations, not automatic Workspace capabilities.

## Public-data redaction gate

Before publishing a reusable integration:

- Replace real names, emails, account IDs, chat IDs, document IDs, folder IDs, project IDs, event IDs, domains, file paths, and organization-specific labels with neutral placeholders.
- Remove raw payload samples copied from production.
- Search for OAuth tokens, refresh tokens, client secrets, API keys, cookies, signed URLs, and authorization headers.
- Check embedded image metadata and screenshots.
- Inspect the packaged archive, not only the source directory.
- Run a secret scanner and review the final Git diff.

## Official references

- [`gws` repository and documentation](https://github.com/googleworkspace/cli)
- [Google Workspace authentication overview](https://developers.google.com/workspace/guides/auth-overview)
- [Gmail push notifications](https://developers.google.com/workspace/gmail/api/guides/push)
- [Google Drive API overview](https://developers.google.com/workspace/drive/api/guides/about-sdk)
- [Google Docs API overview](https://developers.google.com/workspace/docs/api/how-tos/overview)
- [Google Sheets API concepts](https://developers.google.com/workspace/sheets/api/guides/concepts)
- [Google Calendar API overview](https://developers.google.com/workspace/calendar/api/guides/overview)
- [rclone Google Drive backend](https://rclone.org/drive/)

## Completion checklist

- [ ] Correct Google identity and scopes verified without exposing credentials.
- [ ] Exact target IDs resolved and current state fetched.
- [ ] Smallest mutation prepared and reviewed/dry-run.
- [ ] Dedupe/idempotency key recorded.
- [ ] Write executed once.
- [ ] API readback passed.
- [ ] Human-facing surface checked when formatting or UI matters.
- [ ] Stable ID/URL returned.
- [ ] Logs and artifacts contain no personal data or secrets.
