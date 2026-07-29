"use client";
/**
 * src/components/ai/chat-widget.tsx
 *
 * TBAI Neural Engine Chat Widget — Apple Intelligence Series Design.
 * Listens for global 'open-tbai-chat' event triggered from the hero AI Star button.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  X, Send, Loader2, User,
  ExternalLink, ChevronRight, Sparkles, RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskCard {
  id:       string;
  title:    string;
  budget:   string;
  category: string;
  deadline: string;
  applyUrl: string;
}

interface Action {
  label: string;
  url:   string;
}

interface AIMessage {
  id:        string;
  role:      "user" | "assistant";
  text:      string;
  taskCards?: TaskCard[] | undefined;
  actions?:   Action[] | undefined;
  timestamp:  Date;
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/\|(.+)\|/g, (_, row) =>
      `<div class="tbai-table-row">${row.split("|").map((c: string) =>
        `<span>${c.trim()}</span>`).join("")}</div>`
    );
}

// ── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="tbai-msg tbai-msg--assistant">
      <div className="tbai-avatar tbai-avatar--ai">
        <Sparkles size={14} />
      </div>
      <div className="tbai-bubble tbai-bubble--assistant tbai-typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: "🔍 Find tasks for me",        text: "find me tasks matching my skills" },
  { label: "💰 Budget advice",             text: "what's a fair budget for a research task?" },
  { label: "📄 How does escrow work?",     text: "how does the escrow payment work?" },
  { label: "🎓 Tips to win tasks",         text: "how do I improve my profile to get selected?" },
  { label: "📊 Platform stats",            text: "how many students and tasks are on TaskBridge?" },
];

// ── Main Widget ───────────────────────────────────────────────────────────────

export function ChatWidget() {
  const [open,      setOpen]      = useState(false);
  const [input,     setInput]     = useState("");
  const [messages,  setMessages]  = useState<AIMessage[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Listen for global open event (from Hero Apple AI Star button)
  useEffect(() => {
    const handleOpenAI = () => setOpen(true);
    window.addEventListener("open-tbai-chat", handleOpenAI);
    return () => window.removeEventListener("open-tbai-chat", handleOpenAI);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id:        "welcome",
        role:      "assistant",
        text:      "✨ **TaskBridge AI Intelligence Active**\n\nPowered by Apple-series design standards and domain intelligence. I can match tasks to your skills, calculate escrow payouts, analyze budgets, and draft legal contracts.\n\nWhat would you like assistance with?",
        actions:   [
          { label: "Browse Tasks",  url: "/tasks"    },
          { label: "Register Free", url: "/register" },
        ],
        timestamp: new Date(),
      }]);
    }
  }, [open, messages.length]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput("");

    const userMsg: AIMessage = {
      id:        crypto.randomUUID(),
      role:      "user",
      text:      msg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res  = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: msg, sessionId }),
      });
      const json = await res.json() as {
        success:   boolean;
        sessionId: string;
        response:  { text: string; taskCards?: TaskCard[]; actions?: Action[] };
        error?:    string;
      };

      if (json.sessionId) setSessionId(json.sessionId);

      const aiMsg: AIMessage = {
        id:        crypto.randomUUID(),
        role:      "assistant",
        text:      json.success ? json.response.text : (json.error ?? "Something went wrong."),
        taskCards: json.response?.taskCards,
        actions:   json.response?.actions,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id:        crypto.randomUUID(),
        role:      "assistant",
        text:      "⚠️ TBAI Engine is reconnecting. Please try again in a moment.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  return (
    <>
      {/* ── Global styles ──────────────────────────────────────────────────── */}
      <style>{`
        .tbai-widget {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* Panel — Apple Intelligence aesthetic */
        .tbai-panel {
          position: fixed; bottom: 84px; right: 24px;
          width: 390px; max-width: calc(100vw - 32px);
          height: 600px; max-height: calc(100vh - 110px);
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid rgba(255, 125, 0, 0.25);
          box-shadow: 0 24px 80px rgba(249,115,22,0.18), 0 8px 30px rgba(0,0,0,0.12);
          display: flex; flex-direction: column; overflow: hidden;
          transform-origin: bottom right;
          animation: tbai-open 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes tbai-open {
          from { transform: scale(0.85) translateY(20px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* Panel header — Apple warm radiant glow */
        .tbai-header {
          padding: 16px 18px;
          background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 40%, #ea580c 100%);
          display: flex; align-items: center; gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.15);
          flex-shrink: 0;
        }
        .tbai-header-icon {
          width: 38px; height: 38px; border-radius: 12px;
          background: linear-gradient(135deg, #ff6b00, #ff0055);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; box-shadow: 0 4px 14px rgba(255,107,0,0.5);
        }
        .tbai-header-text h3 { font-size: 14px; font-weight: 800; color: white; margin: 0; }
        .tbai-header-text p  { font-size: 11px; color: #ffedd5; margin: 2px 0 0; font-family: monospace; }
        .tbai-header-actions { margin-left: auto; display: flex; gap: 4px; }
        .tbai-icon-btn {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,255,255,0.15); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: white; transition: background 0.15s;
        }
        .tbai-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* Live indicator */
        .tbai-live {
          display: flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 100px;
          background: rgba(249,115,22,0.25); border: 1px solid rgba(249,115,22,0.4);
          font-size: 10px; font-weight: 800; color: #ffedd5;
          letter-spacing: 0.05em;
        }
        .tbai-live span {
          width: 6px; height: 6px; border-radius: 50%; background: #f97316;
          animation: tbai-blink 1.4s infinite;
        }
        @keyframes tbai-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        /* Messages */
        .tbai-messages {
          flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent;
        }
        .tbai-messages::-webkit-scrollbar { width: 4px; }
        .tbai-messages::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .tbai-msg { display: flex; gap: 8px; align-items: flex-end; }
        .tbai-msg--user { flex-direction: row-reverse; }
        .tbai-avatar {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 12px; font-weight: 900;
        }
        .tbai-avatar--ai   { background: linear-gradient(135deg, #ff6b00, #ea580c); color: white; }
        .tbai-avatar--user { background: #f1f5f9; color: #64748b; }
        .tbai-bubble {
          max-width: 84%; border-radius: 16px; padding: 10px 14px;
          font-size: 13px; line-height: 1.55; word-break: break-word;
        }
        .tbai-bubble--assistant {
          background: #fffbf7; border: 1px solid #fed7aa; color: #0f172a;
          border-bottom-left-radius: 4px;
        }
        .tbai-bubble--user {
          background: linear-gradient(135deg, #ea580c, #c2410c);
          color: white; border-bottom-right-radius: 4px;
        }
        .tbai-bubble p  { margin: 0 0 8px; }
        .tbai-bubble p:last-child { margin: 0; }
        .tbai-bubble strong { font-weight: 700; }
        .tbai-bubble em { font-style: italic; color: #64748b; }
        .tbai-table-row { display: flex; gap: 12px; font-size: 12px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
        .tbai-table-row span { flex: 1; }

        /* Typing dots */
        .tbai-typing { display: flex; align-items: center; gap: 4px; padding: 12px 16px; }
        .tbai-typing span {
          width: 7px; height: 7px; border-radius: 50%; background: #f97316;
          animation: tbai-dot 1.2s infinite ease-in-out;
        }
        .tbai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .tbai-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes tbai-dot {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40%            { transform: scale(1.15); opacity: 1; }
        }

        /* Task cards */
        .tbai-cards { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
        .tbai-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 12px;
          border: 1px solid #fed7aa; background: white; text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
        }
        .tbai-card:hover {
          border-color: #f97316; box-shadow: 0 4px 12px rgba(249,115,22,0.15);
          transform: translateY(-1px);
        }
        .tbai-card-cat {
          font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
          padding: 3px 7px; border-radius: 6px; background: #fff7ed; color: #c2410c; white-space: nowrap;
        }
        .tbai-card-title { font-size: 12px; font-weight: 700; color: #0f172a; flex: 1; }
        .tbai-card-budget { font-size: 12px; font-weight: 800; color: #059669; white-space: nowrap; }

        /* Actions */
        .tbai-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .tbai-action {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 700;
          border: 1px solid #fed7aa; background: #fff7ed; color: #9a3412;
          text-decoration: none; transition: background 0.15s, border-color 0.15s;
        }
        .tbai-action:hover { background: #ffedd5; border-color: #f97316; }

        /* Quick prompts */
        .tbai-quick { padding: 10px 14px; border-top: 1px solid #f1f5f9; display: flex; flex-wrap: wrap; gap: 5px; }
        .tbai-quick-btn {
          font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px;
          border: 1px solid #fed7aa; background: white; cursor: pointer; color: #9a3412;
          transition: background 0.15s, border-color 0.15s; white-space: nowrap;
        }
        .tbai-quick-btn:hover { background: #fff7ed; border-color: #f97316; color: #ea580c; }

        /* Input row */
        .tbai-input-row {
          padding: 12px 14px; border-top: 1px solid #f1f5f9;
          display: flex; gap: 8px; align-items: flex-end;
          background: white; flex-shrink: 0;
        }
        .tbai-textarea {
          flex: 1; resize: none; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 10px 12px; font-size: 13px; font-family: inherit;
          line-height: 1.5; outline: none; min-height: 40px; max-height: 100px;
          color: #0f172a; background: #fafbfc;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .tbai-textarea:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.2); background: white; }
        .tbai-textarea::placeholder { color: #94a3b8; }
        .tbai-send {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #ff6b00, #ea580c);
          border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: white; transition: opacity 0.15s, transform 0.15s;
        }
        .tbai-send:hover:not(:disabled) { opacity: 0.9; transform: scale(1.05); }
        .tbai-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .tbai-time { font-size: 9px; color: #cbd5e1; text-align: center; margin: 2px 0; }
      `}</style>

      <div className="tbai-widget">
        {/* ── Chat panel (opens when AIHeroStar button is clicked) ── */}
        {open && (
          <div className="tbai-panel">

            {/* Header */}
            <div className="tbai-header">
              <div className="tbai-header-icon">
                <Sparkles size={20} color="white" />
              </div>
              <div className="tbai-header-text">
                <h3>TaskBridge AI</h3>
                <p>Apple-Series Intelligence Module</p>
              </div>
              <div className="tbai-live">
                <span />
                ACTIVE
              </div>
              <div className="tbai-header-actions">
                <button className="tbai-icon-btn" onClick={clearChat} title="Clear conversation">
                  <RefreshCw size={13} />
                </button>
                <button className="tbai-icon-btn" onClick={() => setOpen(false)} title="Close drawer">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="tbai-messages">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div className={`tbai-msg tbai-msg--${msg.role}`}>
                    <div className={`tbai-avatar tbai-avatar--${msg.role === "assistant" ? "ai" : "user"}`}>
                      {msg.role === "assistant" ? <Sparkles size={14} /> : <User size={13} />}
                    </div>
                    <div>
                      <div className={`tbai-bubble tbai-bubble--${msg.role === "assistant" ? "assistant" : "user"}`}>
                        {msg.role === "assistant" ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                          />
                        ) : (
                          msg.text
                        )}

                        {/* Task cards */}
                        {msg.taskCards && msg.taskCards.length > 0 && (
                          <div className="tbai-cards">
                            {msg.taskCards.map((card) => (
                              <Link key={card.id} href={card.applyUrl} className="tbai-card" target="_blank">
                                <div>
                                  <div className="tbai-card-cat">{card.category}</div>
                                </div>
                                <div className="tbai-card-title">{card.title}</div>
                                <div className="tbai-card-budget">{card.budget}</div>
                                <ChevronRight size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="tbai-actions">
                            {msg.actions.map((action) => (
                              <Link key={action.url} href={action.url} className="tbai-action">
                                {action.label}
                                <ExternalLink size={10} />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="tbai-time">
                        {msg.timestamp.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="tbai-quick">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.text}
                    className="tbai-quick-btn"
                    onClick={() => sendMessage(p.text)}
                    disabled={loading}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div className="tbai-input-row">
              <textarea
                ref={inputRef}
                className="tbai-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask TaskBridge AI about tasks, escrow, or contracts…"
                rows={1}
                maxLength={1000}
                disabled={loading}
              />
              <button
                className="tbai-send"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                {loading
                  ? <Loader2 size={16} className="tbai-spin" style={{ animation: "spin 1s linear infinite" }} />
                  : <Send size={16} />
                }
              </button>
            </div>

            {/* Footer */}
            <div className="tbai-footer">
              Powered by <strong>TaskBridge AI</strong> · Apple Series Design
            </div>

          </div>
        )}
      </div>
    </>
  );
}
