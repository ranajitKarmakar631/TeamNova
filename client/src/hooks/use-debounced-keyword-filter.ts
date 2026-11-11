import { useEffect, useRef, useState } from "react";

interface UseDebouncedKeywordFilterOptions {
  keyword?: string | null;
  onKeywordChange: (keyword: string | null) => void;
  delay?: number;
}

/**
 * Syncs a controlled search input with URL filter state using a guarded debounce
 * so unrelated re-renders and resets never trigger redundant URL updates.
 */
export function useDebouncedKeywordFilter({
  keyword,
  onKeywordChange,
  delay = 400,
}: UseDebouncedKeywordFilterOptions) {
  const [searchValue, setSearchValue] = useState(keyword || "");
  const onKeywordChangeRef = useRef(onKeywordChange);
  onKeywordChangeRef.current = onKeywordChange;

  useEffect(() => {
    setSearchValue(keyword || "");
  }, [keyword]);

  useEffect(() => {
    const nextKeyword = searchValue || null;
    const currentKeyword = keyword || null;
    if (nextKeyword === currentKeyword) return;

    const timer = setTimeout(() => {
      onKeywordChangeRef.current(nextKeyword);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchValue, keyword, delay]);

  return [searchValue, setSearchValue] as const;
}

export default useDebouncedKeywordFilter;

