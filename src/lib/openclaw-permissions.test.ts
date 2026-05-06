import { describe, expect, it } from 'vitest'
import {
  DEFAULT_OPERATOR_SCOPES,
  OPERATOR_SCOPES,
  hasAnyScope,
  hasEvent,
  hasMethod,
  hasScope,
  normalizeStringList
} from './openclaw/permissions'

describe('OpenClaw permission helpers', () => {
  it('keeps default operator scope tier limited to read/write', () => {
    expect(DEFAULT_OPERATOR_SCOPES).toEqual([
      OPERATOR_SCOPES.READ,
      OPERATOR_SCOPES.WRITE
    ])
  })

  it('normalizes string lists from hello-ok scope and feature payloads', () => {
    expect(normalizeStringList(['operator.read', '', 'operator.write', 'operator.read', 7, null])).toEqual([
      'operator.read',
      'operator.write'
    ])
    expect(normalizeStringList(undefined)).toEqual([])
  })

  it('treats operator.admin as satisfying narrower operator scopes', () => {
    const scopes = [OPERATOR_SCOPES.ADMIN]
    expect(hasScope(scopes, OPERATOR_SCOPES.PAIRING)).toBe(true)
    expect(hasScope(scopes, OPERATOR_SCOPES.APPROVALS)).toBe(true)
    expect(hasAnyScope(scopes, [OPERATOR_SCOPES.PAIRING, OPERATOR_SCOPES.TALK_SECRETS])).toBe(true)
  })

  it('checks advertised methods and events independently from scopes', () => {
    expect(hasMethod(['chat.send', 'sessions.list'], 'chat.send')).toBe(true)
    expect(hasMethod(['chat.send'], 'config.set')).toBe(false)
    expect(hasEvent(['exec.approval.requested'], 'exec.approval.requested')).toBe(true)
    expect(hasEvent(['chat'], 'node.pair.pending')).toBe(false)
  })
})
