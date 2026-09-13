import type { AuthSession } from '../auth/auth';

export type InvitationPreview = {
  code: string;
  eventId: string;
  eventTitle: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  locationName: string;
  private: true;
  previewAllowed: true;
  participationRequiresAuthentication: true;
};

export type AcceptedInvitation = {
  eventId: string;
  role: 'organizer' | 'co-organizer' | 'family-member' | 'guest';
  familyGroupId: string;
};

export class AllTogetherApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getSession: () => Promise<AuthSession | null>,
  ) {}

  async invitationPreview(code: string): Promise<InvitationPreview> {
    return this.request(`/v1/invitations/${encodeURIComponent(code)}/preview`, false);
  }

  async acceptInvitation(code: string): Promise<AcceptedInvitation> {
    return this.request(`/v1/invitations/${encodeURIComponent(code)}/accept`, true, { method: 'POST' });
  }

  async myEventAccess(eventId: string): Promise<{ role: AcceptedInvitation['role'] }> {
    return this.request(`/v1/events/${encodeURIComponent(eventId)}/me`, true);
  }

  private async request<T>(path: string, authenticated: boolean, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('accept', 'application/json');

    if (authenticated) {
      const session = await this.getSession();
      if (!session) throw new Error('Authentication required');
      headers.set('authorization', `Bearer ${session.accessToken}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(`API request failed with ${response.status}`);
    return response.json() as Promise<T>;
  }
}
