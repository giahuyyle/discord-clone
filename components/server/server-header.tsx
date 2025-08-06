"use client";

import { ServerWithMembersWithProfiles } from "@/types";
import { MemberRole } from "@prisma/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, DoorOpen, Plus, PlusCircle, Settings, Trash, User, UserPlus } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";

interface ServerHeaderProps {
    server: ServerWithMembersWithProfiles,
    role?: MemberRole;
}

export const ServerHeader = ({
    server,
    role
}: ServerHeaderProps) => {
    const { onOpen } = useModal();

    const isAdmin = (role === MemberRole.ADMIN);
    const isMod = (isAdmin || role === MemberRole.MODERATOR);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="focus:outline-none"
                asChild
            >
                <button
                    className="w-full text-md font-semibold px-3 flex items-center h-12 border-white dark:border-neutral-800
                    border-b-2 hover:bg-zinc-700/10 dark:hover-bg-zinc-700/50 transition"
                >
                    {server.name}
                    <ChevronDown className="h-5 w-5 ml-auto" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 text-xs font-medium text-primary dark:text-neutral-400 space-y-[2px]"
            >
                {isMod && (
                    <DropdownMenuItem
                        onClick={() => onOpen("invite", { server })}
                        className="text-indigo-600 dark:text-indigo-400 text-sm cursor-pointer px-3 py-2"
                    >
                        Invite People
                        <UserPlus className="ml-auto text-indigo-600 dark:text-indigo-400" />
                    </DropdownMenuItem>
                )}

                {isAdmin && (
                    <DropdownMenuItem
                        onClick={() => onOpen("editServer", { server })}
                        className="text-sm cursor-pointer px-3 py-2"
                    >
                        Server Settings
                        <Settings className="ml-auto" />
                    </DropdownMenuItem>
                )}

                {isAdmin && (
                    <DropdownMenuItem
                        className="text-sm cursor-pointer px-3 py-2"
                        onClick={() => onOpen("members", { server })}
                    >
                        Manage Members
                        <User className="ml-auto" />
                    </DropdownMenuItem>
                )}

                {isMod && (
                    <DropdownMenuItem
                        className="text-sm cursor-pointer px-3 py-2"
                        onClick={() => onOpen("createChannel", { server })}
                    >
                        Create Channel
                        <PlusCircle className="ml-auto" />
                    </DropdownMenuItem>
                )}

                {isMod && (
                    <DropdownMenuSeparator />
                )}

                {isAdmin && (
                    <DropdownMenuItem
                        className="text-sm cursor-pointer px-3 py-2 text-red-500"
                    >
                        Delete Server
                        <Trash className="ml-auto text-red-500" />
                    </DropdownMenuItem>
                )}

                {!isAdmin && (
                    <DropdownMenuItem
                        className="text-sm cursor-pointer px-3 py-2 text-red-500"
                        onClick={() => onOpen("leaveServer", { server })}
                    >
                        Leave Server
                        <DoorOpen className="ml-auto text-red-500" />
                    </DropdownMenuItem>
                )}

            </DropdownMenuContent>
        </DropdownMenu>
    );
};