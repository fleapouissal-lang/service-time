// ---------------------------------------------------------------------------
// Enums (alignés sur supabase/migrations/20260603150000_initial_schema.sql)
// ---------------------------------------------------------------------------

export type ProfileRole = "admin" | "technician" | "client";

export type TechnicianType = "workshop" | "mobile";

export type ServiceType =
  | "periodic_maintenance"
  | "emergency"
  | "spare_parts";

export type ExecutionMethod = "workshop_visit" | "mobile_workshop";

export enum ServiceRequestStatus {
  RECEIVED = "received",
  IN_PROGRESS = "in_progress",
  ON_THE_WAY = "on_the_way",
  ARRIVED = "arrived",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export type RequestPriority = "low" | "normal" | "high";

export type NotificationChannel = "whatsapp" | "sms";

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: ProfileRole;
  technician_type: TechnicianType | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** @deprecated Utiliser Profile avec role = 'technician' */
export interface Technician {
  id: string;
  full_name: string;
  phone: string | null;
  technician_type: TechnicianType;
  is_active: boolean;
}

/** @deprecated Utiliser Profile */
export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Service {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  category: string | null;
  service_type: ServiceType;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SparePart {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  category: string | null;
  category_en: string | null;
  details: string | null;
  details_en: string | null;
  image_url: string | null;
  img: string | null;
  /** Ordered gallery paths; `img` is the cover (first image). */
  images: string[] | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SparePartPaymentMethod = "cash_on_delivery" | "online";

export type SparePartPaymentStatus = "pending" | "paid" | "failed";

export type SparePartOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface SparePartOrder {
  id: string;
  client_id: string;
  status: SparePartOrderStatus;
  notes: string | null;
  order_token: string;
  payment_method: SparePartPaymentMethod;
  payment_status: SparePartPaymentStatus;
  total_amount: number;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface SparePartOrderItem {
  id: string;
  order_id: string;
  spare_part_id: string;
  quantity: number;
  name_snapshot: string;
  category_snapshot: string | null;
  img_snapshot: string | null;
  price_snapshot: number;
  created_at: string;
}

export interface ClientVehicle {
  id: string;
  client_id: string;
  label: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  client_id: string | null;
  customer_name: string;
  customer_phone: string;
  car_type: string | null;
  location_text: string | null;
  location_lat: number | null;
  location_lng: number | null;
  description: string | null;
  service_type: ServiceType;
  execution_method: ExecutionMethod;
  status: ServiceRequestStatus;
  priority: RequestPriority;
  assigned_technician_id: string | null;
  tracking_token: string;
  created_at: string;
  updated_at: string;
}

export interface RequestPhoto {
  id: string;
  request_id: string;
  storage_path: string;
  created_at: string;
}

export interface RequestStatusHistory {
  id: string;
  request_id: string;
  status: ServiceRequestStatus;
  changed_by: string | null;
  created_at: string;
}

export interface TechnicianLocation {
  technician_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}

export interface SiteContent {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  request_id: string | null;
  channel: NotificationChannel;
  event: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
}
