import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

/**
 * Mode démo : actif quand aucun backend n'est configuré (VITE_API_URL absent)
 * ou quand VITE_DEMO=1. Toute l'API REST et le socket sont simulés côté
 * client pour que l'app soit une démo autonome (déployable sur Vercel).
 */
export const DEMO =
  !import.meta.env.VITE_API_URL || import.meta.env.VITE_DEMO === '1'

/* ---------------------------------------------------------------- données */

type ChannelMessage = {
  channelId: string
  senderId: string
  senderUsername: string
  text: string
  timestamp: string
}

type PrivateMessage = {
  senderId: string
  receiverId: string
  senderUsername: string
  receiverUsername: string
  text: string
  timestamp: string
}

type GeneralMessage = {
  id: number
  user: { id: string; username: string }
  text: string
  timestamp: number
}

const DEMO_PEERS = [
  { userId: 'u2', username: 'Léa', isOnline: true, socketId: 'demo-2' },
  { userId: 'u3', username: 'Marco', isOnline: true, socketId: 'demo-3' },
  { userId: 'u4', username: 'Sofia', isOnline: true, socketId: 'demo-4' },
]

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000)

const channels: Array<{
  id: string
  name: string
  imageUrl: string | null
  createdBy: string
  members: string[]
}> = [
  { id: 'c1', name: 'dev-web', imageUrl: null, createdBy: 'u2', members: ['u1', 'u2', 'u3'] },
  { id: 'c2', name: 'design', imageUrl: null, createdBy: 'u4', members: ['u1', 'u4'] },
]

const channelMessages: Record<string, ChannelMessage[]> = {
  c1: [
    {
      channelId: 'c1',
      senderId: 'u2',
      senderUsername: 'Léa',
      text: 'Hello ! Quelqu’un a déjà testé Socket.io avec Vue 3 ?',
      timestamp: minutesAgo(42).toISOString(),
    },
    {
      channelId: 'c1',
      senderId: 'u3',
      senderUsername: 'Marco',
      text: 'Oui, c’est exactement ce qui fait tourner ce chat 😄',
      timestamp: minutesAgo(40).toISOString(),
    },
    {
      channelId: 'c1',
      senderId: 'u2',
      senderUsername: 'Léa',
      text: 'Astuce : tape /users pour lister les membres du salon.',
      timestamp: minutesAgo(35).toISOString(),
    },
  ],
  c2: [
    {
      channelId: 'c2',
      senderId: 'u4',
      senderUsername: 'Sofia',
      text: 'Nouveau design system indigo/violet, vos retours ?',
      timestamp: minutesAgo(60).toISOString(),
    },
  ],
}

const generalMessages: GeneralMessage[] = [
  {
    id: 1,
    user: { id: 'u2', username: 'Léa' },
    text: 'Bienvenue sur EchoConnect 👋 Ceci est le salon général.',
    timestamp: minutesAgo(90).getTime(),
  },
  {
    id: 2,
    user: { id: 'u3', username: 'Marco' },
    text: 'Tape /list pour voir tous les salons disponibles.',
    timestamp: minutesAgo(75).getTime(),
  },
]

const privateThreads: Record<string, PrivateMessage[]> = {
  u2: [
    {
      senderId: 'u2',
      receiverId: 'u1',
      senderUsername: 'Léa',
      receiverUsername: 'Vous',
      text: 'Salut ! Bienvenue dans la démo d’EchoConnect 🙂',
      timestamp: minutesAgo(20).toISOString(),
    },
  ],
  u3: [
    {
      senderId: 'u3',
      receiverId: 'u1',
      senderUsername: 'Marco',
      receiverUsername: 'Vous',
      text: 'Yo ! Tu as vu le salon dev-web ?',
      timestamp: minutesAgo(15).toISOString(),
    },
  ],
  u4: [],
}

const REPLIES = [
  'Bien vu 👍',
  'Ah oui, complètement d’accord.',
  'Intéressant, tu peux développer ?',
  'Haha, exactement 😄',
  'Je regarde ça et je te redis !',
  'Top, merci pour l’info.',
  'On en parle sur le salon dev-web ?',
]

const randomReply = () => REPLIES[Math.floor(Math.random() * REPLIES.length)]
const peerName = (id: string) =>
  DEMO_PEERS.find((p) => p.userId === id)?.username ?? 'Léa'

/* ------------------------------------------------------------ faux socket */

type Handler = (payload: unknown) => void

class FakeSocket {
  private handlers: Record<string, Handler[]> = {}

  on(event: string, handler: Handler): void {
    ;(this.handlers[event] ??= []).push(handler)
  }

  off(event: string): void {
    delete this.handlers[event]
  }

  fire(event: string, payload: unknown): void {
    this.handlers[event]?.forEach((h) => h(payload))
  }

  emit(event: string, payload?: unknown): void {
    switch (event) {
      case 'joinConnectedUsers':
        // la liste des connectés arrive « du serveur » juste après
        setTimeout(() => this.fire('updateUserList', [...DEMO_PEERS]), 250)
        break

      case 'sendChannelMessage': {
        const msg = payload as ChannelMessage
        ;(channelMessages[msg.channelId] ??= []).push(msg)
        // le serveur rediffuse le message à tout le salon, émetteur inclus
        this.fire('receiveChannelMessage', msg)
        setTimeout(
          () => {
            const channel = channels.find((c) => c.id === msg.channelId)
            const authorId = channel?.members.find((m) => m !== 'u1') ?? 'u2'
            const reply: ChannelMessage = {
              channelId: msg.channelId,
              senderId: authorId,
              senderUsername: peerName(authorId),
              text: randomReply(),
              timestamp: new Date().toISOString(),
            }
            ;(channelMessages[msg.channelId] ??= []).push(reply)
            this.fire('receiveChannelMessage', reply)
          },
          1200 + Math.random() * 1500,
        )
        break
      }

      case 'sendMessage': {
        const msg = payload as { user: { id: string; username: string }; text: string; timestamp: number }
        const stored: GeneralMessage = { id: Date.now(), ...msg }
        generalMessages.push(stored)
        this.fire('receiveMessage', stored)
        setTimeout(
          () => {
            const reply: GeneralMessage = {
              id: Date.now() + 1,
              user: { id: 'u3', username: 'Marco' },
              text: randomReply(),
              timestamp: Date.now(),
            }
            generalMessages.push(reply)
            this.fire('receiveMessage', reply)
          },
          1200 + Math.random() * 1500,
        )
        break
      }

      case 'sendPrivateMessage': {
        const msg = payload as PrivateMessage
        ;(privateThreads[msg.receiverId] ??= []).push(msg)
        setTimeout(
          () => {
            const reply: PrivateMessage = {
              senderId: msg.receiverId,
              receiverId: msg.senderId,
              senderUsername: msg.receiverUsername,
              receiverUsername: msg.senderUsername,
              text: randomReply(),
              timestamp: new Date().toISOString(),
            }
            ;(privateThreads[msg.receiverId] ??= []).push(reply)
            this.fire('receivePrivateMessage', reply)
          },
          1300 + Math.random() * 1500,
        )
        break
      }

      default:
        // joinChannel, logout… : rien à simuler
        break
    }
  }
}

export const fakeSocket = new FakeSocket()

/* ------------------------------------------------------------- faux REST */

type MockResponse = { status: number; body: unknown }

const API_PATHS =
  /\/(login|users|channels|messages-channels|general-messages|private-messages)(\/|\?|$)/

function pathOf(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^undefined/, '')
    .replace(/^null/, '')
}

function route(method: string, url: string, rawBody: unknown): MockResponse {
  const path = pathOf(url)
  const body: any =
    typeof rawBody === 'string' && rawBody ? JSON.parse(rawBody) : (rawBody ?? {})
  let m: RegExpMatchArray | null

  if (method === 'POST' && path.endsWith('/login')) {
    const username =
      String(body.email ?? '')
        .split('@')[0]
        .replace(/[^a-zA-Z0-9_-]/g, '') || 'Invité'
    return {
      status: 200,
      body: {
        token: 'demo-token',
        user: {
          id: 'u1',
          username: username.charAt(0).toUpperCase() + username.slice(1),
          email: body.email,
        },
      },
    }
  }

  if (method === 'POST' && path.endsWith('/users/create')) {
    return { status: 201, body: { ok: true } }
  }

  if ((m = path.match(/\/channels\/user\//)) && method === 'GET') {
    return { status: 200, body: channels }
  }

  if (method === 'POST' && path.endsWith('/channels/create')) {
    const channel = {
      id: `c${Date.now()}`,
      name: String(body.name ?? 'nouveau-salon'),
      imageUrl: null,
      createdBy: 'u1',
      members: ['u1'],
    }
    channels.push(channel)
    channelMessages[channel.id] = []
    return { status: 201, body: channel }
  }

  if ((m = path.match(/\/channels\/([^/]+)\/members/)) && method === 'GET') {
    const channel = channels.find((c) => c.id === m![1])
    const members = (channel?.members ?? []).map((id) => ({
      username: id === 'u1' ? 'Vous' : peerName(id),
    }))
    return { status: 200, body: members }
  }

  if ((m = path.match(/\/channels\/([^/]+)\/addMember\//)) && method === 'PUT') {
    return { status: 200, body: { ok: true } }
  }

  if ((m = path.match(/\/channels\/([^/?]+)$/)) && method === 'DELETE') {
    const idx = channels.findIndex((c) => c.id === m![1])
    if (idx >= 0) channels.splice(idx, 1)
    return { status: 200, body: { ok: true } }
  }

  if (method === 'GET' && /\/channels(\?|$)/.test(path)) {
    return { status: 200, body: channels }
  }

  if ((m = path.match(/\/messages-channels\/send/)) && method === 'POST') {
    return { status: 201, body: { ok: true } }
  }

  if ((m = path.match(/\/messages-channels\/([^/?]+)/)) && method === 'GET') {
    return { status: 200, body: channelMessages[m[1]] ?? [] }
  }

  if (method === 'GET' && path.includes('/general-messages')) {
    return { status: 200, body: { data: generalMessages } }
  }

  if (method === 'POST' && path.includes('/general-messages')) {
    return { status: 201, body: { ok: true } }
  }

  if ((m = path.match(/\/private-messages\/([^/]+)\/([^/?]+)/)) && method === 'GET') {
    return { status: 200, body: privateThreads[m[2]] ?? [] }
  }

  if (method === 'POST' && path.includes('/private-messages')) {
    return { status: 201, body: { ok: true } }
  }

  if ((m = path.match(/\/users\/search\?name=(.+)/)) && method === 'GET') {
    const name = decodeURIComponent(m[1])
    const peer = DEMO_PEERS.find(
      (p) => p.username.toLowerCase() === name.toLowerCase(),
    )
    return {
      status: 200,
      body: [{ _id: peer?.userId ?? `u${Date.now()}`, username: peer?.username ?? name }],
    }
  }

  if (/\/users\/[^/]+\/(email|password)/.test(path) && method === 'PUT') {
    return { status: 200, body: { ok: true } }
  }

  if (/\/users\/[^/?]+$/.test(path) && method === 'DELETE') {
    return { status: 200, body: { ok: true } }
  }

  return { status: 404, body: { message: `Endpoint démo inconnu : ${method} ${path}` } }
}

/* ------------------------------------------------------------ installation */

export function installDemo(): void {
  // Intercepte les appels axios
  axios.defaults.adapter = async (config: AxiosRequestConfig) => {
    const res = route(
      (config.method ?? 'get').toUpperCase(),
      config.url ?? '',
      config.data,
    )
    if (res.status >= 400) {
      return Promise.reject({
        response: { status: res.status, data: res.body },
        message: (res.body as any)?.message ?? 'Erreur démo',
      })
    }
    return {
      data: res.body,
      status: res.status,
      statusText: 'OK',
      headers: {},
      config: config as never,
    }
  }

  // Intercepte les appels fetch vers l'API
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (API_PATHS.test(pathOf(url))) {
      const res = route((init?.method ?? 'GET').toUpperCase(), url, init?.body)
      return new Response(JSON.stringify(res.body), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return originalFetch(input, init)
  }
}
