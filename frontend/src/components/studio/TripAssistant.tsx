"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ArrowUp, LoaderCircle, Sparkles } from "lucide-react";
import { tripsService } from "@/services/trips.service";
import { errorMessage } from "@/services/api";
import type { ChatMessage } from "@/types/models";

export function TripAssistant({
  tripId,
  destination,
  sample,
}: {
  tripId: string;
  destination: string;
  sample: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || busy || sample) return;
    const text = input.trim();
    setBusy(true);
    setError("");
    const history = messages
      .slice(-20)
      .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));
    setMessages((previous) => [...previous, { role: "user", content: text }]);
    setInput("");
    try {
      const reply = await tripsService.chat(tripId, text, history);
      setMessages((previous) => [
        ...previous,
        { role: "model", content: reply.message },
      ]);
    } catch (cause) {
      setError(errorMessage(cause));
      setInput(text);
      setMessages((previous) => previous.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="card overflow-hidden">
      <div className="border-b line p-6">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={18} />
          <h2 className="font-semibold">A little local thinking.</h2>
        </div>
        <p className="muted text-sm leading-6">
          Ask about your trip to {destination}. AI suggestions are not live
          availability or verified local advice.
        </p>
      </div>
      <div
        className="max-h-[450px] min-h-64 space-y-5 overflow-y-auto p-6"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <Sparkles
              size={28}
              strokeWidth={1.2}
              className="mx-auto mb-4 muted"
            />
            <p className="text-base">
              What would make this trip a little more you?
            </p>
            <p className="muted mx-auto mb-5 mt-2 max-w-sm text-sm leading-6">
              Try asking for rainy-day alternatives, vegetarian food spots, or a
              slower-paced afternoon.
            </p>
            {sample ? (
              <Link href="/plan" className="btn btn-secondary text-sm">
                Plan your trip to chat with your assistant
              </Link>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "What if it rains?",
                  "Suggest vegetarian food",
                  "Make time for a slow morning",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-full border line px-3 py-2 text-[12px] hover:bg-[var(--soft)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[90%] rounded-xl p-4 text-base leading-7 ${message.role === "user" ? "ml-auto soft" : "border line"}`}
          >
            <p className="eyebrow muted mb-2 !text-[12px]">
              {message.role === "user" ? "YOU" : "YATRIK"}
            </p>
            <ReactMarkdown
              components={{
                a: ({ children }) => <span>{children}</span>,
                img: () => null,
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5">{children}</ol>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
        {busy && (
          <p role="status" className="muted flex items-center gap-2 text-sm">
            <LoaderCircle size={14} className="animate-spin" /> Connecting a few
            dots…
          </p>
        )}
        <div ref={end} />
      </div>
      {error && (
        <p role="alert" className="px-6 pb-4 text-sm text-[var(--error)]">
          {error}
        </p>
      )}
      <form onSubmit={send} className="flex gap-3 border-t line p-4">
        <label className="sr-only" htmlFor="assistant-message">
          Ask your travel assistant
        </label>
        <input
          id="assistant-message"
          className="field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="A question, a what-if, a little change of plan…"
          disabled={sample || busy}
          maxLength={1000}
        />
        <button
          className="btn btn-primary !h-12 !w-12 !p-0"
          aria-label="Send message"
          disabled={sample || busy || !input.trim()}
        >
          <ArrowUp size={18} />
        </button>
      </form>
      <p className="muted px-5 pb-4 text-[12px]">
        Messages are shared with Gemini. Don’t include personal or sensitive
        information. Chat history lasts for this visit.
      </p>
    </div>
  );
}
