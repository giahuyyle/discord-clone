"use client";

import { UploadDropzone } from "@/lib/uploadthing";

import { FileIcon, X } from "lucide-react";
import Image from "next/image";

type UploadedFile = {
    url: string;
    name: string;
};

interface FileUploadProps {
    onChange: (file?: UploadedFile) => void;
    value: string;
    name: string | null;
    endpoint: "messageFile" | "serverImage";
}

export const FileUpload = ({
    onChange,
    value,
    name,
    endpoint
}: FileUploadProps) => {
    const fileType = name?.split(".").pop();

    if (value && fileType !== "pdf") {
        if (typeof value === "string") {
            // If it's a string, treat it as a URL directly
            return (
                <div className="relative h-20 w-20 items-center">
                    <Image 
                        fill
                        src={value}
                        alt="Upload"
                        className="rounded-full"
                    />
                    <button
                        onClick={() => onChange(undefined)}
                        className="bg-rose-400 rounded-full text-white p-1
                        absolute top-0 right-0 shadow-sm cursor-pointer"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            );
        } 
    }
    
    if (value && fileType === "pdf") {
        return (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-zinc-500/20">
                <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400 " />
                <a 
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline line-clamp-1"
                >
                    {name}
                </a>
                <button
                    onClick={() => onChange(undefined)}
                    className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
                    type="button"
                >
                    <X className="h-4 w-4"/>
                </button>

            </div>
        );
    }

    return (  
        <UploadDropzone 
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
                onChange({
                    url: res?.[0].ufsUrl,
                    name: res?.[0].name,
                });
            }}
            onUploadError={(error: Error) => {
                console.log("Error: ", error);
            }}
        />
    );
}