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

export default function ChatInterface({ personaId, onStreamingChange }) {
  const p = getPersona(personaId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef(null);
  const messagesRef = useRef(messages);
  const streamingRef = useRef(false);
  const personaAccent = `var(${p.accentVar})`;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [personaId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming, personaId]);

  useEffect(() => {
    onStreamingChange?.(streaming);
  }, [streaming, onStreamingChange]);

  const sendText = useCallback(
    async (raw) => {
      const text = String(raw || "").trim();
      if (!text || streamingRef.current) return;

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
      }
    },
    [personaId]
  );

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
