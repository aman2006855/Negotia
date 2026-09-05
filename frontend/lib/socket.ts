import type { Project } from './types';

type Handler = (...args: any[]) => void;

class MockSocket {
  private listeners: Map<string, Handler[]> = new Map();

  on(event: string, handler: Handler) {
    const list = this.listeners.get(event) ?? [];
    list.push(handler);
    this.listeners.set(event, list);
  }

  off(event: string, handler: Handler) {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(event, list.filter((h) => h !== handler));
  }

  emit(_event: string, _data?: any) {}

  async emitWithAck(event: string, data?: any): Promise<any> {
    return { ok: true };
  }

  timeout(_ms: number) { return this; }

  connect() {}
  disconnect() {}
}

const mockSocket = new MockSocket();

export function getSocket(): MockSocket {
  return mockSocket;
}

export function destroySocket() {}

export function isMockMode(): boolean {
  return false;
}
