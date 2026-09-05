import { mockApi } from './mock';
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
    if (event === 'job:lock') return mockApi.lockJob(data?.jobId);
    if (event === 'negotiation:join') return { ok: true, state: await mockApi.joinNegotiation() };
    if (event === 'negotiation:message') {
      const msg = await mockApi.sendMessage(data?.body);
      return { ok: true, message: { ...msg, senderName: msg.senderName } };
    }
    if (event === 'negotiation:decline') return mockApi.decline();
    if (event === 'agreement:sign') return mockApi.sign();
    if (event === 'project:updateProgress') return mockApi.updateProjectProgress(data?.projectId, data?.progress);
    if (event === 'project:updateStatus') return mockApi.updateProjectStatus(data?.projectId, data?.status);
    if (event === 'project:addMilestone') return mockApi.addMilestone(data?.projectId, data?.title);
    if (event === 'project:toggleMilestone') return mockApi.toggleMilestone(data?.projectId, data?.milestoneId);
    if (event === 'project:sendMessage') return mockApi.sendWorkspaceMessage(data?.projectId, data?.body);
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
  return true;
}
