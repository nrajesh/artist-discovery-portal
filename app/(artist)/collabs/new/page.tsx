'use client';

import { usePostHog } from 'posthog-js/react';

export default function NewCollabPage() {
  const posthog = usePostHog();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    posthog.capture('collab_created');
  }

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-8 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-stone-800 mb-6">Create Collab</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <button
            type="submit"
            className="w-full py-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 transition-colors min-h-[44px]"
          >
            Create Collab
          </button>
        </form>
      </div>
    </main>
  );
}
