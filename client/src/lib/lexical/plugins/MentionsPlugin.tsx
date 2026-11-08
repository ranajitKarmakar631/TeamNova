import React, { useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode } from 'lexical';
import { $createMentionNode } from '../nodes/MentionNode';

export interface MentionUser {
  id: string;
  name: string;
  avatar?: string | null;
  email?: string;
}

export class MentionTypeaheadOption extends MenuOption {
  name: string;
  id?: string;
  avatar?: string | null;
  email?: string;

  constructor(name: string, id?: string, avatar?: string | null, email?: string) {
    super(name);
    this.name = name;
    this.id = id;
    this.avatar = avatar;
    this.email = email;
  }
}

interface MentionsPluginProps {
  options?: MentionUser[];
  onSearch?: (query: string) => Promise<MentionUser[]> | MentionUser[];
}

export function MentionsPlugin({
  options = [],
}: MentionsPluginProps): React.ReactElement | null {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForAtSignTriggerMatch = useBasicTypeaheadTriggerMatch('@', {
    minLength: 0,
  });

  const menuOptions = useMemo(() => {
    const list = options.map(
      (user) => new MentionTypeaheadOption(user.name, user.id, user.avatar, user.email)
    );

    if (!queryString) {
      return list.slice(0, 8);
    }

    const query = queryString.toLowerCase();
    return list
      .filter(
        (opt) =>
          opt.name.toLowerCase().includes(query) ||
          (opt.email && opt.email.toLowerCase().includes(query))
      )
      .slice(0, 8);
  }, [options, queryString]);

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        const mentionNode = $createMentionNode(selectedOption.name, selectedOption.id);
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        closeMenu();
      });
    },
    [editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForAtSignTriggerMatch}
      options={menuOptions}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        if (
          anchorElementRef.current == null ||
          menuOptions.length === 0
        ) {
          return null;
        }

        return ReactDOM.createPortal(
          <div className="lx-mentions-menu" role="listbox" aria-label="Mention candidates">
            <div className="lx-mentions-header">Members</div>
            {menuOptions.map((option, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={option.key}
                  tabIndex={-1}
                  role="option"
                  aria-selected={isSelected}
                  ref={option.setRefElement}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => {
                    setHighlightedIndex(index);
                    selectOptionAndCleanUp(option);
                  }}
                  className={`lx-mentions-item ${isSelected ? 'selected' : ''}`}
                >
                  {option.avatar ? (
                    <img
                      src={option.avatar}
                      alt={option.name}
                      className="lx-mentions-avatar"
                    />
                  ) : (
                    <div className="lx-mentions-fallback">
                      {option.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="lx-mentions-info">
                    <span className="lx-mentions-name">{option.name}</span>
                    {option.email && (
                      <span className="lx-mentions-email">{option.email}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>,
          anchorElementRef.current
        );
      }}
    />
  );
}

export default MentionsPlugin;
