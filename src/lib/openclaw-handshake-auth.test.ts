import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpenClawClient } from './openclaw'
import type { WebSocketLike } from './openclaw/types'
import type { DeviceIdentity } from './device-identity'

class MockSocket implements WebSocketLike {
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3
  readyState = 1
  sent: string[] = []
  onopen: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onclose: ((event: unknown) => void) | null = null

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.readyState = 3
  }
}

const identity: DeviceIdentity = {
  id: 'd'.repeat(64),
  publicKeyBase64url: 'pub',
  privateKeyJwk: { kty: 'OKP', crv: 'Ed25519', d: 'priv', x: 'pub' }
}

describe('OpenClawClient handshake auth', () => {
  beforeEach(() => {
    const api = (window as any).electronAPI || {}
    api.signEd25519 = vi.fn().mockResolvedValue('sig')
    api.generateEd25519KeyPair = vi.fn()
    ;(window as any).electronAPI = api
  })

  it('sends stored device tokens as auth.deviceToken and signs with v3 payload token precedence', async () => {
    const socket = new MockSocket()
    const client = new OpenClawClient(
      'ws://gateway.test',
      'shared-password',
      'password',
      () => socket,
      identity,
      'Regression Device',
      'stored-device-token'
    )
    ;(client as any).ws = socket

    await (client as any).performHandshake('nonce-1')

    const frame = JSON.parse(socket.sent[0])
    expect(frame.params.auth).toEqual({ password: 'shared-password', deviceToken: 'stored-device-token' })
    expect(frame.params.device.signature).toBe('sig')
    expect((window as any).electronAPI.signEd25519).toHaveBeenCalledWith(
      identity.privateKeyJwk,
      expect.stringContaining('|stored-device-token|nonce-1|')
    )
    expect((window as any).electronAPI.signEd25519.mock.calls[0][1].startsWith('v3|')).toBe(true)
  })

  it('does not put password auth secrets into the device signature payload', async () => {
    const socket = new MockSocket()
    const client = new OpenClawClient(
      'ws://gateway.test',
      'shared-password',
      'password',
      () => socket,
      identity,
      'Regression Device'
    )
    ;(client as any).ws = socket

    await (client as any).performHandshake('nonce-2')

    const payload = (window as any).electronAPI.signEd25519.mock.calls[0][1]
    expect(payload).not.toContain('shared-password')
    expect(payload).toContain('||nonce-2|')
  })
})
