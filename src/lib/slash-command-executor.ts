// Slash command execution engine for ClawControlled
// Executes local slash commands via gateway RPC methods.

import type { OpenClawClient } from './openclaw/client'
import type { Message, Session, Agent } from './openclaw/types'
import { SLASH_COMMANDS, CATEGORY_LABELS } from './slash-commands'

export interface SlashCommandResult {
  content: string
  action?: 'refresh' | 'export' | 'new-session' | 'reset' | 'stop' | 'clear' | 'open-nodes'
}

export async function executeSlashCommand(
  client: OpenClawClient,
  sessionKey: string,
  commandName: string,
  args: string,
  context: {
    sessions: Session[]
    agents: Agent[]
    messages: Message[]
    currentAgentId: string | null
  }
): Promise<SlashCommandResult> {
  switch (commandName) {
    case 'help':
      return executeHelp()
    case 'new':
      return { content: 'Starting new session...', action: 'new-session' }
    case 'session':
      return executeSessionMenu(args)
    case 'reset':
      return { content: 'Resetting session...', action: 'reset' }
    case 'stop':
      return { content: 'Stopping current run...', action: 'stop' }
    case 'clear':
      return { content: 'Chat history cleared.', action: 'clear' }
    case 'compact':
      return await executeCompact(client, sessionKey)
    case 'model':
      return await executeModel(client, sessionKey, args, context)
    case 'think':
      return await executeThink(client, sessionKey, args, context)
    case 'fast':
      return await executeFast(client, sessionKey, args, context)
    case 'verbose':
      return await executeVerbose(client, sessionKey, args, context)
    case 'export':
      return executeExport(context.messages, sessionKey)
    case 'usage':
      return executeUsage(context)
    case 'agent':
      return executeAgentMenu(args, context.agents)
    case 'agents':
      return executeAgents(context.agents)
    case 'kill':
      return await executeKill(client, sessionKey, args)
    case 'cron':
      return executeCronMenu(args)
    case 'config':
      return executeConfigMenu(args)
    case 'canvas':
      return executeCanvasMenu(args)
    default:
      return { content: `Unknown command: \`/${commandName}\`` }
  }
}

function executeHelp(): SlashCommandResult {
  const lines = ['**Available Commands**\n']
  let currentCategory = ''

  for (const cmd of SLASH_COMMANDS) {
    const categoryLabel = CATEGORY_LABELS[cmd.category]
    if (categoryLabel !== currentCategory) {
      currentCategory = categoryLabel
      lines.push(`**${currentCategory}**`)
    }
    const argStr = cmd.args ? ` ${cmd.args}` : ''
    lines.push(`\`/${cmd.name}${argStr}\` — ${cmd.description}`)
  }

  lines.push('\nType `/` to open the command menu.')
  return { content: lines.join('\n') }
}

function executeSessionMenu(args: string): SlashCommandResult {
  const action = args.trim().toLowerCase()
  if (!action) {
    return {
      content: [
        '**Session Menu**',
        '- `/session new` — Create and switch to a brand new chat',
        '- `/session rename` — Rename the current session [UI flow pending]',
        '- `/session search` — Search session history [interactive UI pending]',
        '- `/session archive` — Archive a session [stub pending backend flow]',
        '- `/session delete` — Delete a session [UI confirm flow pending]',
      ].join('\n')
    }
  }

  switch (action) {
    case 'new':
    case 'new-chat':
      return { content: 'Starting new session...', action: 'new-session' }
    case 'rename':
      return { content: 'Session rename is available from the session context menu. Interactive `/session rename` flow is queued for this rebuild.' }
    case 'search':
      return { content: 'Session search UI is planned as part of the new session manager surface. Typed search command scaffolding is in place.' }
    case 'archive':
      return { content: 'Session archive is not yet wired to a backend API. Safe UI stub planned, no destructive action taken.' }
    case 'delete':
      return { content: 'Session delete currently uses the sidebar/context menu confirmation flow. Guided slash confirmation is still being added.' }
    default:
      return { content: `Unknown session action: \`${action}\`` }
  }
}

async function executeCompact(client: OpenClawClient, sessionKey: string): Promise<SlashCommandResult> {
  try {
    await client.call('sessions.compact', { key: sessionKey })
    return { content: 'Context compacted successfully.', action: 'refresh' }
  } catch (err) {
    return { content: `Compaction failed: ${String(err)}` }
  }
}

async function executeModel(
  client: OpenClawClient,
  sessionKey: string,
  args: string,
  context: { sessions: Session[] }
): Promise<SlashCommandResult> {
  if (!args) {
    const session = context.sessions.find(s => s.key === sessionKey)
    const model = session?.model || 'default'
    const lines = [`**Current model:** \`${model}\``]

    try {
      const models = await client.listModels()
      if (models.length > 0) {
        const modelIds = models.map(m => m.id)
        lines.push(
          `**Available:** ${modelIds.slice(0, 10).map(m => `\`${m}\``).join(', ')}` +
          (modelIds.length > 10 ? ` +${modelIds.length - 10} more` : '')
        )
      }
    } catch {
      // ignore
    }

    return { content: lines.join('\n') }
  }

  try {
    await client.call('sessions.patch', { key: sessionKey, model: args.trim() })
    return { content: `Model set to \`${args.trim()}\`.`, action: 'refresh' }
  } catch (err) {
    return { content: `Failed to set model: ${String(err)}` }
  }
}

async function executeThink(
  client: OpenClawClient,
  sessionKey: string,
  args: string,
  context: { sessions: Session[] }
): Promise<SlashCommandResult> {
  const level = args.trim().toLowerCase()

  if (!level) {
    const session = context.sessions.find(s => s.key === sessionKey)
    const current = session?.thinkingLevel || 'off'
    return { content: `Current thinking level: **${current}**.\nOptions: off, low, medium, high.` }
  }

  const valid = ['off', 'low', 'medium', 'high', 'xhigh']
  if (!valid.includes(level)) {
    return { content: `Unrecognized thinking level "${level}". Valid levels: ${valid.join(', ')}.` }
  }

  try {
    await client.call('sessions.patch', { key: sessionKey, thinkingLevel: level === 'off' ? null : level })
    return { content: `Thinking level set to **${level}**.`, action: 'refresh' }
  } catch (err) {
    return { content: `Failed to set thinking level: ${String(err)}` }
  }
}

async function executeFast(
  client: OpenClawClient,
  sessionKey: string,
  args: string,
  context: { sessions: Session[] }
): Promise<SlashCommandResult> {
  const mode = args.trim().toLowerCase()

  if (!mode || mode === 'status') {
    const session = context.sessions.find(s => s.key === sessionKey)
    const current = session?.fastMode === true ? 'on' : 'off'
    return { content: `Current fast mode: **${current}**.\nOptions: status, on, off.` }
  }

  if (mode !== 'on' && mode !== 'off') {
    return { content: `Unrecognized fast mode "${args.trim()}". Valid options: status, on, off.` }
  }

  try {
    await client.call('sessions.patch', { key: sessionKey, fastMode: mode === 'on' })
    return { content: `Fast mode ${mode === 'on' ? 'enabled' : 'disabled'}.`, action: 'refresh' }
  } catch (err) {
    return { content: `Failed to set fast mode: ${String(err)}` }
  }
}

async function executeVerbose(
  client: OpenClawClient,
  sessionKey: string,
  args: string,
  context: { sessions: Session[] }
): Promise<SlashCommandResult> {
  const level = args.trim().toLowerCase()

  if (!level) {
    const session = context.sessions.find(s => s.key === sessionKey)
    const current = session?.verboseLevel || 'off'
    return { content: `Current verbose level: **${current}**.\nOptions: off, on, full.` }
  }

  const valid = ['off', 'on', 'full']
  if (!valid.includes(level)) {
    return { content: `Unrecognized verbose level "${level}". Valid levels: ${valid.join(', ')}.` }
  }

  try {
    await client.call('sessions.patch', { key: sessionKey, verboseLevel: level === 'off' ? null : level })
    return { content: `Verbose mode set to **${level}**.`, action: 'refresh' }
  } catch (err) {
    return { content: `Failed to set verbose mode: ${String(err)}` }
  }
}

function executeExport(messages: Message[], sessionKey: string): SlashCommandResult {
  if (messages.length === 0) {
    return { content: 'No messages to export.' }
  }

  const lines: string[] = [`# Chat Export: ${sessionKey}\n`]
  for (const msg of messages) {
    const role = msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : 'System'
    lines.push(`## ${role}`)
    if (msg.thinking) {
      lines.push(`<details><summary>Thinking</summary>\n\n${msg.thinking}\n\n</details>\n`)
    }
    lines.push(msg.content)
    lines.push('')
  }

  const markdown = lines.join('\n')
  navigator.clipboard.writeText(markdown).catch(() => {})

  return { content: `Exported ${messages.length} messages to clipboard.`, action: 'export' }
}

function executeUsage(context: { sessions: Session[] }): SlashCommandResult {
  let totalInput = 0
  let totalOutput = 0
  for (const s of context.sessions) {
    totalInput += s.inputTokens ?? 0
    totalOutput += s.outputTokens ?? 0
  }
  const total = totalInput + totalOutput

  const lines = [
    '**Token Usage**',
    `Input: **${fmtTokens(totalInput)}** tokens`,
    `Output: **${fmtTokens(totalOutput)}** tokens`,
    `Total: **${fmtTokens(total)}** tokens`,
    `Sessions: **${context.sessions.length}**`,
  ]
  return { content: lines.join('\n') }
}

function executeAgentMenu(args: string, agents: Agent[]): SlashCommandResult {
  const action = args.trim().toLowerCase()
  if (!action) {
    return {
      content: [
        '**Agent Menu**',
        '- `/agent list` — Show configured agents',
        '- `/agent create` — Open create-agent workflow [UI flow available]',
        '- `/agent edit` — Edit selected agent [detail view flow available]',
        '- `/agent delete` — Delete selected agent [detail view confirm flow]',
        '- `/agent assign-role` — Open the device role and token manager',
      ].join('\n')
    }
  }

  switch (action) {
    case 'list':
      return executeAgents(agents)
    case 'create':
      return { content: 'Use the Agent Hub or Create Agent view to add a new agent. Guided slash create flow is being added.' }
    case 'edit':
      return { content: 'Agent editing is available from the Agent detail surface. Guided slash edit flow is being added.' }
    case 'delete':
      return { content: 'Agent deletion remains protected behind the Agent detail confirmation flow. Guided slash confirmation is pending.' }
    case 'assign-role':
      return { content: 'Opening the Nodes role and token manager for device/operator role actions.', action: 'open-nodes' }
    default:
      return { content: `Unknown agent action: \`${action}\`` }
  }
}

function executeAgents(agents: Agent[]): SlashCommandResult {
  if (agents.length === 0) {
    return { content: 'No agents configured.' }
  }
  const lines = [`**Agents** (${agents.length})\n`]
  for (const agent of agents) {
    const status = agent.status === 'online' ? '🟢' : agent.status === 'busy' ? '🟡' : '⚫'
    lines.push(`- ${status} \`${agent.id}\` — ${agent.name}`)
  }
  return { content: lines.join('\n') }
}

function executeCronMenu(args: string): SlashCommandResult {
  const action = args.trim().toLowerCase()
  if (!action) {
    return {
      content: [
        '**Cron Menu**',
        '- `/cron list` — View cron jobs [dashboard integration planned]',
        '- `/cron create` — Open cron creation flow [UI view exists]',
        '- `/cron pause` — Pause a job [guided flow pending]',
        '- `/cron resume` — Resume a job [guided flow pending]',
        '- `/cron delete` — Delete a job [guided confirm flow pending]',
      ].join('\n')
    }
  }
  return { content: `Cron action \`${action}\` is reserved for the Cron Monitor flow. Interactive execution is being added.` }
}

function executeConfigMenu(args: string): SlashCommandResult {
  const action = args.trim().toLowerCase()
  if (!action) {
    return {
      content: [
        '**Config Menu**',
        '- `/config view` — Review current configuration [manager surface planned]',
        '- `/config edit` — Safe edit flow [planned]',
        '- `/config backup` — Export config backup [planned]',
        '- `/config restore` — Restore a config backup [planned]',
        '- `/config smart-merge` — Merge incoming config safely [planned]',
      ].join('\n')
    }
  }
  return { content: `Config action \`${action}\` is not yet wired to a safe local flow. No changes applied.` }
}

function executeCanvasMenu(args: string): SlashCommandResult {
  const action = args.trim().toLowerCase()
  if (!action) {
    return {
      content: [
        '**Canvas Menu**',
        '- `/canvas new` — Start a new canvas workflow',
        '- `/canvas open` — Open current canvas panel',
        '- `/canvas save` — Save current canvas state [pending persistence review]',
        '- `/canvas export` — Export canvas output [pending UI action]',
      ].join('\n')
    }
  }
  return { content: `Canvas action \`${action}\` is queued for the Canvas control surface. Interactive execution is being added.` }
}

async function executeKill(client: OpenClawClient, sessionKey: string, args: string): Promise<SlashCommandResult> {
  const target = args.trim()
  if (!target) {
    return { content: 'Usage: `/kill <id|all>`' }
  }

  try {
    if (target.toLowerCase() === 'all') {
      await client.call('chat.abort', { sessionKey })
      return { content: 'Aborted all active runs.' }
    }
    await client.call('chat.abort', { sessionKey: target })
    return { content: `Aborted session \`${target}\`.` }
  } catch (err) {
    return { content: `Failed to abort: ${String(err)}` }
  }
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}
