import { getAuth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { NextApiRequest } from "next";

export const currentProfilePages = async (req: NextApiRequest) => {
    // Use currentUser() to fetch the full user object
    const { userId } = await getAuth(req);

    // If there's no user, redirect to sign-in
    if (!userId) {
        return redirect("/sign-up");
    }

    // Check if a profile for this user already exists
    const profile = await db.profile.findUnique({
        where: {
            userId: userId
        }
    });
        
    return profile;
};