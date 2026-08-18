import io from 'socket.io-client'
import { DEMO, fakeSocket } from '@/demo/demo'

export default class SocketService {
  // Socket réel (socket.io) ou faux socket en mode démo — même interface on/off/emit
  public static socket: any

  public static init(): void {
    if (this.socket) return
    this.socket = DEMO ? fakeSocket : io(`${import.meta.env.VITE_API_URL}`)
  }
}
