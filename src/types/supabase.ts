// Supabase database types
export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          file_name: string;
          extracted_text: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          file_name: string;
          extracted_text: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          file_name?: string;
          extracted_text?: string;
        };
      };
    };
  };
}; 