// this is a protected route, only logged in users can access

import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@clerk/nextjs";
import { User } from "lucide-react";

export default function Home() {
    return (
        <div>
            <div className="flex justify-end w-full gap-4 p-4">
                <ModeToggle />  
                <UserButton />  
            </div>
            <div className='flex flex-col items-center'>
                <p className='text-3xl font-bold text-indigo-500'>
                    Hello Discord Clone
                </p>
            </div>
        </div>
    );
}