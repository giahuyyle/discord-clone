import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { Message } from "@prisma/client";
import { NextResponse } from "next/server";

const MESSAGES_SEARCH_BATCH = 10; // search 10 messages per batch

export async function GET(
    req: Request
) {
    try {
        const profile = await currentProfile();
        const { searchParams } = new URL(req.url);

        const cursor = searchParams.get("cursor");
        const channelId = searchParams.get("channelId");

        if (!profile) return new NextResponse("Unauthorized", { status: 401 });
        if (!channelId) return new NextResponse("Channel ID missing", { status: 400 });

        let messages: Message[] = [];

        if (cursor) {
            messages = await db.message.findMany({
                take: MESSAGES_SEARCH_BATCH,
                skip: 1,
                cursor: {
                    id: cursor,
                },
                where: {
                    channelId,
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
            messages = await db.message.findMany({
                take: MESSAGES_SEARCH_BATCH,
                where: {
                    channelId,
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

        // if messages is 10, get the id of the last message and let it be the new cursor
        if (messages.length === MESSAGES_SEARCH_BATCH) {
            nextCursor = messages[MESSAGES_SEARCH_BATCH - 1].id
        }

        return NextResponse.json({
            items: messages,
            cursor: nextCursor
        });

    } catch (error) {
        console.log("MESSAGES GET error:", error);
        return new NextResponse("Internal Eror", { status: 500 });
    }
}