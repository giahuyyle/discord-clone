import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { NavigationAction } from "@/components/navigation/navigation-action";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationItem } from "@/components/navigation/navigation-item";
import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@clerk/nextjs";

export const NavigationSidebar = async () => {
    const profile = await currentProfile();

    if (!profile) {
        redirect("/");
    }

    const servers = await db.server.findMany({
        where: {
            members: {
                some: {
                    profileId: profile.id
                }
            }
        }
    });

    return (
        <div
            className="space-y-4 flex flex-col items-center h-full text-primary
            bg-indigo-300 dark:bg-[#1e1f22] py-3 "
        >
            <NavigationAction />
            <Separator
                className="bg-zinc-100 dark:bg-zinc-600 rounded-md h-[2px] w-10"
            />
            <ScrollArea className="flex-1 w-full">
                {servers.map((server) => (
                    <div
                        key={server.id}
                        className="mb-4"
                    >
                        <NavigationItem 
                            id={server.id}
                            name={server.name}
                            imageUrl={server.imageUrl}
                        />
                    </div>
                ))}
            </ScrollArea>
            <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
                <ModeToggle />
                <UserButton
                    afterSwitchSessionUrl="/sign-in"
                    appearance={
                        {
                            elements: {
                                avatarBox: "h-[48px] w-[48px]"
                            }
                        }
                    }
                />
            </div>
        </div>
    )
};