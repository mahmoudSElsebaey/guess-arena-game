import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { appendRoomAction, publishRoomEvent } from "@/lib/rooms";

export const dynamic = "force-dynamic";

function failure(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { response: failure("UNAUTHORIZED", 401) } as const;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true }
  });
  if (!user || user.status !== "ACTIVE") return { response: failure("UNAUTHORIZED", 401) } as const;
  if (user.role !== "OWNER" && user.role !== "ADMIN") return { response: failure("FORBIDDEN", 403) } as const;
  return { user } as const;
}

export async function GET() {
  const access = await requireAdmin();
  if ("response" in access) return access.response;
  const [rooms, grouped] = await Promise.all([
    prisma.room.findMany({
      take: 100,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        host: { select: { id: true, name: true, email: true } },
        winner: { select: { id: true, name: true, email: true } },
        members: {
          orderBy: { seat: "asc" },
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { actions: true } }
      }
    }),
    prisma.room.groupBy({ by: ["status"], _count: { _all: true } })
  ]);

  return NextResponse.json({
    rooms: rooms.map(room => ({
      id: room.id, code: room.code, status: room.status,
      createdAt: room.createdAt.toISOString(),
      startedAt: room.startedAt?.toISOString() ?? null,
      finishedAt: room.finishedAt?.toISOString() ?? null,
      turnNumber: room.turnNumber,
      host: room.host, winner: room.winner,
      members: room.members.map(member => ({
        id: member.id, userId: member.userId, name: member.user.name ?? member.user.email ?? "Player",
        email: member.user.email, seat: member.seat, isConnected: member.isConnected,
        isReady: member.isReady, leftAt: member.leftAt?.toISOString() ?? null,
        lastSeenAt: member.lastSeenAt.toISOString()
      })),
      actionCount: room._count.actions
    })),
    counts: Object.fromEntries(grouped.map(item => [item.status, item._count._all]))
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const access = await requireAdmin();
  if ("response" in access) return access.response;
  const body = await request.json().catch(() => ({}));
  if (typeof body.roomId !== "string" || body.roomId.length > 80) return failure("INVALID_ROOM");
  if (body.action !== "terminate") return failure("INVALID_ACTION");

  try {
    const result = await prisma.$transaction(async tx => {
      const room = await tx.room.findUnique({
        where: { id: body.roomId },
        include: { members: { where: { leftAt: null }, select: { id: true, userId: true } } }
      });
      if (!room) throw new Error("ROOM_NOT_FOUND");
      if (room.status !== "WAITING" && room.status !== "IN_PROGRESS") throw new Error("ROOM_NOT_ACTIVE");
      const now = new Date();
      const changed = await tx.room.updateMany({
        where: { id: room.id, status: room.status, version: room.version },
        data: {
          status: "CANCELLED", winnerId: null, currentTurnUserId: null,
          finishedAt: now, expiresAt: null, version: { increment: 1 }
        }
      });
      if (changed.count !== 1) throw new Error("ROOM_STATE_CHANGED");
      await tx.roomMember.updateMany({
        where: { roomId: room.id, leftAt: null },
        data: { leftAt: now, isConnected: false, isReady: false }
      });
      await appendRoomAction(tx, {
        roomId: room.id, actorId: access.user.id, type: "GAME_FINISHED",
        payload: { reason: "ADMIN_TERMINATED", terminatedBy: access.user.id, previousStatus: room.status }
      });
      return { id: room.id, code: room.code, version: room.version + 1, status: "CANCELLED" as const };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await publishRoomEvent(result.id, "room.updated", {
      roomId: result.id, version: result.version, status: result.status, reason: "ADMIN_TERMINATED"
    });
    return NextResponse.json({ ok: true, room: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "ROOM_NOT_FOUND" ? 404
      : message === "ROOM_NOT_ACTIVE" || message === "ROOM_STATE_CHANGED" ? 409 : 500;
    return failure(status === 500 ? "ROOM_TERMINATE_FAILED" : message, status);
  }
}
