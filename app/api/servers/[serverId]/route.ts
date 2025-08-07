import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: {
        params: { serverId: string }
    }
) {
    try {
        const profile = await currentProfile();
        const { name, imageUrl } = await req.json();

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { serverId } = await params; 

        if (!serverId) return new NextResponse("Server ID missing", { status: 400 });

        const server = await db.server.update({
            where: {
                id: serverId,
                profileId: profile.id,
            },
            data: {
                name,
                imageUrl,
            }
        });

        return NextResponse.json(server);

    } catch (error) {
        console.log("PATCH server name/image error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: {
        params: { serverId: string }
    }
) {
    try {
        const profile = await currentProfile();
        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { serverId } = await params; 

        if (!serverId) return new NextResponse("Server ID missing", { status: 400 });

        const server = await db.server.delete({
            where: {
                id: serverId,
                profileId: profile.id,
            },
        });

        return NextResponse.json(server);

    } catch (error) {
        console.log("DELETE_SERVER route error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}