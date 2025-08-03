"use client";

import { UploadDropzone } from "@/lib/uploadthing";

import { X } from "lucide-react";
import Image from "next/image";
import { file } from "zod";

interface FileUploadProps {
    onChange: (url?: string) => void;
    value: string;
    endpoint: "messageFile" | "serverImage";
}

export const FileUpload = ({
    onChange,
    value,
    endpoint
}: FileUploadProps) => {
    const fileType = value?.split(".").pop();

    if (value && fileType !== "pdf") {
        return (
            <div className="relative h-20 w-20 items-center">
                <Image 
                    fill
                    src={value}
                    alt="Upload"
                    className="rounded-full"
                />
                <button
                    onClick={() => onChange("")}
                    className="bg-rose-400 rounded-full text-white p-1
                    absolute top-0 right-0 shadow-sm cursor-pointer"
                    type="button"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        )
    }

    return (  
        <UploadDropzone 
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
                onChange(res?.[0].ufsUrl);
            }}
            onUploadError={(error: Error) => {
                console.log("Error: ", error);
            }}
        />
    );
}