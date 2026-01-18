import { useAuth } from "./auth/useAuth"
import NaverSmokingMap from "./components/NaverSmokingMap"

export default function App() {
  const { user, loading, error, login, logout } = useAuth()

  if (loading) {
    return <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>로딩 중...</div>
  }

  if (!user) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>
        <div style={{ width: 360, maxWidth: "90vw", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 18, boxShadow: "0 18px 40px rgba(2,6,23,.12)" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>SmokeSpot</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
            구글 로그인 후 지도에서 흡연구역을 확인할 수 있어요.
          </div>

          {error && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fee2e2", padding: 10, borderRadius: 12 }}>
              {error}
            </div>
          )}

          <button
            onClick={login}
            style={{ marginTop: 14, width: "100%", borderRadius: 14, padding: "12px 14px", background: "#0f172a", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
          >
            Google 로그인
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: "relative" }}>
      <NaverSmokingMap />

      {/* 로그인 바 (오버레이) */}
      <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ background: "rgba(255,255,255,.92)", border: "1px solid #e2e8f0", borderRadius: 16, padding: "10px 12px", boxShadow: "0 12px 28px rgba(2,6,23,.12)" }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>로그인됨</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            {user.displayName ?? "사용자"} <span style={{ fontWeight: 500, color: "#64748b" }}>({user.email})</span>
          </div>
        </div>

        <button
          onClick={logout}
          style={{ background: "rgba(255,255,255,.92)", border: "1px solid #e2e8f0", borderRadius: 16, padding: "10px 12px", boxShadow: "0 12px 28px rgba(2,6,23,.12)", cursor: "pointer", fontWeight: 700, color: "black" }}
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
