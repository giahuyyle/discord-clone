import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

interface InviteCodePageProps {
    params: Promise<{
        inviteCode: string;
    }>
}

const InviteCodePage = async ({
    params
}: InviteCodePageProps) => {
    const profile = await currentProfile();

    if (!profile) return redirect("/sign-in");

    // if no invite code, redirect to homepage
    const inviteCode = (await params).inviteCode;
    if (!inviteCode) return redirect("/");

    // if already a member, return
    const existingServer = await db.server.findFirst({
        where: {
            inviteCode: inviteCode,
            members: {
                some: {
                    profileId: profile.id
                }
            }
        }
    });

    if (existingServer) return redirect(`/servers/${existingServer.id}`)

    const server = await db.server.update({
        where: {
            inviteCode: inviteCode,
        },
        data: {
            members: {
                create: [
                    {
                        profileId: profile.id
                    }
                ]
            }
        }
    });

    if (server) return redirect(`/servers/${server.id}`)

    return (  
        <div>
            Hello invite
        </div>
    );
}
 
export default InviteCodePage;