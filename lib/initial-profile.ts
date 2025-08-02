import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";

export const initialProfile = async () => {
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

    // If the profile exists, return it
    if (profile) {
        return profile;
    }

    // If no profile exists, create a new one
    // Populate the data with metadata from the Clerk user object
    const newProfile = await db.profile.create({
        data: {
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`,
            imageUrl: user.imageUrl,
            email: user.emailAddresses[0].emailAddress, // Clerk stores emails in an array
        }
    });

    return newProfile;
};
