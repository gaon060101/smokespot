// src/lib/reviews.ts
import { auth, db } from "../firebase"
import type { Spot } from "./normalize"
import { spotIdOf } from "./spotId"
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  runTransaction,
  type Timestamp,
} from "firebase/firestore"

export type ReviewDoc = {
  uid: string
  displayName: string
  rating: number // 1~5
  text: string   // <= 500
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type SpotAggDoc = {
  gu: string
  title: string
  addressText: string
  numRatings: number
  ratingSum: number
  avgRating: number
  updatedAt: Timestamp | null
}

function spotDocRef(spotId: string) {
  return doc(db, "spots", spotId)
}
function reviewDocRef(spotId: string, uid: string) {
  return doc(db, "spots", spotId, "reviews", uid)
}

export async function upsertMyReviewWithAgg(spot: Spot, input: { rating: number; text: string }) {
  const user = auth.currentUser
  if (!user) throw new Error("로그인이 필요해요.")

  const rating = Math.floor(Number(input.rating))
  const text = String(input.text ?? "")

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error("별점은 1~5만 가능해요.")
  if (text.length > 500) throw new Error("후기는 500자 이하로 써줘.")

  const spotId = spotIdOf(spot)
  const sRef = spotDocRef(spotId)
  const rRef = reviewDocRef(spotId, user.uid)

  await runTransaction(db, async (tx) => {
    // 1) 읽기(트랜잭션 규칙: read 먼저) [web:217]
    const [spotSnap, reviewSnap] = await Promise.all([tx.get(sRef), tx.get(rRef)])

    const prevSpot = spotSnap.exists()
      ? (spotSnap.data() as any)
      : ({ numRatings: 0, ratingSum: 0, avgRating: 0 } as Partial<SpotAggDoc>)

    const prevReviewRating = reviewSnap.exists() ? Number((reviewSnap.data() as any).rating ?? 0) : null

    let numRatings = Number(prevSpot.numRatings ?? 0)
    let ratingSum = Number(prevSpot.ratingSum ?? 0)

    if (prevReviewRating == null) {
      // 새 리뷰
      numRatings += 1
      ratingSum += rating
    } else {
      // 기존 리뷰 수정
      ratingSum += rating - prevReviewRating
    }

    const avgRating = numRatings > 0 ? ratingSum / numRatings : 0
    const now = serverTimestamp()

    // 2) 쓰기: spot 집계 업데이트 + 리뷰 문서 업서트
    tx.set(
      sRef,
      {
        gu: spot.gu,
        title: spot.title,
        addressText: spot.addressText ?? "",
        numRatings,
        ratingSum,
        avgRating,
        updatedAt: now,
      },
      { merge: true }
    )

    tx.set(
      rRef,
      {
        uid: user.uid,
        displayName: user.displayName ?? "",
        rating,
        text,
        createdAt: reviewSnap.exists() ? (reviewSnap.data() as any).createdAt ?? null : now,
        updatedAt: now,
      },
      { merge: true }
    )
  })
}

// 최신 리뷰 N개
export async function fetchRecentReviews(spot: Spot, n = 20): Promise<ReviewDoc[]> {
  const spotId = spotIdOf(spot)
  const q = query(collection(db, "spots", spotId, "reviews"), orderBy("updatedAt", "desc"), limit(n))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as ReviewDoc)
}
