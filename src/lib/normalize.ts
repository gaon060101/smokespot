export type Spot = {
  gu: string
  title: string
  addressText?: string
  lat?: number
  lng?: number
  raw: Record<string, any>
}

function num(v: any): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export const normalize = {
  gangbuk(row: any): Spot {
    return { gu: "강북구", title: row["시설 구분"] ?? "흡연구역", addressText: row["주소"], raw: row }
  },
  gwanak(row: any): Spot {
    return { gu: "관악구", title: row["구분"] ?? "흡연구역", addressText: row["위치"], raw: row }
  },
  gwangjin(row: any): Spot {
    return { gu: "광진구", title: row["시설명"] ?? row["구분"] ?? "흡연구역", addressText: row["영업소소재지(도로 명)"], raw: row }
  },
  guro(row: any): Spot {
    return {
      gu: "구로구",
      title: row["건물명"] ?? row["시설구분"] ?? "흡연구역",
      addressText: row["도로명주소"] ?? row["지번주소"],
      lat: num(row["위도"]),
      lng: num(row["경도"]),
      raw: row,
    }
  },
  nowon(row: any): Spot {
    return {
      gu: "노원구",
      title: row["구분"] ?? "흡연구역",
      addressText: row["위치"],
      lat: num(row["위도"]),
      lng: num(row["경도"]),
      raw: row,
    }
  },
  dongdaemun(row: any): Spot {
    return { gu: "동대문구", title: row["시설형태"] ?? "흡연구역", addressText: row["설치위치"], raw: row }
  },
  dongjak(row: any): Spot {
    return {
      gu: "동작구",
      title: row["장소"] ?? row["구분"] ?? "흡연구역",
      addressText: row["도로명주소"] ?? row["지번주소"],
      lat: num(row["위도"]),
      lng: num(row["경도"]),
      raw: row,
    }
  },
  seodaemun(row: any): Spot {
    return { gu: "서대문구", title: row["시설구분"] ?? row["시설형태"] ?? "흡연구역", addressText: row["설치위치"], raw: row }
  },
  seocho(row: any): Spot {
    return { gu: "서초구", title: row["시설형태"] ?? "흡연구역", addressText: row["설치위치"], raw: row }
  },
  seongdong(row: any): Spot {
    return { gu: "성동구", title: row["시설명"] ?? "흡연구역", addressText: row["설치위치"], raw: row }
  },
  songpa(row: any): Spot {
    return { gu: "송파구", title: row["건물명"] ?? row["구분"] ?? "흡연구역", addressText: row["도로명주소"], raw: row }
  },
  yeongdeungpo(row: any): Spot {
    return {
      gu: "영등포구",
      title: row["시설 구분"] ?? row["시설형태"] ?? "흡연구역",
      addressText: row["설치 위치"],
      lat: num(row["위도"]),
      lng: num(row["경도"]),
      raw: row,
    }
  },
  junggu(row: any): Spot {
    return { gu: "중구", title: row["구분"] ?? "흡연구역", addressText: row["설치도로명주소"], raw: row }
  },
  jungnang(row: any): Spot {
    return { gu: "중랑구", title: row["시설명(업소)"] ?? row["업종"] ?? "흡연구역", addressText: row["주소"], raw: row }
  },
}
