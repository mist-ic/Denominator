"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPersona } from "@/lib/personas";
import TypingIndicator from "./TypingIndicator";
import SuggestionChips from "./SuggestionChips";

function extractEvents(buffer) {
  const events = [];
  let rest = buffer;
  let idx;
  while ((idx = rest.indexOf("\n\n")) !== -1) {
    const block = rest.slice(0, idx).trim();
    rest = rest.slice(idx + 2);
    if (!block.startsWith("data:")) continue;
    const payload = block.slice(5).trim();
    try {
      events.push(JSON.parse(payload));
    } catch {
      /* ignore malformed */
    }
  }
  return { events, rest };
}

function textForVoice(raw) {
  if (!raw) return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, 8000);
}

function MicIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export default function ChatInterface({ personaId, onHeadPhaseChange }) {
  const p = getPersona(personaId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [dictating, setDictating] = useState(false);
  const [speechInOk, setSpeechInOk] = useState(false);
  const [speechOutOk, setSpeechOutOk] = useState(false);
  const listRef = useRef(null);
  const messagesRef = useRef(messages);
  const streamingRef = useRef(false);
  const recognitionRef = useRef(null);
  const dictationLineRef = useRef("");
  const manualStopRef = useRef(false);
  const personaAccent = `var(${p.accentVar})`;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSpeechInOk(
        !!(window.SpeechRecognition || window.webkitSpeechRecognition)
      );
      setSpeechOutOk(!!window.speechSynthesis);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming, personaId]);

  const stopDictation = useCallback((manual) => {
    manualStopRef.current = manual;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const sendText = useCallback(
    async (raw) => {
      const text = String(raw || "").trim();
      if (!text || streamingRef.current) return;

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      onHeadPhaseChange?.("thinking");

      const historyForApi = messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const userMsg = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setStreaming(true);

      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", id: assistantId },
      ]);

      let streamOk = true;
      let assembled = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            persona: personaId,
            history: historyForApi,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "request_failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("no_body");

        const decoder = new TextDecoder();
        let sseBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const { events, rest } = extractEvents(sseBuffer);
          sseBuffer = rest;

          for (const ev of events) {
            if (ev.error) throw new Error(ev.error);
            if (ev.text) {
              const delta = ev.text;
              assembled += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + delta }
                    : m
                )
              );
            }
          }
        }
      } catch {
        streamOk = false;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Something went wrong. Please try again.",
                }
              : m
          )
        );
      } finally {
        setStreaming(false);
        if (!streamOk) {
          onHeadPhaseChange?.("idle");
          return;
        }

        const rawOut = assembled.trim();
        const failed = rawOut.startsWith("Something went wrong");
        const canSpeak =
          readAloud &&
          rawOut &&
          !failed &&
          typeof window !== "undefined" &&
          window.speechSynthesis;

        if (canSpeak) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(textForVoice(rawOut));
          u.onstart = () => onHeadPhaseChange?.("speaking");
          u.onend = () => onHeadPhaseChange?.("idle");
          u.onerror = () => onHeadPhaseChange?.("idle");
          window.speechSynthesis.speak(u);
        } else {
          onHeadPhaseChange?.("idle");
        }
      }
    },
    [personaId, onHeadPhaseChange, readAloud]
  );

  const toggleDictation = useCallback(() => {
    if (streamingRef.current) return;
    if (dictating) {
      stopDictation(true);
      return;
    }
    const Ctor =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!Ctor) return;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    onHeadPhaseChange?.("idle");

    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = false;
    r.interimResults = true;
    dictationLineRef.current = "";
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      dictationLineRef.current = t;
      setInput(t.trim());
    };
    r.onerror = () => {
      setDictating(false);
      recognitionRef.current = null;
    };
    r.onend = () => {
      setDictating(false);
      recognitionRef.current = null;
      if (manualStopRef.current) {
        manualStopRef.current = false;
        return;
      }
      const trimmed = dictationLineRef.current.trim();
      dictationLineRef.current = "";
      if (trimmed) sendText(trimmed);
    };
    recognitionRef.current = r;
    setDictating(true);
    try {
      r.start();
    } catch {
      setDictating(false);
      recognitionRef.current = null;
    }
  }, [dictating, stopDictation, onHeadPhaseChange, sendText]);

  const onSubmit = (e) => {
    e.preventDefault();
    sendText(input);
  };

  const last = messages[messages.length - 1];
  const showTyping =
    streaming && last?.role === "assistant" && last?.content === "";

  const showChips = messages.length === 0 && !streaming;

  return (
    <>
      {showChips ? (
        <div style={{ "--persona-accent": personaAccent }}>
          <SuggestionChips
            suggestions={p.suggestions}
            disabled={streaming}
            onPick={sendText}
          />
        </div>
      ) : null}

      <div
        ref={listRef}
        className="messages"
        style={{ "--persona-accent": personaAccent }}
      >
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          if (!isUser && m.content === "" && showTyping) return null;
          return (
            <div
              key={m.id || `${m.role}-${i}`}
              className={`message ${isUser ? "message-user" : "message-assistant"}`}
            >
              {!isUser ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.avatar}
                  alt=""
                  width={32}
                  height={32}
                  className="message-avatar"
                />
              ) : null}
              <div className="message-bubble">{m.content}</div>
            </div>
          );
        })}
        {showTyping ? (
          <TypingIndicator avatarSrc={p.avatar} accentVar={p.accentVar} />
        ) : null}
      </div>

      <form className="compose" onSubmit={onSubmit}>
        <div className="compose-toolbar">
          {speechInOk ? (
            <button
              type="button"
              className="compose-icon-btn"
              data-on={dictating}
              disabled={streaming}
              onClick={() => toggleDictation()}
              aria-label={dictating ? "Stop voice input" : "Start voice input"}
              aria-pressed={dictating}
              title={dictating ? "Stop dictation" : "Dictate"}
              style={{ "--persona-accent": personaAccent }}
            >
              <MicIcon />
            </button>
          ) : null}
          {speechOutOk ? (
            <button
              type="button"
              className="compose-icon-btn"
              data-on={readAloud}
              onClick={() => setReadAloud((v) => !v)}
              aria-label={
                readAloud ? "Turn off read replies aloud" : "Read replies aloud"
              }
              aria-pressed={readAloud}
              title="Read assistant replies aloud"
              style={{ "--persona-accent": personaAccent }}
            >
              <SpeakerIcon />
            </button>
          ) : null}
        </div>
        <input
          className="compose-input"
          placeholder="Message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          aria-label="Message"
          style={{ "--persona-accent": personaAccent }}
        />
        <button
          type="submit"
          className="compose-send"
          disabled={streaming || !input.trim()}
          style={{ background: personaAccent, color: "#0a0a0f" }}
        >
          Send
        </button>
      </form>
    </>
  );
}
