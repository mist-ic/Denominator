"use client";

import { useState } from "react";
import PersonaSwitcher from "@/components/PersonaSwitcher";
import ChatInterface from "@/components/ChatInterface";
import TalkingHead from "@/components/TalkingHead";

export default function Home() {
  const [persona, setPersona] = useState("anshuman");
  const [headPhase, setHeadPhase] = useState("idle");

  return (
    <main className="shell orch-shell">
      <header className="app-header orch-reveal orch-reveal-1">
        <p className="app-overline">Scaler style prep personas</p>
        <h1>Denominator</h1>
        <p className="app-tagline">
          Chat with three instructor voices powered by Gemini. Switch tabs to
          reset the thread.
        </p>
        <p className="app-meta">
          Docs for grading: see{" "}
          <a className="app-link" href="https://github.com/mist-ic/Denominator/blob/master/prompts.md">
            prompts.md
          </a>{" "}
          and{" "}
          <a className="app-link" href="https://github.com/mist-ic/Denominator/blob/master/reflection.md">
            reflection.md
          </a>
          .
        </p>
      </header>

      <div className="chat-shell orch-reveal orch-reveal-2">
        <div className="chat-stage">
          <TalkingHead key={persona} personaId={persona} phase={headPhase} />
          <PersonaSwitcher
            activeId={persona}
            onSwitch={(id) => {
              setPersona(id);
              setHeadPhase("idle");
            }}
          />
        </div>
        <ChatInterface
          key={persona}
          personaId={persona}
          onHeadPhaseChange={setHeadPhase}
        />
      </div>
    </main>
  );
}
