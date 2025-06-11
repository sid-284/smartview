# Next.js App with Clerk Authentication

This is a Next.js application using the App Router with Clerk for authentication.

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up your Clerk account:
   - Create an account at [clerk.com](https://clerk.com)
   - Create a new application
   - Get your API keys from the Clerk Dashboard

4. Update the `.env.local` file with your Clerk API keys:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Features

- Next.js 14 with App Router
- Clerk Authentication
- Protected Routes
- TypeScript
- Tailwind CSS

## Project Structure

- `app/layout.tsx`: Root layout with ClerkProvider
- `app/page.tsx`: Home page with conditional content based on auth state
- `app/sign-in/page.tsx`: Sign-in page with Clerk's SignIn component
- `app/sign-up/page.tsx`: Sign-up page with Clerk's SignUp component
- `app/dashboard/page.tsx`: Protected dashboard page
- `src/middleware.ts`: Clerk middleware for route protection 