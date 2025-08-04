import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ChannelType } from "@prisma/client";
import { ascii } from "effect/FastCheck";
import { redirect } from "next/navigation";
import { ServerHeader } from "@/components/server/server-header";

interface ServerSidebarProps {
    serverId: string;
};

export const ServerSidebar = async ({
    serverId
}: ServerSidebarProps) => {
    const profile = await currentProfile();
    if (!profile) return redirect("/");

    const server = await db.server.findUnique({
        where: {
            id: serverId
        },
        include: {
            // sort channels by created time
            channels: {
                orderBy: {
                    createdAt: "asc",
                }
            },

            // sort members by role, ADMIN -> MODERATOR -> MEMBER
            members: {
                include: {
                    profile: true,
                },
                orderBy: {
                    role: "asc",
                }
            }
        }
    });

    if (!server) return redirect("/");

    // get all channels in the server
    const textChannels = server?.channels.filter((channel) => channel.type === ChannelType.TEXT);
    const audioChannels = server?.channels.filter((channel) => channel.type === ChannelType.AUDIO);
    const videoChannels = server?.channels.filter((channel) => channel.type === ChannelType.VIDEO);

    // show all members but ourself
    const members = server?.members.filter((member) => member.profileId !== profile.id);

    // get your role in the server, IF you are a member
    const role = server.members.find((member) => member.profileId === profile.id)?.role;

    return (
        <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-violet-200">
            <ServerHeader 
                server={server}
                role={role}
            />
        </div>
    )
};