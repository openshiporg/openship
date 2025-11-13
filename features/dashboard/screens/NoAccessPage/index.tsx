'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NoAccessPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm flex flex-col items-center bg-muted/40 border rounded-lg p-6 shadow-lg">
        <div className="flex justify-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/10 border-2 border-rose-200 dark:border-rose-800">
            <Lock className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
        </div>

        <div className="text-center gap-0 mt-4">
          <h1 className="text-center text-lg font-semibold">Access Denied</h1>
          <p className="mt-2 text-center mx-auto sm:max-w-[90%] text-sm text-muted-foreground">
            You don't have permission to access this page. If you believe this is an error, please contact your administrator for assistance.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full mt-8">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-3" />
            Go Back
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={() => router.push('/')}
          >
            <Store className="size-3" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NoAccessPage;