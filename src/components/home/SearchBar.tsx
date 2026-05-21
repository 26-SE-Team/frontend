interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="home-search" aria-label="매물 검색">
      <svg
        className="home-search__icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path
          d="M20 20L16 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="search"
        className="home-search__input"
        placeholder="검색"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        enterKeyHint="search"
        autoComplete="off"
      />
      {value.length > 0 && (
        <button
          type="button"
          className="home-search__clear"
          onClick={() => onChange("")}
          aria-label="검색어 지우기"
        >
          ×
        </button>
      )}
    </label>
  );
}
