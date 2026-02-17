import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    className?: string;
    variant?: "avatar" | "card";
}

export function ImageUpload({
    value,
    onChange,
    label = "Upload Image",
    className = "",
    variant = "card",
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
        if (!allowedTypes.includes(file.type)) {
            alert("Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed");
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be under 5MB");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.success) {
                // Build the full URL using the API base
                const baseUrl = import.meta.env.VITE_API_URL || "https://clinicflow-connect.onrender.com/api/v1";
                // The upload returns /uploads/filename, we need to go up from /api/v1
                const serverBase = baseUrl.replace(/\/api\/v1\/?$/, "");
                const fullUrl = `${serverBase}${response.data.data.url}`;
                onChange(fullUrl);
            }
        } catch (error: any) {
            console.error("Upload failed:", error);
            alert(error.response?.data?.error?.message || "Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
        // Reset the input so the same file can be selected again if needed
        e.target.value = "";
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload(file);
    };

    const handleRemove = () => {
        onChange("");
    };

    // Hidden file input
    const fileInput = (
        <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
        />
    );

    if (variant === "avatar") {
        return (
            <div className={`relative inline-block ${className}`}>
                {fileInput}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="relative group"
                    title={label}
                >
                    {value ? (
                        <img
                            src={value}
                            alt="Uploaded"
                            className="h-20 w-20 rounded-full object-cover border-2 border-primary/20"
                        />
                    ) : (
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30">
                            <ImageIcon className="h-8 w-8 text-primary/40" />
                        </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {uploading ? (
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                        ) : (
                            <Upload className="h-5 w-5 text-white" />
                        )}
                    </div>
                </button>
                {value && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                        title="Remove image"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        );
    }

    // Card variant (for hospital image, etc.)
    return (
        <div className={className}>
            {fileInput}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${dragActive
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : value
                            ? "border-border hover:border-primary/40"
                            : "border-border hover:border-primary/40 hover:bg-secondary/30"
                    }`}
            >
                {value ? (
                    <div className="relative group">
                        <img
                            src={value}
                            alt="Uploaded"
                            className="w-full h-40 object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                            {uploading ? (
                                <Loader2 className="h-6 w-6 text-white animate-spin" />
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        <Upload className="h-3 w-3 mr-1" />
                                        Replace
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove();
                                        }}
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        Remove
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                        {uploading ? (
                            <>
                                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                                <p className="text-sm text-muted-foreground">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                    <Upload className="h-5 w-5 text-primary" />
                                </div>
                                <p className="text-sm font-medium text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Drag & drop or click to browse
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                    JPG, PNG, GIF, WebP, SVG • Max 5MB
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
