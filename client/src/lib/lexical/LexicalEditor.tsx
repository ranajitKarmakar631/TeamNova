import React, { useEffect, useMemo, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import {
  $createParagraphNode,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  EditorState,
  KEY_DOWN_COMMAND,
  Klass,
  LexicalNode,
} from 'lexical';

import Toolbar from './components/Toolbar';
import { MentionNode } from './nodes/MentionNode';
import { MentionsPlugin, MentionUser } from './plugins/MentionsPlugin';
import { $importMarkdown, $exportMarkdown } from './parser/markdownParser';
import './LexicalEditor.css';

const theme = {
  paragraph: 'lx-p',
  heading: {
    h1: 'lx-h1',
    h2: 'lx-h2',
    h3: 'lx-h3',
    h4: 'lx-h4',
    h5: 'lx-h5',
    h6: 'lx-h6',
  },
  quote: 'lx-quote',
  list: {
    ul: 'lx-ul',
    ol: 'lx-ol',
    listitem: 'lx-li',
  },
  code: 'lx-code',
  link: 'lx-link',
  text: {
    bold: 'lx-bold',
    italic: 'lx-italic',
    strikethrough: 'lx-strike',
    underline: 'lx-underline',
    code: 'lx-inline-code',
  },
};

// Every node type the editor can contain. Must be registered up front.
const NODES: Array<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  LinkNode,
  MentionNode,
];

export type LexicalValue = any;

export function isLexicalJsonObject(val: unknown): val is Record<string, any> {
  return typeof val === 'object' && val !== null && 'root' in val;
}

export function isLexicalStateEmpty(val: any): boolean {
  if (!val) return true;
  if (typeof val === 'string') return val.trim().length === 0;
  if (typeof val === 'object') {
    const root = val.root || val;
    if (!root || !root.children || root.children.length === 0) return true;
    if (root.children.length === 1) {
      const firstChild = root.children[0];
      if (!firstChild.children || firstChild.children.length === 0) return true;
      if (
        firstChild.children.length === 1 &&
        firstChild.children[0].type === 'text' &&
        !firstChild.children[0].text?.trim()
      ) {
        return true;
      }
    }
  }
  return false;
}

export function extractMentionsFromLexicalState(val: any): string[] {
  if (!val || typeof val !== 'object') return [];
  const mentionIds: string[] = [];

  const traverse = (node: any) => {
    if (!node) return;
    if (node.type === 'mention' && (node.mentionId || node.__mentionId)) {
      mentionIds.push(node.mentionId || node.__mentionId);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  };

  traverse(val.root || val);
  return Array.from(new Set(mentionIds));
}

export function extractPlainTextFromLexical(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;

  const pieces: string[] = [];
  const traverse = (node: any) => {
    if (!node) return;
    if (node.text && typeof node.text === 'string') {
      pieces.push(node.text);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  };

  traverse(val.root || val);
  return pieces.join(' ').trim();
}

interface SyncPluginProps {
  value: LexicalValue;
  readOnly: boolean;
  syncRef: React.MutableRefObject<string | null>;
}

/**
 * Pushes external `value` into the editor when it differs from what the
 * editor last reported. Handles:
 * - Native Lexical JSON AST object ({ root: { children: [...] } })
 * - Stringified Lexical JSON ('{"root": ...}')
 * - Markdown / plain text string
 * - Empty / null reset
 */
function SyncPlugin({ value, readOnly, syncRef }: SyncPluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const serializedKey =
      value == null
        ? ''
        : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

    if (serializedKey === syncRef.current) return;
    syncRef.current = serializedKey;

    if (!value || (typeof value === 'string' && !value.trim())) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const p = $createParagraphNode();
        root.append(p);
      });
      return;
    }

    // 1. Native Lexical JSON Object { root: ... }
    if (isLexicalJsonObject(value)) {
      try {
        const parsed = editor.parseEditorState(JSON.stringify(value));
        editor.setEditorState(parsed);
        return;
      } catch (e) {
        console.warn('[LexicalEditor] Error parsing JSON AST object:', e);
      }
    }

    // 2. Stringified Lexical JSON
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('{') && trimmed.includes('"root"')) {
        try {
          const parsed = editor.parseEditorState(trimmed);
          editor.setEditorState(parsed);
          return;
        } catch {
          // Fall through to markdown parser
        }
      }

      // 3. Markdown / plain text string
      editor.update(() => $importMarkdown(value));
    }
  }, [editor, value, syncRef]);

  useEffect(() => {
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  return null;
}

interface ChangePluginProps {
  onChange?: (val: any) => void;
  outputFormat?: 'json' | 'markdown';
  syncRef: React.MutableRefObject<string | null>;
}

/** Serializes editor state to JSON object or markdown and reports changes upward. */
function ChangePlugin({
  onChange,
  outputFormat = 'markdown',
  syncRef,
}: ChangePluginProps): React.ReactElement {
  return (
    <OnChangePlugin
      ignoreSelectionChange
      onChange={(editorState: EditorState) => {
        if (!onChange) return;
        if (outputFormat === 'json') {
          const json = editorState.toJSON();
          const serialized = JSON.stringify(json);
          if (serialized === syncRef.current) return;
          syncRef.current = serialized;
          onChange(json);
        } else {
          const markdown = editorState.read(() => $exportMarkdown());
          if (markdown === syncRef.current) return;
          syncRef.current = markdown;
          onChange(markdown);
        }
      }}
    />
  );
}

function KeyboardShortcutsPlugin({
  onSubmitShortcut,
}: {
  onSubmitShortcut?: () => void;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onSubmitShortcut) return;
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          onSubmitShortcut();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onSubmitShortcut]);

  return null;
}

export interface LexicalEditorProps {
  value?: LexicalValue;
  onChange?: (val: any) => void;
  outputFormat?: 'json' | 'markdown';
  placeholder?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
  className?: string;
  mentionOptions?: MentionUser[];
  onSubmitShortcut?: () => void;
}

/**
 * LexicalEditor
 *
 * @param value             Lexical JSON AST object, stringified JSON, or Markdown string.
 * @param onChange          Called with the updated content (Lexical JSON AST or Markdown).
 * @param outputFormat      'json' (Lexical AST object) or 'markdown' (default 'markdown').
 * @param placeholder       Placeholder text when empty.
 * @param readOnly          Disables editing and hides the toolbar.
 * @param showToolbar       Show the formatting toolbar (default true).
 * @param className         Extra class for wrapper.
 * @param mentionOptions    List of users for the @mention popup menu.
 * @param onSubmitShortcut  Triggered on Ctrl+Enter (or Cmd+Enter).
 */
export default function LexicalEditor({
  value = '',
  onChange,
  outputFormat = 'markdown',
  placeholder = 'Start writing…',
  readOnly = false,
  showToolbar = true,
  className = '',
  mentionOptions = [],
  onSubmitShortcut,
}: LexicalEditorProps): React.ReactElement {
  const syncRef = useRef<string | null>(null);

  const initialConfig = useMemo(
    () => ({
      namespace: 'LexicalEditor',
      theme,
      nodes: NODES,
      editable: !readOnly,
      onError: (error: Error) => console.error('[LexicalEditor]', error),
    }),
    [readOnly],
  );

  return (
    <div className={`lx-root ${readOnly ? 'lx-readonly' : ''} ${className}`.trim()}>
      <LexicalComposer initialConfig={initialConfig}>
        {showToolbar && !readOnly && <Toolbar />}

        <div className="lx-body">
          <RichTextPlugin
            contentEditable={<ContentEditable className="lx-content" />}
            placeholder={<div className="lx-placeholder">{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MentionsPlugin options={mentionOptions} />
          <SyncPlugin value={value} readOnly={readOnly} syncRef={syncRef} />
          <ChangePlugin onChange={onChange} outputFormat={outputFormat} syncRef={syncRef} />
          <KeyboardShortcutsPlugin onSubmitShortcut={onSubmitShortcut} />
        </div>
      </LexicalComposer>
    </div>
  );
}
