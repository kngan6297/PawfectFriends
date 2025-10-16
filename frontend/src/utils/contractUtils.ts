/**
 * Contract utility functions for frontend
 */

import { formatDisplayDateTime } from "./dateUtils";

/**
 * Get contract URL for display or download
 * Prioritizes file URL (uploaded), then looks in contractDocuments
 * @param req - Adoption request object
 * @returns Contract URL or null if not available
 */
export const getContractUrl = (req: any): string | null => {
    // Prioritize file URL (uploaded)
    const fileUrl = req?.contractDetails?.file?.url
        || req?.contractDocuments?.find((d: any) => d.type === "contract" && d.status !== "drafted")?.url;
    return fileUrl || null;
};

/**
 * Check if contract has a downloadable file
 * @param req - Adoption request object
 * @returns Whether contract has a downloadable file
 */
export function hasContractFile(req: any): boolean {
    return !!(req?.contractDetails?.fileUrl || req?.contractDetails?.file?.url);
}

/**
 * Get contract display name
 * @param adoptionRequest - Adoption request object
 * @returns Contract display name
 */
export const getContractDisplayName = (adoptionRequest: any): string => {
    if (!adoptionRequest?.contractDetails) {
        return 'No Contract';
    }

    const contract = adoptionRequest.contractDetails;

    if (contract.file?.originalName) {
        return contract.file.originalName;
    }

    if (contract.contractId) {
        return `Contract ${contract.contractId}`;
    }

    if (contract.title) {
        return contract.title;
    }

    return 'Adoption Contract';
};

/**
 * Get contract status display
 * @param adoptionRequest - Adoption request object
 * @returns Contract status display
 */
export const getContractStatusDisplay = (adoptionRequest: any): {
    status: string;
    color: string;
    description: string;
} => {
    if (!adoptionRequest?.contractDetails) {
        return {
            status: 'Not Generated',
            color: 'gray',
            description: 'No contract has been generated yet'
        };
    }

    const contract = adoptionRequest.contractDetails;

    switch (contract.status) {
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
        default:
            return {
                status: 'Unknown',
                color: 'gray',
                description: 'Contract status is unknown'
            };
    }
};

/**
 * Check if contract can be generated
 * @param adoptionRequest - Adoption request object
 * @returns Whether contract can be generated
 */
export const canGenerateContract = (adoptionRequest: any): boolean => {
    if (!adoptionRequest) {
        return false;
    }

    // Can generate if no contract exists or if contract is in drafted status
    return !adoptionRequest.contractDetails ||
        adoptionRequest.contractDetails.status === 'drafted';
};

/**
 * Check if contract can be sent
 * @param adoptionRequest - Adoption request object
 * @returns Whether contract can be sent
 */
export const canSendContract = (adoptionRequest: any): boolean => {
    return adoptionRequest?.contractDetails?.status === 'drafted';
};

/**
 * Check if contract can be signed
 * @param adoptionRequest - Adoption request object
 * @returns Whether contract can be signed
 */
export const canSignContract = (adoptionRequest: any): boolean => {
    return adoptionRequest?.contractDetails?.status === 'sent';
};

import { formatDisplayDateTime } from "./dateUtils";

/**
 * Format contract date
 * @param dateString - Date string
 * @returns Formatted date string
 */
export const formatContractDate = (dateString: string): string => {
    if (!dateString) {
        return 'Not available';
    }

    try {
        return formatDisplayDateTime(dateString);
    } catch (error) {
        console.error('Failed to format contract date:', error);
        return 'Invalid date';
    }
};

/**
 * Get contract file size display
 * @param adoptionRequest - Adoption request object
 * @returns Formatted file size
 */
export const getContractFileSize = (adoptionRequest: any): string => {
    if (!adoptionRequest?.contractDetails?.file?.size) {
        return 'Unknown size';
    }

    const bytes = adoptionRequest.contractDetails.file.size;

    if (bytes < 1024) {
        return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
};