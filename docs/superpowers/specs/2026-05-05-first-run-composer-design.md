# First-Run Composer — Design Spec

## Problem

New users with `has_generated = false` land on a passive dashboard. The current `ActivationPanel` shows 3 link cards but requires the user to navigate away, understand a workflow, and fill in fields before getting any value. Most users drop off before their first generation.

## Goal

Replace the passive activation panel with an interactive **First-Run Composer** that helps a new user create one useful LinkedIn post in under 60 seconds — without leaving the dashboard, choosing a workflow, or filling in Settings.

## Constraints

- No new DB columns or schema changes.
- No new workflows.
- No website scraping.
- No second generation call (refinement loop deferred to v1.5).
- No workflow picker — always generates a LinkedIn post.
- No credit special-casing.
- Normal navigation remains available at all times.
- Composer is not a modal or overlay — it renders inline above the dashboard.

---

## Architecture

### New files

| File | Purpose |
|------|---------|
| `components/ui/first-run-composer.tsx` | Self-contained stateful component — full flow from input to output |
| `app/api/infer-context/route.ts` | Authenticated API route — infers provisional business context from one sentence |

### Modified files

| File | Change |
|------|--------|
| `app/app/dashboard/page.tsx` | Replace `<ActivationPanel />` with `<FirstRunComposer />`, pass `workspaceId` |
| `components/ui/activation-panel.tsx` | Becomes unused (keep file, remove import from dashboard) |

### Unchanged

- `/api/runs/route.ts` — generation goes through the existing dispatch, which already handles `social_posts`, flips `has_generated`, and creates the run record.
- `/api/workspace/context/route.ts` — already supports partial upsert of `workspace_context` fields including `brand_notes`.
- `lib/workflows/marketing/social-posts.ts` — no changes. Business Context injection happens via the existing `buildContextPacket` layer.

---

## State Machine

The composer moves through 6 states:

```
input → inferring → confirm → editing → generating → output
```

| State | What renders | Transitions |
|-------|-------------|-------------|
| `input` | Headline, subcopy, structured input ("I help ___ do ___ without ___"), "Create first draft" button | → `inferring` on submit |
| `inferring` | Loading indicator: "Understanding your business..." | → `confirm` on success, → `editing` on failure |
| `confirm` | "I think you help [audience] with [offer] so they can [outcome]. Is this close?" + 3 buttons | "Yes" → `generating`, "Almost" → `editing` (pre-filled), "Not really" → `editing` (cleared) |
| `editing` | 3 editable fields pre-filled (or empty). "Create first draft" button | → `generating` on submit |
| `generating` | StreamingCard with live token output | → `output` when stream completes |
| `output` | Label + subcopy + final text + refinement CTA | Terminal state for this session |

---

## `/api/infer-context` Route

```
POST /api/infer-context
Content-Type: application/json

Request:  { "description": "I help solo consultants produce marketing without a team" }
Response: { "audience": "solo consultants", "offer": "marketing production", "outcome": "produce consistent marketing without hiring a team", "confidence": "high" }
```

### Implementation

- Authentication: `supabase.auth.getUser()` — same pattern as other routes.
- AI call: `callClaude` (non-streaming) from `lib/ai/providers/anthropic.ts`.
- Model: same `CLAUDE_MODEL` used by the rest of the app.
- Max tokens: 256 (response is short JSON).

### System prompt

```
You are helping infer a provisional business context from a short user description.

Input:
[USER_INPUT]

Return JSON only with:
{
  "audience": "...",
  "offer": "...",
  "outcome": "...",
  "confidence": "low|medium|high"
}

Rules:
- Do not invent specifics that are not reasonably implied.
- Keep each field short and plain (under 15 words each).
- If the input is vague, make the safest useful inference and set confidence to "low".
- Do not write marketing copy.
- Do not include explanations.
- Return ONLY the JSON object, no markdown, no code blocks.
```

### Error handling

On parse failure, network error, or any exception: return `{ audience: "", offer: "", outcome: "", confidence: "low" }`. The client transitions to `editing` state with empty fields so the user can fill them manually.

---

## Context Save Flow

When the user confirms (either "Yes" from `confirm` state or submits from `editing` state):

1. Build the context string:
   ```
   Audience: [audience]
   Offer / problem: [offer]
   Desired outcome: [outcome]
   ```

2. `PATCH /api/workspace/context` with:
   ```json
   {
     "target_audience": "[audience]",
     "offer": "[offer]",
     "brand_notes": "Audience: [audience]\nOffer / problem: [offer]\nDesired outcome: [outcome]"
   }
   ```
   This saves `audience` and `offer` into their dedicated fields AND preserves the full confirmed context (including outcome) in `brand_notes`.

3. **Await the PATCH response successfully** before proceeding to generation.

---

## Generation Flow

After context save succeeds:

1. Call `POST /api/runs` with:
   ```json
   {
     "module_key": "marketing",
     "workflow_key": "social_posts",
     "input_json": {
       "platform": "linkedin",
       "num_posts": 1,
       "topic": "Write a LinkedIn post based on this confirmed business context: I help [audience] with [offer] so they can [outcome]. Make it useful, specific, and non-generic."
     }
   }
   ```
   The topic includes the confirmed context as a fallback. The saved Business Context (via `buildContextPacket`) does the heavy lifting, but this prevents weak output if context injection fails or lags.

2. Stream the response using the same `fetch` + `ReadableStream` + ref-based text update pattern used by the marketing page (no React re-renders during streaming).

3. When the stream completes, transition to `output` state.

This is a real run — it costs credits, creates a run record, inserts an output, and flips `has_generated = true` (via the existing idempotent update in `route.ts`).

---

## UI Copy

### `input` state

**Headline:** Create your first useful asset in 60 seconds.

**Subcopy:** SoloStack works better when it knows what you actually do. Start with one sentence.

**Input:** Three inline fields in a sentence structure:
```
I help [___________] do [___________] without [___________]
```

**Button:** Create first draft

**Sub-note:** You can add more context later. For now, one honest sentence is enough.

### `inferring` state

Centered loading: "Understanding your business..."

### `confirm` state

"I think you help **[audience]** with **[offer]** so they can **[outcome]**. Is this close?"

Buttons:
- **Yes, create my first draft** (primary)
- **Almost — let me tweak it** (secondary)
- **Not really** (tertiary/text)

### `editing` state

Three fields:
- Who do you help? `[pre-filled or empty]`
- What do you help them do? `[pre-filled or empty]`
- What outcome do they want? `[pre-filled or empty]`

**Button:** Create first draft

### `generating` state

StreamingCard with live output.

### `output` state

**Label:** Your first LinkedIn draft

**Subcopy:** Generated from the business context you just confirmed.

**Output:** The generated post text with copy button.

**Refinement CTA:**
> Want sharper outputs next time?
>
> Add one real detail SoloStack should remember:
> *What problem do your clients complain about most before they buy?*
>
> `[input field]` `[Save]` `[Skip]`

**After save:**
> Saved to Business Context.
> Future outputs will start with more of what you actually know.

---

## Dashboard Integration

In `app/app/dashboard/page.tsx`:

- Replace `<ActivationPanel />` with `<FirstRunComposer workspaceId={workspaceId} />` inside the existing `{!hasGenerated && ...}` gate.
- The composer renders inline above the rest of the dashboard — not a modal, not an overlay.
- Normal navigation (sidebar, module links) remains available at all times.
- After `has_generated` flips (run completes), the composer stays visible for the current session (the user is viewing their output). On next dashboard load, `has_generated = true` → hero card renders instead.
- The `workspaceId` prop is needed so the composer can call `/api/runs` (which is workspace-scoped) without a redundant fetch.

---

## What is NOT in scope

- Website scraping / URL parsing
- Workflow picker in the composer
- Second generation call / refinement regeneration
- Credit special-casing or free runs
- New DB columns or schema changes
- Changes to Settings UI
- Changes to onboarding flow
- Smart context extraction or field mapping
- Anti-abuse logic
