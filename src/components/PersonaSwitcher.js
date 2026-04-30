"use client";

import { PERSONAS, PERSONA_ORDER } from "@/lib/personas";

export default function PersonaSwitcher({ activeId, onSwitch }) {
  return (
    <div className="persona-switcher" role="tablist" aria-label="Choose instructor">
      {PERSONA_ORDER.map((id) => {
        const p = PERSONAS[id];
        const isActive = id === activeId;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-active={isActive}
            className="persona-tab"
            style={{
              "--persona-accent": `var(${p.accentVar})`,
            }}
            onClick={() => onSwitch(id)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.avatar}
              alt=""
              width={28}
              height={28}
              className="persona-tab-avatar"
            />
            <span className="persona-tab-name">{p.displayName}</span>
          </button>
        );
      })}
    </div>
  );
}
