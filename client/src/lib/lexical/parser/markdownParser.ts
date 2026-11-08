/**
 * Markdown <-> Lexical parser with Mention support.
 *
 * Two layers:
 *   1. Pure string parsing (parseMarkdown) -> lightweight block/inline AST.
 *   2. Lexical bridge: $importMarkdown writes an AST into the editor root,
 *      $exportMarkdown serializes the current editor state back to markdown.
 *
 * Supported syntax:
 *   Blocks:  # to ###### headings, paragraphs, > quotes, - / * / + bullet lists,
 *            1. / 1) ordered lists, ``` fenced code blocks
 *   Inline:  **bold**, *italic* or _italic_, ~~strike~~, `code`, [text](url),
 *            @[Name](id) or @Name (mentions)
 */

import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  LexicalNode,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';
import {
  $createListItemNode,
  $createListNode,
  $isListNode,
} from '@lexical/list';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { $createLinkNode, $isLinkNode } from '@lexical/link';
import { $createMentionNode, $isMentionNode, MentionNode } from '../nodes/MentionNode';

/* -------------------------------------------------------------------------- */
/*  Patterns                                                                  */
/* -------------------------------------------------------------------------- */

// Groups:
// 1: code
// 2: bracket mention name, 3: bracket mention id
// 4: at mention name
// 5: bold
// 6: strike
// 7: italic (*)
// 8: italic (_)
// 9: link text, 10: link url
const INLINE_RE =
  /`([^`\n]+)`|@\[([^\]\n]+)\](?:\(([^)\s]+)\))?|(?<!\w)@([a-zA-Z0-9_\-.]+)|(?<!\\)\*\*([^*\n]+?)\*\*|(?<!\\)~~([^~\n]+?)~~|(?<!\\)\*([^*\n]+?)\*|(?<!\w)_([^_\n]+?)_(?!\w)|\[([^\]\n]+)\]\(([^)\s]+)\)/;

const FENCE_RE = /^```\s*([\w+#.-]*)\s*$/;
const FENCE_CLOSE_RE = /^```\s*$/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const UL_RE = /^\s*[-*+]\s+(.*)$/;
const OL_RE = /^\s*\d+[.)]\s+(.*)$/;

const isBlank = (line: string) => line.trim() === '';
const isBlockStart = (line: string) =>
  /^(```|#{1,6}\s|>|\s*[-*+]\s|\s*\d+[.)]\s)/.test(line);

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type InlineSegment =
  | { text: string; formats: string[] }
  | { link: string; children: InlineSegment[] }
  | { mention: string; mentionId?: string }
  | { lineBreak: true };

export type BlockAST =
  | { type: 'heading'; tag: HeadingTagType; inline: InlineSegment[] }
  | { type: 'paragraph'; inline: InlineSegment[] }
  | { type: 'quote'; inline: InlineSegment[] }
  | { type: 'code'; language: string; lines: string[] }
  | { type: 'list'; ordered: boolean; items: InlineSegment[][] };

/* -------------------------------------------------------------------------- */
/*  Inline parsing                                                            */
/* -------------------------------------------------------------------------- */

export function parseInline(text: string, formats: string[] = []): InlineSegment[] {
  const re = new RegExp(INLINE_RE.source, 'g');
  const out: InlineSegment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      out.push({ text: text.slice(last, match.index), formats });
    }

    const [
      whole,
      code,
      bracketMentionName,
      bracketMentionId,
      atMentionName,
      bold,
      strike,
      italic,
      underscoreItalic,
      linkText,
      url,
    ] = match;

    if (code !== undefined) {
      out.push({ text: code, formats: [...formats, 'code'] });
    } else if (bracketMentionName !== undefined) {
      out.push({
        mention: bracketMentionName,
        mentionId: bracketMentionId || undefined,
      });
    } else if (atMentionName !== undefined) {
      out.push({
        mention: atMentionName,
      });
    } else if (bold !== undefined) {
      out.push(...parseInline(bold, [...formats, 'bold']));
    } else if (strike !== undefined) {
      out.push(...parseInline(strike, [...formats, 'strikethrough']));
    } else if (italic !== undefined || underscoreItalic !== undefined) {
      out.push(
        ...parseInline(italic ?? underscoreItalic, [...formats, 'italic'])
      );
    } else if (linkText !== undefined && url !== undefined) {
      out.push({ link: url, children: parseInline(linkText, formats) });
    }

    last = match.index + whole.length;
  }

  if (last < text.length) {
    out.push({ text: text.slice(last), formats });
  }
  return out;
}

function inlineFromLines(lines: string[]): InlineSegment[] {
  return lines.flatMap((line, idx) => [
    ...(idx > 0 ? [{ lineBreak: true as const }] : []),
    ...parseInline(line),
  ]);
}

function rawFromLines(lines: string[]): InlineSegment[] {
  return lines.flatMap((line, idx) => [
    ...(idx > 0 ? [{ lineBreak: true as const }] : []),
    { text: line, formats: [] },
  ]);
}

/* -------------------------------------------------------------------------- */
/*  Block parsing (pure, no Lexical)                                          */
/* -------------------------------------------------------------------------- */

export function parseMarkdown(source: string): BlockAST[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: BlockAST[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i++;
      continue;
    }

    // Fenced code block
    const fence = line.match(FENCE_RE);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !FENCE_CLOSE_RE.test(lines[i])) {
        body.push(lines[i++]);
      }
      i++; // skip closing fence (or EOF)
      blocks.push({ type: 'code', language: fence[1] || '', lines: body });
      continue;
    }

    // Heading
    const heading = line.match(HEADING_RE);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({
        type: 'heading',
        tag: `h${level}` as HeadingTagType,
        inline: parseInline(heading[2]),
      });
      i++;
      continue;
    }

    // Blockquote (consecutive > lines)
    if (QUOTE_RE.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        const m = lines[i++].match(QUOTE_RE);
        if (m) quoted.push(m[1]);
      }
      blocks.push({ type: 'quote', inline: inlineFromLines(quoted) });
      continue;
    }

    // Lists (consecutive items of the same kind)
    const ordered = OL_RE.test(line);
    if (ordered || UL_RE.test(line)) {
      const itemRe = ordered ? OL_RE : UL_RE;
      const items: InlineSegment[][] = [];
      while (i < lines.length && itemRe.test(lines[i])) {
        const m = lines[i++].match(itemRe);
        if (m) items.push(parseInline(m[1]));
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // Paragraph
    const para: string[] = [line];
    i++;
    while (i < lines.length && !isBlank(lines[i]) && !isBlockStart(lines[i])) {
      para.push(lines[i++]);
    }
    blocks.push({ type: 'paragraph', inline: inlineFromLines(para) });
  }

  return blocks;
}

/* -------------------------------------------------------------------------- */
/*  Lexical bridge: markdown AST -> editor nodes                              */
/* -------------------------------------------------------------------------- */

function appendInline(parent: any, segments: InlineSegment[]) {
  for (const seg of segments) {
    if ('lineBreak' in seg && seg.lineBreak) {
      parent.append($createLineBreakNode());
    } else if ('mention' in seg) {
      const mentionNode = $createMentionNode(seg.mention, seg.mentionId);
      parent.append(mentionNode);
    } else if ('link' in seg) {
      const link = $createLinkNode(seg.link);
      appendInline(link, seg.children);
      parent.append(link);
    } else if ('text' in seg && seg.text) {
      const node = $createTextNode(seg.text);
      seg.formats.forEach((format: any) => node.toggleFormat(format));
      parent.append(node);
    }
  }
}

function blockToNode(block: BlockAST): LexicalNode | null {
  switch (block.type) {
    case 'heading': {
      const node = $createHeadingNode(block.tag);
      appendInline(node, block.inline);
      return node;
    }
    case 'paragraph': {
      const node = $createParagraphNode();
      appendInline(node, block.inline);
      return node;
    }
    case 'quote': {
      const node = $createQuoteNode();
      appendInline(node, block.inline);
      return node;
    }
    case 'code': {
      const node = $createCodeNode(block.language || undefined);
      appendInline(node, rawFromLines(block.lines));
      return node;
    }
    case 'list': {
      const list = $createListNode(block.ordered ? 'number' : 'bullet');
      for (const item of block.items) {
        const li = $createListItemNode();
        appendInline(li, item);
        list.append(li);
      }
      return list;
    }
    default:
      return null;
  }
}

/**
 * Replaces the editor root with the content of `markdown`.
 * Must be called inside editor.update().
 */
export function $importMarkdown(markdown: string) {
  const root = $getRoot();
  root.clear();

  for (const block of parseMarkdown(markdown ?? '')) {
    const node = blockToNode(block);
    if (node) root.append(node);
  }

  if (root.isEmpty()) {
    root.append($createParagraphNode());
  }
}

/* -------------------------------------------------------------------------- */
/*  Lexical bridge: editor nodes -> markdown                                  */
/* -------------------------------------------------------------------------- */

function wrapFormats(node: any): string {
  const text = node.getTextContent();
  if (!text) return '';
  if (node.hasFormat('code')) return `\`${text}\``;

  let out = text;
  if (node.hasFormat('strikethrough')) out = `~~${out}~~`;
  if (node.hasFormat('italic')) out = `*${out}*`;
  if (node.hasFormat('bold')) out = `**${out}**`;
  return out;
}

function inlineToMarkdown(node: any): string {
  return node
    .getChildren()
    .map((child: any) => {
      if ($isLineBreakNode(child)) return '\n';
      if ($isMentionNode(child)) {
        const mention = child as MentionNode;
        const name = mention.__mentionName;
        const id = mention.__mentionId;
        if (id) {
          return `@[${name}](${id})`;
        }
        return `@${name}`;
      }
      if ($isLinkNode(child)) return `[${inlineToMarkdown(child)}](${child.getURL()})`;
      if ($isTextNode(child)) return wrapFormats(child);
      if ($isElementNode(child)) return inlineToMarkdown(child);
      return '';
    })
    .join('');
}

function blockToMarkdown(node: any): string | null {
  if ($isHeadingNode(node)) {
    const level = Number(node.getTag().slice(1));
    return `${'#'.repeat(level)} ${inlineToMarkdown(node)}`;
  }

  if ($isQuoteNode(node)) {
    return inlineToMarkdown(node)
      .split('\n')
      .map((line: string) => `> ${line}`)
      .join('\n');
  }

  if ($isCodeNode(node)) {
    const lang = node.getLanguage() ?? '';
    return `\`\`\`${lang}\n${node.getTextContent()}\n\`\`\``;
  }

  if ($isListNode(node)) {
    const ordered = node.getListType() === 'number';
    return node
      .getChildren()
      .map((item: any, idx: number) => {
        const marker = ordered ? `${idx + 1}.` : '-';
        return `${marker} ${inlineToMarkdown(item)}`;
      })
      .join('\n');
  }

  if ($isElementNode(node)) {
    return inlineToMarkdown(node);
  }

  return null;
}

/**
 * Serializes the current editor root to markdown.
 * Must be called inside editor.read() / editor.update().
 */
export function $exportMarkdown(): string {
  return $getRoot()
    .getChildren()
    .map(blockToMarkdown)
    .filter((block: string | null) => block !== null && block.trim() !== '')
    .join('\n\n');
}

