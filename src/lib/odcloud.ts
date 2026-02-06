export async function fetchAllPages<T>(
  baseUrlWithPagePerPage: string,
  serviceKey: string,
  perPage = 1000
): Promise<T[]> {
  const url1 = new URL(baseUrlWithPagePerPage)
  url1.searchParams.set("page", "1")
  url1.searchParams.set("perPage", String(perPage))
  url1.searchParams.set("serviceKey", serviceKey)
  console.log("ODcloud serviceKey len", serviceKey?.length)
  console.log("ODcloud URL raw", url1.toString())
  console.log("ODcloud URL bytes", Array.from(url1.toString()).slice(-80)) // 끝부분에 이상문자 있는지


  const r1 = await fetch(url1.toString())
  if (!r1.ok) throw new Error(`ODcloud fetch failed: ${r1.status}`)
  const j1 = await r1.json()

  const totalCount: number = j1.totalCount ?? 0
  const data1: T[] = j1.data ?? []

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))
  if (totalPages === 1) return data1

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }).map(async (_, i) => {
      const page = i + 2
      const u = new URL(baseUrlWithPagePerPage)
      u.searchParams.set("page", String(page))
      u.searchParams.set("perPage", String(perPage))
      u.searchParams.set("serviceKey", serviceKey)

      const r = await fetch(u.toString())
      if (!r.ok) throw new Error(`ODcloud fetch failed: ${r.status}`)
      const j = await r.json()
      return (j.data ?? []) as T[]
    })
  )

  return data1.concat(rest.flat())
}
