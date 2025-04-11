import type { DefaultEventsMap } from "@socket.io/component-emitter";
import io, {Socket} from "socket.io-client";

export default class SocketService {
    public static socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined
    public static init(): void {
        this.socket = io(`${import.meta.env.VITE_API_URL}`)
    }
}