import { Response } from 'express';

export interface RealtimeEvent {
  type: 'new_order' | 'order_updated' | 'new_reservation' | 'reservation_updated' | 'menu_updated' | 'settings_updated';
  data: any;
  timestamp: string;
}

interface ClientConnection {
  id: string;
  res: Response;
  role: 'admin' | 'customer' | 'guest';
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

  public registerClient(id: string, res: Response, role: 'admin' | 'customer' | 'guest' = 'guest', userId?: string) {
    this.clients.set(id, { id, res, role, userId });

    // Send initial connected confirmation with sanitized metadata
    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        id,
        role,
        authenticated: role !== 'guest',
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    const cleanup = () => {
      this.clients.delete(id);
    };

    res.on('close', cleanup);
    res.on('finish', cleanup);
    res.on('error', cleanup);
  }

  /**
   * Broadcast only to verified administrators
   */
  public broadcastToAdmins(type: RealtimeEvent['type'], data: any) {
    const payload: RealtimeEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    const message = `data: ${JSON.stringify(payload)}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      if (client.role === 'admin') {
        try {
          client.res.write(message);
        } catch {
          this.clients.delete(id);
        }
      }
    }
  }

  /**
   * Broadcast an order event securely to admins and strictly to the owner customer
   */
  public broadcastOrderEvent(type: 'new_order' | 'order_updated', order: any) {
    const payload: RealtimeEvent = {
      type,
      data: order,
      timestamp: new Date().toISOString(),
    };
    const message = `data: ${JSON.stringify(payload)}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      // Admins receive all orders
      if (client.role === 'admin') {
        try {
          client.res.write(message);
        } catch {
          this.clients.delete(id);
        }
      } else if (client.userId && order.customer_id && client.userId === order.customer_id) {
        // Owner customer receives only their own order updates
        try {
          client.res.write(message);
        } catch {
          this.clients.delete(id);
        }
      }
    }
  }

  /**
   * Broadcast a reservation event securely to admins and strictly to the owner customer
   */
  public broadcastReservationEvent(type: 'new_reservation' | 'reservation_updated', reservation: any) {
    const payload: RealtimeEvent = {
      type,
      data: reservation,
      timestamp: new Date().toISOString(),
    };
    const message = `data: ${JSON.stringify(payload)}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      if (client.role === 'admin') {
        try {
          client.res.write(message);
        } catch {
          this.clients.delete(id);
        }
      } else if (client.userId && reservation.customer_id && client.userId === reservation.customer_id) {
        try {
          client.res.write(message);
        } catch {
          this.clients.delete(id);
        }
      }
    }
  }

  /**
   * Broadcast public non-sensitive events (e.g. menu availability changes) to all clients
   */
  public broadcastPublic(type: RealtimeEvent['type'], data: any) {
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
      } catch {
        this.clients.delete(id);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const realtimeHub = new RealtimeHub();

