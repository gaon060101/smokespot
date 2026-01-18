let loadingPromise: Promise<void> | null = null

export function loadNaverMaps(): Promise<void> {
  if ((window as any).naver?.maps?.Service) return Promise.resolve()
  if (loadingPromise) return loadingPromise

  const ncpKeyId = import.meta.env.VITE_NAVER_MAPS_KEY_ID as string
  if (!ncpKeyId) throw new Error("VITE_NAVER_MAPS_KEY_ID is missing")

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      ncpKeyId
    )}&submodules=geocoder`
    script.async = true
    script.onerror = () => reject(new Error("Failed to load Naver Maps script"))

    script.onload = () => {
      const naver = (window as any).naver
      if (!naver?.maps) return reject(new Error("naver.maps not available"))

      naver.maps.onJSContentLoaded = () => resolve() // submodule 로드 완료 [web:48]
    }

    document.head.appendChild(script)
  })

  return loadingPromise
}
