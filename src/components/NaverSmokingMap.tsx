import { useEffect, useMemo, useRef, useState } from "react"
import { loadNaverMaps } from "../lib/naverMapsLoader"
import { fetchAllPages } from "../lib/odcloud"
import type { Spot } from "../lib/normalize"
import { normalize } from "../lib/normalize"
import { getCurrentLatLng, reverseGeocodeToGu } from "../lib/location"
import ReviewPanel from "../components/ReviewPanel"

type GuConfig = { gu: string; url: string; normalize: (row: any) => Spot }

const GU_CONFIGS: GuConfig[] = [
  { gu: "강북구", url: "https://api.odcloud.kr/api/15049030/v1/uddi:0d7a603a-608e-481a-8ff0-a4cd23d7c449?page=1&perPage=10", normalize: normalize.gangbuk },
  { gu: "관악구", url: "https://api.odcloud.kr/api/15040591/v1/uddi:eba119bb-1ead-41dd-94be-aba2885356f7?page=1&perPage=10", normalize: normalize.gwanak },
  { gu: "광진구", url: "https://api.odcloud.kr/api/15040615/v1/uddi:d494c578-f45e-4c42-9dde-c277cbd8717a?page=1&perPage=10", normalize: normalize.gwangjin },
  { gu: "구로구", url: "https://api.odcloud.kr/api/15069274/v1/uddi:e4f910f0-cad9-440b-9fa8-bf3fd0b0b499?page=1&perPage=10", normalize: normalize.guro },
  { gu: "노원구", url: "https://api.odcloud.kr/api/15078097/v1/uddi:be856a2f-2b4b-42f7-a341-9e15cd5eb80b?page=1&perPage=10", normalize: normalize.nowon },
  { gu: "동대문구", url: "https://api.odcloud.kr/api/15070168/v1/uddi:aef69bb4-d848-4088-9abd-f6e3dd361cfb?page=1&perPage=10", normalize: normalize.dongdaemun },
  { gu: "동작구", url: "https://api.odcloud.kr/api/15049031/v1/uddi:03e47093-48b5-442c-a6a5-bd756148f6ae?page=1&perPage=10", normalize: normalize.dongjak },
  { gu: "서대문구", url: "https://api.odcloud.kr/api/15040413/v1/uddi:280fb8c7-7bd8-4633-896e-99a76d23d2de?page=1&perPage=10", normalize: normalize.seodaemun },
  { gu: "서초구", url: "https://api.odcloud.kr/api/15074379/v1/uddi:2c49abeb-cd4c-4639-8160-b2e648076cae?page=1&perPage=10", normalize: normalize.seocho },
  { gu: "성동구", url: "https://api.odcloud.kr/api/15029169/v1/uddi:c106e496-6ae4-4f24-baf3-c4014b678d30?page=1&perPage=10", normalize: normalize.seongdong },
  { gu: "송파구", url: "https://api.odcloud.kr/api/15090343/v1/uddi:7f5d9c71-fdc4-4a83-8c60-fa980eb70465?page=1&perPage=10", normalize: normalize.songpa },
  { gu: "영등포구", url: "https://api.odcloud.kr/api/15069051/v1/uddi:51a46754-1f5c-4490-aefa-a86d8c92cebf?page=1&perPage=10", normalize: normalize.yeongdeungpo },
  { gu: "중구", url: "https://api.odcloud.kr/api/15080296/v1/uddi:ea9e4970-741d-433b-9f60-de9dc0f2a9c5?page=1&perPage=10", normalize: normalize.junggu },
  { gu: "중랑구", url: "https://api.odcloud.kr/api/15040636/v1/uddi:dc7ed6ee-001f-4312-a75a-ed408fd01f62?page=1&perPage=10", normalize: normalize.jungnang },
]

const DEFAULT_CENTER = { lat: 37.565, lng: 126.931 }
const DEFAULT_GU = "서대문구"

// 네이버 지도 URL Scheme: appname 필수 [web:110]
const APPNAME = "smokespot-web"
const COORDS_CACHE_PREFIX = "smokespot:coords:" // + gu

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "'")
}

function buildPrettyHtml(spot: Spot) {
  const entries = Object.entries(spot.raw)
  const rows = entries
    .slice(0, 30)
    .map(([k, v]) => {
      const key = escapeHtml(String(k))
      const val = escapeHtml(String(v ?? ""))
      return `
        <div style="display:flex; gap:10px; padding:6px 0; border-top:1px solid #f1f5f9;">
          <div style="width:92px; flex:0 0 92px; color:#64748b;">${key}</div>
          <div style="flex:1; color:#0f172a; word-break:break-word;">${val}</div>
        </div>
      `
    })
    .join("")

  const title = escapeHtml(`${spot.gu} · ${spot.title}`)
  const addr = spot.addressText ? escapeHtml(spot.addressText) : ""

  return `
    <div style="
      width:320px;
      max-width:320px;
      background:#ffffff;
      border:1px solid #e2e8f0;
      border-radius:16px;
      box-shadow:0 18px 40px rgba(2,6,23,.15);
      overflow:hidden;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', Arial;
    ">
      <div style="padding:12px 14px; border-bottom:1px solid #e2e8f0;">
        <div style="font-size:12px; color:#64748b;">흡연구역 정보</div>
        <div style="margin-top:2px; font-size:16px; font-weight:700; color:#0f172a; line-height:1.2;">${title}</div>
        ${addr ? `<div style="margin-top:6px; font-size:12px; color:#334155; line-height:1.25;">${addr}</div>` : ""}
      </div>
      <div style="padding:10px 14px; max-height:180px; overflow:auto;">
        ${rows || `<div style="color:#64748b; font-size:12px;">표시할 데이터가 없어요.</div>`}
      </div>
      <div style="padding:10px 14px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b;">
        지도를 누르면 닫혀요.
      </div>
    </div>
  `
}

function myLocationIconHtml() {
  return `
    <div style="
      width:18px; height:18px;
      border-radius:999px;
      background:#2563eb;
      border:3px solid #ffffff;
      box-shadow:0 10px 18px rgba(2,6,23,.22);
      box-sizing:border-box;
    "></div>
  `
}

// 거리(m)
function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

function openNaverWalkRoute(params: {
  start: { lat: number; lng: number; name?: string }
  dest: { lat: number; lng: number; name?: string }
}) {
  const { start, dest } = params

  // 도보 길찾기: /route/walk, appname 필수 [web:110]
  const nmapUrl =
    `nmap://route/walk?` +
    `slat=${encodeURIComponent(String(start.lat))}` +
    `&slng=${encodeURIComponent(String(start.lng))}` +
    `&sname=${encodeURIComponent(start.name ?? "현재 위치")}` +
    `&dlat=${encodeURIComponent(String(dest.lat))}` +
    `&dlng=${encodeURIComponent(String(dest.lng))}` +
    `&dname=${encodeURIComponent(dest.name ?? "흡연구역")}` +
    `&appname=${encodeURIComponent(APPNAME)}`

  window.location.href = nmapUrl
}

function readGuCoordsCache(gu: string): Record<string, { lat: number; lng: number }> {
  try {
    const raw = localStorage.getItem(COORDS_CACHE_PREFIX + gu)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    return obj && typeof obj === "object" ? obj : {}
  } catch {
    return {}
  }
}

function writeGuCoordsCache(gu: string, cache: Record<string, { lat: number; lng: number }>) {
  try {
    localStorage.setItem(COORDS_CACHE_PREFIX + gu, JSON.stringify(cache))
  } catch {
    // 저장 실패(용량, 프라이빗 모드 등)면 무시
  }
}

export default function NaverSmokingMap() {
  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)

  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  const myMarkerRef = useRef<any>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentGu, setCurrentGu] = useState<string | null>(null)
  const [myLatLng, setMyLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [spots, setSpots] = useState<Spot[]>([])

  const serviceKey = useMemo(() => import.meta.env.VITE_DATA_GO_KR_SERVICE_KEY as string, [])
  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map())

  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)

  function setOrMoveMyMarker(naver: any, latlng: { lat: number; lng: number }) {
    const pos = new naver.maps.LatLng(latlng.lat, latlng.lng)

    if (!myMarkerRef.current) {
      myMarkerRef.current = new naver.maps.Marker({
        map: mapRef.current,
        position: pos,
        icon: {
          content: myLocationIconHtml(),
          size: new naver.maps.Size(18, 18),
          anchor: new naver.maps.Point(9, 9),
        },
        zIndex: 10_000,
      })
    } else {
      myMarkerRef.current.setPosition(pos)
    }
  }

  function moveToMyLocation(animated = true) {
    const naver = (window as any).naver
    const map = mapRef.current
    if (!naver?.maps || !map || !myLatLng) return

    const target = new naver.maps.LatLng(myLatLng.lat, myLatLng.lng)
    if (animated && typeof map.panTo === "function") map.panTo(target)
    else map.setCenter(target)
  }

  async function clearSpotMarkers() {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
  }

  async function loadGuSpots(gu: string) {
    const cfg = GU_CONFIGS.find((c) => c.gu === gu)
    if (!cfg) throw new Error(`지원하지 않는 구예요: ${gu}`)
    const rows = await fetchAllPages<any>(cfg.url, serviceKey, 1000)
    return rows.map(cfg.normalize)
  }

  async function geocodeAddressToCoords(naver: any, query: string): Promise<{ lat: number; lng: number } | null> {
    // geocode 사용법은 공식 튜토리얼 패턴 [web:33]
    return new Promise((resolve) => {
      naver.maps.Service?.geocode?.({ query }, (status: any, response: any) => {
        if (status !== naver.maps.Service.Status.OK) return resolve(null)
        const items = response?.v2?.addresses ?? []
        if (!items.length) return resolve(null)
        const x = Number(items[0].x)
        const y = Number(items[0].y)
        if (!Number.isFinite(x) || !Number.isFinite(y)) return resolve(null)
        resolve({ lat: y, lng: x })
      })
    })
  }

  async function resolveSpotLatLng(naver: any, spot: Spot): Promise<{ lat: number; lng: number } | null> {
    if (Number.isFinite(spot.lat) && Number.isFinite(spot.lng)) {
      return { lat: spot.lat!, lng: spot.lng! }
    }
    if (!spot.addressText) return null

    const q = spot.addressText.trim()
    if (!q) return null

    const cached = geocodeCacheRef.current.get(q)
    if (cached) return cached

    const coords = await geocodeAddressToCoords(naver, q)
    if (coords) geocodeCacheRef.current.set(q, coords)
    return coords
  }

  async function addSpotMarker(naver: any, spot: Spot) {
    const coords = await resolveSpotLatLng(naver, spot)
    if (!coords) return

    // 좌표를 spot에도 채워둬서(길찾기/거리계산에 그대로 사용)
    spot.lat = coords.lat
    spot.lng = coords.lng

    // 구 단위 localStorage 캐시에도 저장
    const cache = readGuCoordsCache(spot.gu)
    cache[spot.addressText?.trim() ?? ""] = coords
    writeGuCoordsCache(spot.gu, cache)

    const marker = new naver.maps.Marker({
      map: mapRef.current,
      position: new naver.maps.LatLng(coords.lat, coords.lng),
    })

    naver.maps.Event.addListener(marker, "click", () => {
      const iw = infoWindowRef.current
      if (!iw) return
      iw.setContent(buildPrettyHtml(spot))
      iw.open(mapRef.current, marker)
      setSelectedSpot({...spot})
    })

    markersRef.current.push(marker)
  }

  async function handleRecenter() {
    const naver = (window as any).naver
    if (!naver?.maps || !mapRef.current) return

    setLoading(true)
    setError(null)

    try {
      const latlng = await getCurrentLatLng()
      setMyLatLng(latlng)
      setOrMoveMyMarker(naver, latlng)
      moveToMyLocation(true)

      // 위치가 다른 구면 해당 구로 재로딩
      let gu = await reverseGeocodeToGu(naver, latlng)
      if (!gu) gu = DEFAULT_GU
      setCurrentGu(gu)

      // localStorage 캐시 로드 -> 메모리 캐시에 주입
      const saved = readGuCoordsCache(gu)
      for (const [addr, c] of Object.entries(saved)) geocodeCacheRef.current.set(addr, c)

      const loaded = await loadGuSpots(gu)
      setSpots(loaded)

      await clearSpotMarkers()
      for (const s of loaded) await addSpotMarker(naver, s)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleWalkToNearest() {
    const naver = (window as any).naver
    if (!naver?.maps?.Service) {
      setError("지도 서비스가 아직 준비되지 않았어요.")
      return
    }
    if (!myLatLng) {
      setError("현재 위치가 없어서 길찾기를 시작할 수 없어요.")
      return
    }
    if (!spots.length) {
      setError("흡연구역 데이터가 아직 없어요.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1) 가능한 한 캐시/spot.latlng를 사용
      // 2) 좌표 없는 spot은 일부만 지오코딩해서 보완(정확도 확보)
      const MAX_GEOCODE = 80
      let geocoded = 0

      let best: { spot: Spot; lat: number; lng: number } | null = null
      let bestD = Infinity

      for (const s of spots) {
        let coords: { lat: number; lng: number } | null = null

        if (Number.isFinite(s.lat) && Number.isFinite(s.lng)) {
          coords = { lat: s.lat!, lng: s.lng! }
        } else {
          if (geocoded >= MAX_GEOCODE) continue
          coords = await resolveSpotLatLng(naver, s)
          if (coords) {
            geocoded++

            // spot + localStorage 캐시 업데이트(다음부터 빨라짐)
            s.lat = coords.lat
            s.lng = coords.lng
            if (s.addressText) {
              const cache = readGuCoordsCache(s.gu)
              cache[s.addressText.trim()] = coords
              writeGuCoordsCache(s.gu, cache)
            }
          }
        }

        if (!coords) continue

        const d = haversineMeters(myLatLng, coords)
        if (d < bestD) {
          bestD = d
          best = { spot: s, lat: coords.lat, lng: coords.lng }
        }
      }

      if (!best) {
        setError("가까운 흡연구역을 찾을 수 없어요(좌표/주소 데이터가 부족해요).")
        return
      }

      openNaverWalkRoute({
        start: { lat: myLatLng.lat, lng: myLatLng.lng, name: "현재 위치" },
        dest: { lat: best.lat, lng: best.lng, name: `${best.spot.gu} ${best.spot.title}` },
      })
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  // 초기 로딩: 내 위치 중심 + 내 위치 마커 + 내 구만 로드 + (구 캐시 로드)
  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setLoading(true)
        setError(null)

        await loadNaverMaps()
        if (cancelled) return

        const naver = (window as any).naver
        if (!naver?.maps) throw new Error("naver.maps missing (script load failed)")

        if (!mapRef.current) {
          if (!mapDivRef.current) throw new Error("map container is null")
          mapRef.current = new naver.maps.Map(mapDivRef.current, {
            center: new naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
            zoom: 12,
          })

          naver.maps.Event.addListener(mapRef.current, "click", () => {
            if (infoWindowRef.current?.getMap()) infoWindowRef.current.close()
            setSelectedSpot(null) // 후기 패널 닫기
          })

          infoWindowRef.current = new naver.maps.InfoWindow({ maxWidth: 340 })

          setTimeout(() => {
            try {
              naver.maps.Event.trigger(mapRef.current, "resize")
            } catch {}
          }, 0)
        }

        // 내 위치
        let latlng = DEFAULT_CENTER
        // try {
        //   latlng = await getCurrentLatLng()
        // } catch {}
        // if (cancelled) return
        // 위 4줄 주석 풀면 현재 위치로 로딩되고 주석하면 DEFAULT_CENTER로 로딩

        setMyLatLng(latlng)
        mapRef.current.setCenter(new naver.maps.LatLng(latlng.lat, latlng.lng))
        setOrMoveMyMarker(naver, latlng)

        // 내 구
        let gu = await reverseGeocodeToGu(naver, latlng)
        if (!gu) gu = DEFAULT_GU
        if (cancelled) return

        setCurrentGu(gu)

        // localStorage 캐시 로드 -> 메모리 Map에 주입
        const saved = readGuCoordsCache(gu)
        for (const [addr, c] of Object.entries(saved)) geocodeCacheRef.current.set(addr, c)

        // 구 데이터 로드
        const loaded = await loadGuSpots(gu)
        if (cancelled) return

        setSpots(loaded)

        await clearSpotMarkers()
        for (const s of loaded) {
          if (cancelled) return
          await addSpotMarker(naver, s)
        }
      } catch (e: any) {
        setError(e?.message ?? String(e))
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [serviceKey])

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />

      {/* 내 위치로 */}
      <button
        onClick={handleRecenter}
        style={{
          position: "absolute",
          right: 14,
          bottom: 140,
          zIndex: 1000,
          background: "rgba(255,255,255,.95)",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "10px 12px",
          boxShadow: "0 12px 28px rgba(2,6,23,.12)",
          cursor: "pointer",
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        내 위치로
      </button>

      {/* 가장 가까운 흡연구역 도보 길찾기 */}
      <button
        onClick={handleWalkToNearest}
        style={{
          position: "absolute",
          right: 14,
          bottom: 86,
          zIndex: 1000,
          background: "rgba(15,23,42,.95)",
          border: "1px solid rgba(15,23,42,.95)",
          borderRadius: 14,
          padding: "10px 12px",
          boxShadow: "0 12px 28px rgba(2,6,23,.12)",
          cursor: "pointer",
          fontWeight: 900,
          color: "#fff",
        }}
      >
        가까운 흡연구역 길찾기(도보)
      </button>

      {(loading || error || currentGu) && (
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              background: "rgba(255,255,255,.92)",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "10px 12px",
              boxShadow: "0 12px 28px rgba(2,6,23,.12)",
              fontSize: 12,
              color: "#0f172a",
              maxWidth: 560,
            }}
          >
            {loading
              ? "현재 위치 기반으로 로딩 중..."
              : error
              ? `에러: ${error}`
              : currentGu
              ? `현재 구: ${currentGu}`
              : ""}
          </div>
        </div>
      )}
      {selectedSpot && (
        <ReviewPanel spot={selectedSpot} onClose={() => setSelectedSpot(null)} />
      )}

    </div>
    
  )
  
}

