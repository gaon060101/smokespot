import { useEffect, useMemo, useRef, useState } from "react"

type Msg = { role: "user" | "assistant"; text: string; ts: number }

function now() {
  return Date.now()
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

export default function QuitSmoking() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "금연 상담을 시작해볼까요?\n\n1) 하루에 몇 개비 피워요?\n2) 첫 담배는 보통 기상 후 몇 분 뒤예요?\n3) 오늘 목표: '참기' / '줄이기' / '대체하기' 중 뭐가 좋아요?",
      ts: now(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  useEffect(() => {
    // 새 메시지 오면 아래로 스크롤
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    setErr(null)
    setInput("")
    const userMsg: Msg = { role: "user", text, ts: now() }
    setMessages((m) => [...m, userMsg])
    setLoading(true)

    try {
      const r = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      const data = await r.json().catch(() => ({}))

      if (!r.ok) {
        const msg =
          data?.upstream?.error?.message ??
          data?.error ??
          `요청 실패 (${r.status})`
        throw new Error(msg)
      }

      const botText = String(data?.text ?? "").trim() || "응답이 비어 있어요."
      setMessages((m) => [...m, { role: "assistant", text: botText, ts: now() }])
    } catch (e: any) {
      setErr(e?.message ?? String(e))
    } finally {
      setLoading(false)
      // 다시 포커스
      inputRef.current?.focus()
    }
  }

  return (
    <div style={c.wrap}>
      <div ref={listRef} style={c.list} aria-label="대화 내용">
        {messages.map((m, i) => {
          const mine = m.role === "user"
          return (
            <div key={i} style={{ ...c.row, justifyContent: mine ? "flex-end" : "flex-start" }}>
              <div style={{ ...c.bubble, ...(mine ? c.bubbleMine : c.bubbleBot) }}>
                <div style={c.bubbleText}>{m.text}</div>
                <div style={{ ...c.meta, textAlign: mine ? "right" : "left" }}>
                  {mine ? "나" : "상담사"} · {formatTime(m.ts)}
                </div>
              </div>
            </div>
          )
        })}

        {loading && (
          <div style={{ ...c.row, justifyContent: "flex-start" }}>
            <div style={{ ...c.bubble, ...c.bubbleBot }}>
              <div style={c.typingRow}>
                <span style={c.dot} />
                <span style={{ ...c.dot, animationDelay: "120ms" }} />
                <span style={{ ...c.dot, animationDelay: "240ms" }} />
              </div>
              <div style={c.meta}>생각 중…</div>
            </div>
          </div>
        )}
      </div>

      {err && <div style={c.error}>{err}</div>}

      <div style={c.composer}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요…"
          rows={2}
          style={c.input}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.repeat) {
              e.preventDefault()
              send()
            }
          }}
        />

        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          style={{ ...c.sendBtn, ...(canSend ? {} : c.sendBtnDisabled) }}
        >
          전송
        </button>
      </div>
    </div>
  )
}

const c: Record<string, React.CSSProperties> = {
  wrap: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },

  list: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background:
      "radial-gradient(1200px 600px at 80% -20%, rgba(245,158,11,0.12), transparent 55%), linear-gradient(180deg, rgba(248,250,252,0.7), rgba(255,255,255,0.9))",
  },

  row: { display: "flex" },

  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    padding: "10px 12px",
    border: "1px solid rgba(226,232,240,0.9)",
    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
  },
  bubbleMine: {
    background: "rgba(15,23,42,0.95)",
    color: "#fff",
    borderColor: "rgba(15,23,42,0.95)",
  },
  bubbleBot: {
    background: "rgba(255,255,255,0.92)",
    color: "#0f172a",
  },

  bubbleText: {
    whiteSpace: "pre-wrap",
    fontSize: 13,
    lineHeight: 1.45,
  },

  meta: {
    marginTop: 6,
    fontSize: 11,
    color: "rgba(100,116,139,0.95)",
  },

  typingRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 0",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: "rgba(100,116,139,0.8)",
    animation: "qsDot 900ms infinite ease-in-out",
  },

  error: {
    margin: "10px 12px 0",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(254,202,202,1)",
    background: "rgba(254,242,242,1)",
    color: "#991b1b",
    fontSize: 12,
    lineHeight: 1.4,
  },

  composer: {
    display: "flex",
    gap: 10,
    padding: 12,
    borderTop: "1px solid rgba(226,232,240,0.9)",
    background: "rgba(255,255,255,0.92)",
  },

  input: {
    flex: 1,
    resize: "none",
    borderRadius: 14,
    border: "1px solid rgba(226,232,240,1)",
    padding: "10px 12px",
    outline: "none",
    fontSize: 13,
    lineHeight: 1.35,
    color: "#0f172a",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
  },

  sendBtn: {
    width: 72,
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.95)",
    background: "rgba(15,23,42,0.95)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(2,6,23,.16)",
  },
  sendBtnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
    boxShadow: "none",
  },
}

/**
 * 인라인 스타일만으로 keyframes를 못 넣어서,
 * 아래 CSS를 전역(예: src/index.css)에 한 번만 추가해줘.
 *
 * @keyframes qsDot {
 *   0%, 80%, 100% { transform: translateY(0); opacity: .45; }
 *   40% { transform: translateY(-4px); opacity: 1; }
 * }
 */
