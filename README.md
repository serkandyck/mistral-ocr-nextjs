# OCR Document Scanner

A modern web application for extracting text from images using OCR (Optical Character Recognition) technology. Built with Next.js, Supabase, and Mistral AI.

![OCR Document Scanner Screenshot](/public/images/screenshot.png)

## Features

- 📷 Image upload and text extraction
- 📝 Markdown rendering of extracted text
- 💾 Document management with save and delete functionality
- 🔒 Secure authentication with Google
- 📱 Responsive design for all devices
- 🌐 Modern and intuitive user interface

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [React](https://reactjs.org/) - UI library
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Supabase](https://supabase.com/) - Backend and authentication
- [Mistral AI](https://mistral.ai/) - OCR API

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ocr-document-scanner.git
cd ocr-document-scanner
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Mistral AI
MISTRAL_API_KEY=your-mistral-api-key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

1. Create a new Supabase project
2. Create a `documents` table with the following schema:

```sql
create table documents (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  file_name text not null,
  extracted_text text not null
);

-- Enable Row Level Security
alter table documents enable row level security;

-- Create policy to allow users to see only their documents
create policy "Users can view their own documents"
  on documents for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own documents
create policy "Users can insert their own documents"
  on documents for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to delete their own documents
create policy "Users can delete their own documents"
  on documents for delete
  using (auth.uid() = user_id);
```

## Features in Detail

### Image Upload and Text Extraction
- Supports common image formats (JPG, PNG, GIF, BMP)
- Real-time text extraction using Mistral AI's OCR technology
- Automatic error handling and user feedback

### Document Management
- Save extracted text as documents
- View saved documents
- Delete documents
- Automatic saving after successful text extraction

### Text Processing
- View text in raw format or rendered markdown
- Copy text to clipboard
- Download text as markdown file
- Support for basic markdown formatting

### Authentication
- Google OAuth integration
- Secure session management
- Protected API routes
- Row-level security for documents

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Mistral AI](https://mistral.ai/) for the OCR technology
- [TailwindCSS](https://tailwindcss.com/) for the styling system
