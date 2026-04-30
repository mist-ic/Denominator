"use client";

import { useState } from "react";
import PersonaSwitcher from "@/components/PersonaSwitcher";
import ChatInterface from "@/components/ChatInterface";
import TalkingHead from "@/components/TalkingHead";

export default function Home() {
  const [persona, setPersona] = useState("anshuman");
  const [headPhase, setHeadPhase] = useState("idle");

  return (
    <main className="shell">
      <header className="app-header">
        <h1>Denominator</h1>
        <p>Pick an instructor voice. Powered by Gemini.</p>
      </header>

      <div className="chat-shell">
        <TalkingHead personaId={persona} phase={headPhase} />
        <PersonaSwitcher
          activeId={persona}
          onSwitch={(id) => {
            setPersona(id);
            setHeadPhase("idle");
          }}
        />
        <ChatInterface
          key={persona}
          personaId={persona}
          onHeadPhaseChange={setHeadPhase}
        />
      </div>
    </main>
  );
}
