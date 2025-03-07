// OCR API route
// This file provides a server-side API endpoint for OCR functionality
import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Remove the data URL prefix if present
    const base64Data = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;

    // Create a data URL for the image
    const dataUrl = `data:image/jpeg;base64,${base64Data}`;

    try {
      // Check if API key is configured
      if (!process.env.MISTRAL_API_KEY) {
        return NextResponse.json(
          { error: 'Mistral API key is not configured' },
          { status: 500 }
        );
      }
      
      // Initialize Mistral client
      const mistralClient = new Mistral({
        apiKey: process.env.MISTRAL_API_KEY,
      });
      
      // Call Mistral AI API for OCR with the correct parameters
      const response = await (mistralClient as any).ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: "image_url",
          imageUrl: dataUrl
        }
      });

      // Extract text from the response
      const responseObj = response as any;
      
      // Check if the response has pages with markdown content
      let extractedText = '';
      
      if (responseObj.pages && Array.isArray(responseObj.pages) && responseObj.pages.length > 0) {
        // Collect text from all pages
        extractedText = responseObj.pages
          .map((page: any) => page.markdown || '')
          .filter((text: string) => text.trim() !== '')
          .join('\n\n');
      } else if (responseObj.text) {
        // Fallback to text field if available
        extractedText = responseObj.text;
      }

      return NextResponse.json({
        text: extractedText
      });
    } catch (error: any) {
      return NextResponse.json(
        { 
          error: 'Failed to extract text from image', 
          details: error.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Invalid request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 400 }
    );
  }
} 