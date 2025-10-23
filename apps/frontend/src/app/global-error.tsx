'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-6 border border-border/10 rounded-md bg-card text-card-foreground">
          <h2 className="text-lg font-semibold">Unexpected application error</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message || 'Something went wrong.'}
          </p>
          <button
            onClick={() => reset()}
            className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
