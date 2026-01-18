import { useEffect, useState } from "react"
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth"
import { auth, googleProvider } from "../firebase"
import type { User } from "firebase/auth"
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  async function login() {
    setError(null)
    await signInWithPopup(auth, googleProvider) // Google 로그인 [web:112]
  }

  async function logout() {
    await signOut(auth)
  }

  return { user, loading, error, login, logout }
}
