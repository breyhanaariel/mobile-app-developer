import type { AuthSession } from '../auth/auth';

export type EventRole = 'organizer' | 'co-organizer' | 'family-member' | 'guest';
export type InvitationPreview = {
  code: string;
  eventId: string;
  familyGroupId: string;
  eventTitle: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  locationName: string;
  private: boolean;
  previewAllowed: true;
  participationRequiresAuthentication: true;
};
export type AcceptedInvitation = { eventId: string; role: EventRole };
export type CloudinarySignature = { cloudName: string; apiKey: string; timestamp: number; folder: string; context: string; signature: string };

export class AllTogetherApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getSession: () => Promise<AuthSession | null>,
  ) {}

  async invitationPreview(code: string): Promise<InvitationPreview> { return this.request(`/v1/invitations/${encodeURIComponent(code)}/preview`, false); }
  async acceptInvitation(code: string): Promise<AcceptedInvitation> { return this.request(`/v1/invitations/${encodeURIComponent(code)}/accept`, true, { method: 'POST' }); }
  async events<T = unknown>(): Promise<T> { return this.request('/v1/events', true); }
  async event<T = unknown>(eventId: string): Promise<T> { return this.request(`/v1/events/${encodeURIComponent(eventId)}`, true); }
  async createEvent<T = unknown>(input: Record<string, unknown>): Promise<T> { return this.request('/v1/events', true, { method: 'POST', body: JSON.stringify(input) }); }
  async myEventAccess(eventId: string): Promise<{ role: EventRole; householdManager: boolean }> { return this.request(`/v1/events/${encodeURIComponent(eventId)}/me`, true); }

  async householdRsvp(householdId: string, status: 'yes' | 'no' | 'maybe' | 'pending', attendance?: Record<string, boolean>) {
    return this.request(`/v1/households/${encodeURIComponent(householdId)}/rsvp`, true, { method: 'POST', body: JSON.stringify({ status, attendance }) });
  }

  async activityRsvp(scheduleItemId: string, status: 'yes' | 'no' | 'maybe' | 'pending') {
    return this.request(`/v1/schedule-items/${encodeURIComponent(scheduleItemId)}/rsvp`, true, { method: 'POST', body: JSON.stringify({ status }) });
  }

  async vote(pollId: string, optionIds: string[]) { return this.request(`/v1/polls/${encodeURIComponent(pollId)}/votes`, true, { method: 'POST', body: JSON.stringify({ optionIds }) }); }
  async postMessage(eventId: string, text: string) { return this.request('/v1/chat/messages', true, { method: 'POST', body: JSON.stringify({ eventId, text }) }); }
  async removeMessage(messageId: string) { return this.request(`/v1/chat/messages/${encodeURIComponent(messageId)}`, true, { method: 'DELETE' }); }
  async setExpenseShareSettled(shareId: string, settled: boolean) { return this.request(`/v1/expense-shares/${encodeURIComponent(shareId)}`, true, { method: 'PATCH', body: JSON.stringify({ settled }) }); }
  async setTaskComplete(taskId: string, complete: boolean) { return this.request(`/v1/tasks/${encodeURIComponent(taskId)}`, true, { method: 'PATCH', body: JSON.stringify({ complete }) }); }
  async notifications<T = unknown>(): Promise<T> { return this.request('/v1/notifications', true); }
  async changes<T = unknown>(eventId: string): Promise<T> { return this.request(`/v1/events/${encodeURIComponent(eventId)}/changes`, true); }
  async registerPushToken(token: string, platform: 'ios' | 'android') { return this.request('/v1/push-tokens', true, { method: 'POST', body: JSON.stringify({ token, platform }) }); }
  async cloudinarySignature(eventId: string): Promise<CloudinarySignature> { return this.request('/v1/photos/sign-upload', true, { method: 'POST', body: JSON.stringify({ eventId }) }); }
  async recordPhoto(eventId: string, publicId: string, secureUrl: string, caption?: string) { return this.request('/v1/photos', true, { method: 'POST', body: JSON.stringify({ eventId, publicId, secureUrl, caption }) }); }
  async removePhoto(photoId: string) { return this.request(`/v1/photos/${encodeURIComponent(photoId)}`, true, { method: 'DELETE' }); }

  async uploadPhoto(eventId: string, uri: string, caption?: string) {
    const signature = await this.cloudinarySignature(eventId);
    const form = new FormData();
    form.append('file', { uri, name: 'family-photo.jpg', type: 'image/jpeg' } as any);
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('folder', signature.folder);
    form.append('context', signature.context);
    form.append('signature', signature.signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: 'POST', body: form });
    if (!response.ok) throw new Error('cloudinary_upload_failed');
    const uploaded = await response.json() as { public_id: string; secure_url: string };
    await this.recordPhoto(eventId, uploaded.public_id, uploaded.secure_url, caption);
    return uploaded;
  }

  private async request<T>(path: string, authenticated: boolean, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('accept', 'application/json');
    if (init.body) headers.set('content-type', 'application/json');
    if (authenticated) {
      const session = await this.getSession();
      if (!session) throw new Error('Authentication required');
      headers.set('authorization', `Bearer ${session.accessToken}`);
    }
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((payload as { error?: string }).error ?? `API request failed with ${response.status}`);
    return payload as T;
  }
}

export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_ALLTOGETHER_API_URL ?? 'http://10.0.2.2:3000';
