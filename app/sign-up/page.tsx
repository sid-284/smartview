import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Create a new account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <a href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </a>
          </p>
        </div>
        
        <div className="mt-8">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-500 hover:bg-blue-600 text-sm normal-case",
                card: "bg-white shadow-xl",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 