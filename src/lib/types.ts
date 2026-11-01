export type EventStatus = 'open' | 'closed' | 'draft';
export type DietaryOption = 'normal' | 'vegetarian' | 'none';
export type RegistrationStatus = 'confirmed' | 'waitlist' | 'cancelled';

export interface EventItem {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  event_date: string;
  registration_deadline: string;
  max_capacity: number;
  status: EventStatus;
  image_url: string;
  organizer: string;
  created_at: string;
  // 統計計算欄位 (前端聚合)
  confirmed_count?: number;
  waitlist_count?: number;
}

export interface RegistrationItem {
  id: string;
  event_id: string;
  ticket_code: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  dietary: DietaryOption;
  notes: string;
  status: RegistrationStatus;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  // 關聯活動資訊
  event?: EventItem;
}

export interface CreateRegistrationInput {
  event_id: string;
  name: string;
  email: string;
  phone: string;
  organization?: string;
  dietary: DietaryOption;
  notes?: string;
}

export interface CreateEventInput {
  title: string;
  category: string;
  description: string;
  location: string;
  event_date: string;
  registration_deadline: string;
  max_capacity: number;
  status: EventStatus;
  image_url: string;
  organizer: string;
}
