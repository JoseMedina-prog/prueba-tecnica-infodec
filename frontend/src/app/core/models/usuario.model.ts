export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  idioma: 'es' | 'de' | string;
  created_at?: string;
  updated_at?: string;
}
