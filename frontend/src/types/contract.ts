/**
 * Contract-related type definitions for frontend
 */

export type ContractStatus = 'none' | 'drafted' | 'sent' | 'signed' | 'void';

export type ContractLanguage = 'en' | 'vi';

export interface ContractDetails {
    status: ContractStatus;
    title: string;
    description?: string;
    terms?: string; // additional terms imported by shelter
    content?: string; // markdown the rendered contract
    lang?: ContractLanguage;
    fileKey?: string; // S3/GridFS key
    fileUrl?: string; // public/secure URL
    generated?: boolean;
    uploadedAt?: string;
    sentAt?: string;
    signedAt?: string;
    version?: number;
    checksum?: string; // sha256 content
    contractId?: string;
    file?: ContractFile;
    uploadedBy?: string;
    sentBy?: string;
    signedBy?: string;
    conditions?: string[];
}

export interface ContractFile {
    originalName: string;
    mimetype: string;
    size: number;
    buffer?: ArrayBuffer;
    url?: string;
}

export interface ContractGenerationOptions {
    version?: string;
    generatePdf?: boolean;
}

export interface ContractTemplateData {
    currentDate: string;
    contractId: string;
    user: {
        name: string;
        email: string;
        phone: string;
    };
    pet: {
        name: string;
        type: string;
        breed: string;
        age: string | number;
        description: string;
    };
    shelter: {
        name: string;
        address: string;
        phone: string;
        email: string;
    };
    additionalTerms: string;
}

export interface ContractValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface ContractTemplateInfo {
    language: ContractLanguage;
    title: string;
    description: string;
    version: string;
}

// Contract status display helpers
export const getContractStatusDisplay = (status: ContractStatus): {
    status: string;
    color: string;
    description: string;
} => {
    switch (status) {
        case 'none':
            return {
                status: 'Not Generated',
                color: 'gray',
                description: 'No contract has been generated yet'
            };
        case 'drafted':
            return {
                status: 'Drafted',
                color: 'yellow',
                description: 'Contract is ready for review and sending'
            };
        case 'sent':
            return {
                status: 'Sent',
                color: 'blue',
                description: 'Contract has been sent to the adopter for signing'
            };
        case 'signed':
            return {
                status: 'Signed',
                color: 'green',
                description: 'Contract has been signed by both parties'
            };
        case 'void':
            return {
                status: 'Void',
                color: 'red',
                description: 'Contract has been voided or cancelled'
            };
        default:
            return {
                status: 'Unknown',
                color: 'gray',
                description: 'Contract status is unknown'
            };
    }
};

// Contract language options
export const CONTRACT_LANGUAGES: { value: ContractLanguage; label: string; flag: string }[] = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' }
];

// Contract status options
export const CONTRACT_STATUSES: ContractStatus[] = ['none', 'drafted', 'sent', 'signed', 'void'];
