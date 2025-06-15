This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Environment Setup

You can develop either locally with Docker or connect to a remote Supabase project.

#### Option A: Local Development (Recommended)

1. Install and start Docker Desktop
2. Run local Supabase:
   ```bash
   npm run supabase:start
   ```
3. Create `.env.local` with local credentials:
   ```bash
   # Local Supabase (from supabase start output)
   NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[local-anon-key]"
   POSTGRES_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
   ```

#### Option B: Remote Supabase Project

Create a `.env.local` file with your Supabase project credentials:

```bash
# Database
POSTGRES_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"

# Optional: For server-side operations (if needed)
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

Replace the placeholders with your actual Supabase project credentials.

📖 **See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed local setup instructions.**

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Run database migrations:

```bash
npm run drizzle:push
```

### 4. Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
