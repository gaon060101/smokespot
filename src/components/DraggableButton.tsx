import { useEffect, useRef, useState } from "react"
import QuitSmoking from "./QuitSmoking"

export default function DraggableButton() {
  const [pos, setPos] = useState({ x: 16, y: 220 })
  const [open, setOpen] = useState(false)

  const dragRef = useRef({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    moved: false,
  })

  const DRAG_THRESHOLD_PX = 6

  // 열려있을 때 ESC로 닫기
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <>
      {open && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
          style={ui.backdrop}
        >
          <div style={ui.widget} role="dialog" aria-label="금연 상담">
            <div style={ui.widgetHeader}>
              <div style={{ minWidth: 0 }}>
                <div style={ui.widgetKicker}>AI 금연 상담</div>
                <div style={ui.widgetTitle}>지금 한 번만 물어봐도 좋아요</div>
              </div>

              {/* <button
                type="button"
                onClick={() => setOpen(false)}
                style={ui.iconBtn}
                aria-label="닫기"
                title="닫기 (Esc)"
              >
                ×
              </button> */}
              
            </div>

            <div style={ui.widgetBody}>
              <QuitSmoking />
            </div>

            <div style={ui.widgetFooterHint}>
              팁: Enter로 전송, Shift+Enter로 줄바꿈
            </div>
          </div>
        </div>
      )}

      {/* Floating draggable button */}
      <button
        type="button"
        style={{
          ...ui.fab,
          left: pos.x,
          top: pos.y,
          cursor: dragRef.current.dragging ? "grabbing" : "grab",
        }}
        onPointerDown={(e) => {
          dragRef.current.dragging = true
          dragRef.current.moved = false
          dragRef.current.startX = e.clientX
          dragRef.current.startY = e.clientY

          const loc = e.currentTarget.getBoundingClientRect()
          dragRef.current.offsetX = e.clientX - loc.left
          dragRef.current.offsetY = e.clientY - loc.top

          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {}
        }}
        onPointerMove={(e) => {
          if (!dragRef.current.dragging) return

          const dx = e.clientX - dragRef.current.startX
          const dy = e.clientY - dragRef.current.startY
          if (!dragRef.current.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
            dragRef.current.moved = true
          }

          const nextX = e.clientX - dragRef.current.offsetX
          const nextY = e.clientY - dragRef.current.offsetY
          setPos({ x: nextX, y: nextY })
        }}
        onPointerUp={() => {
          const wasDrag = dragRef.current.moved
          dragRef.current.dragging = false
          if (!wasDrag) setOpen(true)
        }}
        onPointerCancel={() => {
          dragRef.current.dragging = false
        }}
        aria-label="금연 상담 열기"
        title="금연 상담"
      >
        <span style={ui.fabDot} />
        금연 상담
      </button>
    </>
  )
}

const ui: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.45)",
    zIndex: 2000,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: 16,
  },

  widget: {
    width: 380,
    maxWidth: "min(420px, calc(100vw - 32px))",
    height: 560,
    maxHeight: "calc(100vh - 32px)",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(226,232,240,0.9)",
    borderRadius: 16,
    boxShadow: "0 30px 90px rgba(2,6,23,.35)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    backdropFilter: "blur(10px)",
  },

  widgetHeader: {
    padding: "12px 12px 10px",
    borderBottom: "1px solid rgba(226,232,240,0.9)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.85) 100%)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  widgetKicker: { fontSize: 12, color: "#64748b", fontWeight: 800, letterSpacing: 0.2 },
  widgetTitle: {
    marginTop: 2,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 900,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 280,
  },

  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(226,232,240,0.9)",
    background: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontSize: 22,
    lineHeight: "30px",
    fontWeight: 900,
    color: "#0f172a",
  },

  widgetBody: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  },

  widgetFooterHint: {
    padding: "8px 12px",
    borderTop: "1px solid rgba(226,232,240,0.9)",
    fontSize: 11,
    color: "#64748b",
    background: "rgba(248,250,252,0.8)",
  },

  fab: {
    position: "absolute",
    zIndex: 1000,
    height: 44,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid rgba(226,232,240,1)",
    background: "rgba(15,23,42,0.95)",
    color: "#fff",
    fontWeight: 900,
    boxShadow: "0 16px 40px rgba(2,6,23,0.22)",
    userSelect: "none",
    touchAction: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  },

  fabDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)",
    boxShadow: "0 0 0 4px rgba(245,158,11,0.22)",
  },
}
