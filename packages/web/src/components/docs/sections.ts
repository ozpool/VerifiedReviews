/**
 * The white-paper outline. One entry per top-level section — the same list drives
 * the table of contents, the left sidebar, and the scroll-spy highlight, so they
 * can never drift apart. `id` is the anchor target; `label` is what the reader sees.
 */
export interface DocSection {
  id: string;
  label: string;
}

export const SECTIONS: DocSection[] = [
  { id: 'cover', label: 'Cover' },
  { id: 'contents', label: 'Table of Contents' },
  { id: 'summary', label: 'Executive Summary' },
  { id: 'introduction', label: 'Introduction' },
  { id: 'market', label: 'Market Opportunity' },
  { id: 'body', label: 'How It Works' },
  { id: 'edge-cases', label: 'Edge Cases & Failure Modes' },
  { id: 'team', label: 'Team & Governance' },
  { id: 'security', label: 'Security & Audit Status' },
  { id: 'business-model', label: 'Business Model' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'get-started', label: 'Get Started' },
  { id: 'references', label: 'References' },
  { id: 'appendix', label: 'Appendix' },
];
