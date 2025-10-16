import { getContractUrl, hasContract, getContractStatus } from '../contractUtils';

describe('contractUtils', () => {
    describe('getContractUrl', () => {
        it('should return URL from contractDetails.file.url', () => {
            const request = {
                contractDetails: {
                    file: {
                        url: 'https://example.com/contract.pdf'
                    }
                }
            };
            expect(getContractUrl(request)).toBe('https://example.com/contract.pdf');
        });

        it('should return URL from contractDetails.file.fileUrl', () => {
            const request = {
                contractDetails: {
                    file: {
                        fileUrl: 'https://example.com/contract.pdf'
                    }
                }
            };
            expect(getContractUrl(request)).toBe('https://example.com/contract.pdf');
        });

        it('should return URL from contractDetails.file.link', () => {
            const request = {
                contractDetails: {
                    file: {
                        link: 'https://example.com/contract.pdf'
                    }
                }
            };
            expect(getContractUrl(request)).toBe('https://example.com/contract.pdf');
        });

        it('should return URL from contractDetails.url', () => {
            const request = {
                contractDetails: {
                    url: 'https://example.com/contract.pdf'
                }
            };
            expect(getContractUrl(request)).toBe('https://example.com/contract.pdf');
        });

        it('should return URL from documents with type "contract"', () => {
            const request = {
                documents: [
                    { name: 'other.pdf', url: 'https://example.com/other.pdf', type: 'other' },
                    { name: 'contract.pdf', url: 'https://example.com/contract.pdf', type: 'contract' }
                ]
            };
            expect(getContractUrl(request)).toBe('https://example.com/contract.pdf');
        });

        it('should return URL from documents with name containing "contract"', () => {
            const request = {
                documents: [
                    { name: 'other.pdf', url: 'https://example.com/other.pdf', type: 'other' },
                    { name: 'adoption-contract.pdf', url: 'https://example.com/adoption-contract.pdf', type: 'other' }
                ]
            };
            expect(getContractUrl(request)).toBe('https://example.com/adoption-contract.pdf');
        });

        it('should return URL from documents with name containing "contract contract"', () => {
            const request = {
                documents: [
                    { name: 'other.pdf', url: 'https://example.com/other.pdf', type: 'other' },
                    { name: 'contract contract.pdf', url: 'https://example.com/contract-contract.pdf', type: 'other' }
                ]
            };
            expect(getContractUrl(request)).toBe('https://example.com/contract-contract.pdf');
        });

        it('should return null when no contract URL is found', () => {
            const request = {
                documents: [
                    { name: 'other.pdf', url: 'https://example.com/other.pdf', type: 'other' }
                ]
            };
            expect(getContractUrl(request)).toBeNull();
        });

        it('should return null for empty request', () => {
            expect(getContractUrl({})).toBeNull();
        });
    });

    describe('hasContract', () => {
        it('should return true when contract URL exists', () => {
            const request = {
                contractDetails: {
                    file: {
                        url: 'https://example.com/contract.pdf'
                    }
                }
            };
            expect(hasContract(request)).toBe(true);
        });

        it('should return false when no contract URL exists', () => {
            const request = {
                documents: [
                    { name: 'other.pdf', url: 'https://example.com/other.pdf', type: 'other' }
                ]
            };
            expect(hasContract(request)).toBe(false);
        });
    });

    describe('getContractStatus', () => {
        it('should return contract status when available', () => {
            const request = {
                contractDetails: {
                    status: 'sent'
                }
            };
            expect(getContractStatus(request)).toBe('sent');
        });

        it('should return "not_available" when no contract details', () => {
            const request = {};
            expect(getContractStatus(request)).toBe('not_available');
        });

        it('should return "not_available" when status is undefined', () => {
            const request = {
                contractDetails: {}
            };
            expect(getContractStatus(request)).toBe('not_available');
        });
    });
});
