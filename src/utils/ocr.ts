// OCR utility functions
// This file provides client-side functions to interact with the OCR API

/**
 * Extract text from an image using the OCR API
 * @param imageBase64 - Base64-encoded image data
 * @returns The extracted text
 */
export async function extractTextFromImage(imageBase64: string): Promise<string> {
  try {
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to extract text from image');
    }

    // Check if we have text in the response
    if (!data.text || data.text.trim() === '') {
      return '';
    }
    
    return data.text;
  } catch (error) {
    throw new Error('Failed to extract text from image');
  }
} 