import { Server as SocketServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { ExecSocketEvents } from "../events/socket.event";
import { fe_url } from "../env/e";

export class CollabDrawingServer {
  private static instance: CollabDrawingServer;
  private _io: SocketServer;

  private constructor(httpServer: HTTPServer) {
    this._io = new SocketServer(httpServer, {
      cors: {
        origin: fe_url,
        credentials: true,
      },
    });
    this.setupSocketEvents();
  }

  public static getInstance(httpServer: HTTPServer): CollabDrawingServer {
    if (!CollabDrawingServer.instance) {
      CollabDrawingServer.instance = new CollabDrawingServer(httpServer);
    }
    return CollabDrawingServer.instance;
  }

  private setupSocketEvents() {
    const io = this._io;
    ExecSocketEvents(io);
  }

  public getConnectionStats() {
    return {
      totalConnections: this._io.engine.clientsCount,
      totalRooms: this._io.sockets.adapter.rooms.size,
    };
  }
}
