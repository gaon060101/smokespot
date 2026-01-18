import { useEffect, useState } from "react"

declare global {
  interface Window {
    naver: any
  }
}

export function useNaverMaps() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (window.naver?.maps) {
      setReady(true)
      return
    }

    if (document.getElementById("naver-maps-sdk")) return

    const script = document.createElement("script")
    script.id = "naver-maps-sdk"
    script.async = true
    script.defer = true
    script.src =
      `https://oapi.map.naver.com/openapi/v3/maps.js` +
      `?ncpKeyId=${import.meta.env.VITE_NAVER_MAPS_CLIENT_ID}` +
      `&submodules=geocoder` // [web:128]

    script.onload = () => setReady(true)
    document.head.appendChild(script)
  }, [])

  return { ready }
}
