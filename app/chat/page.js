"use client";

import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Erreur : ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <p className="page-eyebrow">Pilotage assisté</p>
          <h1 className="page-title">Chat</h1>
        </div>
      </div>

      <div className="chat-shell">
        <div className="chat-window">
          {messages.length === 0 && (
            <p className="chat-hint">
              Exemples : "combien de prospects investisseurs ?", "envoie un email à jane@vc.com",
              "envoie à tous les nouveaux testeurs".
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === "user" ? "user" : "model"}`}>
              {m.content}
            </div>
          ))}
          {loading && <div className="msg model">…</div>}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Écris un message..."
            disabled={loading}
          />
          <button onClick={send} disabled={loading}>
            Envoyer
          </button>
        </div>
      </div>
    </>
  );
}
