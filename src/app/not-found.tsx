/**
 * src/app/not-found.tsx
 * 404 page
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-center px-4">
      <div>
        <p className="text-7xl font-black text-brand-700">404</p>
        <h1 className="text-2xl font-bold text-neutral-900 mt-4">Page not found</h1>
        <p className="text-neutral-500 mt-2 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tasks">Browse tasks</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
