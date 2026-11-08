import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  LexicalCommand,
  $createTextNode,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';

interface ToolbarButton {
  label: string;
  title: string;
  className?: string;
  run: () => void;
}

export default function Toolbar(): React.ReactElement {
  const [editor] = useLexicalComposerContext();

  const dispatch = (command: LexicalCommand<any>, payload?: any) => () =>
    editor.dispatchCommand(command, payload);

  const setBlock = (create: () => any) => () =>
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, create);
      }
    });

  const insertLink = () => {
    const url = window.prompt('Enter URL (leave empty to remove the link)');
    if (url === null) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url.trim() || null);
  };

  const insertMentionTrigger = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertNodes([$createTextNode('@')]);
      }
    });
  };

  const groups: ToolbarButton[][] = [
    [
      { label: '↶', title: 'Undo (Ctrl+Z)', run: dispatch(UNDO_COMMAND, undefined) },
      { label: '↷', title: 'Redo (Ctrl+Y)', run: dispatch(REDO_COMMAND, undefined) },
    ],
    [
      { label: 'P', title: 'Paragraph', run: setBlock(() => $createParagraphNode()) },
      { label: 'H1', title: 'Heading 1', run: setBlock(() => $createHeadingNode('h1' as HeadingTagType)) },
      { label: 'H2', title: 'Heading 2', run: setBlock(() => $createHeadingNode('h2' as HeadingTagType)) },
      { label: 'H3', title: 'Heading 3', run: setBlock(() => $createHeadingNode('h3' as HeadingTagType)) },
      { label: '❝', title: 'Quote', run: setBlock(() => $createQuoteNode()) },
      { label: '{ }', title: 'Code block', run: setBlock(() => $createCodeNode()) },
    ],
    [
      { label: 'B', title: 'Bold (Ctrl+B)', className: 'lx-btn-bold', run: dispatch(FORMAT_TEXT_COMMAND, 'bold') },
      { label: 'I', title: 'Italic (Ctrl+I)', className: 'lx-btn-italic', run: dispatch(FORMAT_TEXT_COMMAND, 'italic') },
      { label: 'S', title: 'Strikethrough', className: 'lx-btn-strike', run: dispatch(FORMAT_TEXT_COMMAND, 'strikethrough') },
      { label: '<>', title: 'Inline code', run: dispatch(FORMAT_TEXT_COMMAND, 'code') },
    ],
    [
      { label: '•', title: 'Bullet list', run: dispatch(INSERT_UNORDERED_LIST_COMMAND, undefined) },
      { label: '1.', title: 'Numbered list', run: dispatch(INSERT_ORDERED_LIST_COMMAND, undefined) },
      { label: '🔗', title: 'Insert link', run: insertLink },
      { label: '@', title: 'Mention member', run: insertMentionTrigger },
    ],
  ];

  return (
    <div className="lx-toolbar" role="toolbar" aria-label="Formatting">
      {groups.map((group, gi) => (
        <div className="lx-group" key={gi}>
          {group.map((btn) => (
            <button
              key={btn.title}
              type="button"
              title={btn.title}
              aria-label={btn.title}
              className={`lx-btn ${btn.className ?? ''}`.trim()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={btn.run}
            >
              {btn.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

