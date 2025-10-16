<template>
  <div class="file-upload">
    <!-- Upload Button -->
    <el-button
      v-if="!showUploadArea"
      type="primary"
      @click="showUploadArea = true"
      :icon="Upload"
      size="small"
    >
      {{ buttonText }}
    </el-button>

    <!-- Upload Area -->
    <div v-if="showUploadArea" class="upload-area">
      <div class="upload-header">
        <h4>📎 Upload Files</h4>
        <el-button
          type="text"
          @click="showUploadArea = false"
          :icon="Close"
          size="small"
        />
      </div>

      <!-- File Selection -->
      <div class="file-selection">
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          drag
          multiple
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :file-list="fileList"
          :accept="acceptedTypes"
          :limit="maxFiles"
          :show-file-list="true"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            Drop files here or <em>click to upload</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              Supported: Images, Videos, Audio, Documents (Max: {{ formatFileSize(maxFileSize) }})
            </div>
          </template>
        </el-upload>
      </div>

      <!-- File List -->
      <div v-if="fileList.length > 0" class="file-list">
        <div
          v-for="(file, index) in fileList"
          :key="index"
          class="file-item"
          :class="{ 'uploading': file.uploading, 'error': file.error }"
        >
          <!-- File Preview -->
          <div class="file-preview">
            <div v-if="file.type.startsWith('image/')" class="image-preview">
              <el-image
                :src="file.url"
                :preview-src-list="[file.url]"
                fit="cover"
                class="preview-image"
              />
            </div>
            <div v-else class="file-icon">
              {{ getFileIcon(file.type) }}
            </div>
          </div>

          <!-- File Info -->
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-size">{{ formatFileSize(file.size) }}</div>
            <div v-if="file.error" class="file-error">{{ file.error }}</div>
          </div>

          <!-- Upload Progress -->
          <div v-if="file.uploading" class="upload-progress">
            <el-progress
              :percentage="file.progress || 0"
              :status="file.error ? 'exception' : undefined"
              :stroke-width="4"
            />
          </div>

          <!-- File Actions -->
          <div class="file-actions">
            <el-button
              v-if="!file.uploading && !file.uploaded"
              type="primary"
              size="small"
              @click="uploadFile(file, index)"
              :loading="file.uploading"
            >
              Upload
            </el-button>
            <el-button
              v-if="file.uploaded"
              type="success"
              size="small"
              :icon="Check"
              disabled
            >
              Done
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="removeFile(index)"
              :icon="Delete"
            />
          </div>
        </div>
      </div>

      <!-- Upload Options -->
      <div v-if="fileList.length > 0" class="upload-options">
        <el-form :model="uploadOptions" label-width="100px" size="small">
          <el-form-item label="Category">
            <el-select v-model="uploadOptions.category" placeholder="Select category">
              <el-option
                v-for="category in fileCategories"
                :key="category.value"
                :label="category.label"
                :value="category.value"
              >
                <span class="category-option">
                  <span class="category-icon">{{ category.icon }}</span>
                  <span class="category-label">{{ category.label }}</span>
                  <span class="category-description">{{ category.description }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="Pet (Optional)">
            <el-select
              v-model="uploadOptions.petId"
              placeholder="Select pet"
              clearable
              filterable
            >
              <el-option
                v-for="pet in availablePets"
                :key="pet.id"
                :label="`${pet.name} (${pet.breed})`"
                :value="pet.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Tags">
            <el-select
              v-model="uploadOptions.tags"
              multiple
              filterable
              allow-create
              placeholder="Select or create tags"
            >
              <el-option
                v-for="tag in popularTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Description">
            <el-input
              v-model="uploadOptions.description"
              type="textarea"
              :rows="2"
              placeholder="Describe the file content..."
            />
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="uploadOptions.isPublic">
              Make files public
            </el-checkbox>
          </el-form-item>
        </el-form>
      </div>

      <!-- Upload Actions -->
      <div v-if="fileList.length > 0" class="upload-actions">
        <el-button @click="clearAll">Clear All</el-button>
        <el-button
          type="primary"
          @click="uploadAllFiles"
          :loading="uploading"
          :disabled="!hasUnuploadedFiles"
        >
          Upload All Files
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Upload,
  UploadFilled,
  Close,
  Check,
  Delete
} from '@element-plus/icons-vue';
import { fileSharingService, type FileMetadata, type UploadFileRequest } from '../services/file-sharing.service';

// Props
interface Props {
  buttonText?: string;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string;
  petId?: string;
  category?: string;
  tags?: string[];
  description?: string;
  isPublic?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  buttonText: 'Upload Files',
  maxFiles: 10,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  acceptedTypes: 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.json'
});

// Emits
const emit = defineEmits<{
  fileUploaded: [file: FileMetadata];
  filesUploaded: [files: FileMetadata[]];
  uploadComplete: [files: FileMetadata[]];
}>();

// Refs
const uploadRef = ref();
const showUploadArea = ref(false);
const uploading = ref(false);

// File list with extended properties
interface ExtendedFile extends File {
  url?: string;
  uploading?: boolean;
  uploaded?: boolean;
  progress?: number;
  error?: string;
  uploadedFile?: FileMetadata;
}

const fileList = ref<ExtendedFile[]>([]);

// Upload options
const uploadOptions = ref({
  category: props.category || 'general',
  petId: props.petId || '',
  tags: props.tags || [],
  description: props.description || '',
  isPublic: props.isPublic || false
});

// Available pets (this would come from your pet service)
const availablePets = ref([
  { id: '1', name: 'Buddy', breed: 'Golden Retriever' },
  { id: '2', name: 'Luna', breed: 'Domestic Shorthair' }
]);

// Computed properties
const fileCategories = computed(() => fileSharingService.getPetFileCategories());
const popularTags = computed(() => fileSharingService.getPopularFileTags());

const hasUnuploadedFiles = computed(() => 
  fileList.value.some(file => !file.uploaded && !file.uploading)
);

// Methods
const handleFileChange = (file: any) => {
  // Create object URL for preview
  file.url = URL.createObjectURL(file.raw);
  file.uploading = false;
  file.uploaded = false;
  file.progress = 0;
  file.error = undefined;
};

const handleFileRemove = (file: any) => {
  const index = fileList.value.findIndex(f => f.name === file.name);
  if (index > -1) {
    removeFile(index);
  }
};

const removeFile = (index: number) => {
  const file = fileList.value[index];
  if (file.url) {
    URL.revokeObjectURL(file.url);
  }
  fileList.value.splice(index, 1);
};

const clearAll = async () => {
  if (fileList.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to clear all files?',
      'Clear Files',
      {
        confirmButtonText: 'Clear',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    );
    
    fileList.value.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    fileList.value = [];
  } catch {
    // User cancelled
  }
};

const uploadFile = async (file: ExtendedFile, index: number) => {
  if (file.uploading || file.uploaded) return;

  try {
    file.uploading = true;
    file.progress = 0;
    file.error = undefined;

    // Compress image if needed
    let fileToUpload = file;
    if (file.type.startsWith('image/') && file.size > 1024 * 1024) { // 1MB
      fileToUpload = await fileSharingService.compressImage(file);
    }

    const uploadRequest: UploadFileRequest = {
      file: fileToUpload,
      category: uploadOptions.value.category,
      petId: uploadOptions.value.petId || undefined,
      tags: uploadOptions.value.tags,
      description: uploadOptions.value.description,
      isPublic: uploadOptions.value.isPublic,
      onProgress: (progress) => {
        file.progress = progress.percentage;
      }
    };

    const result = await fileSharingService.uploadFile(uploadRequest);
    
    if (result) {
      file.uploaded = true;
      file.uploadedFile = result;
      file.progress = 100;
      ElMessage.success(`File "${file.name}" uploaded successfully!`);
      emit('fileUploaded', result);
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    file.error = error instanceof Error ? error.message : 'Upload failed';
    ElMessage.error(`Failed to upload "${file.name}": ${file.error}`);
  } finally {
    file.uploading = false;
  }
};

const uploadAllFiles = async () => {
  if (uploading.value) return;

  try {
    uploading.value = true;
    const unuploadedFiles = fileList.value.filter(f => !f.uploaded && !f.uploading);
    
    if (unuploadedFiles.length === 0) {
      ElMessage.info('No files to upload');
      return;
    }

    const uploadPromises = unuploadedFiles.map((file, index) => 
      uploadFile(file, fileList.value.indexOf(file))
    );

    await Promise.all(uploadPromises);
    
    const uploadedFiles = fileList.value
      .filter(f => f.uploaded && f.uploadedFile)
      .map(f => f.uploadedFile!);

    if (uploadedFiles.length > 0) {
      ElMessage.success(`Successfully uploaded ${uploadedFiles.length} files!`);
      emit('filesUploaded', uploadedFiles);
      emit('uploadComplete', uploadedFiles);
    }
  } catch (error) {
    console.error('Error uploading files:', error);
    ElMessage.error('Some files failed to upload');
  } finally {
    uploading.value = false;
  }
};

const getFileIcon = (mimeType: string): string => {
  return fileSharingService.getFileIcon(mimeType);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Lifecycle
onMounted(() => {
  // Initialize with props if provided
  if (props.category) uploadOptions.value.category = props.category;
  if (props.petId) uploadOptions.value.petId = props.petId;
  if (props.tags) uploadOptions.value.tags = props.tags;
  if (props.description) uploadOptions.value.description = props.description;
  if (props.isPublic !== undefined) uploadOptions.value.isPublic = props.isPublic;
});
</script>

<style scoped lang="scss">
.file-upload {
  .upload-area {
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    padding: 20px;
    background: #fafafa;
    margin-top: 10px;

    .upload-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      h4 {
        margin: 0;
        color: #2c3e50;
      }
    }

    .file-selection {
      margin-bottom: 20px;

      .upload-dragger {
        width: 100%;
      }
    }

    .file-list {
      margin-bottom: 20px;

      .file-item {
        display: flex;
        align-items: center;
        padding: 15px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        margin-bottom: 10px;
        background: white;
        transition: all 0.3s ease;

        &:hover {
          border-color: #4a90e2;
          box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
        }

        &.uploading {
          border-color: #409eff;
          background: #f0f9ff;
        }

        &.error {
          border-color: #f56c6c;
          background: #fef0f0;
        }

        .file-preview {
          margin-right: 15px;

          .image-preview {
            width: 60px;
            height: 60px;
            border-radius: 6px;
            overflow: hidden;

            .preview-image {
              width: 100%;
              height: 100%;
            }
          }

          .file-icon {
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: #f5f7fa;
            border-radius: 6px;
            color: #909399;
          }
        }

        .file-info {
          flex: 1;
          margin-right: 15px;

          .file-name {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
            word-break: break-word;
          }

          .file-size {
            color: #7f8c8d;
            font-size: 12px;
          }

          .file-error {
            color: #f56c6c;
            font-size: 12px;
            margin-top: 5px;
          }
        }

        .upload-progress {
          flex: 1;
          margin-right: 15px;
        }

        .file-actions {
          display: flex;
          gap: 8px;
        }
      }
    }

    .upload-options {
      margin-bottom: 20px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e9ecef;

      .category-option {
        display: flex;
        align-items: center;
        gap: 10px;

        .category-icon {
          font-size: 16px;
        }

        .category-label {
          font-weight: 600;
        }

        .category-description {
          color: #7f8c8d;
          font-size: 12px;
          margin-left: auto;
        }
      }
    }

    .upload-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .file-upload {
    .upload-area {
      padding: 15px;

      .file-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;

        .file-preview,
        .file-info,
        .upload-progress {
          margin-right: 0;
          margin-bottom: 10px;
        }

        .file-actions {
          align-self: flex-end;
        }
      }
    }
  }
}
</style>
