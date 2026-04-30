"use client";

export default function SuggestionChips({ suggestions, disabled, onPick }) {
  if (!suggestions?.length) return null;

  return (
    <div className="suggestion-row">
      {suggestions.map((text) => (
        <button
          key={text}
          type="button"
          className="suggestion-chip"
          disabled={disabled}
          onClick={() => onPick(text)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
