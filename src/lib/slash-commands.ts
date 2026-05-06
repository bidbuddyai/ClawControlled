// Slash command definitions and parser for ClawControlled
// Shared source of truth for typed slash commands and interactive menu generation.

export type SlashCommandCategory = 'session' | 'model' | 'tools' | 'agents' | 'cron' | 'config' | 'canvas' | 'task'

export interface SlashCommandDef {
  name: string
  description: string
  args?: string
  category: SlashCommandCategory
  executeLocal: boolean
  argOptions?: string[]
  aliases?: string[]
  icon?: string
  menu?: {
    label?: string
    group?: string
    destructive?: boolean
    requiresConfirm?: boolean
  }
}

export interface SlashMenuAction {
  id: string
  label: string
  description?: string
  command: string
  destructive?: boolean
  requiresConfirm?: boolean
}

export interface SlashMenuGroup {
  id: SlashCommandCategory | 'root'
  label: string
  description?: string
  actions: SlashMenuAction[]
}

export const SLASH_COMMANDS: SlashCommandDef[] = [
  // Session
  { name: 'session', description: 'Open the session command menu', args: '<action>', category: 'session', executeLocal: true, argOptions: ['new', 'rename', 'search', 'archive', 'delete'], menu: { label: 'Session Menu' } },
  { name: 'new', description: 'Start a new session', category: 'session', executeLocal: true, icon: '+', aliases: ['session new'], menu: { label: 'New Chat' } },
  { name: 'reset', description: 'Reset current session', category: 'session', executeLocal: true, menu: { label: 'Reset Session', requiresConfirm: true } },
  { name: 'compact', description: 'Compact session context', category: 'session', executeLocal: true, menu: { label: 'Compact Context' } },
  { name: 'stop', description: 'Stop current run', category: 'session', executeLocal: true, icon: '■', menu: { label: 'Stop Current Run' } },
  { name: 'clear', description: 'Clear chat history', category: 'session', executeLocal: true, menu: { label: 'Clear Chat', requiresConfirm: true } },

  // Model
  { name: 'model', description: 'Show or set model', args: '<name>', category: 'model', executeLocal: true },
  { name: 'think', description: 'Set thinking level', args: '<level>', category: 'model', executeLocal: true, argOptions: ['off', 'low', 'medium', 'high'] },
  { name: 'fast', description: 'Toggle fast mode', args: '<on|off>', category: 'model', executeLocal: true, argOptions: ['status', 'on', 'off'] },
  { name: 'verbose', description: 'Toggle verbose mode', args: '<on|off|full>', category: 'model', executeLocal: true, argOptions: ['on', 'off', 'full'] },

  // Task routing
  { name: 'task', description: 'Start or route a structured task through OpenClaw', args: '<objective>', category: 'task', executeLocal: false, icon: '✓', menu: { label: 'Task' } },

  // Tools
  { name: 'help', description: 'Show available commands', category: 'tools', executeLocal: true, icon: '?' },
  { name: 'export', description: 'Export session to Markdown', category: 'tools', executeLocal: true },
  { name: 'usage', description: 'Show token usage', category: 'tools', executeLocal: true, icon: '◷' },

  // Agents
  { name: 'agent', description: 'Open the agent command menu', args: '<action>', category: 'agents', executeLocal: true, argOptions: ['list', 'create', 'edit', 'delete', 'assign-role'], menu: { label: 'Agent Menu' } },
  { name: 'agents', description: 'List agents', category: 'agents', executeLocal: true, aliases: ['agent list'] },
  { name: 'kill', description: 'Abort sub-agents', args: '<id|all>', category: 'agents', executeLocal: true, menu: { label: 'Abort Subagents', destructive: true, requiresConfirm: true } },

  // Cron
  { name: 'cron', description: 'Open the cron command menu', args: '<action>', category: 'cron', executeLocal: true, argOptions: ['list', 'create', 'pause', 'resume', 'delete'] },

  // Config
  { name: 'config', description: 'Open the config command menu', args: '<action>', category: 'config', executeLocal: true, argOptions: ['view', 'edit', 'backup', 'restore', 'smart-merge'] },

  // Canvas
  { name: 'canvas', description: 'Open the canvas command menu', args: '<action>', category: 'canvas', executeLocal: true, argOptions: ['new', 'open', 'save', 'export'] },
]

export const CATEGORY_LABELS: Record<SlashCommandCategory, string> = {
  session: 'Session',
  model: 'Model',
  tools: 'Tools',
  agents: 'Agents',
  cron: 'Cron',
  config: 'Config',
  canvas: 'Canvas',
  task: 'Task',
}

const CATEGORY_ORDER: SlashCommandCategory[] = ['task', 'session', 'agents', 'cron', 'config', 'canvas', 'model', 'tools']

export interface ParsedSlashCommand {
  command: SlashCommandDef
  args: string
}

export function parseSlashCommand(text: string): ParsedSlashCommand | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('/')) return null

  const body = trimmed.slice(1)
  const firstSeparator = body.search(/[\s:]/)
  const name = (firstSeparator === -1 ? body : body.slice(0, firstSeparator)).toLowerCase()
  let remainder = firstSeparator === -1 ? '' : body.slice(firstSeparator).trimStart()
  if (remainder.startsWith(':')) remainder = remainder.slice(1).trimStart()
  const args = remainder.trim()

  if (!name) return null

  const direct = SLASH_COMMANDS.find(cmd => cmd.name === name)
  if (direct) return { command: direct, args }

  const composite = SLASH_COMMANDS.find(cmd => cmd.aliases?.includes(`${name}${args ? ` ${args}` : ''}`.trim().toLowerCase()))
  if (composite) return { command: composite, args: '' }

  return null
}

export function getSlashCommandCompletions(filter: string): SlashCommandDef[] {
  const lower = filter.toLowerCase().trim()
  const commands = lower
    ? SLASH_COMMANDS.filter(cmd =>
        cmd.name.startsWith(lower) ||
        cmd.description.toLowerCase().includes(lower) ||
        cmd.aliases?.some(alias => alias.includes(lower))
      )
    : SLASH_COMMANDS

  return [...commands].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category)
    const bi = CATEGORY_ORDER.indexOf(b.category)
    if (ai !== bi) return ai - bi
    if (lower) {
      const aExact = a.name.startsWith(lower) ? 0 : 1
      const bExact = b.name.startsWith(lower) ? 0 : 1
      if (aExact !== bExact) return aExact - bExact
    }
    return a.name.localeCompare(b.name)
  })
}

export function buildSlashMenuGroups(): SlashMenuGroup[] {
  return [
    {
      id: 'root',
      label: 'Command Center',
      description: 'Operational shortcuts and guided command actions.',
      actions: CATEGORY_ORDER.map((category) => ({
        id: category,
        label: CATEGORY_LABELS[category],
        description: `Open ${CATEGORY_LABELS[category].toLowerCase()} commands`,
        command: `/${category}`
      }))
    },
    ...CATEGORY_ORDER.map((category) => ({
      id: category,
      label: CATEGORY_LABELS[category],
      actions: SLASH_COMMANDS
        .filter(cmd => cmd.category === category)
        .map((cmd) => ({
          id: cmd.name,
          label: cmd.menu?.label || `/${cmd.name}`,
          description: cmd.description,
          command: `/${cmd.name}${cmd.args ? ' ' : ''}`,
          destructive: cmd.menu?.destructive,
          requiresConfirm: cmd.menu?.requiresConfirm,
        }))
    }))
  ]
}
