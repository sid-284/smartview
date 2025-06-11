import { getAuth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const { userId } = getAuth();
  
  if (!userId) {
    // Redirect to sign in if not authenticated
    redirect('/sign-in');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Protected Dashboard</h1>
      <p className="mb-6">
        This page is protected and only visible to authenticated users.
      </p>
      <p className="text-sm text-gray-500 mb-6">Your user ID: {userId}</p>
      
      <Link 
        href="/" 
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        Back to Home
      </Link>
    </div>
  );
} 