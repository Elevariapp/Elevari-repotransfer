export interface ContentQueueItem {
  id: string;
  file_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  property_id: string | null;
  file_path: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at?: string;
  reviewer_id?: string | null;
}

export interface ContentItem {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  target_table: string;
  target_id: string;
  created_at: string;
}

