import { api } from './api';

export interface GuideContent {
    title: string;
    subtitle: string;
    steps: {
        icon: string;
        title: string;
        description: string;
    }[];
    beforeAdoption: {
        icon: string;
        title: string;
        description: string;
    }[];
    process: {
        step: number;
        title: string;
        description: string;
    }[];
    afterAdoption: {
        icon: string;
        title: string;
        description: string;
    }[];
}

export const guideService = {
    getAdoptionGuide: async (): Promise<GuideContent> => {
        try {
            const response = await api.get('/adoption-guide');
            return response.data.data;
        } catch (error) {
            console.error('Failed to fetch adoption guide:', error);
            throw error;
        }
    }
}; 