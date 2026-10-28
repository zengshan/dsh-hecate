import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Host half of the Session Hub bundle.
 *
 * Two jobs:
 *  1. make the console workspace exist and stay pinned above every project
 *     workspace — this needs only `workspaceRegistry`, so a profile without the
 *     preview services still gets it;
 *  2. serve the hover preview. The browser cannot read another Session's history
 *     without activating it (every client-side read path either needs a live
 *     cursor or a retained binding), so the Host reads the already-folded model
 *     surface — cold-safe, no Agent involved — and answers one small GET.
 *     `webServer` and `sessionQuery` are therefore optional dependencies.
 */

export const inject = ['workspaceRegistry']

const DEFAULT_PATH = join(homedir(), '.dsh-hub')
const DEFAULT_TITLE = '控制台'
const ATTEMPTS = 20
const RETRY_MS = 500
const PREVIEW_PATH = '/plugins/session-hub/preview'
const PREVIEW_EVENTS = 40
const PREVIEW_LINES = 8
const PREVIEW_TTL_MS = 10000
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'])
const previewCache = new Map()

function blocksText(content) {
  if (!Array.isArray(content)) return ''
  const parts = []
  for (const block of content) {
    if (block !== null && typeof block === 'object' && block.type === 'text' && typeof block.text === 'string') parts.push(block.text)
  }
  return parts.join('\n').trim()
}

/** Fold one surface snapshot into the few lines the popover shows. */
function linesFromSurface(snapshot) {
  const events = snapshot !== null && typeof snapshot === 'object' && Array.isArray(snapshot.events) ? snapshot.events : []
  const lines = []
  for (const event of events.slice(-PREVIEW_EVENTS)) {
    if (event === null || typeof event !== 'object') continue
    const data = event.data
    if (data === null || typeof data !== 'object') continue
    const content = Array.isArray(data.content) ? data.content : data.message === undefined ? undefined : data.message.content
    if (event.type === 'user/message') {
      // A user/message is not necessarily human: background-job output and other
      // harness notices arrive here too, and they read like tool noise.
      const source = data.source
      const human = source === undefined || source === null || source.kind === 'user'
      if (!human) continue
      const text = blocksText(content)
      if (text !== '') lines.push({ role: 'user', human: true, text })
    } else if (event.type === 'assistant/message') {
      const text = blocksText(content)
      if (text !== '') lines.push({ role: 'assistant', text })
    }
  }
  return lines.slice(-PREVIEW_LINES)
}

export function apply(ctx, config = {}) {
  const target = typeof config.path === 'string' && config.path.trim() !== '' ? config.path.trim() : DEFAULT_PATH
  const title = typeof config.title === 'string' && config.title.trim() !== '' ? config.title.trim() : DEFAULT_TITLE
  const pin = config.pin !== false

  const report = (level, message) => {
    try {
      ctx.logger[level](message)
    } catch {
      // A context without a logger is not a reason to fail workspace setup.
    }
  }

  const wait = () => ctx.timeout(RETRY_MS)

  ctx.effect(() => {
    let disposed = false

    const ensureWorkspace = async () => {
      // 1. the configured path, 2. a console workspace this profile already owns
      // at another path (so moving machines or changing `path` adopts instead of
      // creating a second one), 3. a brand-new directory.
      let workspace
      try {
        workspace = await ctx.workspaceRegistry.resolveByPath(target)
      } catch {
        workspace = undefined
      }
      if (workspace === undefined) {
        workspace = ctx.workspaceRegistry.list().find((candidate) => candidate.title === title)
        if (workspace !== undefined) report('info', `session-hub: adopting existing workspace '${title}' at ${workspace.path}`)
      }
      if (workspace === undefined) {
        await mkdir(target, { recursive: true })
        workspace = await ctx.workspaceRegistry.create(target, title)
        report('info', `session-hub: created workspace '${title}' at ${target}`)
      }
      if (!pin) return
      const id = workspace.id ?? workspace.workspaceId
      if (id === undefined) return
      try {
        const first = ctx.workspaceRegistry.list()[0]
        const firstId = first === undefined ? undefined : first.id ?? first.workspaceId
        if (firstId === id) return
        await ctx.workspaceRegistry.insertBefore(id)
        report('info', `session-hub: moved '${title}' to the top of the workspace list`)
      } catch (error) {
        // Pinning is best effort: a failed reorder must not retry workspace setup.
        report('warn', `session-hub: could not pin '${title}' to the top: ${String(error)}`)
      }
    }

    const run = async () => {
      // The registry rejects work until its durable state has bootstrapped, which
      // happens shortly after plugin activation; retry rather than give up.
      for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
        if (disposed) return
        try {
          await ensureWorkspace()
          return
        } catch (error) {
          if (attempt === ATTEMPTS - 1) {
            report('warn', `session-hub: workspace setup failed: ${String(error)}`)
            return
          }
          await wait(RETRY_MS)
        }
      }
    }

    void run()

    return () => {
      disposed = true
    }
  }, 'session-hub: console workspace')

  /**
   * Preview needs the HTTP carrier and the Session query service. Declaring them
   * here (not at the top) keeps the workspace pin alive in profiles that have
   * neither, and tears the route down cleanly if either disappears.
   */
  ctx.inject(['webServer', 'sessionQuery'], (scope) => {
    /** Read one Session's folded surface, cached briefly: hover is a repeated event. */
    const previewFor = async (sessionId) => {
      const cached = previewCache.get(sessionId)
      const now = Date.now()
      if (cached !== undefined && now - cached.at < PREVIEW_TTL_MS) return cached.value
      const snapshot = await scope.sessionQuery.readSurface(sessionId)
      const value = { lines: linesFromSurface(snapshot) }
      previewCache.set(sessionId, { at: now, value })
      if (previewCache.size > 200) {
        for (const key of [...previewCache.keys()].slice(0, 100)) previewCache.delete(key)
      }
      return value
    }

    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'prefix',
          path: PREVIEW_PATH,
          handler: async (req, res) => {
            res.setHeader('content-type', 'application/json; charset=utf-8')
            res.setHeader('cache-control', 'no-store')
            // The page is served from the same loopback origin; anything else is
            // not a browser the user opened, so it never sees Session text.
            const remote = String((req.socket === undefined ? '' : req.socket.remoteAddress) ?? '')
            if (!LOOPBACK.has(remote)) {
              res.statusCode = 403
              res.end('{"error":"forbidden"}')
              return
            }
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              res.statusCode = 405
              res.end('{"error":"method not allowed"}')
              return
            }
            try {
              const url = new URL(String(req.url ?? '/'), 'http://127.0.0.1')
              const sessionId = String(url.searchParams.get('sessionId') ?? '')
              if (!/^[A-Za-z0-9._:-]{1,200}$/u.test(sessionId)) {
                res.statusCode = 400
                res.end('{"error":"bad session id"}')
                return
              }
              const value = await previewFor(sessionId)
              res.statusCode = 200
              res.end(JSON.stringify(value))
            } catch (error) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(error) }))
            }
          },
        }),
      'session-hub: preview route',
    )
  })
}
