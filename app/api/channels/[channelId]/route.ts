import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const profile = await currentProfile();
        const { searchParams } = new URL(req.url);

        const serverId = searchParams.get("serverId");
        const channelId = (await params).channelId;

        if (!profile) return new NextResponse("Unauthorized", { status: 401 });
        if (!serverId) return new NextResponse("serverId missing", { status: 400 });
        if (!channelId) return new NextResponse("channelId missing", { status: 400 });

        const server = await db.server.update({
            where: {
                id: serverId,
                members: {
                    some: {
                        profileId: profile.id,
                        role: {
                            in: [MemberRole.ADMIN, MemberRole.MODERATOR]
                        }
                    }
                }
            },
            data: {
                channels: {
                    delete: {
                        id: channelId,
                        name: {
                            not: "general"
                        }
                    }
                }
            }
        });

        return NextResponse.json(server);

    } catch (error) {
        console.log("CHANNELS_DELETE route.ts error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
};

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{channelId: string}>}
) {
    try {
        const profile = await currentProfile();
        const { name, type } = await req.json();
        const { searchParams } = new URL(req.url);

        const channelId = (await params).channelId;
        
        const serverId = searchParams.get("serverId");

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        
        if (!serverId) {
            return new NextResponse("Server ID missing", { status: 400 });
        }

        if (!channelId) {
            return new NextResponse("Channel ID missing", { status: 400 });
        }

        if (name === "general") {
            return new NextResponse("Name cannot be 'general'",  { status: 400 });
        }
        
        const server = await db.server.update({
            where: {
                id: serverId,
                members: {
                    some: {
                        profileId: profile.id,
                        role: {
                            in: [MemberRole.ADMIN, MemberRole.MODERATOR],
                        }
                    }
                }
            },
            data: {
                channels: {
                    update: {
                        where: {
                            id: channelId,
                            NOT: {
                                name: "general",
                            },
                        },
                        data: {
                            name,
                            type,
                        }
                    }
                }
            }
        });
        
        return NextResponse.json(server);


    } catch (error) {
        console.log("[CHANNEL_ID_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
    
}