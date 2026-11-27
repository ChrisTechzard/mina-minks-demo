/** Typed HTTP client. All business validation also happens on the backend. */

import type {
  AdminAvailability,
  AdminBooking,
  AdminIdentity,
  AdminService,
  AvailabilityResponse,
  AftercareContent,
  BookingConfirmation,
  BookingCreatePayload,
  BookingFilters,
  BookingPatch,
  BlockedDate,
  BlockedDatePayload,
  Dashboard,
  LoginResponse,
  LookupResult,
  Service,
  ServicePatch,
  WorkingHour,
  WorkingHourPayload,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  static fromPayload(payload: unknown, status: number): ApiError {
    if (typeof payload !== 'object' || payload === null) {
      return new ApiError('The server returned an unexpected response.', status, 'unknown_error');
    }
    const body = payload as { detail?: unknown; code?: unknown };
    const code = typeof body.code === 'string' ? body.code : 'request_failed';
    let message = 'The request could not be completed.';
    if (typeof body.detail === 'string') {
      message = body.detail;
    } else if (Array.isArray(body.detail)) {
      const messages = body.detail
        .map((item: unknown) => {
          if (typeof item !== 'object' || item === null) return null;
          const entry = item as { msg?: unknown };
          return typeof entry.msg === 'string' ? entry.msg : null;
        })
        .filter((item: string | null): item is string => item !== null);
      if (messages.length > 0) message = messages.join(' ');
    }
    return new ApiError(message, status, code);
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Cannot reach the booking server. Please check your connection.', 0, 'network_error');
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = text;
    }
  }

  if (!response.ok) throw ApiError.fromPayload(payload, response.status);
  return payload as T;
}

function queryString<T extends object>(values: T): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]: [string, unknown]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
}

function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}

export const api = {
  getServices: (activeOnly = true): Promise<Service[]> =>
    request<Service[]>(`/api/services${queryString({ active_only: activeOnly })}`),

  getService: (id: number): Promise<Service> => request<Service>(`/api/services/${id}`),

  getAvailability: (date: string, serviceId: number): Promise<AvailabilityResponse> =>
    request<AvailabilityResponse>(`/api/availability${queryString({ date, service_id: serviceId })}`),

  createBooking: (payload: BookingCreatePayload): Promise<BookingConfirmation> =>
    request<BookingConfirmation>('/api/bookings', { method: 'POST', body: jsonBody(payload) }),

  lookupBooking: (reference: string, email: string, phone: string): Promise<LookupResult> =>
    request<LookupResult>(
      `/api/bookings/lookup/${encodeURIComponent(reference)}${queryString({ email, phone })}`,
    ),

  getAftercare: (): Promise<AftercareContent> => request<AftercareContent>('/api/aftercare'),

  admin: {
    login: (email: string, password: string): Promise<LoginResponse> =>
      request<LoginResponse>('/api/admin/login', {
        method: 'POST',
        body: jsonBody({ email, password }),
      }),

    me: (token: string): Promise<AdminIdentity> =>
      request<AdminIdentity>('/api/admin/me', { token }),

    logout: (token: string): Promise<void> =>
      request<void>('/api/admin/logout', { method: 'POST', token }),

    dashboard: (token: string): Promise<Dashboard> =>
      request<Dashboard>('/api/admin/dashboard', { token }),

    bookings: (token: string, filters: BookingFilters = {}): Promise<AdminBooking[]> =>
      request<AdminBooking[]>(`/api/admin/bookings${queryString(filters)}`, { token }),

    getBooking: (token: string, id: number): Promise<AdminBooking> =>
      request<AdminBooking>(`/api/admin/bookings/${id}`, { token }),

    patchBooking: (token: string, id: number, patch: BookingPatch): Promise<AdminBooking> =>
      request<AdminBooking>(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        token,
        body: jsonBody(patch),
      }),

    cancelBooking: (token: string, id: number): Promise<AdminBooking> =>
      request<AdminBooking>(`/api/admin/bookings/${id}/cancel`, { method: 'POST', token }),

    availability: (token: string): Promise<AdminAvailability> =>
      request<AdminAvailability>('/api/admin/availability', { token }),

    saveWorkingHour: (token: string, payload: WorkingHourPayload): Promise<WorkingHour> =>
      request<WorkingHour>('/api/admin/availability', {
        method: 'POST',
        token,
        body: jsonBody(payload),
      }),

    createBlockedDate: (token: string, payload: BlockedDatePayload): Promise<BlockedDate> =>
      request<BlockedDate>('/api/admin/blocked-dates', {
        method: 'POST',
        token,
        body: jsonBody(payload),
      }),

    deleteBlockedDate: (token: string, id: number): Promise<void> =>
      request<void>(`/api/admin/blocked-dates/${id}`, { method: 'DELETE', token }),

    services: (token: string): Promise<AdminService[]> =>
      request<AdminService[]>('/api/admin/services', { token }),

    patchService: (token: string, id: number, patch: ServicePatch): Promise<AdminService> =>
      request<AdminService>(`/api/admin/services/${id}`, {
        method: 'PATCH',
        token,
        body: jsonBody(patch),
      }),
  },
};
