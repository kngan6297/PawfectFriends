export interface FileUploadResult {
    url: string;
    name: string;
    type: string;
    size: number;
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
];

export const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
        return `File ${file.name} is too large. Maximum size is 5MB.`;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return `File type ${file.type} is not supported.`;
    }

    return null;
};

export const getFileType = (file: File): "image" | "file" => {
    return file.type.startsWith("image/") ? "image" : "file";
};

export const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        } else {
            resolve("");
        }
    });
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}; 