// OpenClaw operator permission helpers for feature gating.

export const OPERATOR_SCOPES = {
  READ: 'operator.read',
  WRITE: 'operator.write',
  ADMIN: 'operator.admin',
  APPROVALS: 'operator.approvals',
  PAIRING: 'operator.pairing',
  TALK_SECRETS: 'operator.talk.secrets'
} as const

export type OperatorScope = typeof OPERATOR_SCOPES[keyof typeof OPERATOR_SCOPES]

export const DEFAULT_OPERATOR_SCOPES: OperatorScope[] = [
  OPERATOR_SCOPES.READ,
  OPERATOR_SCOPES.WRITE
]

export const CURRENT_OPERATOR_SCOPES: OperatorScope[] = [
  OPERATOR_SCOPES.READ,
  OPERATOR_SCOPES.WRITE,
  OPERATOR_SCOPES.ADMIN,
  OPERATOR_SCOPES.APPROVALS
]

export function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))]
}

export function hasScope(scopes: readonly string[], scope: OperatorScope | string): boolean {
  return scopes.includes(scope) || scopes.includes(OPERATOR_SCOPES.ADMIN)
}

export function hasAnyScope(scopes: readonly string[], required: readonly (OperatorScope | string)[]): boolean {
  return required.some(scope => hasScope(scopes, scope))
}

export function hasMethod(methods: readonly string[], method: string): boolean {
  return methods.includes(method)
}

export function hasEvent(events: readonly string[], event: string): boolean {
  return events.includes(event)
}
