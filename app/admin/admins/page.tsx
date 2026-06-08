"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Trash2, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail } from "@/lib/validation";

interface AdminRow { id: string; email: string | null; first_name: string | null; last_name: string | null; created_at: string }
interface InviteRow { id: string; email: string; created_at: string }

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  async function fetchData() {
    const res = await fetch("/api/admin/admins");
    const data = await res.json();
    setAdmins(data.admins ?? []);
    setInvites(data.invites ?? []);
    setLoading(false);
  }
  useEffect(() => { fetchData(); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (!isValidEmail(email)) { toast.error("Please enter a valid email address."); return; }
    setInviting(true);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) { toast.error(data.error ?? "Could not invite."); return; }
    toast.success(`Invited ${email.trim()}. They can now sign up.`);
    setEmail("");
    fetchData();
  }

  async function revoke(invite_id: string) {
    const res = await fetch("/api/admin/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_id }),
    });
    if (res.ok) { toast.success("Invite revoked."); fetchData(); }
    else toast.error("Could not revoke.");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Administrators</h1>
        <p className="text-slate-500 text-sm mt-0.5">Invite other gym administrators to help run this gym.</p>
      </div>

      {/* Invite form */}
      <form onSubmit={invite} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="new-admin@example.com"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={inviting} className="bg-orange-600 hover:bg-orange-700 text-white">
          {inviting ? "Inviting..." : "Invite"}
        </Button>
      </form>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-14 bg-white rounded-xl border border-slate-200 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Current Administrators ({admins.length})</h2>
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {admins.map((a) => {
                const fullName = [a.first_name, a.last_name].filter(Boolean).join(" ");
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <Shield className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <div className="min-w-0">
                      {fullName && <span className="text-sm text-slate-700 font-medium">{fullName}</span>}
                      <span className={`text-sm text-slate-500 ${fullName ? "block text-xs" : ""}`}>{a.email ?? "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {invites.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Pending Invites ({invites.length})</h2>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-slate-700 flex-1">{inv.email}</span>
                    <span className="text-xs text-slate-400">awaiting sign-up</span>
                    <button onClick={() => revoke(inv.id)} className="text-slate-400 hover:text-red-600 p-1" title="Revoke invite">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Invited admins sign up at <span className="font-mono">/admin/accept-invite</span> using their email.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
