// src/lib/location.ts
export type LatLng = { lat: number; lng: number }

export function getCurrentLatLng(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저는 Geolocation을 지원하지 않아요."))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "현재 위치를 가져오지 못했어요.")),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60_000,
      }
    )
  })
}

export function reverseGeocodeToGu(naver: any, latlng: LatLng): Promise<string | null> {
  return new Promise((resolve) => {
    if (!naver?.maps?.Service?.reverseGeocode) return resolve(null)

    const coords = new naver.maps.LatLng(latlng.lat, latlng.lng)

    naver.maps.Service.reverseGeocode(
      {
        coords,
        orders: [
          naver.maps.Service.OrderType.ADDR,
          naver.maps.Service.OrderType.ROAD_ADDR,
        ].join(","),
      },
      (status: any, response: any) => {
        if (status !== naver.maps.Service.Status.OK) return resolve(null)
        const results = response?.v2?.results ?? []
        if (!results.length) return resolve(null)

        const region = results[0]?.region
        const gu = region?.area2?.name ? String(region.area2.name).trim() : null
        resolve(gu || null)
      }
    )
  })
}
