import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { DirectMessage } from "@prisma/client";
import { NextResponse } from "next/server";

const MESSAGES_SEARCH_BATCH = 15; // search 15 messages per batch

export async function GET(
    req: Request
) {
    try {
        const profile = await currentProfile();
        const { searchParams } = new URL(req.url);

        const cursor = searchParams.get("cursor");
        const conversationId = searchParams.get("conversationId");

        if (!profile) return new NextResponse("Unauthorized", { status: 401 });
        if (!conversationId) return new NextResponse("Conversation ID missing", { status: 400 });

        let messages: DirectMessage[] = [];

        if (cursor) {
            messages = await db.directMessage.findMany({
                take: MESSAGES_SEARCH_BATCH,
                skip: 1,
                cursor: {
                    id: cursor,
                },
                where: {
                    conversationId,
                },
                include: {
                    member: {
                        include: {
                            profile: true
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
        } else {
            messages = await db.directMessage.findMany({
                take: MESSAGES_SEARCH_BATCH,
                where: {
                    conversationId,
                },
                include: {
                    member: {
                        include: {
                            profile: true
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
        }

        let nextCursor = null;

        // if messages is 15, get the id of the last message and let it be the new cursor
        if (messages.length === MESSAGES_SEARCH_BATCH) {
            nextCursor = messages[MESSAGES_SEARCH_BATCH - 1].id
        }

        return NextResponse.json({
            items: messages,
            nextCursor: nextCursor
        });

    } catch (error) {
        console.log("DIRECT MESSAGES GET error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}