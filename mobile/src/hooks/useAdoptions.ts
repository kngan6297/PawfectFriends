import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adoptionService } from '@/services/adoptionService';
import { AdoptionRequest, AdoptionApplicationDetails } from '@/types';

export const useAdoptionRequests = (params?: any) => {
    return useQuery({
        queryKey: ['adoptions', params],
        queryFn: () => adoptionService.getUserRequests(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

export const useAdoptionRequest = (id: string) => {
    return useQuery({
        queryKey: ['adoption', id],
        queryFn: () => adoptionService.getById(id),
        enabled: !!id,
    });
};

export const useUserAdoptionRequestDetails = (id: string) => {
    return useQuery({
        queryKey: ['adoption', id, 'user-details'],
        queryFn: () => adoptionService.getUserRequestDetails(id),
        enabled: !!id,
    });
};

export const useAdoptionMeetings = (requestId: string) => {
    return useQuery({
        queryKey: ['adoption', requestId, 'meetings'],
        queryFn: () => adoptionService.getMeetings(requestId),
        enabled: !!requestId,
    });
};

export const useUserAdoptionMeetings = (requestId: string) => {
    return useQuery({
        queryKey: ['adoption', requestId, 'user-meetings'],
        queryFn: () => adoptionService.getUserMeetings(requestId),
        enabled: !!requestId,
    });
};

export const useUserInformationRequests = (requestId: string) => {
    return useQuery({
        queryKey: ['adoption', requestId, 'information-requests'],
        queryFn: () => adoptionService.getUserInformationRequests(requestId),
        enabled: !!requestId,
    });
};

export const useCreateAdoptionRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ petId, applicationDetails }: {
            petId: string;
            applicationDetails: AdoptionApplicationDetails;
        }) => adoptionService.createRequest(petId, applicationDetails),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adoptions'] });
        },
    });
};

export const useUpdateAdoptionRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, updates }: {
            requestId: string;
            updates: any;
        }) => adoptionService.updateRequest(requestId, updates),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['adoptions'] });
            queryClient.invalidateQueries({ queryKey: ['adoption', variables.requestId] });
        },
    });
};

export const useAddAdoptionNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, noteData }: {
            requestId: string;
            noteData: { content: string; isInternal?: boolean };
        }) => adoptionService.addNote(requestId, noteData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['adoption', variables.requestId] });
        },
    });
};

export const useScheduleMeeting = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, meetingData }: {
            requestId: string;
            meetingData: {
                type: string;
                scheduledDate: string;
                location: string;
                notes?: string;
            };
        }) => adoptionService.scheduleMeeting(requestId, meetingData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['adoption', variables.requestId, 'meetings'] });
            queryClient.invalidateQueries({ queryKey: ['adoption', variables.requestId] });
        },
    });
};

export const useUpdateMeetingStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, meetingId, status, notes }: {
            requestId: string;
            meetingId: string;
            status: string;
            notes?: string;
        }) => adoptionService.updateMeetingStatus(requestId, meetingId, status, notes),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['adoption', variables.requestId, 'meetings'] });
            queryClient.invalidateQueries({ queryKey: ['adoption', variables.requestId] });
        },
    });
};

export const useSubmitInformationResponse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, responseData }: {
            requestId: string;
            responseData: any;
        }) => adoptionService.submitInformationResponse(requestId, responseData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['adoption', variables.requestId, 'information-requests'] });
            queryClient.invalidateQueries({ queryKey: ['adoption', variables.requestId] });
        },
    });
};

export const useGetContractFile = () => {
    return useMutation({
        mutationFn: (requestId: string) => adoptionService.getContractFile(requestId),
    });
};

export const useSignContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, signatureData }: {
            requestId: string;
            signatureData: any;
        }) => adoptionService.signContract(requestId, signatureData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['adoption', variables.requestId] });
        },
    });
};
