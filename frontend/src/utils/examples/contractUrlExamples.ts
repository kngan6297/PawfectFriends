/**
 * Examples demonstrating the getContractUrl helper function
 * with different data structures that might be returned by the backend
 */

import { getContractUrl } from '../contractUtils';

// Example 1: Standard contractDetails structure
const example1 = {
    contractDetails: {
        file: {
            url: 'https://example.com/contracts/adoption-123.pdf',
            originalName: 'adoption-contract.pdf',
            mimetype: 'application/pdf',
            size: 1024000
        }
    }
};

console.log('Example 1 - Standard structure:', getContractUrl(example1));
// Output: 'https://example.com/contracts/adoption-123.pdf'

// Example 2: Alternative URL keys
const example2 = {
    contractDetails: {
        file: {
            fileUrl: 'https://example.com/contracts/adoption-456.pdf'
        }
    }
};

console.log('Example 2 - fileUrl key:', getContractUrl(example2));
// Output: 'https://example.com/contracts/adoption-456.pdf'

// Example 3: Direct URL in contractDetails
const example3 = {
    contractDetails: {
        url: 'https://example.com/contracts/adoption-789.pdf'
    }
};

console.log('Example 3 - Direct URL:', getContractUrl(example3));
// Output: 'https://example.com/contracts/adoption-789.pdf'

// Example 4: Contract in documents array
const example4 = {
    documents: [
        { name: 'id-proof.pdf', url: 'https://example.com/id.pdf', type: 'id' },
        { name: 'adoption-contract.pdf', url: 'https://example.com/contract.pdf', type: 'other' }
    ]
};

console.log('Example 4 - Document with contract name:', getContractUrl(example4));
// Output: 'https://example.com/contract.pdf'

// Example 5: Contract type document
const example5 = {
    documents: [
        { name: 'other-doc.pdf', url: 'https://example.com/other.pdf', type: 'other' },
        { name: 'contract.pdf', url: 'https://example.com/contract.pdf', type: 'contract' }
    ]
};

console.log('Example 5 - Contract type document:', getContractUrl(example5));
// Output: 'https://example.com/contract.pdf'

// Example 6: No contract available
const example6 = {
    documents: [
        { name: 'id-proof.pdf', url: 'https://example.com/id.pdf', type: 'id' },
        { name: 'reference-letter.pdf', url: 'https://example.com/ref.pdf', type: 'reference_letter' }
    ]
};

console.log('Example 6 - No contract:', getContractUrl(example6));
// Output: null

// Example 7: Real-world adoption request structure
const example7 = {
    _id: '64a1b2c3d4e5f6789012345',
    user: '64a1b2c3d4e5f6789012346',
    pet: '64a1b2c3d4e5f6789012347',
    shelter: '64a1b2c3d4e5f6789012348',
    status: 'approved',
    contractDetails: {
        status: 'sent',
        title: 'Pet Adoption Agreement',
        description: 'Standard adoption contract for pet ownership',
        terms: 'Terms and conditions...',
        uploadedAt: '2024-01-15T10:30:00Z',
        sentAt: '2024-01-15T11:00:00Z',
        file: {
            originalName: 'pet-adoption-agreement.pdf',
            mimetype: 'application/pdf',
            size: 2048000,
            url: 'https://storage.example.com/contracts/pet-adoption-agreement-123.pdf'
        }
    },
    documents: [
        { name: 'id-proof.pdf', url: 'https://storage.example.com/documents/id-123.pdf', type: 'id' },
        { name: 'reference-letter.pdf', url: 'https://storage.example.com/documents/ref-123.pdf', type: 'reference_letter' }
    ]
};

console.log('Example 7 - Real-world structure:', getContractUrl(example7));
// Output: 'https://storage.example.com/contracts/pet-adoption-agreement-123.pdf'

export {
    example1,
    example2,
    example3,
    example4,
    example5,
    example6,
    example7
};
