import { auth } from "@clerk/nextjs/server";

import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// const auth = (req: Request) => ({ id: "fakeId" }); Fake auth function

const handleAuth = () => {
    const userId = auth();
    if (!userId) throw new Error("Unauthorized");
    return { userId: userId }
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // image for server
  serverImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(() => {}),

  // file attachments for messages
  messageFile: f(["image", "pdf"])
    .middleware(() => handleAuth())
    .onUploadComplete(() => {})

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;