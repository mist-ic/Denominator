"use client";

export default function TypingIndicator({ avatarSrc, accentVar }) {
  return (
    <div
      className="typing-indicator"
      aria-live="polite"
      aria-busy="true"
      style={{ "--persona-accent": accentVar ? `var(${accentVar})` : undefined }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarSrc}
        alt=""
        width={32}
        height={32}
        className="message-avatar"
      />
      <div className="typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
