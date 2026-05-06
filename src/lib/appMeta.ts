// App metadata and OpenClaw client identity
//
// Keep these values centralized so the connect payload and device signature stay in sync.

import pkg from '../../package.json'

export const APP_NAME = 'ClawControlled'
export const APP_VERSION = pkg.version as string

// OpenClaw Gateway accepts a fixed set of protocol client IDs. Keep display
// branding separate from protocol identity: arbitrary app IDs such as `ui`,
// `clawcontrol`, or `clawcontrolled` are rejected during connect validation.
// Operator UI devices must use OpenClaw's UI client ID so existing device
// pairing records and device challenge signatures validate.
//
// NOTE: These IDs and modes must match the values embedded in the device
// challenge signature payload for each role.
export const OPENCLAW_OPERATOR_CLIENT_ID = 'openclaw-control-ui'
export const OPENCLAW_NODE_CLIENT_ID = 'node-host'
export const OPENCLAW_OPERATOR_CLIENT_MODE = 'webchat'
export const OPENCLAW_ROLE = 'operator'

// Node mode — used for the parallel node WebSocket connection
export const OPENCLAW_NODE_CLIENT_MODE = 'node'
export const OPENCLAW_NODE_ROLE = 'node'
