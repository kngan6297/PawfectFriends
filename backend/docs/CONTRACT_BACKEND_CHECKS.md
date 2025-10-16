# Backend Contract Quick Checks

## Summary of Changes

### 1. Contract URL Key Standardization

**File:** `backend/src/modules/adoption/adoption.service.js`
**Function:** `uploadContract`

```javascript
// Added clear URL key for contract files
contractData.file = {
  originalName: contractDetails.file.originalName,
  mimetype: contractDetails.file.mimetype,
  size: contractDetails.file.size,
  url: contractDetails.file.url, // Clear key for contract URL
  buffer: contractDetails.file.buffer, // For local storage fallback
};
```

### 2. Contract Status Updates

**File:** `backend/src/modules/adoption/adoption.service.js`
**Function:** `sendContract`

```javascript
// When shelter sends contract: status = "sent" + set uploadedAt/sentAt
$set: {
  'contractDetails.status': 'sent',
  'contractDetails.sentAt': new Date(),
  'contractDetails.sentBy': shelterId,
  'contractDetails.uploadedAt': new Date(), // Ensure uploadedAt is set when sent
}
```

### 3. Contract File Access Protection

**File:** `backend/src/modules/adoption/adoption.controller.js`
**Function:** `getContractFile`

```javascript
// Permission check: user must be the requester, shelter staff, or admin
const userId = req.user._id.toString();
const isRequester = request.user.toString() === userId;
const isShelterStaff = request.shelter.toString() === userId;
const isAdmin = req.user.role === 'admin';

if (!isRequester && !isShelterStaff && !isAdmin) {
  throw new ApiError(403, 'Unauthorized to access contract file');
}
```

## API Endpoints

### Contract File Download

- **Route:** `GET /api/adoptions/:id/contract/file`
- **Protection:** Authentication + Authorization (requester/shelter/admin only)
- **Response:**
  - Cloud storage URL → Redirect (302)
  - Local buffer → Blob with proper headers

### Contract Management

- **Upload:** `POST /api/adoptions/:id/contract`
- **Send:** `POST /api/adoptions/:id/contract/send`
- **Sign:** `POST /api/adoptions/:id/contract/sign`

## Frontend Integration

The frontend uses `adoptionApi.getContractFile()` which calls the protected endpoint:

```typescript
// Frontend API call
const res = await adoptionApi.getContractFile(req._id, {
  responseType: 'blob',
});
```

## Security Features

1. **Authentication Required:** All contract endpoints require valid JWT token
2. **Authorization Checks:** Users can only access contracts for their own requests or shelter
3. **Admin Override:** Admins can access any contract file
4. **File Validation:** Backend validates contract file existence before serving
5. **Proper Headers:** Content-Type and Content-Disposition headers set correctly

## Data Structure

### Contract Details Schema

```javascript
contractDetails: {
  status: 'drafted' | 'sent' | 'signed',
  title: String,
  description: String,
  terms: String,
  uploadedAt: Date,
  sentAt: Date,
  sentBy: ObjectId,
  file: {
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,        // Clear key for contract URL
    buffer: Buffer      // For local storage fallback
  }
}
```

## Testing

### Manual Testing

1. Upload contract file → Check `contractDetails.file.url` is set
2. Send contract → Verify `status: 'sent'` and `sentAt` timestamp
3. Access contract file → Test with different user roles
4. Test unauthorized access → Should return 403

### API Testing

```bash
# Test contract file access
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/adoptions/:id/contract/file
```
