"use client";
/**
 * TaskBridge AI Chat — professional conversational assistant widget.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X, Send, Loader2, User, Bot,
  ExternalLink, ChevronRight, Sparkles, RefreshCw, Brain, MessageSquare,
} from "lucide-react";
import type { AgentAction } from "@/lib/ai/agent-executor";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskCard {
  id:          string;
  title:       string;
  budget:      string;
  category:    string;
  deadline:    string;
  applyUrl:    string;
  companyName?: string;
}

interface Action {
  label: string;
  url:   string;
}

interface AIMessage {
  id:               string;
  role:             "user" | "assistant";
  text:             string;
  taskCards?:       TaskCard[]      | undefined;
  actions?:         Action[]        | undefined;
  agentActions?:    AgentAction[]   | undefined;
  suggestedReplies?: string[]        | undefined;
  timestamp:        Date;
  intent?:          string          | undefined;
  confidence?:      number          | undefined;
  fullAIMode?:      boolean          | undefined;
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr/>")
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
        <Bot size={14} />
      </div>
      <div className="tbai-bubble tbai-bubble--assistant tbai-typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: "Find tasks",           text: "find me tasks matching my skills" },
  { label: "Budget advice",        text: "what's a fair budget for a research task?" },
  { label: "How escrow works",     text: "how does the escrow payment work?" },
  { label: "Profile tips",         text: "how do I improve my profile to get selected?" },
  { label: "Write a proposal",     text: "help me write a winning proposal" },
  { label: "My dashboard",         text: "show me my dashboard summary" },
];

// ── Agent Action Chip ─────────────────────────────────────────────────────────

function AgentActionChip({ action }: { action: AgentAction }) {
  if (!action.url) return null;
  return (
    <Link href={action.url} className="tbai-agent-chip">
      {action.icon && <span className="tbai-chip-icon">{action.icon}</span>}
      {action.label}
      <ChevronRight size={10} style={{ opacity: 0.6, flexShrink: 0 }} />
    </Link>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export function ChatWidget() {
  const router = useRouter();
  const [open,        setOpen]        = useState(false);
  const [input,       setInput]       = useState("");
  const [messages,    setMessages]    = useState<AIMessage[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [sessionId,   setSessionId]   = useState<string | undefined>();
  const [fullAIMode,  setFullAIMode]  = useState(true);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleOpenAI = () => setOpen(true);
    window.addEventListener("open-tbai-chat", handleOpenAI);
    return () => window.removeEventListener("open-tbai-chat", handleOpenAI);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id:        "welcome",
        role:      "assistant",
        text:      "**Welcome to TaskBridge AI.**\n\nI'm your assistant for finding tasks, understanding payments, planning budgets, and navigating the platform.\n\nWhat would you like to discuss today?",
        suggestedReplies: [
          "Find tasks for me",
          "How does escrow work?",
          "Help me write a proposal",
        ],
        actions: [
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
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg: AIMessage = {
      id:        crypto.randomUUID(),
      role:      "user",
      text:      msg,
      timestamp: new Date(),
      fullAIMode,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res  = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message:     msg,
          sessionId,
          fullAIMode,
          currentPage: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      const json = await res.json() as {
        success:   boolean;
        sessionId: string;
        response:  {
          text:              string;
          taskCards?:        TaskCard[];
          actions?:          Action[];
          agentActions?:     AgentAction[];
          suggestedReplies?: string[];
          intent?:           string;
          confidence?:       number;
        };
        error?:    string;
      };

      if (json.sessionId) setSessionId(json.sessionId);

      const aiMsg: AIMessage = {
        id:               crypto.randomUUID(),
        role:             "assistant",
        text:             json.success ? json.response.text : (json.error ?? "Something went wrong."),
        taskCards:        json.response?.taskCards,
        actions:          json.response?.actions,
        agentActions:     json.response?.agentActions,
        suggestedReplies: json.response?.suggestedReplies,
        intent:           json.response?.intent,
        confidence:       json.response?.confidence,
        timestamp:        new Date(),
        fullAIMode,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Auto-execute agent navigation actions
      const autoAction = json.response?.agentActions?.find((a) => a.autoExecute && a.url);
      if (autoAction?.url) {
        setTimeout(() => router.push(autoAction.url!), 700);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id:        crypto.randomUUID(),
        role:      "assistant",
        text:      "Connection interrupted. Please try again in a moment.",
        suggestedReplies: ["Find tasks for me", "How does escrow work?"],
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, fullAIMode, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  const lastAssistantIdx = messages.reduce(
    (acc, m, i) => (m.role === "assistant" ? i : acc),
    -1
  );

  return (
    <>
      <style>{`
        .tbai-widget {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .tbai-panel {
          position: fixed; bottom: 84px; right: 24px;
          width: 420px; max-width: calc(100vw - 32px);
          height: 640px; max-height: calc(100vh - 110px);
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06);
          display: flex; flex-direction: column; overflow: hidden;
          transform-origin: bottom right;
          animation: tbai-open 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes tbai-open {
          from { transform: scale(0.92) translateY(12px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* Header */
        .tbai-header {
          padding: 16px 18px;
          background: #0f172a;
          display: flex; align-items: center; gap: 12px;
          flex-shrink: 0;
        }
        .tbai-header-icon {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .tbai-header-text h3 {
          font-size: 15px; font-weight: 600; color: #f8fafc; margin: 0;
          letter-spacing: -0.01em;
        }
        .tbai-header-text p {
          font-size: 12px; color: #94a3b8; margin: 2px 0 0;
          display: flex; align-items: center; gap: 6px;
        }
        .tbai-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.6);
        }
        .tbai-header-actions { margin-left: auto; display: flex; gap: 6px; align-items: center; }
        .tbai-icon-btn {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(255,255,255,0.08); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #cbd5e1; transition: background 0.15s, color 0.15s;
        }
        .tbai-icon-btn:hover { background: rgba(255,255,255,0.15); color: #f8fafc; }

        .tbai-mode-toggle {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 8px;
          font-size: 11px; font-weight: 600; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: #94a3b8; transition: all 0.2s;
        }
        .tbai-mode-toggle:hover { background: rgba(255,255,255,0.12); color: #e2e8f0; }
        .tbai-mode-toggle--active {
          background: rgba(99,102,241,0.25);
          border-color: rgba(129,140,248,0.4);
          color: #c7d2fe;
        }

        /* Messages area */
        .tbai-messages {
          flex: 1; overflow-y: auto; padding: 20px 16px;
          display: flex; flex-direction: column; gap: 16px;
          background: #f8fafc;
          scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;
        }
        .tbai-messages::-webkit-scrollbar { width: 5px; }
        .tbai-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        .tbai-msg { display: flex; gap: 10px; align-items: flex-start; }
        .tbai-msg--user { flex-direction: row-reverse; }

        .tbai-avatar {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .tbai-avatar--ai {
          background: #fff; border: 1px solid #e2e8f0;
          color: #f97316;
        }
        .tbai-avatar--user {
          background: #e2e8f0; color: #475569;
        }

        .tbai-msg-body { max-width: 82%; display: flex; flex-direction: column; gap: 6px; }
        .tbai-msg--user .tbai-msg-body { align-items: flex-end; }

        .tbai-bubble {
          border-radius: 14px; padding: 12px 14px;
          font-size: 13.5px; line-height: 1.6; word-break: break-word;
        }
        .tbai-bubble--assistant {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #1e293b;
          border-top-left-radius: 4px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.04);
        }
        .tbai-bubble--user {
          background: #0f172a;
          color: #f1f5f9;
          border-top-right-radius: 4px;
        }
        .tbai-bubble p  { margin: 0 0 8px; }
        .tbai-bubble p:last-child { margin: 0; }
        .tbai-bubble strong { font-weight: 600; color: inherit; }
        .tbai-bubble em { font-style: italic; color: #64748b; }
        .tbai-bubble hr { border: none; border-top: 1px solid #e2e8f0; margin: 10px 0; }
        .tbai-table-row {
          display: flex; gap: 12px; font-size: 12px;
          padding: 5px 0; border-bottom: 1px solid #f1f5f9;
        }
        .tbai-table-row span { flex: 1; }

        .tbai-time {
          font-size: 10px; color: #94a3b8; padding: 0 4px;
        }

        /* Suggested replies */
        .tbai-suggestions {
          display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px;
        }
        .tbai-suggestion {
          font-size: 12px; font-weight: 500; padding: 6px 12px;
          border-radius: 20px; border: 1px solid #e2e8f0;
          background: #ffffff; cursor: pointer; color: #475569;
          transition: all 0.15s; white-space: nowrap;
        }
        .tbai-suggestion:hover:not(:disabled) {
          border-color: #f97316; color: #ea580c;
          background: #fff7ed;
        }
        .tbai-suggestion:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Typing */
        .tbai-typing { display: flex; align-items: center; gap: 5px; padding: 14px 16px; }
        .tbai-typing span {
          width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;
          animation: tbai-dot 1.2s infinite ease-in-out;
        }
        .tbai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .tbai-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes tbai-dot {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40%            { transform: scale(1.1); opacity: 1; }
        }

        /* Task cards */
        .tbai-cards { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .tbai-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          border: 1px solid #e2e8f0; background: #f8fafc; text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .tbai-card:hover {
          border-color: #f97316; box-shadow: 0 2px 8px rgba(249,115,22,0.1);
        }
        .tbai-card-cat {
          font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
          padding: 3px 7px; border-radius: 4px; background: #fff7ed; color: #c2410c;
          white-space: nowrap;
        }
        .tbai-card-info { flex: 1; min-width: 0; }
        .tbai-card-title {
          font-size: 12px; font-weight: 600; color: #0f172a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .tbai-card-company { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .tbai-card-budget { font-size: 12px; font-weight: 700; color: #059669; flex-shrink: 0; }

        /* Action links */
        .tbai-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .tbai-action {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
          border: 1px solid #e2e8f0; background: #f8fafc; color: #475569;
          text-decoration: none; transition: all 0.15s;
        }
        .tbai-action:hover { background: #fff7ed; border-color: #f97316; color: #ea580c; }

        .tbai-agent-chips {
          display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;
          padding-top: 10px; border-top: 1px solid #f1f5f9;
        }
        .tbai-agent-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 11px; border-radius: 20px; font-size: 11px; font-weight: 600;
          border: 1px solid #c7d2fe; background: #eef2ff; color: #4338ca;
          text-decoration: none; transition: all 0.15s;
        }
        .tbai-agent-chip:hover { background: #e0e7ff; border-color: #6366f1; }

        /* Quick prompts */
        .tbai-quick {
          padding: 10px 14px; border-top: 1px solid #e2e8f0;
          display: flex; flex-wrap: wrap; gap: 6px; background: #ffffff;
        }
        .tbai-quick-label {
          width: 100%; font-size: 11px; font-weight: 600; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;
        }
        .tbai-quick-btn {
          font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 20px;
          border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; color: #475569;
          transition: all 0.15s;
        }
        .tbai-quick-btn:hover:not(:disabled) {
          background: #fff7ed; border-color: #f97316; color: #ea580c;
        }
        .tbai-quick-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Input */
        .tbai-input-row {
          padding: 12px 14px; border-top: 1px solid #e2e8f0;
          display: flex; gap: 8px; align-items: flex-end;
          background: #ffffff; flex-shrink: 0;
        }
        .tbai-textarea {
          flex: 1; resize: none; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 10px 14px; font-size: 13.5px; font-family: inherit;
          line-height: 1.5; outline: none; min-height: 42px; max-height: 120px;
          color: #0f172a; background: #f8fafc;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .tbai-textarea:focus {
          border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
          background: #ffffff;
        }
        .tbai-textarea::placeholder { color: #94a3b8; }
        .tbai-send {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: #f97316; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: white; transition: background 0.15s, transform 0.15s;
        }
        .tbai-send:hover:not(:disabled) { background: #ea580c; transform: scale(1.03); }
        .tbai-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .tbai-footer {
          padding: 8px 16px; font-size: 10px; color: #94a3b8;
          text-align: center; border-top: 1px solid #f1f5f9;
          background: #fafbfc; flex-shrink: 0;
        }
      `}</style>

      <div className="tbai-widget">
        {open && (
          <div className="tbai-panel">

            {/* Header */}
            <div className="tbai-header">
              <div className="tbai-header-icon">
                <MessageSquare size={20} color="white" />
              </div>
              <div className="tbai-header-text">
                <h3>TaskBridge Assistant</h3>
                <p>
                  <span className="tbai-status-dot" />
                  Online · Ready to help
                </p>
              </div>
              <div className="tbai-header-actions">
                <button
                  className={`tbai-mode-toggle ${fullAIMode ? "tbai-mode-toggle--active" : ""}`}
                  onClick={() => setFullAIMode((v) => !v)}
                  title={fullAIMode ? "Smart mode on" : "Enable smart mode"}
                >
                  {fullAIMode ? <Brain size={12} /> : <Sparkles size={12} />}
                  {fullAIMode ? "Smart" : "Basic"}
                </button>
                <button className="tbai-icon-btn" onClick={clearChat} title="New conversation">
                  <RefreshCw size={14} />
                </button>
                <button className="tbai-icon-btn" onClick={() => setOpen(false)} title="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="tbai-messages">
              {messages.map((msg, idx) => (
                <div key={msg.id}>
                  <div className={`tbai-msg tbai-msg--${msg.role}`}>
                    <div className={`tbai-avatar tbai-avatar--${msg.role === "assistant" ? "ai" : "user"}`}>
                      {msg.role === "assistant"
                        ? <Bot size={15} />
                        : <User size={14} />}
                    </div>
                    <div className="tbai-msg-body">
                      <div className={`tbai-bubble tbai-bubble--${msg.role}`}>
                        {msg.role === "assistant" ? (
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                        ) : (
                          msg.text
                        )}

                        {msg.taskCards && msg.taskCards.length > 0 && (
                          <div className="tbai-cards">
                            {msg.taskCards.map((card) => (
                              <Link key={card.id} href={card.applyUrl} className="tbai-card" target="_blank">
                                <div className="tbai-card-cat">{card.category}</div>
                                <div className="tbai-card-info">
                                  <div className="tbai-card-title">{card.title}</div>
                                  {card.companyName && (
                                    <div className="tbai-card-company">{card.companyName}</div>
                                  )}
                                </div>
                                <div className="tbai-card-budget">{card.budget}</div>
                                <ChevronRight size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
                              </Link>
                            ))}
                          </div>
                        )}

                        {msg.actions && msg.actions.length > 0 && (
                          <div className="tbai-actions">
                            {msg.actions.map((action) => (
                              <Link key={action.url} href={action.url} className="tbai-action">
                                {action.label}
                                <ExternalLink size={9} />
                              </Link>
                            ))}
                          </div>
                        )}

                        {fullAIMode && msg.agentActions && msg.agentActions.filter((a) => a.url).length > 0 && (
                          <div className="tbai-agent-chips">
                            {msg.agentActions
                              .filter((a) => a.url)
                              .slice(0, 4)
                              .map((action, i) => (
                                <AgentActionChip key={i} action={action} />
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="tbai-time">
                        {msg.timestamp.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                      </div>

                      {/* Suggested replies — only on latest assistant message */}
                      {msg.role === "assistant" &&
                        msg.suggestedReplies &&
                        msg.suggestedReplies.length > 0 &&
                        idx === lastAssistantIdx &&
                        !loading && (
                        <div className="tbai-suggestions">
                          {msg.suggestedReplies.map((reply) => (
                            <button
                              key={reply}
                              className="tbai-suggestion"
                              onClick={() => sendMessage(reply)}
                              disabled={loading}
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts — shown at start */}
            {messages.length <= 1 && (
              <div className="tbai-quick">
                <span className="tbai-quick-label">Suggested topics</span>
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

            {/* Input */}
            <div className="tbai-input-row">
              <textarea
                ref={inputRef}
                className="tbai-textarea"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about tasks, payments, proposals…"
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
                  ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  : <Send size={16} />
                }
              </button>
            </div>

            <div className="tbai-footer">
              TaskBridge AI · Secure &amp; private conversation
            </div>
          </div>
        )}
      </div>
    </>
  );
}
