export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-gray-600">
          The confirmation link may have expired or already been used.
        </p>
        <a
          href="/auth/login"
          className="inline-block rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Back to login
        </a>
      </div>
    </div>
  );
}