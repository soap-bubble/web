/**
 * Custom Next.js server with WebSocket support for game control.
 *
 * This server acts as a message broker between:
 * - MCP server (connects as WebSocket client)
 * - Browser game client (connects as WebSocket client)
 *
 * Run with: npx tsx server.ts
 */

import { createServer, IncomingMessage } from 'node:http'
import { parse } from 'node:url'
import next from 'next'
import { WebSocketServer, WebSocket } from 'ws'
import type {
  GameControlMessage,
  ClientType,
} from './src/lib/game-control-protocol.js'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT ?? '3000', 10)

interface GameSession {
  id: string
  browserClient: WebSocket | null
  mcpClient: WebSocket | null
}

// Track active game sessions
const sessions = new Map<string, GameSession>()

// Generate a simple session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Get or create a session for a client
function getOrCreateSession(sessionId?: string): GameSession {
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId)!
  }

  const id = sessionId ?? generateSessionId()
  const session: GameSession = {
    id,
    browserClient: null,
    mcpClient: null,
  }
  sessions.set(id, session)
  return session
}

// Send message to a WebSocket client
function sendMessage(ws: WebSocket, message: GameControlMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}

// Parse incoming message
function parseMessage(data: string): GameControlMessage | null {
  try {
    const parsed = JSON.parse(data) as GameControlMessage
    if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

// Handle WebSocket connection
function handleConnection(
  ws: WebSocket,
  req: IncomingMessage,
  clientType: ClientType,
  sessionId?: string
): void {
  const session = getOrCreateSession(sessionId)

  if (clientType === 'browser') {
    // Close existing browser client if any
    if (session.browserClient && session.browserClient !== ws) {
      session.browserClient.close()
    }
    session.browserClient = ws
    console.log(`[WS] Browser client connected to session: ${session.id}`)

    // Send connection confirmation with session ID
    sendMessage(ws, { type: 'CONNECTED', payload: { sessionId: session.id } })
  } else {
    // Close existing MCP client if any
    if (session.mcpClient && session.mcpClient !== ws) {
      session.mcpClient.close()
    }
    session.mcpClient = ws
    console.log(`[WS] MCP client connected to session: ${session.id}`)

    // Send connection confirmation
    sendMessage(ws, { type: 'CONNECTED', payload: { sessionId: session.id } })
  }

  ws.on('message', (rawData) => {
    const data = rawData.toString()
    const message = parseMessage(data)

    if (!message) {
      console.warn('[WS] Invalid message received:', data)
      return
    }

    console.log(`[WS] ${clientType} -> ${message.type}`)

    // Route message to the other client type
    if (clientType === 'browser') {
      // Browser -> MCP
      if (session.mcpClient) {
        sendMessage(session.mcpClient, message)
      }
    } else {
      // MCP -> Browser
      if (session.browserClient) {
        sendMessage(session.browserClient, message)
      }
    }
  })

  ws.on('close', () => {
    console.log(`[WS] ${clientType} client disconnected from session: ${session.id}`)
    if (clientType === 'browser' && session.browserClient === ws) {
      session.browserClient = null
    } else if (clientType === 'mcp' && session.mcpClient === ws) {
      session.mcpClient = null
    }

    // Clean up empty sessions after a delay
    setTimeout(() => {
      if (!session.browserClient && !session.mcpClient) {
        sessions.delete(session.id)
        console.log(`[WS] Session cleaned up: ${session.id}`)
      }
    }, 5000)
  })

  ws.on('error', (error) => {
    console.error(`[WS] ${clientType} client error:`, error)
  })
}

async function main() {
  const app = next({ dev, hostname, port })
  const handle = app.getRequestHandler()

  await app.prepare()

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? '', true)
    handle(req, res, parsedUrl)
  })

  // Create WebSocket server attached to the HTTP server
  const wss = new WebSocketServer({
    server,
    path: '/api/game-control',
  })

  wss.on('connection', (ws, req) => {
    const parsedUrl = parse(req.url ?? '', true)
    const query = parsedUrl.query

    // Determine client type from query parameter
    const clientType = (query.client as ClientType) ?? 'browser'
    const sessionId = query.session as string | undefined

    handleConnection(ws, req, clientType, sessionId)
  })

  wss.on('error', (error) => {
    console.error('[WSS] WebSocket server error:', error)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket endpoint: ws://${hostname}:${port}/api/game-control`)
    console.log(`>   Browser: ws://${hostname}:${port}/api/game-control?client=browser`)
    console.log(`>   MCP:     ws://${hostname}:${port}/api/game-control?client=mcp&session=<id>`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
