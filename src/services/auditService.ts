import type { AuditLog, AuditActionType, UserRole } from '../types'

const AUDIT_KEY = 'niatala_audit'

function getCurrentDateTime() {
  const now = new Date()
  const date = now.toLocaleDateString('fr-FR')
  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

export function logAction(
  userId: string,
  username: string,
  userRole: UserRole,
  action: AuditActionType,
  options?: {
    reference?: string
    amount?: number
    motif?: string
    details?: Record<string, unknown>
  }
): AuditLog {
  const { date, time } = getCurrentDateTime()
  const logs = getAuditLogs()

  const newLog: AuditLog = {
    id: `audit_${Date.now()}`,
    timestamp: Date.now(),
    date,
    time,
    userId,
    username,
    userRole,
    action,
    reference: options?.reference,
    amount: options?.amount,
    motif: options?.motif,
    details: options?.details,
  }

  logs.push(newLog)
  localStorage.setItem(AUDIT_KEY, JSON.stringify(logs))
  return newLog
}

export function getAuditLogs(): AuditLog[] {
  const stored = localStorage.getItem(AUDIT_KEY)
  return stored ? JSON.parse(stored) : []
}

export function getAuditLogsByUser(userId: string): AuditLog[] {
  return getAuditLogs().filter(log => log.userId === userId)
}

export function getAuditLogsByAction(action: AuditActionType): AuditLog[] {
  return getAuditLogs().filter(log => log.action === action)
}

export function getAuditLogsByReference(reference: string): AuditLog[] {
  return getAuditLogs().filter(log => log.reference === reference)
}

export function getAuditLogsByDateRange(startDate: Date, endDate: Date): AuditLog[] {
  const startTime = startDate.getTime()
  const endTime = endDate.getTime()
  return getAuditLogs().filter(log => log.timestamp >= startTime && log.timestamp <= endTime)
}
