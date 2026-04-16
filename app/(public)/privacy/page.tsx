import Link from "next/link";

/**
 * Privacy Policy page — analytics disclosure.
 * Server Component at the /privacy route.
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 text-white px-6 py-16 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">Privacy Policy</h1>
        <p className="text-amber-200 text-base sm:text-lg max-w-xl mx-auto">
          How the Carnatic Artist Portal collects and uses analytics data.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-amber-200 hover:text-white font-medium transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-14 space-y-10">

        {/* 1. Analytics usage */}
        <section aria-labelledby="analytics-usage">
          <h2 id="analytics-usage" className="text-xl font-bold text-stone-800 mb-3">
            1. Analytics
          </h2>
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 text-stone-700 leading-relaxed space-y-3">
            <p>
              This portal uses <strong className="text-stone-900">PostHog</strong> analytics to track page views and
              user interactions. The data collected is used solely for the purpose of understanding how the portal is
              used and improving the service for Carnatic musicians and visitors.
            </p>
            <p>
              Events that are tracked include page views, artist profile views, registration form submissions, and
              key interactions within the artist dashboard (such as collab creation and availability updates).
              No tracking occurs outside of these explicitly defined events — autocapture is disabled.
            </p>
          </div>
        </section>

        {/* 2. No PII */}
        <section aria-labelledby="no-pii">
          <h2 id="no-pii" className="text-xl font-bold text-stone-800 mb-3">
            2. Personal Data
          </h2>
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 text-stone-700 leading-relaxed space-y-3">
            <p>
              <strong className="text-stone-900">No personally identifiable information (PII) is included in any
              analytics event.</strong> Specifically, the following data is never sent to the analytics system:
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-600 pl-2">
              <li>Email addresses</li>
              <li>Full names</li>
              <li>Phone numbers or contact details</li>
            </ul>
            <p>
              Authenticated artists are identified in analytics by an opaque internal artist ID only. Non-identifying
              properties such as province and role may be associated with that ID to enable aggregate analysis
              (for example, understanding which regions are most active).
            </p>
          </div>
        </section>

        {/* 3. Data retention */}
        <section aria-labelledby="data-retention">
          <h2 id="data-retention" className="text-xl font-bold text-stone-800 mb-3">
            3. Data Retention
          </h2>
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 text-stone-700 leading-relaxed">
            <p>
              Event data is retained for <strong className="text-stone-900">12 months</strong>.
            </p>
            <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <strong>Note for portal operators:</strong> this retention period is a placeholder. Please update it to
              match the actual retention setting configured on your PostHog instance
              (Settings → Project → Data retention).
            </p>
          </div>
        </section>

        {/* 4. Opt-out */}
        <section aria-labelledby="opt-out">
          <h2 id="opt-out" className="text-xl font-bold text-stone-800 mb-3">
            4. Opting Out
          </h2>
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 text-stone-700 leading-relaxed space-y-3">
            <p>You can opt out of analytics tracking in two ways:</p>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <p className="font-semibold text-stone-800">Do Not Track browser signal</p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    If your browser has the <em>Do Not Track</em> setting enabled (DNT header set to{" "}
                    <code className="bg-stone-100 px-1 rounded text-xs">1</code>), the portal will detect this signal
                    on page load and disable all event capture for your session.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <p className="font-semibold text-stone-800">Opt-out cookie</p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    Setting the cookie{" "}
                    <code className="bg-stone-100 px-1 rounded text-xs">ph_opt_out=1</code> in your browser will
                    prevent any analytics events from being captured. This cookie persists across sessions until
                    you remove it.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-stone-500">
              When either opt-out mechanism is active, no events are sent — not even page views.
            </p>
          </div>
        </section>

        {/* 5. Self-hosted */}
        <section aria-labelledby="self-hosted">
          <h2 id="self-hosted" className="text-xl font-bold text-stone-800 mb-3">
            5. Data Storage &amp; Infrastructure
          </h2>
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 text-stone-700 leading-relaxed space-y-3">
            <p>
              The PostHog analytics instance used by this portal is{" "}
              <strong className="text-stone-900">self-hosted and operated by the portal operator</strong>. It runs on
              infrastructure under the operator&apos;s direct control.
            </p>
            <p>
              <strong className="text-stone-900">Your analytics data does not leave the operator&apos;s
              infrastructure.</strong> No data is sent to PostHog&apos;s cloud service or any third-party analytics
              provider. All event ingestion happens through a reverse-proxy route on this portal&apos;s own domain.
            </p>
          </div>
        </section>

        {/* 6. Contact */}
        <section aria-labelledby="contact">
          <h2 id="contact" className="text-xl font-bold text-stone-800 mb-3">
            6. Questions
          </h2>
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 text-stone-700 leading-relaxed">
            <p>
              If you have questions about how your data is handled, please contact the portal operator directly.
              Contact details can be found on the{" "}
              <Link href="/about" className="text-amber-700 hover:text-amber-900 underline underline-offset-2 font-medium">
                About
              </Link>{" "}
              page.
            </p>
          </div>
        </section>

        <p className="text-xs text-stone-400 text-center pt-4 border-t border-amber-100">
          This privacy policy relates to analytics data collection only. Last reviewed by the portal operator.
        </p>
      </div>

      {/* Footer nav */}
      <div className="border-t border-amber-200 bg-white px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-6 text-sm font-medium text-amber-700">
          <Link href="/" className="hover:text-amber-900 underline underline-offset-2">Home</Link>
          <Link href="/artists" className="hover:text-amber-900 underline underline-offset-2">Browse Artists</Link>
          <Link href="/register" className="hover:text-amber-900 underline underline-offset-2">Register as Artist</Link>
          <Link href="/about" className="hover:text-amber-900 underline underline-offset-2">About this Portal</Link>
        </div>
      </div>
    </main>
  );
}
