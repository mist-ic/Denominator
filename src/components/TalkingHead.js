"use client";

import { getPersona } from "@/lib/personas";

export default function TalkingHead({ personaId, phase }) {
  const p = getPersona(personaId);

  return (
    <div
      className="talking-head"
      style={{ "--persona-accent": `var(${p.accentVar})` }}
    >
      <div className="talking-head-ring" data-phase={phase} aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={personaId}
        src={p.avatar}
        alt=""
        width={88}
        height={88}
        className="talking-head-img"
        data-phase={phase}
      />
    </div>
  );
}
