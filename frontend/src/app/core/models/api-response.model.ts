export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  trace_id?: string;
  meta?: Record<string, any>;
}

export interface ApiHttpError {
  status: number;
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  traceId?: string;
  retryAfter?: number;
}
