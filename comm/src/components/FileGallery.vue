<template>
  <div class="file-gallery">
    <!-- Header -->
    <div class="gallery-header">
      <h3>📁 File Gallery</h3>
      <el-button type="primary" @click="showUploadDialog = true">
        <el-icon><Upload /></el-icon>
        Upload Files
      </el-button>
    </div>

    <!-- Search -->
    <el-input
      v-model="searchQuery"
      placeholder="Search files..."
      clearable
      @input="handleSearch"
      style="margin-bottom: 20px;"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <!-- File Grid -->
    <div class="file-grid">
      <div
        v-for="file in filteredFiles"
        :key="file.id"
        class="file-card"
        @click="previewFile(file)"
      >
        <!-- File Preview -->
        <div class="file-preview">
          <div v-if="file.fileType === 'image'" class="image-preview">
            <el-image
              :src="file.thumbnailUrl || file.url"
              :preview-src-list="[file.url]"
              fit="cover"
              class="preview-image"
            />
          </div>
          <div v-else class="file-icon">
            {{ getFileIcon(file.mimeType) }}
          </div>
        </div>

        <!-- File Info -->
        <div class="file-info">
          <h4 class="file-name">{{ file.fileName }}</h4>
          <p class="file-size">{{ formatFileSize(file.fileSize) }}</p>
          <p class="file-date">{{ formatDate(file.uploadedAt) }}</p>
        </div>

        <!-- File Actions -->
        <div class="file-actions">
          <el-button type="primary" size="small" @click.stop="downloadFile(file)">
            Download
          </el-button>
          <el-button type="danger" size="small" @click.stop="deleteFile(file)">
            Delete
          </el-button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredFiles.length === 0" class="empty-state">
      <el-empty description="No files found">
        <el-button type="primary" @click="showUploadDialog = true">
          Upload Your First File
        </el-button>
      </el-empty>
    </div>

    <!-- Upload Dialog -->
    <el-dialog v-model="showUploadDialog" title="Upload Files" width="800px">
      <FileUpload
        @file-uploaded="handleFileUploaded"
        @upload-complete="handleUploadComplete"
      />
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog v-model="showPreviewDialog" title="File Preview" width="80%">
      <div v-if="previewingFile" class="preview-content">
        <div v-if="previewingFile.fileType === 'image'" class="image-preview">
          <el-image :src="previewingFile.url" fit="contain" style="max-height: 60vh;" />
        </div>
        <div v-else class="file-info">
          <p><strong>Name:</strong> {{ previewingFile.fileName }}</p>
          <p><strong>Size:</strong> {{ formatFileSize(previewingFile.fileSize) }}</p>
          <p><strong>Type:</strong> {{ previewingFile.mimeType }}</p>
          <p><strong>Uploaded:</strong> {{ formatDate(previewingFile.uploadedAt) }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, Search } from '@element-plus/icons-vue';
import { fileSharingService, type FileMetadata } from '../services/file-sharing.service';
import FileUpload from './FileUpload.vue';

// State
const files = ref<FileMetadata[]>([]);
const searchQuery = ref('');
const showUploadDialog = ref(false);
const showPreviewDialog = ref(false);
const previewingFile = ref<FileMetadata | null>(null);

// Computed
const filteredFiles = computed(() => {
  if (!searchQuery.value) return files.value;
  return files.value.filter(file => 
    file.fileName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Methods
const loadFiles = async () => {
  try {
    const result = await fileSharingService.searchFiles('');
    files.value = result;
  } catch (error) {
    console.error('Error loading files:', error);
    ElMessage.error('Failed to load files');
  }
};

const handleSearch = () => {
  // Search is handled by computed property
};

const downloadFile = async (file: FileMetadata) => {
  try {
    const blob = await fileSharingService.downloadFile(file.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      ElMessage.success(`Downloaded ${file.fileName}`);
    }
  } catch (error) {
    ElMessage.error('Failed to download file');
  }
};

const deleteFile = async (file: FileMetadata) => {
  try {
    await ElMessageBox.confirm(
      `Delete "${file.fileName}"?`,
      'Confirm Delete',
      { type: 'warning' }
    );
    
    const success = await fileSharingService.deleteFile(file.id);
    if (success) {
      ElMessage.success('File deleted');
      loadFiles();
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete file');
    }
  }
};

const previewFile = (file: FileMetadata) => {
  previewingFile.value = file;
  showPreviewDialog.value = true;
};

const handleFileUploaded = (file: FileMetadata) => {
  loadFiles();
};

const handleUploadComplete = (files: FileMetadata[]) => {
  showUploadDialog.value = false;
  loadFiles();
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

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-GB');
};

// Lifecycle
onMounted(() => {
  loadFiles();
});
</script>

<style scoped lang="scss">
.file-gallery {
  padding: 20px;

  .gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      color: #2c3e50;
    }
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 20px;

    .file-card {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      overflow: hidden;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: #4a90e2;
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.15);
        transform: translateY(-2px);
      }

      .file-preview {
        height: 200px;
        background: #f5f7fa;

        .image-preview {
          width: 100%;
          height: 100%;

          .preview-image {
            width: 100%;
            height: 100%;
          }
        }

        .file-icon {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
          color: #909399;
        }
      }

      .file-info {
        padding: 15px;

        .file-name {
          margin: 0 0 8px 0;
          color: #2c3e50;
          font-size: 16px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size,
        .file-date {
          margin: 0 0 5px 0;
          color: #7f8c8d;
          font-size: 14px;
        }
      }

      .file-actions {
        padding: 15px;
        display: flex;
        gap: 8px;
        justify-content: center;
        border-top: 1px solid #e9ecef;
        background: #fafafa;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }
}

.preview-content {
  .image-preview {
    text-align: center;
  }

  .file-info {
    p {
      margin: 10px 0;
      font-size: 16px;
    }
  }
}
</style>
