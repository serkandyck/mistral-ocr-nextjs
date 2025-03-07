'use client';

import { useState, useEffect } from 'react';
import { Upload, AlertTriangle, Info, Copy, FileText, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { extractTextFromImage, fileToBase64 } from '@/utils/mistral';
import { isSupabaseConfigured } from '@/utils/supabase';
import { supabase } from '@/utils/supabase';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [configError, setConfigError] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fileName, setFileName] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'raw' | 'rendered'>('rendered');
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Check auth state
  useEffect(() => {
    if (!supabase) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle sign in
  const handleSignIn = async () => {
    if (!supabase) {
      toast.error('Supabase configuration is missing');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        toast.error('An error occurred while signing in');
        console.error('Sign in error:', error);
      }
    } catch (error) {
      toast.error('An error occurred while signing in');
      console.error('Sign in error:', error);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    if (!supabase) {
      toast.error('Supabase configuration is missing');
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('An error occurred while signing out');
        console.error('Sign out error:', error);
      } else {
        toast.success('Successfully signed out');
        // Reset states
        setShowResult(false);
        setExtractedText('');
        setFileName('');
      }
    } catch (error) {
      toast.error('An error occurred while signing out');
      console.error('Sign out error:', error);
    }
  };

  // Function to render markdown
  const renderMarkdown = (text: string) => {
    if (!text) return <span className="text-gray-700 italic">No text extracted</span>;
    
    // Process markdown
    const processedText = text
      // Headers
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold my-4 text-black">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold my-3 text-black">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold my-2 text-black">$1</h3>')
      // Line breaks
      .replace(/\n/g, '<br />')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-black">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="text-black">$1</em>')
      // Lists
      .replace(/^\s*\- (.*$)/gm, '<li class="ml-4 text-black">• $1</li>')
      .replace(/^\s*\d+\. (.*$)/gm, '<li class="ml-4 list-decimal text-black">$1</li>')
      // Paragraphs (wrap text not already in HTML tags)
      .replace(/([^>]*?)(?=<|$)/g, function(match) {
        if (match.trim() === '') return match;
        return `<p class="mb-2 text-black">${match}</p>`;
      });
    
    return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
  };

  // Check if configuration is valid
  useEffect(() => {
    async function checkConfig() {
      try {
        setLoading(true);
        
        // Check if Supabase is configured (we still need this for Mistral API key validation)
        if (!isSupabaseConfigured()) {
          setConfigError(true);
        }
      } catch (error) {
        console.error('Error checking configuration:', error);
      } finally {
        setLoading(false);
      }
    }

    checkConfig();
  }, []);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setApiError(null);
    setCopied(false);

    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    setFileName(file.name);
    toast.loading('Extracting text...', { id: 'extracting' });

    try {
      // Convert the file to base64 using our utility function
      const base64Data = await fileToBase64(file);
      
      // Make direct API request
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64: base64Data }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setApiError(data.error || 'API request failed');
        toast.error('OCR process failed', { id: 'extracting' });
        setExtractedText('');
      } else if (!data.text) {
        setApiError('No text found in API response');
        toast.error('No text could be extracted', { id: 'extracting' });
        setExtractedText('');
      } else {
        setExtractedText(data.text);
        toast.success('Text successfully extracted', { id: 'extracting' });

        // Automatic save process
        try {
          const saveResponse = await fetch('/api/documents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              extractedText: data.text,
            }),
          });

          if (saveResponse.ok) {
            toast.success('Document automatically saved');
            fetchDocuments(); // Update document list
          } else {
            const saveData = await saveResponse.json();
            console.error('Error saving document:', saveData.error);
            toast.error('An error occurred while saving the document');
          }
        } catch (saveError) {
          console.error('Error saving document:', saveError);
          toast.error('An error occurred while saving the document');
        }
      }
      
      setShowResult(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      setApiError(error instanceof Error ? error.message : 'Unknown error');
      toast.error('An error occurred while extracting text', { id: 'extracting' });
      setExtractedText('');
      setShowResult(true);
    } finally {
      setUploading(false);
    }
  };

  // Handle new upload
  const handleNewUpload = () => {
    setExtractedText('');
    setShowResult(false);
    setFileName('');
    setApiError(null);
    setCopied(false);
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(extractedText)
      .then(() => {
        toast.success('Text copied to clipboard');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Error copying text'));
  };

  // Handle download as markdown
  const handleDownloadMarkdown = () => {
    if (!extractedText) return;
    
    const blob = new Blob([extractedText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.split('.')[0] || 'ocr-result'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Markdown file downloaded');
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === 'raw' ? 'rendered' : 'raw');
  };

  // Fetch user's documents
  const fetchDocuments = async () => {
    if (!user) return;

    setLoadingDocuments(true);
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents || []);
      } else {
        console.error('Error fetching documents:', data.error);
        toast.error('An error occurred while loading documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('An error occurred while loading documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Load documents when user changes
  useEffect(() => {
    fetchDocuments();
  }, [user]);

  // Save current document
  const saveDocument = async () => {
    if (!extractedText || !fileName) return;

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          extractedText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Document successfully saved');
        fetchDocuments(); // Refresh documents list
      } else {
        console.error('Error saving document:', data.error);
        toast.error('An error occurred while saving the document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('An error occurred while saving the document');
    }
  };

  // Delete document
  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Document successfully deleted');
        fetchDocuments(); // Refresh documents list
      } else {
        const data = await response.json();
        console.error('Error deleting document:', data.error);
        toast.error('An error occurred while deleting the document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('An error occurred while deleting the document');
    }
  };

  // Load document content
  const loadDocument = (document: any) => {
    setFileName(document.file_name);
    setExtractedText(document.extracted_text);
    setShowResult(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">Configuration Error</h3>
            <div className="mt-2 text-yellow-700">
              <p>Mistral AI API key is not properly configured. Please check your environment variables.</p>
              <p className="mt-2">Update your <code className="bg-yellow-100 px-1 py-0.5 rounded">.env.local</code> file as follows:</p>
              <pre className="bg-yellow-100 p-2 mt-2 rounded overflow-x-auto">
                {`# Mistral AI
MISTRAL_API_KEY=your-actual-mistral-api-key`}
              </pre>
              <p className="mt-2">Then restart the development server.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">OCR Text Extraction Tool</h1>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      {!user ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in with your Google account to use the OCR text extraction tool.
          </p>
          <button
            onClick={handleSignIn}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-base font-medium"
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          {/* Saved Documents Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Saved Documents</h2>
            {loadingDocuments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading documents...</p>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-gray-900">{doc.file_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadDocument(doc)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No saved documents yet.</p>
            )}
          </div>

          {!showResult ? (
            // Upload section
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-6">Upload New Image</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
                <Upload className="mx-auto h-16 w-16 text-gray-400" />
                <p className="mt-4 text-base text-gray-600">
                  Upload an image to extract text using OCR
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-6 inline-flex items-center px-6 py-3 rounded-md bg-blue-500 text-white hover:bg-blue-600 cursor-pointer transition-colors text-base font-medium"
                >
                  {uploading ? 'Uploading...' : 'Select Image'}
                </label>
                <p className="mt-4 text-sm text-gray-500">
                  Supported formats: JPG, PNG, GIF, BMP
                </p>
              </div>
            </div>
          ) : (
            // Result section with save button
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">{fileName}</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleViewMode}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    {viewMode === 'raw' ? 'Markdown View' : 'Raw Text'}
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className={`px-4 py-2 rounded-md ${
                      !extractedText 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : copied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors text-sm font-medium flex items-center`}
                    disabled={!extractedText}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className={`px-4 py-2 rounded-md ${
                      !extractedText 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } transition-colors text-sm font-medium flex items-center`}
                    disabled={!extractedText}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download MD
                  </button>
                  <button
                    onClick={handleNewUpload}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    New Image
                  </button>
                </div>
              </div>
              
              {apiError && (
                <div className="m-6 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-red-800">API Error</h3>
                      <p className="text-sm text-red-700">{apiError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                {viewMode === 'raw' ? (
                  <div className="border rounded-md p-6 bg-gray-100 min-h-[300px] font-mono text-base leading-relaxed whitespace-pre-wrap text-black">
                    {extractedText || <span className="text-gray-700 italic">No text extracted</span>}
                  </div>
                ) : (
                  <div className="border rounded-md p-6 bg-gray-50 min-h-[300px] text-base leading-relaxed markdown-content text-black">
                    {renderMarkdown(extractedText)}
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 bg-blue-100 border-t">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      This text was extracted using Mistral AI OCR technology. Results may vary depending on image quality and content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
