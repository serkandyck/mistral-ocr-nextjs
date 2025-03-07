// Document utility functions
// This file provides client-side functions to interact with the documents API
// Updated to handle errors better and provide more detailed error messages

export interface Document {
  id: string;
  title: string;
  content: string;
  original_text: string;
  user_id: string;
  created_at: string;
}

/**
 * Get all documents for the current user
 * @param userId - The ID of the current user
 * @returns An array of documents
 */
export async function getDocuments(userId: string): Promise<Document[]> {
  try {
    // For development/testing when Supabase is not configured
    if (process.env.NODE_ENV === 'development' && 
        (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase-project-url'))) {
      console.log('Using mock data for documents in development mode');
      return [];
    }

    const response = await fetch('/api/documents', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from documents API:', errorData);
      return []; // Return empty array instead of throwing to prevent app crashes
    }

    const data = await response.json();
    return data.documents || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return []; // Return empty array to prevent app crashes
  }
}

/**
 * Create a new document
 * @param userId - The ID of the current user
 * @param title - The title of the document
 * @param content - The content of the document
 * @param originalText - The original text extracted from the image
 * @returns The created document
 */
export async function createDocument(
  userId: string,
  title: string,
  content: string,
  originalText: string
): Promise<Document> {
  try {
    // For development/testing when Supabase is not configured
    if (process.env.NODE_ENV === 'development' && 
        (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase-project-url'))) {
      console.log('Using mock data for document creation in development mode');
      return {
        id: 'mock-id',
        title,
        content,
        original_text: originalText,
        user_id: userId,
        created_at: new Date().toISOString(),
      };
    }

    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        title,
        content,
        originalText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from documents API:', errorData);
      throw new Error(errorData.error || 'Failed to create document');
    }

    const data = await response.json();
    return data.document;
  } catch (error) {
    console.error('Error creating document:', error);
    throw new Error('Failed to create document');
  }
} 