"use client";

import { useCallback, useEffect, useState } from "react";

type Room = {
  id: string;
  code: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  expiresAt: string | null;
  turnNumber: number;
  host: { id: string; name: string | null; email: string | null };
  winner: { id: string; name: string | null; email: string | null } | null;
  members: Array<{
    id: string; userId: string; name: string; email: string | null; seat: number;
    isConnected: boolean; isReady: boolean; leftAt: string | null; lastSeenAt: string;
  }>;
  actionCount: number;
};

type Filter = "ALL" | "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const statusStyle: Record<Room["status"], string> = {
  WAITING: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-orange-50 text-orange-700",
  CANCELLED: "bg-stone-100 text-stone-600"
};

export function RoomManager({ locale }: { locale: "ar" | "en" }) {
  const ar = locale === "ar";
  const [rooms, setRooms] = useState<Room[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/rooms", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "LOAD_FAILED");
      setRooms(data.rooms);
      setCounts(data.counts);
      setError("");
    } catch {
      setError(ar ? "تعذر تحميل الغرف. حدّث الصفحة وحاول مرة أخرى." : "Could not load rooms. Refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => { void load(); }, [load]);

  async function terminate(room: Room) {
    const message = ar
      ? `هل أنت متأكد من إنهاء الغرفة ${room.code}؟ سيتم إيقاف المباراة وإخراج اللاعبين منها، ولا يمكن التراجع عن هذا الإجراء.`
      : `Terminate room ${room.code}? The match will stop and players will be removed. This cannot be undone.`;
    if (!window.confirm(message)) return;

    setBusyId(room.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, action: "terminate" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "TERMINATE_FAILED");
      setNotice(ar ? `تم إنهاء الغرفة ${room.code} بنجاح.` : `Room ${room.code} was terminated.`);
      await load();
    } catch (e) {
      const key = e instanceof Error ? e.message : "";
      setError(key === "ROOM_NOT_ACTIVE"
        ? (ar ? "الغرفة لم تعد نشطة." : "This room is no longer active.")
        : (ar ? "تعذر إنهاء الغرفة. حدّث القائمة وحاول مرة أخرى." : "Could not terminate this room. Refresh and try again."));
    } finally {
      setBusyId(null);
    }
  }

  const labels: Record<Room["status"], string> = {
    WAITING: ar ? "في الانتظار" : "Waiting",
    IN_PROGRESS: ar ? "مباراة جارية" : "In progress",
    COMPLETED: ar ? "مكتملة" : "Completed",
    CANCELLED: ar ? "ملغاة / منتهية إداريًا" : "Cancelled / admin-ended"
  };
  const filters: Array<{ value: Filter; label: string }> = [
    { value: "ALL", label: ar ? "الكل" : "All" },
    { value: "WAITING", label: ar ? "انتظار" : "Waiting" },
    { value: "IN_PROGRESS", label: ar ? "جارية" : "In progress" },
    { value: "COMPLETED", label: ar ? "مكتملة" : "Completed" },
    { value: "CANCELLED", label: ar ? "ملغاة" : "Cancelled" }
  ];
  const visibleRooms = rooms.filter(room => filter === "ALL" || room.status === filter);
  const date = (value: string) => new Intl.DateTimeFormat(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return (
    <main dir={ar ? "rtl" : "ltr"} className="admin-arena min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="admin-kicker text-xs">GUESS ARENA · ROOM OPERATIONS</p>
            <h1 className="mt-2 text-3xl font-black text-stone-950">{ar ? "إدارة الغرف والمباريات" : "Rooms & matches"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              {ar ? "راقب الغرف واللاعبين وحالة الاتصال، وأنهِ الغرف العالقة أو غير المرغوب فيها بصلاحية إدارية." : "Monitor rooms, players, and connection status. Administrators can safely terminate stuck or unwanted rooms."}
            </p>
          </div>
          <button onClick={() => { setLoading(true); void load(); }} className="min-h-10 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 hover:bg-stone-50">
            {ar ? "تحديث القائمة" : "Refresh"}
          </button>
        </div>

        <section className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: ar ? "غرف في الانتظار" : "Waiting", value: counts.WAITING ?? 0 },
            { label: ar ? "مباريات جارية" : "In progress", value: counts.IN_PROGRESS ?? 0 },
            { label: ar ? "مباريات مكتملة" : "Completed", value: counts.COMPLETED ?? 0 },
            { label: ar ? "غرف ملغاة" : "Cancelled", value: counts.CANCELLED ?? 0 }
          ].map(item => <article key={item.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">{item.label}</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-stone-950">{item.value}</p>
          </article>)}
        </section>

        {error && <div role="alert" aria-live="assertive" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"><p className="min-w-0 flex-1">{error}</p><button type="button" onClick={() => void load()} disabled={loading} className="min-h-9 rounded-lg border border-rose-200 bg-white px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-rose-500">{ar ? "إعادة تحميل الغرف" : "Reload rooms"}</button></div>}
        {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</p>}

        <div className="mt-7 flex flex-wrap gap-2">
          {filters.map(item => <button key={item.value} onClick={() => setFilter(item.value)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === item.value ? "bg-orange-600 text-white" : "border border-stone-200 bg-white text-stone-600 hover:border-orange-300"}`}>
            {item.label}
          </button>)}
        </div>

        {loading ? <div className="py-16 text-center text-sm text-stone-400">{ar ? "جارٍ تحميل الغرف..." : "Loading rooms..."}</div>
          : visibleRooms.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center text-sm text-stone-400">{ar ? "لا توجد غرف في هذا التصنيف." : "No rooms in this filter."}</div>
          : <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {visibleRooms.map(room => <article key={room.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black tracking-wider text-stone-400">{ar ? "كود الغرفة" : "ROOM CODE"}</p>
                  <p className="mt-1 text-2xl font-black tracking-[.18em] text-stone-950">{room.code}</p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${statusStyle[room.status]}`}>{labels[room.status]}</span>
              </div>

              <div className="mt-4 grid gap-3 rounded-xl bg-stone-50 p-3 sm:grid-cols-2">
                <div><p className="text-[11px] text-stone-400">{ar ? "المضيف" : "Host"}</p><p className="mt-1 break-all text-sm font-bold text-stone-800">{room.host.name || room.host.email || "—"}</p></div>
                <div><p className="text-[11px] text-stone-400">{ar ? "تاريخ الإنشاء" : "Created"}</p><p className="mt-1 text-sm font-semibold text-stone-700">{date(room.createdAt)}</p></div>
                {room.startedAt && <div><p className="text-[11px] text-stone-400">{ar ? "بدأت المباراة" : "Started"}</p><p className="mt-1 text-sm font-semibold text-stone-700">{date(room.startedAt)}</p></div>}
                <div><p className="text-[11px] text-stone-400">{ar ? "سجل الحركات" : "Recorded actions"}</p><p className="mt-1 text-sm font-semibold text-stone-700">{room.actionCount}</p></div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-extrabold text-stone-600">{ar ? "اللاعبون" : "Players"}</p>
                <div className="space-y-2">
                  {room.members.map(member => <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-100 px-3 py-2">
                    <div><p className="text-sm font-bold text-stone-800">{member.name}</p><p className="text-xs text-stone-400">{member.email || member.userId}</p></div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500">
                      <span>{ar ? `مقعد ${member.seat}` : `Seat ${member.seat}`}</span>
                      <span className={member.leftAt ? "text-stone-400" : member.isConnected ? "text-emerald-600" : "text-rose-500"}>{member.leftAt ? (ar ? "غادر" : "Left") : member.isConnected ? (ar ? "متصل" : "Connected") : (ar ? "غير متصل" : "Offline")}</span>
                    </div>
                  </div>)}
                  {room.members.length === 0 && <p className="text-xs text-stone-400">{ar ? "لا يوجد لاعبون مسجلون." : "No players recorded."}</p>}
                </div>
              </div>

              {(room.status === "WAITING" || room.status === "IN_PROGRESS") && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
                <p className="text-xs leading-5 text-amber-700">{ar ? "إنهاء الغرفة سيوقفها فورًا ويخرج اللاعبين منها." : "Terminating this room immediately stops it and removes its players."}</p>
                <button disabled={busyId === room.id} onClick={() => void terminate(room)} className="min-h-10 rounded-xl bg-rose-600 px-4 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-50">
                  {busyId === room.id ? (ar ? "جارٍ الإنهاء..." : "Terminating...") : (ar ? "إنهاء الغرفة" : "Terminate room")}
                </button>
              </div>}
              {room.status === "COMPLETED" && room.winner && <p className="mt-4 text-xs font-bold text-emerald-700">{ar ? "الفائز: " : "Winner: "}{room.winner.name || room.winner.email}</p>}
            </article>)}
          </div>}
        <p className="mt-6 text-xs leading-5 text-stone-400">{ar ? "يتم عرض أحدث 100 غرفة. إنهاء الغرفة إجراء إداري نهائي، ويتم حفظه في سجل حركات المباراة." : "Showing the latest 100 rooms. Administrative termination is final and is recorded in the game action history."}</p>
      </div>
    </main>
  );
}
