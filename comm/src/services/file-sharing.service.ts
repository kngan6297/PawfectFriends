import { getIntegrationConfig } from '../config/integration';
import { authService } from './auth.service';

export interface FileUploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface FileMetadata {
    id: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
    url: string;
    thumbnailUrl?: string;
    duration?: number; // for audio/video
    width?: number; // for images/videos
    height?: number; // for images/videos
    tags?: string[];
    description?: string;
    petId?: string; // if related to a specific pet
    category?: 'adoption' | 'medical' | 'behavior' | 'training' | 'general';
    uploadedBy: string;
    uploadedAt: string;
    isPublic: boolean;
    downloadCount: number;
}

export interface UploadFileRequest {
    file: File;
    category?: string;
    petId?: string;
    tags?: string[];
    description?: string;
    isPublic?: boolean;
    onProgress?: (progress: FileUploadProgress) => void;
}

export interface FileSearchFilters {
    category?: string;
    petId?: string;
    tags?: string[];
    fileType?: string;
    uploadedBy?: string;
    dateRange?: {
        start: string;
        end: string;
    };
    isPublic?: boolean;
}

export interface FileSharingConfig {
    maxFileSize: number; // in bytes
    allowedTypes: string[];
    imageCompression: {
        enabled: boolean;
        quality: number; // 0-1
        maxWidth: number;
        maxHeight: number;
    };
    thumbnailGeneration: {
        enabled: boolean;
        sizes: number[];
    };
}

class FileSharingService {
    private config = getIntegrationConfig();
    private defaultConfig: FileSharingConfig = {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
            'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/json'
        ],
        imageCompression: {
            enabled: true,
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080
        },
        thumbnailGeneration: {
            enabled: true,
            sizes: [150, 300, 600]
        }
    };

    /**
     * Upload a file with progress tracking
     */
    async uploadFile(request: UploadFileRequest): Promise<FileMetadata | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            // Validate file
            const validation = this.validateFile(request.file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('file', request.file);
            formData.append('category', request.category || 'general');
            if (request.petId) formData.append('petId', request.petId);
            if (request.tags) formData.append('tags', JSON.stringify(request.tags));
            if (request.description) formData.append('description', request.description);
            formData.append('isPublic', (request.isPublic || false).toString());

            // Create XMLHttpRequest for progress tracking
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable && request.onProgress) {
                        const progress: FileUploadProgress = {
                            loaded: event.loaded,
                            total: event.total,
                            percentage: Math.round((event.loaded / event.total) * 100)
                        };
                        request.onProgress(progress);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            resolve(result);
                        } catch (error) {
                            reject(new Error('Invalid response format'));
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'));
                });

                xhr.open('POST', `${this.config.apiBaseUrl}/files/upload`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(formData);
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        }
    }

    /**
     * Upload multiple files
     */
    async uploadMultipleFiles(requests: UploadFileRequest[]): Promise<FileMetadata[]> {
        const results: FileMetadata[] = [];

        for (const request of requests) {
            try {
                const result = await this.uploadFile(request);
                if (result) {
                    results.push(result);
                }
            } catch (error) {
                console.error(`Error uploading ${request.file.name}:`, error);
            }
        }

        return results;
    }

    /**
     * Get file by ID
     */
    async getFile(fileId: string): Promise<FileMetadata | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/files/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error fetching file:', error);
            return null;
        }
    }

    /**
     * Search files with filters
     */
    async searchFiles(query: string, filters: FileSearchFilters = {}): Promise<FileMetadata[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const params = new URLSearchParams();
            params.append('q', query);

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (key === 'dateRange') {
                        params.append('startDate', value.start);
                        params.append('endDate', value.end);
                    } else if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, v));
                    } else {
                        params.append(key, value.toString());
                    }
                }
            });

            const response = await fetch(`${this.config.apiBaseUrl}/files/search?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error searching files:', error);
            return [];
        }
    }

    /**
     * Get files by pet ID
     */
    async getFilesByPet(petId: string): Promise<FileMetadata[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const response = await fetch(`${this.config.apiBaseUrl}/files/pet/${petId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching pet files:', error);
            return [];
        }
    }

    /**
     * Get trending files
     */
    async getTrendingFiles(limit: number = 10): Promise<FileMetadata[]> {
        try {
            const token = authService.getAuthToken();
            if (!token) return [];

            const response = await fetch(`${this.config.apiBaseUrl}/files/trending?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching trending files:', error);
            return [];
        }
    }

    /**
     * Update file metadata
     */
    async updateFile(fileId: string, updates: Partial<FileMetadata>): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/files/${fileId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            return response.ok;
        } catch (error) {
            console.error('Error updating file:', error);
            return false;
        }
    }

    /**
     * Delete file
     */
    async deleteFile(fileId: string): Promise<boolean> {
        try {
            const token = authService.getAuthToken();
            if (!token) return false;

            const response = await fetch(`${this.config.apiBaseUrl}/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Download file
     */
    async downloadFile(fileId: string): Promise<Blob | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/files/${fileId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                return await response.blob();
            }
            return null;
        } catch (error) {
            console.error('Error downloading file:', error);
            return null;
        }
    }

    /**
     * Generate thumbnail for image/video
     */
    async generateThumbnail(fileId: string, size: number = 300): Promise<string | null> {
        try {
            const token = authService.getAuthToken();
            if (!token) return null;

            const response = await fetch(`${this.config.apiBaseUrl}/files/${fileId}/thumbnail?size=${size}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            }
            return null;
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            return null;
        }
    }

    /**
     * Compress image before upload
     */
    async compressImage(file: File, quality: number = 0.8): Promise<File> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                const maxWidth = this.defaultConfig.imageCompression.maxWidth;
                const maxHeight = this.defaultConfig.imageCompression.maxHeight;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    file.type,
                    quality
                );
            };

            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Validate file before upload
     */
    private validateFile(file: File): { valid: boolean; error?: string } {
        // Check file size
        if (file.size > this.defaultConfig.maxFileSize) {
            return {
                valid: false,
                error: `File size exceeds maximum allowed size of ${this.formatFileSize(this.defaultConfig.maxFileSize)}`
            };
        }

        // Check file type
        if (!this.defaultConfig.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `File type ${file.type} is not allowed`
            };
        }

        return { valid: true };
    }

    /**
     * Format file size for display
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get file type category
     */
    getFileTypeCategory(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';
        return 'other';
    }

    /**
     * Get file icon based on type
     */
    getFileIcon(mimeType: string): string {
        const category = this.getFileTypeCategory(mimeType);
        const icons: Record<string, string> = {
            image: '🖼️',
            video: '🎥',
            audio: '🎵',
            document: '📄',
            other: '📎'
        };
        return icons[category] || '📎';
    }

    /**
     * Get popular file categories for pet adoption
     */
    getPetFileCategories(): { value: string; label: string; icon: string; description: string }[] {
        return [
            {
                value: 'adoption',
                label: 'Adoption Photos',
                icon: '🏠',
                description: 'Photos for pet adoption listings'
            },
            {
                value: 'medical',
                label: 'Medical Records',
                icon: '🏥',
                description: 'Vaccination records, health certificates'
            },
            {
                value: 'behavior',
                label: 'Behavior Videos',
                icon: '🎬',
                description: 'Videos showing pet behavior and personality'
            },
            {
                value: 'training',
                label: 'Training Materials',
                icon: '📚',
                description: 'Training guides and educational content'
            },
            {
                value: 'general',
                label: 'General Files',
                icon: '📁',
                description: 'Other pet-related documents and files'
            }
        ];
    }

    /**
     * Get popular tags for pet files
     */
    getPopularFileTags(): string[] {
        return [
            'puppy', 'kitten', 'senior', 'special-needs', 'foster', 'rescue',
            'training', 'health', 'behavior', 'nutrition', 'exercise', 'grooming',
            'vaccination', 'spay-neuter', 'microchip', 'lost-found', 'reunited',
            'foster-to-adopt', 'temporary-foster', 'long-term-foster',
            'medical', 'adoption', 'behavior', 'training', 'general'
        ];
    }
}

export const fileSharingService = new FileSharingService();
export default fileSharingService;
