import PartySocket from 'partysocket';
import { GLOBAL_CHAT_ROOM_ID } from '~/lib/constants/chat';
import { resolvePartyHost } from '~/lib/party/host';
import { WEBSOCKET_CONFIG } from '../constants';
import {
  parseWebSocketMessage,
  serializeWebSocketMessage,
  type IncomingWebSocketEvent,
  type OutgoingWebSocketEvent,
} from '../utils/websocket-events';

export type WebSocketEventHandler = (event: IncomingWebSocketEvent) => void;

export type WebSocketConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export class ChatWebSocketService {
  private socket: PartySocket | null = null;
  private connectionState: WebSocketConnectionState = 'disconnected';
  private eventHandlers: WebSocketEventHandler[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(private token: string | null = null) {}

  /**
   * Establishes WebSocket connection
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.connectionState === 'connected') {
        resolve();
        return;
      }

      this.token = token;
      this.cleanup();

      try {
        this.connectionState = 'connecting';
        
        this.socket = new PartySocket({
          host: resolvePartyHost(),
          room: GLOBAL_CHAT_ROOM_ID,
          query: { token },
        });

        this.socket.addEventListener('open', () => {
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.addEventListener('close', () => {
          this.connectionState = 'disconnected';
          this.scheduleReconnect();
        });

        this.socket.addEventListener('error', () => {
          this.connectionState = 'error';
          reject(new Error('WebSocket connection failed'));
        });

        this.socket.addEventListener('message', this.handleMessage);

      } catch (error) {
        this.connectionState = 'error';
        reject(error);
      }
    });
  }

  /**
   * Disconnects WebSocket
   */
  disconnect(): void {
    this.cleanup();
    this.connectionState = 'disconnected';
  }

  /**
   * Sends a message through WebSocket
   */
  sendMessage(event: OutgoingWebSocketEvent): boolean {
    if (!this.socket || this.connectionState !== 'connected') {
      return false;
    }

    try {
      const message = serializeWebSocketMessage(event);
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Adds event handler for incoming messages
   */
  addEventListener(handler: WebSocketEventHandler): () => void {
    this.eventHandlers.push(handler);
    
    // Return cleanup function
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index > -1) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Gets current connection state
   */
  getConnectionState(): WebSocketConnectionState {
    return this.connectionState;
  }

  /**
   * Checks if WebSocket is connected and ready
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN && this.connectionState === 'connected';
  }

  private handleMessage = (event: MessageEvent<string>) => {
    const parsedEvent = parseWebSocketMessage(event.data);
    if (parsedEvent) {
      this.eventHandlers.forEach(handler => {
        try {
          handler(parsedEvent);
        } catch (error) {
          console.error('Error in WebSocket event handler:', error);
        }
      });
    }
  };

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (this.token && this.connectionState === 'disconnected') {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS})`);
        this.connect(this.token).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, WEBSOCKET_CONFIG.RECONNECT_DELAY * this.reconnectAttempts);
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.removeEventListener('message', this.handleMessage);
      this.socket.close();
      this.socket = null;
    }
  }
}