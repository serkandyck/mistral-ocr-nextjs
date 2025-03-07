// Mistral AI utility for OCR functionality
// This file provides functions to interact with Mistral AI for OCR
import { Mistral } from '@mistralai/mistralai';

// Initialize Mistral client
let mistralClient: any = null;

try {
  if (process.env.MISTRAL_API_KEY) {
    mistralClient = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY,
    });
  }
} catch (error) {
  console.error('Error initializing Mistral client:', error);
}

/**
 * Convert a file to base64
 * @param file - The file to convert
 * @returns A promise that resolves to the base64-encoded file
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix if present
      const base64Data = base64.includes('base64,') 
        ? base64.split('base64,')[1] 
        : base64;
      resolve(base64Data);
    };
    reader.onerror = error => {
      reject(error);
    };
  });
}

/**
 * Extract text from the Mistral OCR API response
 * @param response - The API response object
 * @returns The extracted text
 */
function extractTextFromResponse(response: any): string {
  // Check if the response has pages with markdown content
  if (response.pages && Array.isArray(response.pages) && response.pages.length > 0) {
    // Collect text from all pages
    const extractedText = response.pages
      .map((page: any) => page.markdown || '')
      .filter((text: string) => text.trim() !== '')
      .join('\n\n');
    
    return extractedText;
  } 
  
  // Fallback to text field if available
  if (response.text) {
    return response.text;
  }
  
  return '';
}

/**
 * Extract text from an image using Mistral AI OCR
 * @param imageBase64 - Base64-encoded image data
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromImage(imageBase64: string): Promise<string> {
  try {
    // Check if Mistral client is initialized
    if (!mistralClient) {
      throw new Error('Mistral client is not initialized');
    }
    
    // Remove the data URL prefix if present
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;
    
    // Create a data URL for the image
    const dataUrl = `data:image/jpeg;base64,${base64Data}`;
    
    // Call Mistral AI API for OCR with the correct parameters
    try {
      const response = await mistralClient.ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: "image_url",
          imageUrl: dataUrl
        }
      });
      
      // Extract text from the response
      return extractTextFromResponse(response);
    } catch (apiError: any) {
      // Try with type casting as a workaround
      const response = await (mistralClient as any).ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: "image_url",
          imageUrl: dataUrl
        }
      });
      
      // Extract text from the response
      return extractTextFromResponse(response);
    }
  } catch (error) {
    throw new Error('Failed to extract text from image');
  }
} 