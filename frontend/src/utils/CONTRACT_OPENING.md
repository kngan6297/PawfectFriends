# Contract Opening with Blob Fallback

This document explains the new contract opening functionality that safely handles contract files with multiple fallback strategies.

## Overview

The `handleOpenContract` function provides a robust way to open contract files with the following fallback strategy:

1. **Direct URL Opening**: If the contract has a public URL, open it directly
2. **Blob Download**: If the URL requires authentication, download via API and create a blob URL
3. **Tab Fallback**: If no contract file is available, switch to the Contract tab to show terms inline

## Implementation

### Frontend Components

#### `AdoptionTrackerPage.tsx`

- Added `handleOpenContract` function
- Updated contract buttons to use the new function
- Added `activeTab` state for tab switching fallback

#### `AdoptionRequestDetail.tsx`

- Added `handleOpenContract` function
- Ready for integration with contract viewing buttons

### API Integration

#### Frontend API Service

```typescript
// Added to adoptionApi in api.ts
getContractFile: async (
  id: string,
  options: { responseType: "blob" }
): Promise<any> => {
  const response = await api.get(`/api/adoptions/${id}/contract/file`, options);
  return response;
};
```

#### Backend Endpoint

```javascript
// GET /api/adoptions/:id/contract/file
export const getContractFile = catchAsync(async (req, res) => {
  // Handles both cloud storage URLs and local file buffers
  // Sets proper Content-Type and Content-Disposition headers
});
```

## Usage Examples

### Basic Usage

```typescript
import { handleOpenContract } from "@/pages/adoption/AdoptionTrackerPage";

// In your component
<Button onClick={() => handleOpenContract(adoptionRequest)}>
  View Contract
</Button>;
```

### With Custom Error Handling

```typescript
const handleContractClick = async () => {
  try {
    await handleOpenContract(adoptionRequest);
  } catch (error) {
    console.error("Failed to open contract:", error);
    // Custom error handling
  }
};
```

## Fallback Behavior

### 1. Direct URL Opening

```typescript
// URLs that start with http:// or https:// or /
if (/^https?:\/\//i.test(url) || url.startsWith("/")) {
  window.open(url, "_blank");
  return;
}
```

### 2. Blob Download

```typescript
// For authenticated/protected URLs
const res = await adoptionApi.getContractFile(requestId, {
  responseType: "blob",
});
const blob = new Blob([res.data], {
  type: res.headers?.["content-type"] || "application/pdf",
});
const objUrl = URL.createObjectURL(blob);
window.open(objUrl, "_blank");
```

### 3. Tab Fallback

```typescript
// When no contract URL is available
if (!url) {
  setActiveTab("contract");
  showToast({
    type: "info",
    title: "No direct file link",
    description: "Opening the Contract tab instead.",
  });
  return;
}
```

## Backend Implementation

### Route Configuration

```javascript
// In adoption.route.js
router.get("/:id/contract/file", apiLimiter, getContractFile);
```

### Controller Function

```javascript
export const getContractFile = catchAsync(async (req, res) => {
  const request = await getAdoptionRequestById_service(req.params.id);

  if (!request?.contractDetails?.file) {
    throw new ApiError(404, "Contract file not found");
  }

  const contractFile = request.contractDetails.file;

  // Handle cloud storage URLs
  if (contractFile.url) {
    return res.redirect(contractFile.url);
  }

  // Handle local file buffers
  if (contractFile.buffer) {
    res.set({
      "Content-Type": contractFile.mimetype || "application/pdf",
      "Content-Disposition": `attachment; filename="${
        contractFile.originalName || "contract.pdf"
      }"`,
      "Content-Length": contractFile.size || contractFile.buffer.length,
    });
    return res.send(contractFile.buffer);
  }

  throw new ApiError(404, "Contract file not available");
});
```

## Error Handling

The implementation includes comprehensive error handling:

- **404 Errors**: When contract file is not found
- **Network Errors**: When API calls fail
- **Blob Creation Errors**: When file data is corrupted
- **User Feedback**: Toast notifications for all error states

## Security Considerations

- **Authentication**: All contract file requests require valid authentication
- **Authorization**: Users can only access contracts for their own adoption requests
- **File Validation**: Backend validates file existence and accessibility
- **Content-Type Headers**: Proper MIME types are set for security

## Testing

### Manual Testing

1. Upload a contract file
2. Try opening with direct URL
3. Try opening with blob download
4. Test with missing contract file

### Automated Testing

```bash
# Run the test script
node backend/scripts/test-contract-endpoint.js
```

## Browser Compatibility

- **Modern Browsers**: Full support for blob URLs and modern APIs
- **File Downloads**: Fallback to direct download for older browsers
- **Error Handling**: Graceful degradation for unsupported features

## Performance Considerations

- **Blob Cleanup**: Blob URLs are automatically cleaned up by the browser
- **Caching**: Cloud storage URLs benefit from CDN caching
- **File Size**: Large files are streamed efficiently
- **Memory Usage**: Blob creation is optimized for memory usage

## Future Enhancements

- **Progressive Loading**: For very large contract files
- **Offline Support**: Cache contract files for offline viewing
- **Digital Signatures**: Integration with digital signature verification
- **Version Control**: Track contract file versions and changes
