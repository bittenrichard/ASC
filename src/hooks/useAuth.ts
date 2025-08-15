import { useState, useEffect } from 'react'
import { mockAuth, type MockUser, type UserRole } from '../lib/mockAuth'

export type { UserRole, MockUser as AuthUser }

export function useAuth() {
  const [user, setUser] = useState<MockUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obter usuário atual
    const currentUser = mockAuth.getCurrentUser()
    setUser(currentUser)
    setLoading(false)

    // Escutar mudanças de autenticação
    const unsubscribe = mockAuth.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    const result = await mockAuth.signIn(email, password)
    return {
      error: result.error ? { message: result.error } : null
    }
  }

  const signOut = async () => {
    await mockAuth.signOut()
    return { error: null }
  }

  return {
    user,
    loading,
    signIn,
    signOut
  }
}