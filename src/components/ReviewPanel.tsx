// src/components/ReviewPanel.tsx
import { useEffect, useMemo, useState } from "react"
import type { Spot } from "../lib/normalize"
import { fetchRecentReviews, upsertMyReviewWithAgg, type ReviewDoc } from "../lib/reviews"

function fmtName(r: ReviewDoc) {
  const name = (r.displayName ?? "").trim()
  if (name) return name
  return r.uid ? `${r.uid.slice(0, 6)}…` : "익명"
}

function StarsView({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.floor(Number(value) || 0)))
  return (
    <div style={styles.starsView} aria-label={`${v}점`} title={`${v}점`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={i < v ? styles.starFilledSm : styles.starEmptySm}>★</span>
      ))}
    </div>
  )
}

export default function ReviewPanel({ spot, onClose }: { spot: Spot; onClose: () => void }) {
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState<number | null>(null)
  const [text, setText] = useState("")
  const [rows, setRows] = useState<ReviewDoc[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const title = useMemo(() => `${spot.gu} · ${spot.title}`, [spot.gu, spot.title])
  const addr = useMemo(() => (spot.addressText ?? "").trim(), [spot.addressText])

  async function reload() {
    const r = await fetchRecentReviews(spot, 30)
    setRows(r)
  }

  useEffect(() => {
    setErr(null)
    reload().catch((e) => setErr(e?.message ?? String(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot.gu, spot.title, spot.addressText])

  const submit = async () => {
    setBusy(true)
    setErr(null)
    try {
      await upsertMyReviewWithAgg(spot, { rating, text: text.trim() })
      setText("")
      await reload()
    } catch (e: any) {
      setErr(e?.message ?? String(e))
    } finally {
      setBusy(false)
    }
  }

  const shown = hover ?? rating

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.headerKicker}>후기</div>
          <div style={styles.headerTitle} title={title}>{title}</div>
          {addr && <div style={styles.headerAddr} title={addr}>{addr}</div>}
        </div>
        
      </div>

      <div style={styles.body}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>내 후기 남기기</div>

          <div style={{ marginTop: 10 }}>
            <div style={styles.labelRow}>
              <div style={styles.label}>별점</div>
              <div style={styles.hint}>클릭해서 선택</div>
            </div>

            {/* 별이 "차는" UI: hover 값 기준으로 미리보기 */}
            <div style={styles.starsRow} onMouseLeave={() => setHover(null)}>
              {[1, 2, 3, 4, 5].map((v) => {
                const active = v <= shown
                return (
                  <button
                    key={v}
                    type="button"
                    onMouseEnter={() => setHover(v)}
                    onFocus={() => setHover(v)}
                    onClick={() => setRating(v)}
                    style={{
                      ...styles.starBtn,
                      ...(active ? styles.starBtnOn : styles.starBtnOff),
                    }}
                    aria-label={`${v}점`}
                    title={`${v}점`}
                  >
                    ★
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={styles.labelRow}>
              <div style={styles.label}>후기</div>
              <div style={styles.hint}>{text.length}/500</div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              style={styles.textarea}
              placeholder="예) 위치가 찾기 쉬워요 / 바람막이가 있어요 / 사람 많아요"
            />
          </div>

          {err && <div style={styles.errorBox}>에러: {err}</div>}

          <button
            onClick={submit}
            disabled={busy || text.trim().length === 0}
            style={{
              ...styles.primaryBtn,
              ...(busy || text.trim().length === 0 ? styles.primaryBtnDisabled : {}),
            }}
          >
            {busy ? "저장 중..." : "저장하기"}
          </button>
        </div>

        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>최근 후기</div>
          <button onClick={() => reload().catch(() => {})} style={styles.ghostBtn} disabled={busy}>
            새로고침
          </button>
        </div>

        <div style={styles.list}>
          {rows.length === 0 ? (
            <div style={styles.empty}>아직 후기가 없어요.</div>
          ) : (
            rows.map((r) => (
              <div key={r.uid} style={styles.reviewCard}>
                <div style={styles.reviewTop}>
                  <div style={styles.reviewer}>{fmtName(r)}</div>
                  <StarsView value={r.rating} />
                </div>
                <div style={styles.reviewText}>{r.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  // backdrop 제거: panel만 fixed로
  panel: {
    position: "fixed",
    right: 16,
    top: 16,
    bottom: 16,
    width: "min(420px, 92vw)",
    zIndex: 99999,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    boxShadow: "0 30px 80px rgba(2,6,23,.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  header: {
    padding: "14px 14px 12px",
    borderBottom: "1px solid #e2e8f0",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  headerKicker: { fontSize: 12, color: "#64748b", fontWeight: 700 },
  headerTitle: { marginTop: 2, fontSize: 16, fontWeight: 900, color: "#0f172a", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 },
  headerAddr: { marginTop: 6, fontSize: 12, color: "#334155", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0", background: "rgba(255,255,255,.9)", cursor: "pointer", fontSize: 20, lineHeight: "32px", fontWeight: 900, color: "#0f172a" },

  body: { padding: 14, overflow: "auto", display: "flex", flexDirection: "column", gap: 12 },

  card: { border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, background: "#fff", boxShadow: "0 12px 30px rgba(2,6,23,.06)" },
  cardTitle: { fontSize: 14, fontWeight: 900, color: "#0f172a" },

  labelRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 12, fontWeight: 800, color: "#0f172a" },
  hint: { fontSize: 12, color: "#64748b" },

  starsRow: { display: "flex", alignItems: "center", gap: 6, marginTop: 8 },
  // “차는 느낌”: 채워진 별은 노란색 + 살짝 그림자
  starBtn: { width: 40, height: 40, borderRadius: 999,  cursor: "pointer", fontSize: 20, lineHeight: "38px", textAlign: "center", userSelect: "none", background: "#fff", padding: 0, outline:"none"},
  starBtnOn: { color: "#f59e0b", border: "white" },
  starBtnOff: { color: "#cbd5e1" },

  textarea: { marginTop: 8, width: "100%", resize: "vertical", minHeight: 90, borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 12px", outline: "none", fontSize: 13, lineHeight: 1.4, color: "#0f172a", background: "#fff" },

  errorBox: { marginTop: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontSize: 12 },

  primaryBtn: { marginTop: 10, width: "100%", height: 44, borderRadius: 12, border: "1px solid rgba(15,23,42,0.95)", background: "rgba(15,23,42,0.95)", color: "#fff", fontWeight: 900, cursor: "pointer", boxShadow: "0 12px 28px rgba(2,6,23,.18)" },
  primaryBtnDisabled: { opacity: 0.55, cursor: "not-allowed", boxShadow: "none" },

  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: 900, color: "#0f172a" },
  ghostBtn: { height: 32, padding: "0 10px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", cursor: "pointer", fontWeight: 800, fontSize: 12 },

  list: { display: "grid", gap: 10 },
  empty: { padding: 12, borderRadius: 14, border: "1px dashed #cbd5e1", background: "#f8fafc", color: "#475569", fontSize: 12, lineHeight: 1.4 },

  reviewCard: { border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, background: "#fff" },
  reviewTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  reviewer: { fontSize: 12, fontWeight: 900, color: "#0f172a" },
  reviewText: { marginTop: 6, fontSize: 13, color: "#0f172a", lineHeight: 1.45, whiteSpace: "pre-wrap" },

  starsView: { display: "flex", alignItems: "center", gap: 2 },
  starFilledSm: { color: "#f59e0b", fontSize: 14, lineHeight: "14px" },
  starEmptySm: { color: "#e2e8f0", fontSize: 14, lineHeight: "14px" },
}
