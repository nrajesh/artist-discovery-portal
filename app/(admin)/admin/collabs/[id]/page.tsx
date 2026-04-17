import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollabDetailForAdmin } from "@/lib/queries/collabs";

export default async function AdminCollabDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collab = await getCollabDetailForAdmin(id);
  if (!collab) notFound();
  const messages = collab.messages;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-8">
      <Link href="/admin/collabs" className="text-sm text-amber-700 hover:text-amber-900 mb-6 inline-block">
        Back to Collabs
      </Link>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">{collab.name}</h1>
            <p className="text-stone-500 text-sm mt-1">Owner: {collab.owner} &middot; Created {collab.createdAt}</p>
          </div>
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${collab.status === "active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
            {collab.status}
          </span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm mb-6">
          Admins can view all message history. Artists are notified of this.
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 mb-6">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Members ({collab.members.length})</h2>
          <div className="flex flex-wrap gap-2">
            {collab.members.map((m) => (
              <span key={m} className="bg-stone-100 text-stone-700 text-xs px-3 py-1 rounded-full font-medium">{m}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-4">Message History ({messages.length})</h2>
          {messages.length === 0 ? (
            <p className="text-stone-400 text-sm italic">No messages yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 flex-shrink-0">
                    {msg.sender[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-stone-800">{msg.sender}</span>
                      <span className="text-xs text-stone-400">{msg.time}</span>
                    </div>
                    <p className="text-sm text-stone-700 leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
