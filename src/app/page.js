"use client";

import { useState } from "react";
import PersonaSwitcher from "@/components/PersonaSwitcher";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [persona, setPersona] = useState("anshuman");

  return (
    <main className="shell">
      <header className="app-header">
        <h1>Denominator</h1>
        <p>Pick an instructor voice. Powered by Gemini.</p>
      </header>

      <div className="chat-shell">
        <PersonaSwitcher activeId={persona} onSwitch={setPersona} />
        <ChatInterface personaId={persona} />
      </div>
    </main>
  );
}
