// Sistema de autenticação mock para demonstração
export type UserRole = 'sdr' | 'manager' | null

export interface MockUser {
  id: string
  email: string
  name: string
  role: UserRole
}

// Usuários de demonstração
const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'joao.silva@empresa.com',
    name: 'João Silva',
    role: 'sdr'
  },
  {
    id: '2',
    email: 'maria.santos@empresa.com',
    name: 'Maria Santos',
    role: 'manager'
  },
  {
    id: '3',
    email: 'pedro.oliveira@empresa.com',
    name: 'Pedro Oliveira',
    role: 'sdr'
  }
]

class MockAuthService {
  private currentUser: MockUser | null = null
  private listeners: ((user: MockUser | null) => void)[] = []

  constructor() {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('mockUser')
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser)
    }
  }

  signIn(email: string, password: string): Promise<{ user: MockUser | null; error: string | null }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = mockUsers.find(u => u.email === email)
        
        if (user && password === 'senha123') {
          this.currentUser = user
          localStorage.setItem('mockUser', JSON.stringify(user))
          this.notifyListeners()
          resolve({ user, error: null })
        } else {
          resolve({ user: null, error: 'Email ou senha incorretos' })
        }
      }, 500) // Simular delay de rede
    })
  }

  signOut(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null
        localStorage.removeItem('mockUser')
        this.notifyListeners()
        resolve()
      }, 200)
    })
  }

  getCurrentUser(): MockUser | null {
    return this.currentUser
  }

  onAuthStateChange(callback: (user: MockUser | null) => void) {
    this.listeners.push(callback)
    
    // Retornar função para remover o listener
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser))
  }
}

export const mockAuth = new MockAuthService()