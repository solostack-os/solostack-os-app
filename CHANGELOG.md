# Changelog

## 2026-04-29 — Marketing OS v2.0

### New: VO Script Generator
- 6th workflow in Marketing OS — generates voiceover scripts with breath-paced structure and timing
- 6 format presets: Commercial Ad, Corporate Brand, Explainer, Radio Spot, Podcast Intro/Outro, Presentation
- 3 pace levels (Slow/Premium, Standard, Energetic) with automatic word count targeting based on duration
- Duration selector: 15s / 30s / 60s / 90s / Custom (5-300s)
- Direction notes toggle adds parenthetical cues — (pause), (emphasis), (slow), (crescendo)
- Outputs 3 variants with different narrative angles, each with word count, estimated duration, and in-range validation
- Full brand context integration via the existing Settings toggle

### Improved: Ad Copy Generator — platform-specific output formats
- **Google Ads**: Now outputs Responsive Search Ad (RSA) format — 15 headlines (30 char) + 4 descriptions (90 char) with per-line character counts and over-limit warnings
- **Facebook**: New Ad/Organic Post mode toggle. Ad mode outputs 3 angle-labeled variations with primary text, headline (40 char), and description (30 char). Organic mode outputs free-form engagement-optimized posts
- **Instagram**: 3 placement-specific variations — Feed (2200 char cap), Stories (card-by-card), Reels (hook-first) — plus a suggested hashtag block (5-10 tags)

### Improved: Input character limits recalibrated
- Brief/topic fields across all generators: raised to 2500 characters (from 300-600)
- Settings — Business Description: 1500 characters (was unlimited, now enforced with counter)
- Settings — Brand Voice: 1500 characters (was unlimited, now enforced with counter)
- Settings — Copy I admire: 1000 characters (was unlimited, now enforced with counter)
- Settings — Copy I avoid: 1000 characters (was unlimited, now enforced with counter)
- Character counter feedback thresholds now scale proportionally with field limits
- Backend validation added: briefs over 2600 characters are rejected at the API level

### Improved: Brand Voice anchor system
- Prompt labels upgraded to explicit steering language: "POSITIVE STYLISTIC ANCHORS — emulate the register, structure, and tone" / "NEGATIVE ANTI-PATTERNS — actively steer away from this register, vocabulary, and structure"
- Anti-examples hint in Settings redesigned as a visually prominent accent-colored callout emphasizing that anti-examples have higher steering impact than positive examples
