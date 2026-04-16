'use client';

import { useState } from 'react';
import { usePostHog } from 'posthog-js/react';

export default function AvailabilityPage() {
  const posthog = usePostHog();
  const [windows, setWindows] = useState<string[]>([]);

  function handleAddWindow() {
    setWindows(prev => [...prev, new Date().toISOString().slice(0, 10)]);
  }

  function handleSave() {
    posthog.capture('availability_updated', { window_count: windows.length });
  }

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-8 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-stone-800 mb-6">Availability Calendar</h1>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          {windows.length === 0 ? (
            <p className="text-stone-400 text-sm italic">No availability windows added yet.</p>
          ) : (
            <ul className="space-y-2">
              {windows.map((w, i) => (
                <li key={i} className="text-sm text-stone-700 border border-stone-100 rounded-lg px-3 py-2">
                  {w}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={handleAddWindow}
            className="w-full py-2.5 border border-amber-300 text-amber-700 font-medium rounded-lg hover:bg-amber-50 transition-colors min-h-[44px]"
          >
            + Add Window
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 transition-colors min-h-[44px]"
          >
            Save Availability
          </button>
        </div>
      </div>
    </main>
  );
}
