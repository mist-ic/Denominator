"use client";

import { useState } from "react";
import { getPersona } from "@/lib/personas";

export default function TalkingHead({ personaId, phase }) {
  const p = getPersona(personaId);
  const [imgFailed, setImgFailed] = useState(false);

  const initial = p.displayName?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      className="talking-head"
      style={{ "--persona-accent": `var(${p.accentVar})` }}
    >
      <div className="talking-head-backdrop" aria-hidden />
      <div className="talking-head-inner">
        <div className="talking-head-ring" data-phase={phase} aria-hidden />
        <div key={personaId} className="talking-head-frame">
          {!imgFailed ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={p.avatar}
              alt=""
              width={88}
              height={88}
              className="talking-head-img"
              data-phase={phase}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="talking-head-fallback" data-phase={phase}>
              <span className="talking-head-fallback-letter" aria-hidden>
                {initial}
              </span>
              <span className="visually-hidden">{p.displayName} avatar</span>
            </div>
          )}
        </div>
        <div className="talking-head-caption">
          <span className="talking-head-name">{p.displayName}</span>
          <span className="talking-head-role">{p.title}</span>
        </div>
      </div>
    </div>
  );
}
