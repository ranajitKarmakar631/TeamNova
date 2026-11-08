import {
  $applyNodeReplacement,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
  TextNode,
} from 'lexical';

export type SerializedMentionNode = Spread<
  {
    mentionName: string;
    mentionId?: string;
  },
  SerializedTextNode
>;

function $convertMentionElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const textContent = domNode.textContent;
  const mentionId = domNode.getAttribute('data-lexical-mention-id') || undefined;

  if (textContent !== null) {
    const mentionName = textContent.startsWith('@')
      ? textContent.slice(1)
      : textContent;
    const node = $createMentionNode(mentionName, mentionId);
    return {
      node,
    };
  }

  return null;
}

export class MentionNode extends TextNode {
  __mentionName: string;
  __mentionId?: string;

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(
      node.__mentionName,
      node.__mentionId,
      node.__text,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    const node = $createMentionNode(
      serializedNode.mentionName,
      serializedNode.mentionId
    );
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(
    mentionName: string,
    mentionId?: string,
    text?: string,
    key?: NodeKey
  ) {
    super(text ?? `@${mentionName}`, key);
    this.__mentionName = mentionName;
    this.__mentionId = mentionId;
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      type: 'mention',
      mentionName: this.__mentionName,
      mentionId: this.__mentionId,
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = 'lx-mention';
    if (this.__mentionId) {
      dom.setAttribute('data-lexical-mention-id', this.__mentionId);
    }
    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-mention', 'true');
    if (this.__mentionId) {
      element.setAttribute('data-lexical-mention-id', this.__mentionId);
    }
    element.className = 'lx-mention';
    element.textContent = this.__text;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-mention')) {
          return null;
        }
        return {
          conversion: $convertMentionElement,
          priority: 1,
        };
      },
    };
  }

  isTextEntity(): boolean {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createMentionNode(
  mentionName: string,
  mentionId?: string
): MentionNode {
  const mentionNode = new MentionNode(mentionName, mentionId);
  mentionNode.setMode('segmented').toggleDirectionless();
  return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
  node: LexicalNode | null | undefined
): node is MentionNode {
  return node instanceof MentionNode;
}

