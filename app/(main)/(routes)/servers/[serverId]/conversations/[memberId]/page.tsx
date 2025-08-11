import { ChatHeader } from "@/components/chat/chat-header";
import { getOrCreateConversation } from "@/lib/conversation";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

interface MemberIdPageProp {
    params: Promise<{
        memberId: string;
        serverId: string;
    }>
};

const MemberIdPage = async ({
    params
}: MemberIdPageProp) => {
    const profile = await currentProfile();

    // memberId is the member id of memberTwo
    const { serverId, memberId } = await params;

    if (!profile) return redirect("/sign-in");

    const currentMember = await db.member.findFirst({
        where: {
            serverId: serverId,
            profileId: profile.id
        },
        include: {
            profile: true
        }
    });

    if (!currentMember) return redirect("/");

    const conversation = await getOrCreateConversation(currentMember.id, memberId);

    // if conversation not found/created, it means you're not in the server, hence redirects and let you join immediately
    if (!conversation) return redirect(`/servers/${serverId}`);

    const { memberOne, memberTwo } = conversation;

    // see which one initiated the conversation, and then extracts who is the receiver
    const otherMember = memberOne.profileId === profile.id ? memberTwo : memberOne;

    return (  
        <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
            <ChatHeader
                imageUrl={otherMember.profile.imageUrl}
                name={otherMember.profile.name}
                serverId={serverId}
                type="conversation"
            />
        </div>
    );
}
 
export default MemberIdPage;