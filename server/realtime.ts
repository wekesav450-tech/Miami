import { Response } from 'express';

export interface RealtimeEvent {
  type: 'new_order' | 'order_updated' | 'new_reservation' | 'reservation_updated' | 'menu_updated';
  data: any;
  timestamp: string;
}

interface ClientConnection {
  id: string;
  res: Response;
  role?: string;
  userId?: string;
}

class RealtimeHub {
  private clients: Map<string, ClientConnection> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.broadcastRaw(': heartbeat\n\n');
    }, 25000);
  }

  public registerClient(id: string, res: Response, role?: string, userId?: string) {
    this.clients.set(id, { id, res, role, userId });

    // Send initial connected confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', id, timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.clients.delete(id);
    });
  }

  public broadcast(type: RealtimeEvent['type'], data: any) {
    const payload: RealtimeEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    const message = `data: ${JSON.stringify(payload)}\n\n`;
    this.broadcastRaw(message);
  }

  private broadcastRaw(message: string) {
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(message);
      } catch (err) {
        this.clients.delete(id);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const realtimeHub = new RealtimeHub();
