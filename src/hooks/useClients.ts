import type { Client, DebtOperation } from '../types'
import { useStorage } from './useStorage'

interface CreateClientInput {
  name: string
  phone: string
  address?: string
  id?: string
}

interface ClientWithOperations extends Client {
  operations: DebtOperation[]
}

export function useClients() {
  const [clients, setClients] = useStorage<ClientWithOperations[]>('niatala_clients', [])

  const addClient = (input: CreateClientInput): ClientWithOperations => {
    const newClient: ClientWithOperations = {
      id: input.id || `client_${Date.now()}`,
      name: input.name,
      phone: input.phone,
      address: input.address,
      createdAt: Date.now(),
      totalDebt: 0,
      operations: [],
    }

    setClients([...clients, newClient])
    return newClient
  }

  const getClientById = (clientId: string): ClientWithOperations | undefined => {
    return clients.find(c => c.id === clientId)
  }

  const getClientByName = (name: string): ClientWithOperations | undefined => {
    return clients.find(c => c.name.toLowerCase() === name.toLowerCase())
  }

  const updateClient = (clientId: string, updates: Partial<Client>) => {
    setClients(
      clients.map(c =>
        c.id === clientId ? { ...c, ...updates } : c,
      ),
    )
  }

  const addDebtOperation = (
    clientId: string,
    operation: Omit<DebtOperation, 'id'>,
    clientInfo?: { name: string; phone: string }
  ): DebtOperation => {
    const operationWithId: DebtOperation = {
      ...operation,
      id: `op_${Date.now()}`,
    }

    const clientExists = clients.some(c => c.id === clientId)
    console.log(`addDebtOperation: clientId=${clientId}, clientExists=${clientExists}, totalClients=${clients.length}`)

    // Si le client n'existe pas et que clientInfo est fourni, créer le client
    let targetClients = clients
    if (!clientExists && clientInfo) {
      const newClient: ClientWithOperations = {
        id: clientId,
        name: clientInfo.name,
        phone: clientInfo.phone,
        createdAt: Date.now(),
        totalDebt: 0,
        operations: [],
      }
      targetClients = [...clients, newClient]
      console.log(`Created new client: ${clientId}`)
    }

    const updatedClients = targetClients.map(c => {
      if (c.id === clientId) {
        const newOperations = [...c.operations, operationWithId]
        const newTotalDebt = newOperations.reduce((sum, op) => {
          if (op.type === 'PURCHASE') return sum + op.amount
          if (op.type === 'PAYMENT') return sum - op.amount
          return sum
        }, 0)

        console.log(`Updated client ${clientId}: totalDebt=${newTotalDebt}`)
        return {
          ...c,
          operations: newOperations,
          totalDebt: Math.max(0, newTotalDebt),
        }
      }
      return c
    })

    setClients(updatedClients)

    return operationWithId
  }

  const getClientDebtStatus = (
    clientId: string,
  ): 'PAID' | 'IN_PROGRESS' => {
    const client = getClientById(clientId)
    return client && client.totalDebt > 0 ? 'IN_PROGRESS' : 'PAID'
  }

  const getClientsWithDebt = (): ClientWithOperations[] => {
    return clients.filter(c => c.totalDebt > 0)
  }

  const getTotalDebts = (): number => {
    return clients.reduce((sum, c) => sum + c.totalDebt, 0)
  }

  return {
    clients,
    addClient,
    getClientById,
    getClientByName,
    updateClient,
    addDebtOperation,
    getClientDebtStatus,
    getClientsWithDebt,
    getTotalDebts,
  }
}
