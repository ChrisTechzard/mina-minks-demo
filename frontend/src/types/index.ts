/** Shared contracts mirroring the FastAPI response models. */

export interface Service {
  id: number;
  name: string;
  description: string;
  price_ghs: number;
  duration_minutes: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface AvailabilityResponse {
  date: string;
  service_id: number;
  timezone: string;
  slot_duration_minutes: number;
  slots: string[];
  message: string;
}

export interface BookingCreatePayload {
  service_id: number;
  start_at: string;
  full_name: string;
  email: string;
  phone: string;
  notes?: string | null;
}

export interface BookingConfirmation {
  reference: string;
  status: string;
  start_at: string;
  end_at: string;
  service_name: string;
  service_category: string;
  service_duration_minutes: number;
  price_ghs: number;
  client_name: string;
  client_email_masked: string;
  client_phone_masked: string;
  message: string;
}

export interface LookupResult {
  reference: string;
  status: string;
  start_at: string;
  end_at: string;
  service_name: string;
  duration_minutes: number;
  client_name: string;
  client_email_masked: string;
  client_phone_masked: string;
}

export interface AftercareContent {
  label: string;
  disclaimer: string;
  sections: Array<{ title: string; items: string[] }>;
  rebooking_note: string;
}

export interface AdminBooking {
  id: number;
  reference: string;
  status: string;
  start_at: string;
  end_at: string;
  notes: string | null;
  created_at: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_id: number;
  service_name: string;
  price_ghs: number;
  duration_minutes: number;
}

export interface Dashboard {
  total_bookings: number;
  today_bookings: number;
  upcoming_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  sample_value_ghs: number;
  upcoming: AdminBooking[];
}

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_at: string;
  email: string;
}

export interface AdminIdentity {
  email: string;
  expires_at: string;
}

export interface BookingFilters {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface WorkingHour {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BlockedDate {
  id: number;
  date: string;
  reason: string | null;
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface AdminAvailability {
  working_hours: WorkingHour[];
  blocked_dates: BlockedDate[];
  timezone: string;
}

export interface AdminService extends Service {}

export interface WorkingHourPayload {
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BlockedDatePayload {
  date: string;
  reason: string | null;
  is_full_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
}

export interface BookingPatch {
  status?: string;
  start_at?: string;
  notes?: string;
}

export interface ServicePatch {
  name?: string;
  description?: string;
  price_ghs?: number;
  duration_minutes?: number;
  is_active?: boolean;
}
