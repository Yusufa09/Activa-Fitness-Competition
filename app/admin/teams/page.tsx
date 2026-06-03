"use client";

import { useEffect, useState } from "react";
import { QRCodeDisplay } from "@/components/admin/QRCodeDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TEAM_COLORS } from "@/lib/points";
import { ChevronDown, ChevronUp, Pencil, Check, X, Plus, ArrowRightLeft, Search } from "lucide-react";
import { toast } from "sonner";

interface MemberRow { display_name: string; created_at: string }
interface EnrollmentRow { id: string; points: number; member: MemberRow }
interface TeamRow {
  id: string;
  name: string;
  color: string;
  total_points: number;
  enrollments: EnrollmentRow[];
}
interface CompetitionRow { id: string; name: string }

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [competition, setCompetition] = useState<CompetitionRow | null>(null);
  const [gymCode, setGymCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState("");

  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [search, setSearch] = useState("");
  const [teamFilters, setTeamFilters] = useState<Record<string, string>>({});

  async function fetchData() {
    const r = await fetch("/api/admin/teams");
    const d = await r.json();
    setTeams(d.teams ?? []);
    setCompetition(d.competition ?? null);
    setGymCode(d.gym?.gym_code ?? "");
    setLoading(false);
  }

  useEffect(() => {
    setAppUrl(process.env.NEXT_PUBLIC_APP_URL || window.location.origin);
    fetchData();
  }, []);

  async function saveRename(id: string) {
    if (!editName.trim()) return;
    const res = await fetch("/api/admin/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName.trim() }),
    });
    if (res.ok) { toast.success("Team renamed."); setEditingTeam(null); fetchData(); }
    else toast.error("Could not rename team.");
  }

  async function createTeam() {
    if (!newTeamName.trim()) return;
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName.trim() }),
    });
    if (res.ok) { toast.success("Team added."); setNewTeamName(""); setAddingTeam(false); fetchData(); }
    else toast.error("Could not add team.");
  }

  async function moveMember(enrollmentId: string, toTeamId: string) {
    const res = await fetch("/api/admin/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move_member", enrollment_id: enrollmentId, to_team_id: toTeamId }),
    });
    if (res.ok) { toast.success("Member moved."); fetchData(); }
    else toast.error("Could not move member.");
  }

  if (!loading && !competition) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Teams</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          No active competition. Start one in{" "}
          <a href="/admin/competitions" className="text-orange-600 hover:underline">Competitions</a>{" "}
          to see teams.
        </div>
      </div>
    );
  }

  const maxPoints = Math.max(...teams.map((t) => t.total_points), 1);
  const query = search.trim().toLowerCase();
  const searchResults = query
    ? teams.flatMap((team) =>
        (team.enrollments ?? [])
          .filter((en) => en.member.display_name.toLowerCase().includes(query))
          .map((en) => ({ en, team }))
      ).sort((a, b) => b.en.points - a.en.points)
    : [];

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teams</h1>
          {competition && <p className="text-slate-500 text-sm mt-0.5">{competition.name}</p>}
        </div>
        {appUrl && gymCode && (
          <QRCodeDisplay url={`${appUrl}/?gym=${gymCode}`} label={`Scan to join · Code ${gymCode}`} />
        )}
      </div>

      {/* Member search */}
      {!loading && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name…"
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Search results */}
      {query && (
        <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 text-xs uppercase text-slate-500 font-medium">
            {searchResults.length} match{searchResults.length === 1 ? "" : "es"} for &ldquo;{search}&rdquo;
          </div>
          {searchResults.length === 0 ? (
            <p className="p-4 text-slate-400 text-sm text-center">No members found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-2 font-medium">Name</th>
                  <th className="text-left px-4 py-2 font-medium">Team</th>
                  <th className="text-right px-4 py-2 font-medium">Points</th>
                  <th className="text-right px-4 py-2 font-medium">Move to</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(({ en, team }) => {
                  const colors = TEAM_COLORS[team.color] ?? TEAM_COLORS.orange;
                  const otherTeams = teams.filter((t) => t.id !== team.id);
                  return (
                    <tr key={en.id} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 text-slate-700 font-medium">{en.member.display_name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{team.name}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-600">{en.points}</td>
                      <td className="px-4 py-2.5 text-right">
                        {otherTeams.length > 0 ? (
                          <select
                            defaultValue=""
                            onChange={(e) => { if (e.target.value) moveMember(en.id, e.target.value); }}
                            className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-white"
                          >
                            <option value="" disabled>Choose team…</option>
                            {otherTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add team */}
      {!loading && !query && (
        <div className="mb-4">
          {addingTeam ? (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
              <Input
                autoFocus
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createTeam()}
                placeholder="New team name"
                className="flex-1"
              />
              <Button size="sm" onClick={createTeam} className="bg-orange-600 hover:bg-orange-700 text-white">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingTeam(false); setNewTeamName(""); }}>Cancel</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAddingTeam(true)} className="text-slate-600">
              <Plus className="w-4 h-4 mr-1.5" /> New Team
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />)}</div>
      ) : query ? null : (
        <div className="space-y-4">
          {teams.map((team) => {
            const colors = TEAM_COLORS[team.color] ?? TEAM_COLORS.orange;
            const isExpanded = expanded === team.id;
            const otherTeams = teams.filter((t) => t.id !== team.id);
            return (
              <div key={team.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className={`p-5 ${colors.bg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {editingTeam === team.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveRename(team.id)}
                            className="max-w-[200px] bg-white"
                          />
                          <button onClick={() => saveRename(team.id)} className="text-green-600 hover:text-green-700 p-1"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingTeam(null)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h2 className={`text-xl font-bold ${colors.text}`}>{team.name}</h2>
                          <button
                            onClick={() => { setEditingTeam(team.id); setEditName(team.name); }}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Rename team"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-slate-500 text-sm">{team.enrollments?.length ?? 0} members</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-3xl font-black ${colors.text}`}>{team.total_points.toLocaleString()}</p>
                      <p className="text-slate-400 text-xs">total points</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
                    <div className={`h-full ${colors.bar} rounded-full`} style={{ width: `${(team.total_points / maxPoints) * 100}%` }} />
                  </div>
                  <button onClick={() => setExpanded(isExpanded ? null : team.id)} className={`mt-4 flex items-center gap-1 text-sm font-medium ${colors.text} hover:underline`}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {isExpanded ? "Hide" : "Show"} members
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200">
                    {(team.enrollments?.length ?? 0) === 0 ? (
                      <p className="p-4 text-slate-400 text-sm text-center">No members yet.</p>
                    ) : (
                      <>
                      <div className="relative px-4 py-2 border-b border-slate-100">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          value={teamFilters[team.id] ?? ""}
                          onChange={(e) => setTeamFilters((p) => ({ ...p, [team.id]: e.target.value }))}
                          placeholder={`Search members in ${team.name}…`}
                          className="pl-8 h-8 text-xs"
                        />
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <th className="text-left px-4 py-2 font-medium">Name</th>
                            <th className="text-right px-4 py-2 font-medium">Points</th>
                            <th className="text-right px-4 py-2 font-medium">Move to</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...team.enrollments]
                            .filter((en) => en.member.display_name.toLowerCase().includes((teamFilters[team.id] ?? "").toLowerCase()))
                            .sort((a, b) => b.points - a.points).map((en) => (
                            <tr key={en.id} className="border-t border-slate-100">
                              <td className="px-4 py-2.5 text-slate-700 font-medium">{en.member.display_name}</td>
                              <td className={`px-4 py-2.5 text-right font-bold ${colors.text}`}>{en.points}</td>
                              <td className="px-4 py-2.5 text-right">
                                {otherTeams.length > 0 ? (
                                  <div className="inline-flex items-center gap-1.5 text-slate-400">
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                    <select
                                      defaultValue=""
                                      onChange={(e) => { if (e.target.value) moveMember(en.id, e.target.value); }}
                                      className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-white"
                                    >
                                      <option value="" disabled>Choose team…</option>
                                      {otherTeams.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
