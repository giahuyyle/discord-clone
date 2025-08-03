import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";

export const currentProfile = async () => {
    // Use currentUser() to fetch the full user object
    const user = await currentUser();

    // If there's no user, redirect to sign-in
    if (!user) {
        return redirect("/sign-up");
    }

    // Check if a profile for this user already exists
    const profile = await db.profile.findUnique({
        where: {
            userId: user.id,
        }
    });
        
    return profile;
};