import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Next.js with Clerk Authentication</h1>
      
      <SignedIn>
        <div className="bg-green-100 text-green-800 p-6 rounded-lg shadow-md mb-6 max-w-md w-full">
          <h2 className="text-2xl font-semibold mb-4">Welcome, you are signed in!</h2>
          <p className="mb-4">This content is only visible to authenticated users.</p>
          <p className="text-sm text-green-600 mb-4">You're viewing this because you're authenticated with Clerk.</p>
          
          <Link 
            href="/dashboard" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium inline-block w-full text-center"
          >
            Go to Dashboard
          </Link>
        </div>
      </SignedIn>
      
      <SignedOut>
        <div className="bg-blue-100 text-blue-800 p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-semibold mb-4">Welcome, visitor!</h2>
          <p className="mb-4">Please sign in or sign up to access protected content.</p>
          <p className="text-sm text-blue-600 mb-4">You're viewing this because you're not authenticated.</p>
          
          <div className="flex flex-col gap-4 mt-6">
            <p className="text-center">Use the buttons in the header to sign in or sign up</p>
          </div>
        </div>
      </SignedOut>
    </div>
  );
} 