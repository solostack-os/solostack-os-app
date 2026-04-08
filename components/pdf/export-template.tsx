import React from "react";
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

export interface ExportTemplateProps {
  content: string;
  contentType: string;
  workspace: ExportWorkspaceData;
}

// React-PDF ships with Helvetica built in, so we avoid any network font
// fetches that would slow down or fail during server-side rendering.
Font.registerHyphenationCallback((word) => [word]);

const DEFAULT_PRIMARY = "#6c8cff";
const DEFAULT_SECONDARY = "#818cf8";
const INK = "#0f172a";
const INK_SOFT = "#475569";
const INK_FAINT = "#94a3b8";
const RULE = "#e2e8f0";

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
 * Split the raw generated text into "blocks" the template can render with
 * light styling. We don't attempt full markdown parsing — just the shapes
 * the workflows actually emit:
 *   - `---` horizontal rules between sections
 *   - lines ending in `:` (e.g. "Subject:", "Body:") are treated as headings
 *     when they sit on their own line
 *   - everything else is a paragraph, preserving line breaks
 */
type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "rule" };

function parseContent(raw: string): Block[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  const blocks: Block[] = [];

  // Split on horizontal rules first so sections render with visual separation.
  const sections = normalized.split(/\n\s*-{3,}\s*\n/);
  sections.forEach((section, sectionIdx) => {
    if (sectionIdx > 0) blocks.push({ kind: "rule" });

    const paragraphs = section.split(/\n{2,}/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Single-line that reads as a heading ("Subject:", "Next Steps", ...)
      const isSingleLine = !trimmed.includes("\n");
      const looksLikeHeading =
        isSingleLine &&
        trimmed.length <= 80 &&
        (trimmed.endsWith(":") || /^#{1,6}\s+/.test(trimmed));

      if (looksLikeHeading) {
        blocks.push({
          kind: "heading",
          text: trimmed.replace(/^#{1,6}\s+/, "").replace(/:$/, ""),
        });
      } else {
        blocks.push({ kind: "paragraph", text: trimmed });
      }
    }
  });

  return blocks;
}

export function ExportTemplate({ content, contentType, workspace }: ExportTemplateProps) {
  const primary = workspace.primary_color || DEFAULT_PRIMARY;
  const secondary = workspace.secondary_color || DEFAULT_SECONDARY;
  const showCompanyDetails = workspace.include_company_details !== false;
  const hasAnyCompanyDetail = Boolean(
    workspace.legal_name || workspace.cui || workspace.registration_number
  );
  const showHeaderDetails = showCompanyDetails && hasAnyCompanyDetail;
  const title = formatContentType(contentType);
  const blocks = parseContent(content);

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 11,
      color: INK,
      paddingTop: 48,
      paddingBottom: 72,
      paddingHorizontal: 56,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 18,
    },
    headerLeft: {
      flexDirection: "column",
      maxWidth: "55%",
    },
    logo: {
      width: 64,
      height: 64,
      objectFit: "contain",
      marginBottom: 6,
    },
    headerRight: {
      flexDirection: "column",
      alignItems: "flex-end",
      maxWidth: "45%",
    },
    legalName: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: INK,
      marginBottom: 2,
      textAlign: "right",
    },
    companyLine: {
      fontSize: 9,
      color: INK_SOFT,
      marginBottom: 1,
      textAlign: "right",
    },
    date: {
      fontSize: 9,
      color: INK_FAINT,
      marginTop: 4,
      textAlign: "right",
    },
    accentBar: {
      height: 3,
      flexDirection: "row",
      marginBottom: 28,
    },
    accentBarPrimary: { flex: 3, backgroundColor: primary },
    accentBarSecondary: { flex: 1, backgroundColor: secondary },
    title: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: INK,
      marginBottom: 20,
    },
    body: {
      flexDirection: "column",
    },
    heading: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: primary,
      marginTop: 14,
      marginBottom: 6,
    },
    paragraph: {
      fontSize: 11,
      lineHeight: 1.55,
      color: INK,
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
      left: 56,
      right: 56,
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
      width: 14,
      height: 14,
      objectFit: "contain",
      marginRight: 6,
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

  return (
    <Document title={title} author={workspace.legal_name ?? "SoloStack OS"}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {(workspace.logo_url || showHeaderDetails) && (
          <View style={styles.header}>
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
        )}

        {/* Accent bar */}
        <View style={styles.accentBar}>
          <View style={styles.accentBarPrimary} />
          <View style={styles.accentBarSecondary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Body */}
        <View style={styles.body}>
          {blocks.map((block, idx) => {
            if (block.kind === "rule") {
              return <View key={idx} style={styles.rule} />;
            }
            if (block.kind === "heading") {
              return (
                <Text key={idx} style={styles.heading}>
                  {block.text}
                </Text>
              );
            }
            return (
              <Text key={idx} style={styles.paragraph}>
                {block.text}
              </Text>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            {workspace.logo_url ? (
              /* eslint-disable-next-line jsx-a11y/alt-text */
              <Image style={styles.footerLogo} src={workspace.logo_url} />
            ) : null}
            <Text style={styles.footerText}>Generated with SoloStack OS</Text>
          </View>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
