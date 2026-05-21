import React from "react";

interface HighlightTextProps {
  text: string;
  query: string;
}

export default function HighlightText({ text, query }: HighlightTextProps) {
  if (!query || !text) return <span>{text}</span>;

  // Escape special regex characters
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span
            key={index}
            className="text-brand font-extrabold transition-all duration-200"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
}
