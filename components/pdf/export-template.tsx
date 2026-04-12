import React from "react";
import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

/**
 * Data passed from the server to the PDF template. Column names match what
 * the API route pulls out of the workspaces row (see app/api/export/pdf/route.ts).
 */
export interface ExportWorkspaceData {
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  legal_name?: string | null;
  cui?: string | null;
  registration_number?: string | null;
  include_company_details?: boolean | null;
}

export type HeaderVariant = "dark" | "light";

export interface ExportTemplateProps {
  content: string;
  contentType: string;
  workspace: ExportWorkspaceData;
  /**
   * Header style to use. Defaults to "dark" — the API route picks "dark" when
   * the logo is light-toned and "light" when the logo is dark-toned so the
   * logo always reads clearly against the header background.
   */
  headerVariant?: HeaderVariant;
}

/**
 * Register Liberation Sans — a metrically identical Arial/Helvetica substitute
 * with full Latin + Latin Extended coverage. This ensures Romanian diacritics
 * (ă â î ș ț) and other non-ASCII Latin characters render correctly in PDFs.
 *
 * The TTF files live in /public/fonts/ so they're deployed as static assets
 * alongside the app. We use absolute file-system paths (via process.cwd()) so
 * this works in both local dev and the Vercel Node.js runtime.
 *
 * Helvetica (the react-pdf built-in) only covers Latin-1 and silently drops
 * any character outside that range, which is why diacritics were missing.
 */
const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "LiberationSans",
  fonts: [
    { src: path.join(FONTS_DIR, "LiberationSans-Regular.ttf"), fontWeight: "normal", fontStyle: "normal" },
    { src: path.join(FONTS_DIR, "LiberationSans-Bold.ttf"), fontWeight: "bold", fontStyle: "normal" },
    { src: path.join(FONTS_DIR, "LiberationSans-Italic.ttf"), fontWeight: "normal", fontStyle: "italic" },
    { src: path.join(FONTS_DIR, "LiberationSans-BoldItalic.ttf"), fontWeight: "bold", fontStyle: "italic" },
  ],
});

// Disable hyphenation so words aren't broken mid-word across lines.
Font.registerHyphenationCallback((word) => [word]);

const DEFAULT_PRIMARY = "#6c8cff";
const DEFAULT_SECONDARY = "#818cf8";
const INK = "#0f172a";
const INK_SOFT = "#475569";
const INK_FAINT = "#94a3b8";
const RULE = "#e2e8f0";

/** Header background + text palette keyed by variant. */
const HEADER_PALETTE = {
  dark: {
    background: "#0f1629",
    primaryText: "#ffffff",
    softText: "rgba(255,255,255,0.72)",
    faintText: "rgba(255,255,255,0.5)",
  },
  light: {
    background: "#f5f5f5",
    primaryText: INK,
    softText: INK_SOFT,
    faintText: INK_FAINT,
  },
} as const;

const PAGE_HORIZONTAL_PADDING = 56;

/** Human-readable label for the content type (e.g. "cold_email" → "Cold email"). */
function formatContentType(contentType: string): string {
  if (!contentType) return "Document";
  const spaced = contentType.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Today's date as "8 April 2026" — stable across locales we care about. */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Lightweight markdown parser for the subset the AI workflows actually emit.
 *
 * Block-level:
 *   `# … ######`   → headings (level 1-6)
 *   `---`          → horizontal rule
 *   `- item` / `* item` → list items (grouped into a single list block)
 *   blank lines    → paragraph boundaries
 *
 * Inline (within any text block):
 *   `**bold**`     → bold span
 *   `*italic*`     → italic span
 *
 * Legacy fallback: if a single-line paragraph is short (≤ 80 chars) and ends
 * with ":", render it as a heading. Several workflows emit "Subject:", "Body:",
 * "Next Steps:" etc. on their own line and we want those to stand out without
 * requiring every workflow prompt to adopt explicit `##` markdown.
 */

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string };

type Block =
  | { kind: "heading"; level: number; tokens: InlineToken[] }
  | { kind: "paragraph"; tokens: InlineToken[] }
  | { kind: "list"; items: InlineToken[][] }
  | { kind: "rule" };

/**
 * Split a line of text into inline tokens. Processes `**bold**` first, then
 * `*italic*` within non-bold segments, so italics nested inside bold stay as
 * literal text (we don't support nested emphasis and the workflows never emit
 * it). Unmatched stars pass through as plain text.
 */
function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];

  // split() with a capturing group returns alternating segments where odd
  // indices are the captured contents of the match.
  const boldParts = text.split(/\*\*(.+?)\*\*/g);
  for (let i = 0; i < boldParts.length; i++) {
    const part = boldParts[i];
    if (part === undefined || part === "") continue;

    if (i % 2 === 1) {
      tokens.push({ type: "bold", value: part });
      continue;
    }

    // Non-bold segment — scan for *italic*. We use a character class that
    // forbids `*` inside, which keeps us away from `**` boundaries.
    const italicParts = part.split(/\*([^*\n]+?)\*/g);
    for (let j = 0; j < italicParts.length; j++) {
      const ipart = italicParts[j];
      if (ipart === undefined || ipart === "") continue;
      if (j % 2 === 1) {
        tokens.push({ type: "italic", value: ipart });
      } else {
        tokens.push({ type: "text", value: ipart });
      }
    }
  }

  // Fallback for the rare case nothing matched and we produced nothing
  // (e.g. input was only whitespace).
  if (tokens.length === 0 && text.length > 0) {
    tokens.push({ type: "text", value: text });
  }

  return tokens;
}

function parseContent(raw: string): Block[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const blocks: Block[] = [];

  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length === 0) return;
    const wasSingleLine = paragraphBuffer.length === 1;
    const joined = paragraphBuffer.join(" ").trim();
    paragraphBuffer = [];
    if (!joined) return;

    // Legacy colon-heading heuristic: short single-line paragraph ending
    // in ":" renders as a level-3 heading. See notes on parser above.
    if (wasSingleLine && joined.length <= 80 && joined.endsWith(":")) {
      blocks.push({
        kind: "heading",
        level: 3,
        tokens: parseInline(joined.replace(/:$/, "")),
      });
      return;
    }

    blocks.push({ kind: "paragraph", tokens: parseInline(joined) });
  }

  function flushList() {
    if (listBuffer.length === 0) return;
    const items = listBuffer.map((item) => parseInline(item));
    listBuffer = [];
    blocks.push({ kind: "list", items });
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Blank line — close the current paragraph/list.
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Horizontal rule.
    if (/^-{3,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "rule" });
      continue;
    }

    // Markdown heading — `#` through `######`.
    const headingMatch = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        level: headingMatch[1].length,
        tokens: parseInline(headingMatch[2]),
      });
      continue;
    }

    // List item — `- foo` or `* foo` (the space after the marker is required
    // so we don't accidentally eat `*italic*` lines).
    const listMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    if (listMatch) {
      flushParagraph();
      listBuffer.push(listMatch[1]);
      continue;
    }

    // Anything else continues the current paragraph. If we were mid-list,
    // close it first.
    flushList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks;
}

export function ExportTemplate({
  content,
  contentType,
  workspace,
  headerVariant,
}: ExportTemplateProps) {
  const primary = workspace.primary_color || DEFAULT_PRIMARY;
  const secondary = workspace.secondary_color || DEFAULT_SECONDARY;
  const showCompanyDetails = workspace.include_company_details !== false;
  const hasAnyCompanyDetail = Boolean(
    workspace.legal_name || workspace.cui || workspace.registration_number
  );
  const showHeaderDetails = showCompanyDetails && hasAnyCompanyDetail;
  const showHeader = Boolean(workspace.logo_url) || showHeaderDetails;
  const title = formatContentType(contentType);
  const blocks = parseContent(content);

  // Default to "dark" so the output looks deliberate when the brightness
  // check can't run (missing logo, fetch failure, etc.).
  const variant: HeaderVariant = headerVariant ?? "dark";
  const palette = HEADER_PALETTE[variant];

  // Top breathing room that should appear at the start of EVERY page after
  // a break. Set as Page.paddingTop so react-pdf applies it automatically
  // when content wraps onto a new page. On page 1 we compensate with a
  // negative marginTop on the `topSection` wrapper so the header band still
  // reaches the very top edge instead of sitting inside the padding.
  const PAGE_TOP_PADDING = 48;

  const styles = StyleSheet.create({
    page: {
      fontFamily: "LiberationSans",
      fontSize: 11,
      color: INK,
      paddingTop: PAGE_TOP_PADDING,
      // Reserves space for the absolutely-positioned footer. The 70pt footer
      // logo + 10pt paddingTop + 1pt borderTop = ~81pt of footer height, and
      // the footer is anchored at `bottom: 36`, so the body content area must
      // end at least 36 + 81 ≈ 117pt from the bottom to avoid overlap.
      paddingBottom: 120,
      paddingHorizontal: 0,
    },
    // Page-1-only wrapper around the header band + accent bar. The negative
    // marginTop equals Page.paddingTop so the section slides up to y=0.
    // This View only renders once (no `fixed`), so on pages 2+ the body
    // content continues at Page.paddingTop from the top as intended.
    topSection: {
      marginTop: -PAGE_TOP_PADDING,
    },
    // Full-bleed header band. Horizontal padding lives here (not on the
    // Page) so the background colour can span edge-to-edge. Vertical padding
    // is kept tight so the band hugs the 160pt logo rather than floating
    // in a tall empty band.
    headerBand: {
      backgroundColor: palette.background,
      paddingTop: 16,
      paddingBottom: 12,
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    headerLeft: {
      flexDirection: "column",
      maxWidth: "55%",
    },
    logo: {
      width: 160,
      height: 160,
      objectFit: "contain",
    },
    headerRight: {
      flexDirection: "column",
      alignItems: "flex-end",
      maxWidth: "45%",
    },
    legalName: {
      fontSize: 10,
      fontFamily: "LiberationSans", fontWeight: "bold",
      color: palette.primaryText,
      marginBottom: 2,
      textAlign: "right",
    },
    companyLine: {
      fontSize: 9,
      color: palette.softText,
      marginBottom: 1,
      textAlign: "right",
    },
    date: {
      fontSize: 9,
      color: palette.faintText,
      marginTop: 4,
      textAlign: "right",
    },
    // Accent bar sits flush under the header, full-width.
    accentBar: {
      height: 3,
      flexDirection: "row",
    },
    accentBarPrimary: { flex: 3, backgroundColor: primary },
    accentBarSecondary: { flex: 1, backgroundColor: secondary },
    // Main content has its own horizontal padding.
    content: {
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      paddingTop: showHeader ? 32 : 48,
    },
    title: {
      fontSize: 18,
      fontFamily: "LiberationSans", fontWeight: "bold",
      color: INK,
      marginBottom: 20,
    },
    body: {
      flexDirection: "column",
    },
    h1: {
      fontSize: 15,
      fontFamily: "LiberationSans", fontWeight: "bold",
      color: primary,
      marginTop: 16,
      marginBottom: 8,
    },
    h2: {
      fontSize: 13,
      fontFamily: "LiberationSans", fontWeight: "bold",
      color: primary,
      marginTop: 14,
      marginBottom: 7,
    },
    h3: {
      fontSize: 12,
      fontFamily: "LiberationSans", fontWeight: "bold",
      color: primary,
      marginTop: 12,
      marginBottom: 6,
    },
    paragraph: {
      fontSize: 11,
      lineHeight: 1.55,
      color: INK,
      marginBottom: 10,
    },
    bold: {
      fontFamily: "LiberationSans", fontWeight: "bold",
    },
    italic: {
      fontFamily: "LiberationSans", fontStyle: "italic",
    },
    listItem: {
      flexDirection: "row",
      marginBottom: 4,
      paddingLeft: 6,
    },
    bullet: {
      width: 12,
      fontSize: 11,
      lineHeight: 1.55,
      color: primary,
    },
    listItemText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 1.55,
      color: INK,
    },
    listGroup: {
      marginBottom: 10,
    },
    rule: {
      height: 1,
      backgroundColor: RULE,
      marginVertical: 16,
    },
    footer: {
      position: "absolute",
      bottom: 36,
      left: PAGE_HORIZONTAL_PADDING,
      right: PAGE_HORIZONTAL_PADDING,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: RULE,
      paddingTop: 10,
    },
    footerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    footerLogo: {
      width: 70,
      height: 70,
      objectFit: "contain",
      marginRight: 10,
    },
    footerText: {
      fontSize: 8,
      color: INK_FAINT,
    },
    pageNumber: {
      fontSize: 8,
      color: INK_FAINT,
    },
  });

  /**
   * Render an array of inline tokens as react-pdf children. Bold and italic
   * tokens become nested <Text> elements with overriding fontFamily — that's
   * the only way react-pdf supports in-line style changes within a text flow.
   * Plain text passes through as a fragment so mixed string/element children
   * render correctly. Defined inside the component so it captures `styles`.
   */
  function renderInline(
    tokens: InlineToken[],
    keyPrefix: string | number
  ): React.ReactNode[] {
    return tokens.map((tok, i) => {
      const key = `${keyPrefix}-${i}`;
      if (tok.type === "bold") {
        return (
          <Text key={key} style={styles.bold}>
            {tok.value}
          </Text>
        );
      }
      if (tok.type === "italic") {
        return (
          <Text key={key} style={styles.italic}>
            {tok.value}
          </Text>
        );
      }
      return <React.Fragment key={key}>{tok.value}</React.Fragment>;
    });
  }

  return (
    <Document title={title} author={workspace.legal_name ?? "SoloStack OS"}>
      <Page size="A4" style={styles.page}>
        {/* Page-1 top section (header band + accent bar). Wrapped in a
            View with a negative marginTop so it pulls itself up out of the
            Page's paddingTop area and reaches the top edge. Because this
            wrapper renders in normal flow (not `fixed`), it only exists on
            page 1 — pages 2+ start their content at Page.paddingTop, giving
            the breathing room we want after a page break. */}
        <View style={styles.topSection}>
          {/* Header band (full-bleed) */}
          {showHeader && (
            <View style={styles.headerBand}>
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  {workspace.logo_url ? (
                    /* eslint-disable-next-line jsx-a11y/alt-text */
                    <Image style={styles.logo} src={workspace.logo_url} />
                  ) : null}
                </View>
                {showHeaderDetails && (
                  <View style={styles.headerRight}>
                    {workspace.legal_name ? (
                      <Text style={styles.legalName}>{workspace.legal_name}</Text>
                    ) : null}
                    {workspace.cui ? (
                      <Text style={styles.companyLine}>CUI: {workspace.cui}</Text>
                    ) : null}
                    {workspace.registration_number ? (
                      <Text style={styles.companyLine}>
                        Reg. No: {workspace.registration_number}
                      </Text>
                    ) : null}
                    <Text style={styles.date}>{formatDate(new Date())}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Accent bar — same in both variants */}
          <View style={styles.accentBar}>
            <View style={styles.accentBarPrimary} />
            <View style={styles.accentBarSecondary} />
          </View>
        </View>

        {/* Content wrapper with horizontal padding */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.body}>
            {blocks.map((block, idx) => {
              if (block.kind === "rule") {
                return <View key={idx} style={styles.rule} />;
              }

              if (block.kind === "heading") {
                const headingStyle =
                  block.level === 1
                    ? styles.h1
                    : block.level === 2
                    ? styles.h2
                    : styles.h3;
                return (
                  <Text key={idx} style={headingStyle}>
                    {renderInline(block.tokens, idx)}
                  </Text>
                );
              }

              if (block.kind === "list") {
                return (
                  <View key={idx} style={styles.listGroup}>
                    {block.items.map((itemTokens, itemIdx) => (
                      <View key={itemIdx} style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.listItemText}>
                          {renderInline(itemTokens, `${idx}-${itemIdx}`)}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              }

              return (
                <Text key={idx} style={styles.paragraph}>
                  {renderInline(block.tokens, idx)}
                </Text>
              );
            })}
          </View>
        </View>

        {/* Footer — absolutely positioned, unchanged */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            {workspace.logo_url ? (
              /* eslint-disable-next-line jsx-a11y/alt-text */
              <Image style={styles.footerLogo} src={workspace.logo_url} />
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={styles.footerText}>Generated with SoloStack.io</Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}
