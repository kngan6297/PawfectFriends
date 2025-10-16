import { Pet } from '../pet/pet.model.js';
import { User } from '../user/user.model.js';
import { AdoptionRequest } from './adoption.model.js';
import { ApiError } from '../../utils/errors.js';
import notificationService from '../notification/notification.service.js';

export const createAdoptionRequest = async (
  userId,
  petId,
  applicationDetails
) => {
  // Check if pet is available
  const pet = await Pet.findById(petId);
  if (!pet) {
    const error = new Error('Pet not found');
    error.statusCode = 404;
    throw error;
  }
  if (pet.status != 'adoptable') {
    const error = new Error('Pet is not available for adoption');
    error.statusCode = 400;
    throw error;
  }

  // Check for existing request
  const existingRequest = await AdoptionRequest.findOne({
    user: userId,
    pet: petId,
  });
  if (existingRequest) {
    const error = new Error(
      'You have already submitted an adoption request for this pet'
    );
    error.statusCode = 400;
    throw error;
  }

  // Create adoption request
  const adoptionRequest = await AdoptionRequest.create({
    user: userId,
    pet: petId,
    shelter: pet.shelter,
    applicationDetails,
    timeline: [{ status: 'submitted' }],
  });

  // Update pet status
  await Pet.findByIdAndUpdate(petId, { status: 'pending' });

  // Create notification for shelter
  try {
    await notificationService.createAdoptionRequestNotification(
      adoptionRequest._id,
      pet.shelter
    );
  } catch (error) {
    console.error('Failed to create adoption request notification:', error);
  }

  return adoptionRequest;
};

export const getAdoptionRequests = async (query = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = true,
  } = options;

  const paginateOptions = {
    page,
    limit,
    sort,
    populate: populate
      ? [
          {
            path: 'user',
            select: 'name email phone firstName lastName avatar',
          },
          {
            path: 'pet',
            select: 'name photos type breed age gender description',
          },
          { path: 'shelter', select: 'name email phone location' },
        ]
      : [],
    customLabels: {
      docs: 'requests',
      totalDocs: 'total',
      limit: 'limit',
      page: 'page',
      totalPages: 'pages',
      hasNextPage: 'hasNextPage',
      hasPrevPage: 'hasPrevPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage',
    },
  };

  const result = await AdoptionRequest.paginate(query, paginateOptions);

  // Transform the data to match frontend expectations
  const transformedRequests = result.requests.map((request) => {
    const requestObj = request.toObject();
    return {
      ...requestObj,
      petDetails: requestObj.pet, // Map pet to petDetails
      userDetails: requestObj.user, // Map user to userDetails
      shelterDetails: requestObj.shelter, // Map shelter to shelterDetails
    };
  });

  return {
    requests: transformedRequests,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      nextPage: result.nextPage,
      prevPage: result.prevPage,
    },
  };
};

export const getAdoptionRequestById = async (requestId, populate = true) => {
  const request = await AdoptionRequest.findById(requestId).populate(
    populate
      ? [
          {
            path: 'user',
            select: 'name email phone firstName lastName avatar',
          },
          {
            path: 'pet',
            select: 'name photos type breed age gender description',
          },
          { path: 'shelter', select: 'name email phone location' },
          'notes.author',
        ]
      : []
  );

  if (!request) {
    throw new Error('Adoption request not found');
  }

  // Transform the data to match frontend expectations
  const requestObj = request.toObject();
  return {
    ...requestObj,
    petDetails: requestObj.pet, // Map pet to petDetails
    userDetails: requestObj.user, // Map user to userDetails
    shelterDetails: requestObj.shelter, // Map shelter to shelterDetails
  };
};

export const updateAdoptionRequest = async (
  requestId,
  shelterId,
  updateData
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, shelter: shelterId },
    { $set: updateData },
    { new: true, runValidators: false }
  ).populate(['userDetails', 'petDetails', 'shelterDetails']);

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  // If the request is being rejected, check if there are any other pending requests for this pet
  if (updateData.status === 'rejected') {
    const pendingRequestsCount = await AdoptionRequest.countDocuments({
      pet: request.petDetails._id,
      status: 'pending',
    });

    // If no more pending requests exist for this pet, reset pet status to adoptable
    if (pendingRequestsCount === 0) {
      await Pet.findByIdAndUpdate(request.petDetails._id, {
        status: 'adoptable',
      });
    }
  }

  // If the request is being approved, reserve the pet (don't mark as adopted yet)
  if (updateData.status === 'approved') {
    await Pet.findByIdAndUpdate(request.petDetails._id, {
      status: 'pending',
      reservedFor: request.userDetails._id,
    });
  }

  // Create notification for user about status change
  try {
    await notificationService.createAdoptionStatusChangeNotification(
      request._id,
      updateData.status,
      request.userDetails._id
    );
  } catch (error) {
    console.error('Failed to create status change notification:', error);
  }

  return request;
};

export const addNote = async (requestId, userId, note) => {
  const updateData = {
    $push: {
      notes: {
        content: note.content,
        author: userId,
        isInternal: note.isInternal || false,
      },
    },
  };

  // If this is a milestone note, also add to timeline
  if (note.isMilestone && note.timelineStatus) {
    updateData.$push.timeline = {
      status: note.timelineStatus,
      note: note.content,
      updatedBy: userId,
    };
  }

  const request = await AdoptionRequest.findByIdAndUpdate(
    requestId,
    updateData,
    { new: true }
  ).populate(['userDetails', 'petDetails', 'shelterDetails', 'notes.author']);

  if (!request) {
    throw new Error('Adoption request not found');
  }

  return request;
};

export const scheduleMeeting = async (requestId, meetingData) => {
  // First, check if the request is approved
  const existingRequest = await AdoptionRequest.findById(requestId);
  if (!existingRequest) {
    throw new Error('Adoption request not found');
  }

  if (existingRequest.status !== 'approved') {
    throw new Error(
      'Can only schedule meetings for approved adoption requests'
    );
  }

  // Prepare meeting data with proper schema fields
  const meetingToSave = {
    ...meetingData,
    status: 'scheduled',
    rescheduleCount: 0,
    originalDate: meetingData.scheduledDate,
    rescheduleHistory: [],
  };

  const request = await AdoptionRequest.findByIdAndUpdate(
    requestId,
    {
      $set: {
        status: 'scheduled', // Change status from approved to scheduled
      },
      $push: {
        meetings: meetingToSave,
        timeline: {
          status: `${meetingData.type}_scheduled`,
          note: `Scheduled ${meetingData.type} meeting for ${new Date(meetingData.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
          updatedBy: meetingData.updatedBy || 'system',
        },
      },
    },
    { new: true }
  ).populate('user', '_id name email');

  if (!request) {
    throw new Error('Adoption request not found');
  }

  // Send notification to user about meeting scheduled
  try {
    await notificationService.createAdoptionStatusChangeNotification(
      requestId,
      'scheduled',
      request.user._id
    );
  } catch (error) {
    console.error('Failed to create meeting scheduled notification:', error);
    // Don't fail the meeting scheduling if notification fails
  }

  return request;
};

export const scheduleHandover = async (requestId, handoverData) => {
  const request = await AdoptionRequest.findByIdAndUpdate(
    requestId,
    {
      $push: {
        meetings: {
          ...handoverData,
          type: 'handover',
          scheduledDate: new Date(
            `${handoverData.handoverDate}T${handoverData.handoverTime}`
          ),
        },
        timeline: {
          status: 'handover_scheduled',
          note: `Handover scheduled: ${handoverData.handoverMethod} on ${handoverData.handoverDate} at ${handoverData.handoverTime}`,
        },
      },
    },
    { new: true }
  ).populate('user', '_id name email');

  if (!request) {
    throw new Error('Adoption request not found');
  }

  // Send notification to user about handover scheduled
  try {
    await notificationService.createNotification({
      recipient: request.user._id,
      type: 'handover_scheduled',
      title: 'Handover Scheduled',
      message: `Your pet handover has been scheduled for ${handoverData.handoverDate} at ${handoverData.handoverTime} via ${handoverData.handoverMethod}`,
      data: {
        adoptionRequestId: requestId,
        handoverDate: handoverData.handoverDate,
        handoverTime: handoverData.handoverTime,
        handoverMethod: handoverData.handoverMethod,
        actionUrl: `/adoption-tracker?requestId=${requestId}&tab=meetings`,
        actionText: 'View Details',
      },
      sendEmail: true, // Send email for important handover notifications
    });
  } catch (error) {
    console.error('Failed to create handover scheduled notification:', error);
    // Don't fail the handover scheduling if notification fails
  }

  return request;
};

export const updateMeetingStatus = async (
  requestId,
  meetingId,
  status,
  notes
) => {
  // First, update the meeting status
  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, 'meetings._id': meetingId },
    {
      $set: {
        'meetings.$.status': status,
        'meetings.$.notes': notes,
      },
      $push: {
        timeline: {
          status: `${
            status === 'completed'
              ? 'completed'
              : status === 'cancelled'
                ? 'cancelled'
                : status === 'rescheduled'
                  ? 'rescheduled'
                  : 'updated'
          }_meeting`,
          note: notes || `Meeting ${status}`,
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request or meeting not found');
  }

  // If meeting is completed and request is scheduled, move to contract pending
  // Meeting completion doesn't change adoption status
  // Status remains 'scheduled' until contract is signed

  return request;
};

export const uploadDocument = async (requestId, userId, document) => {
  const request = await AdoptionRequest.findByIdAndUpdate(
    requestId,
    {
      $push: {
        documents: {
          ...document,
          uploadedAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request not found');
  }

  return request;
};

export const verifyDocument = async (
  requestId,
  documentId,
  userId,
  status,
  reason = ''
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: requestId,
      'documents._id': documentId,
    },
    {
      $set: {
        'documents.$.status': status,
        'documents.$.verifiedAt': new Date(),
        'documents.$.verifiedBy': userId,
      },
      $push: {
        timeline: {
          status: `document_${status}`,
          note: `Document ${status}: ${reason || ''}`,
          updatedBy: userId,
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request or document not found');
  }

  return request;
};

export const deleteDocument = async (requestId, documentId, userId) => {
  const request = await AdoptionRequest.findByIdAndUpdate(
    requestId,
    {
      $pull: {
        documents: { _id: documentId },
      },
      $push: {
        timeline: {
          status: 'document_deleted',
          note: 'Document deleted',
          updatedBy: userId,
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request not found');
  }

  return request;
};

export const makeFinalDecision = async (requestId, shelterId, decision) => {
  // Validate rejection reason is provided when rejecting
  if (decision.status === 'rejected') {
    if (!decision.rejectionReason) {
      throw new Error(
        'Rejection reason is required when rejecting an adoption request'
      );
    }
  }

  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, shelter: shelterId },
    {
      $set: {
        status: decision.status,
        decisionDate: new Date(),
        finalDecision: {
          ...decision,
          date: new Date(),
          decidedBy: shelterId,
        },
        ...(decision.status === 'rejected' && {
          rejectionReason: decision.rejectionReason,
          rejectionDetails: decision.rejectionDetails || '',
        }),
      },
      $push: {
        timeline: {
          status: decision.status,
          note:
            decision.status === 'rejected'
              ? `Rejected: ${decision.rejectionReason}${decision.rejectionDetails ? ` - ${decision.rejectionDetails}` : ''}`
              : decision.reason,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  // Update pet status if approved
  if (decision.status === 'approved') {
    await Pet.findByIdAndUpdate(request.pet, { status: 'adopted' });
  } else if (decision.status === 'rejected') {
    // Check if there are any other pending requests for this pet
    const pendingRequestsCount = await AdoptionRequest.countDocuments({
      pet: request.pet,
      status: 'pending',
    });

    // If no more pending requests exist for this pet, reset pet status to adoptable
    if (pendingRequestsCount === 0) {
      await Pet.findByIdAndUpdate(request.pet, { status: 'adoptable' });
    }
  }

  return request;
};

export const scheduleFollowUp = async (requestId, followUpData) => {
  const request = await AdoptionRequest.findByIdAndUpdate(
    requestId,
    {
      $push: {
        followUp: followUpData,
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request not found');
  }

  return request;
};

// New workflow methods
export const performPreliminaryEvaluation = async (
  requestId,
  shelterId,
  evaluation
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, shelter: shelterId },
    {
      $set: {
        preliminaryEvaluation: {
          ...evaluation,
          evaluatedBy: shelterId,
          evaluatedAt: new Date(),
        },
        status: evaluation.decision === 'proceed' ? 'pending' : 'rejected',
      },
      $push: {
        timeline: {
          status: evaluation.decision === 'proceed' ? 'pending' : 'rejected',
          note: evaluation.notes,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  ).populate('user', '_id name email');

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  // If rejected, update pet status back to adoptable and send notification
  if (evaluation.decision === 'reject') {
    await Pet.findByIdAndUpdate(request.pet, { status: 'adoptable' });

    // Send notification to user about rejection
    try {
      await notificationService.createAdoptionStatusChangeNotification(
        requestId,
        'rejected',
        request.user._id
      );
    } catch (error) {
      console.error('Failed to create rejection notification:', error);
    }
  }

  return request;
};

export const updateInterviewResults = async (
  requestId,
  shelterId,
  interviewResults
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, shelter: shelterId },
    {
      $set: {
        interviewResults: {
          ...interviewResults,
          conductedBy: shelterId,
          conductedAt: new Date(),
        },
        status:
          interviewResults.outcome === 'passed'
            ? 'approved'
            : interviewResults.outcome === 'conditional'
              ? 'approved'
              : 'rejected',
      },
      $push: {
        timeline: {
          status: interviewResults.outcome === 'skip' ? 'approved' : 'approved',
          note:
            interviewResults.outcome === 'skip'
              ? 'Verification step skipped'
              : `Interview ${interviewResults.outcome}: ${interviewResults.notes}`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  ).populate('user', '_id name email');

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  // If interview failed, update pet status back to adoptable
  if (interviewResults.outcome === 'failed') {
    await Pet.findByIdAndUpdate(request.pet, { status: 'adoptable' });
  }

  // If approved, reserve the pet and send notification
  if (
    interviewResults.outcome === 'passed' ||
    interviewResults.outcome === 'conditional' ||
    interviewResults.outcome === 'skip'
  ) {
    // Reserve the pet for this user
    try {
      await Pet.findByIdAndUpdate(request.pet, {
        status: 'pending',
        reservedFor: request.user._id,
      });
    } catch (error) {
      console.error('Failed to reserve pet:', error);
    }

    // Send notification to user about approval
    try {
      await notificationService.createAdoptionStatusChangeNotification(
        requestId,
        'approved',
        request.user._id
      );
    } catch (error) {
      console.error('Failed to create approval notification:', error);
    }
  } else if (interviewResults.outcome === 'failed') {
    // Send notification to user about rejection
    try {
      await notificationService.createAdoptionStatusChangeNotification(
        requestId,
        'rejected',
        request.user._id
      );
    } catch (error) {
      console.error('Failed to create rejection notification:', error);
    }
  }

  return request;
};

export const updateHomeVisitResults = async (
  requestId,
  shelterId,
  homeVisitResults
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, shelter: shelterId },
    {
      $set: {
        homeVisitResults: {
          ...homeVisitResults,
          conductedBy: shelterId,
          conductedAt: new Date(),
        },
        status:
          homeVisitResults.outcome === 'passed'
            ? 'approved'
            : homeVisitResults.outcome === 'conditional'
              ? 'approved'
              : 'rejected',
      },
      $push: {
        timeline: {
          status: 'approved',
          note: `Home visit ${homeVisitResults.outcome}: ${homeVisitResults.notes}`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  ).populate('user', '_id name email');

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  // If home visit failed, update pet status back to adoptable
  if (homeVisitResults.outcome === 'failed') {
    await Pet.findByIdAndUpdate(request.pet, { status: 'adoptable' });
  }

  // If approved, reserve the pet and send notification
  if (
    homeVisitResults.outcome === 'passed' ||
    homeVisitResults.outcome === 'conditional'
  ) {
    // Reserve the pet for this user
    try {
      await Pet.findByIdAndUpdate(request.pet, {
        status: 'pending',
        reservedFor: request.user._id,
      });
    } catch (error) {
      console.error('Failed to reserve pet:', error);
    }

    // Send notification to user about approval
    try {
      await notificationService.createAdoptionStatusChangeNotification(
        requestId,
        'approved',
        request.user._id
      );
    } catch (error) {
      console.error('Failed to create approval notification:', error);
    }
  } else if (homeVisitResults.outcome === 'failed') {
    // Send notification to user about rejection
    try {
      await notificationService.createAdoptionStatusChangeNotification(
        requestId,
        'rejected',
        request.user._id
      );
    } catch (error) {
      console.error('Failed to create rejection notification:', error);
    }
  }

  return request;
};

export const approveAdoptionRequest = async (
  requestId,
  shelterId,
  approvalDetails
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, shelter: shelterId },
    {
      $set: {
        status: 'approved',
        finalDecision: {
          status: 'approved',
          date: new Date(),
          reason:
            approvalDetails.reason || 'Approved after successful evaluation',
          decidedBy: shelterId,
          conditions: approvalDetails.conditions || [],
        },
      },
      $push: {
        timeline: {
          status: 'approved',
          note: `Application approved, awaiting scheduling/contract`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  ).populate('user', '_id name email');

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  // Reserve the pet for this user (don't mark as adopted yet)
  try {
    await Pet.findByIdAndUpdate(request.pet, {
      status: 'pending',
      reservedFor: request.user._id,
    });
  } catch (error) {
    console.error('Failed to reserve pet:', error);
    // Don't fail the approval if pet reservation fails
  }

  // Send notification to user about approval
  try {
    await notificationService.createAdoptionStatusChangeNotification(
      requestId,
      'approved',
      request.user._id
    );
  } catch (error) {
    console.error('Failed to create approval notification:', error);
    // Don't fail the approval if notification fails
  }

  return request;
};

// Contract management is handled through contractDetails.status field

export const generateContract = async (
  requestId,
  shelterId,
  contractDetails
) => {
  // Get the full adoption request with populated data
  const request = await AdoptionRequest.findById(requestId)
    .populate('user', 'name email phone firstName lastName location')
    .populate('pet', 'name type breed age gender description photos')
    .populate('shelter', 'name email phone location');

  console.log('🔍 Populated request data:', {
    hasUser: !!request?.user,
    hasShelter: !!request?.shelter,
    hasPet: !!request?.pet,
    userFields: request?.user ? Object.keys(request.user) : [],
    shelterFields: request?.shelter ? Object.keys(request.shelter) : [],
    petFields: request?.pet ? Object.keys(request.pet) : [],
  });

  // Convert to plain objects to ensure proper data access
  if (request) {
    if (request.user) {
      // The data is already there, just ensure it's accessible
      request.user = {
        name: request.user.name,
        email: request.user.email,
        phone: request.user.phone,
        firstName: request.user.firstName,
        lastName: request.user.lastName,
        location: request.user.location,
        ...request.user,
      };
      console.log('🔍 User after direct access:', {
        name: request.user.name,
        email: request.user.email,
        phone: request.user.phone,
        location: request.user.location,
      });
    }
    if (request.shelter) {
      request.shelter = {
        name: request.shelter.name,
        email: request.shelter.email,
        phone: request.shelter.phone,
        location: request.shelter.location,
        ...request.shelter,
      };
      console.log('🔍 Shelter after direct access:', {
        name: request.shelter.name,
        email: request.shelter.email,
        phone: request.shelter.phone,
        location: request.shelter.location,
      });
    }
    if (request.pet) {
      request.pet = request.pet.toObject ? request.pet.toObject() : request.pet;
    }
  }

  if (!request) {
    throw new Error('Adoption request not found');
  }

  // Import the contract template engine
  const { buildAdoptionContract, validateContractOptions } = await import(
    '../../services/contractTemplate.service.js'
  );

  // Validate contract options
  const validation = validateContractOptions(contractDetails);
  if (!validation.isValid) {
    throw new Error(
      `Invalid contract options: ${validation.errors.join(', ')}`
    );
  }

  // Generate contract using template engine
  const contractData = buildAdoptionContract({
    title: contractDetails.title,
    description: contractDetails.description,
    extraTerms: contractDetails.customTerms || contractDetails.terms || '',
    adoption: request,
  });

  // Helper function to convert markdown to HTML
  const markdownToHtml = (markdown) => {
    let html = markdown;
    // Convert headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert italic text
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Convert unordered lists
    html = html.replace(/^[\s]*[-*+]\s+(.*)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    // Convert line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    // Wrap in paragraphs
    html = '<p>' + html + '</p>';
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><br><\/p>/g, '');
    return html;
  };

  // Generate PDF if requested
  let pdfBuffer = null;
  let pdfUrl = null;

  if (contractDetails.generatePdf !== false) {
    try {
      const { htmlToPdfBuffer } = await import('../../services/pdf.service.js');
      const { saveBufferAndGetUrl, generateUniqueFilename } = await import(
        '../../services/fileStore.service.js'
      );

      // Convert markdown to HTML for PDF generation
      const htmlContent = markdownToHtml(contractData.content);
      const html = `
<!DOCTYPE html>
<html lang="${contractData.language}">
<head>
    <meta charset="UTF-8">
    <title>${contractData.title}</title>
    <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto; line-height: 1.5; padding: 24px; }
        h1, h2, h3 { margin: 0.8em 0 0.4em; }
        table { border-collapse: collapse; width: 100%; }
        pre { white-space: pre-wrap; }
        hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
    </style>
</head>
<body>${htmlContent}</body>
</html>`;

      pdfBuffer = await htmlToPdfBuffer(html);

      // Save PDF to file storage and get URL
      const filename = generateUniqueFilename(
        `adoption-contract-${contractData.contractId}.pdf`,
        ''
      );
      const [filePath, url] = await saveBufferAndGetUrl(
        pdfBuffer,
        `contracts/${filename}`,
        'application/pdf'
      );

      pdfUrl = url;
      console.log('PDF saved:', { filePath, url });
    } catch (error) {
      console.warn('PDF generation failed:', error.message);
      // Continue without PDF if generation fails
    }
  }

  // Prepare contract details for database
  const contractDataForDB = {
    title: contractData.title,
    description: contractData.description,
    terms: contractData.terms,
    content: contractData.content,
    status: 'drafted',
    uploadedAt: new Date(),
    uploadedBy: shelterId,
    generated: true,
    version: parseInt(contractData.version) || 1,
    lang: contractData.language,
    contractId: contractData.contractId,
    checksum: contractData.checksum, // Save checksum for auditing
    file: pdfBuffer
      ? {
          originalName: `adoption-contract-${contractData.contractId}.pdf`,
          mimetype: 'application/pdf',
          size: pdfBuffer.length,
          buffer: pdfBuffer,
          url: pdfUrl,
        }
      : null,
  };

  const updatedRequest = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, shelter: shelterId },
    {
      $set: {
        contractDetails: contractDataForDB,
      },
      $push: {
        timeline: {
          status: 'contract_ready',
          note: `Contract generated and ready for signing (${contractData.language.toUpperCase()})`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  );

  if (!updatedRequest) {
    throw new Error('Adoption request not found or unauthorized');
  }

  return updatedRequest;
};

// Generate contract content based on adoption request data
const generateContractContent = (request, contractDetails) => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const user = request.user;
  const pet = request.pet;
  const shelter = request.shelter;

  return `
PET ADOPTION AGREEMENT

This Pet Adoption Agreement ("Agreement") is entered into on ${currentDate} between:

SHELTER: ${shelter.name}
Address: ${shelter.address || 'Not provided'}
Phone: ${shelter.phone || 'Not provided'}
Email: ${shelter.email || 'Not provided'}

ADOPTER: ${user.name}
Email: ${user.email}
Phone: ${user.phone || 'Not provided'}

PET DETAILS:
Name: ${pet.name}
Type: ${pet.type}
Breed: ${pet.breed}
Age: ${pet.age}

TERMS AND CONDITIONS:

1. ADOPTION FEE: The adopter agrees to pay any applicable adoption fees as determined by the shelter.

2. CARE RESPONSIBILITIES: The adopter agrees to provide proper care for the pet including:
   - Adequate food, water, and shelter
   - Regular veterinary care and vaccinations
   - Exercise and mental stimulation
   - Love and attention

3. HEALTH GUARANTEE: The shelter warrants that the pet is in good health at the time of adoption. Any pre-existing conditions have been disclosed.

4. RETURN POLICY: If the adopter is unable to keep the pet, they must return it to the shelter rather than rehoming independently.

5. SPAY/NEUTER: If the pet is not already spayed/neutered, the adopter agrees to have this procedure done within 30 days of adoption.

6. IDENTIFICATION: The adopter agrees to ensure the pet has proper identification (microchip, tags) at all times.

7. LEGAL OWNERSHIP: Legal ownership of the pet transfers to the adopter upon completion of this agreement and payment of any fees.

8. COMPLIANCE: The adopter agrees to comply with all local laws and regulations regarding pet ownership.

ADDITIONAL TERMS:
${contractDetails.terms || 'No additional terms specified.'}

By signing below, both parties agree to the terms of this adoption agreement.

SHELTER REPRESENTATIVE: _________________ Date: _______

ADOPTER SIGNATURE: _________________ Date: _______

This agreement is binding and enforceable by law.
  `.trim();
};

export const sendContract = async (requestId, shelterId) => {
  // First, check if contract exists and is in drafted status
  const existingRequest = await AdoptionRequest.findOne({
    _id: requestId,
    shelter: shelterId,
  });

  if (!existingRequest) {
    throw new Error('Adoption request not found or unauthorized');
  }

  // Validate that contract exists and is in drafted status
  if (!existingRequest.contractDetails) {
    throw new Error(
      'No contract uploaded. Please upload a contract before sending.'
    );
  }

  if (existingRequest.contractDetails.status !== 'drafted') {
    throw new Error(
      `Cannot send contract. Current status is '${existingRequest.contractDetails.status}'. Only drafted contracts can be sent.`
    );
  }

  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, shelter: shelterId },
    {
      $set: {
        'contractDetails.status': 'sent',
        'contractDetails.sentAt': new Date(),
        'contractDetails.sentBy': shelterId,
        // Don't set uploadedAt here - it should already be set from upload
      },
      $push: {
        timeline: {
          status: 'contract_sent',
          note: 'Contract sent to user for signing',
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  ).populate('user', 'name email');

  // Send notification to user about contract
  try {
    const { default: notificationService } = await import(
      '../notification/notification.service.js'
    );
    await notificationService.createContractSentNotification(
      requestId,
      request.user._id,
      {
        contractTitle: request.contractDetails?.title || 'Adoption Contract',
        petName: request.petDetails?.name || 'your pet',
        shelterName: request.shelterDetails?.name || 'the shelter',
      }
    );
  } catch (error) {
    console.error('Error sending contract notification:', error);
    // Don't fail the contract sending if notification fails
  }

  return request;
};

export const signContract = async (requestId, userId, signatureDetails) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, user: userId },
    {
      $set: {
        'contractDetails.status': 'signed',
        'contractDetails.signedAt': new Date(),
        'contractDetails.signedBy': userId,
        // Keep adoption status as 'scheduled' - only change to 'completed' when handover is done
      },
      $push: {
        timeline: {
          status: 'contract_signed',
          note: 'Contract signed by user',
          updatedBy: userId,
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  // Don't update pet status yet - wait for handover completion
  return request;
};

export const completeHandover = async (requestId, shelterId, handoverData) => {
  console.log('🔍 Complete Handover - Input Data:', {
    requestId,
    shelterId,
    handoverData,
  });

  const handoverDetails = {
    handoverDate: handoverData.handoverDate
      ? new Date(handoverData.handoverDate)
      : new Date(),
    handoverLocation: handoverData.handoverLocation,
    handoverNotes: handoverData.handoverNotes,
    handoverMethod: handoverData.handoverMethod || 'in_person',
    witnessName: handoverData.witnessName,
    witnessContact: handoverData.witnessContact,
    completedAt: new Date(),
    completedBy: shelterId,
    status: 'completed',
  };

  console.log('🔍 Complete Handover - Processed Data:', handoverDetails);

  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, shelter: shelterId },
    {
      $set: {
        handoverDetails: handoverDetails,
      },
      $push: {
        timeline: {
          status: 'handover_completed',
          note: `Handover completed: ${handoverData.handoverMethod || 'In-person handover'}`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  console.log('🔍 Complete Handover - Updated Request:', {
    handoverDetails: request.handoverDetails,
    contractDetails: request.contractDetails,
    status: request.status,
  });

  // Check if both contract is signed and handover is completed
  const isContractSigned = request.contractDetails?.status === 'signed';
  const isHandoverCompleted = request.handoverDetails?.completedAt;

  console.log('🔍 Adoption Completion Check:', {
    requestId,
    contractStatus: request.contractDetails?.status,
    isContractSigned,
    handoverCompletedAt: request.handoverDetails?.completedAt,
    isHandoverCompleted,
    currentStatus: request.status,
  });

  if (isContractSigned && isHandoverCompleted) {
    console.log('✅ Both conditions met - completing adoption automatically');
    // Both conditions met - complete the adoption
    await AdoptionRequest.findByIdAndUpdate(requestId, {
      $set: {
        status: 'completed',
      },
      $push: {
        timeline: {
          status: 'completed',
          note: 'Adoption completed - contract signed and handover done',
          updatedBy: shelterId,
        },
      },
    });

    // Update pet status to adopted
    await Pet.findByIdAndUpdate(request.pet, { status: 'adopted' });
    console.log('🎉 Adoption completed successfully');
  } else {
    console.log('❌ Adoption not completed - missing conditions:', {
      contractSigned: isContractSigned,
      handoverCompleted: isHandoverCompleted,
    });
  }

  return request;
};

// Manual adoption completion endpoint for cases where automatic completion fails
export const completeAdoption = async (requestId, shelterId) => {
  const request = await AdoptionRequest.findById(requestId);

  if (!request) {
    throw new Error('Adoption request not found');
  }

  // Check if user has permission (shelter staff or admin)
  const isShelterStaff = request.shelter.toString() === shelterId.toString();
  if (!isShelterStaff) {
    throw new Error('Unauthorized to complete this adoption');
  }

  // Check if both conditions are met
  const isContractSigned = request.contractDetails?.status === 'signed';
  const isHandoverCompleted = request.handoverDetails?.completedAt;

  if (!isContractSigned) {
    throw new Error('Cannot complete adoption: contract is not signed');
  }

  if (!isHandoverCompleted) {
    throw new Error('Cannot complete adoption: handover is not completed');
  }

  // Complete the adoption
  const updatedRequest = await AdoptionRequest.findByIdAndUpdate(
    requestId,
    {
      $set: {
        status: 'completed',
      },
      $push: {
        timeline: {
          status: 'completed',
          note: 'Adoption manually completed - contract signed and handover done',
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  );

  // Update pet status to adopted
  await Pet.findByIdAndUpdate(request.pet, { status: 'adopted' });

  console.log('🎉 Adoption manually completed successfully');

  return updatedRequest;
};

export const schedulePostAdoptionFollowUp = async (
  requestId,
  shelterId,
  followUpData
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    { _id: requestId, shelter: shelterId },
    {
      $push: {
        followUps: {
          ...followUpData,
          type: followUpData.type || 'phone_call', // phone_call, home_visit, email_check
          scheduledDate: new Date(followUpData.scheduledDate),
          status: 'scheduled',
          createdAt: new Date(),
        },
        timeline: {
          status: 'follow_up_scheduled',
          note: `Follow-up ${followUpData.type || 'phone_call'} scheduled for ${new Date(followUpData.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  return request;
};

export const completeFollowUp = async (
  requestId,
  shelterId,
  followUpId,
  completionData
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: requestId,
      shelter: shelterId,
      'followUps._id': followUpId,
    },
    {
      $set: {
        'followUps.$.completedDate': new Date(),
        'followUps.$.status': completionData.outcome || 'completed', // completed, cancelled
        'followUps.$.notes': completionData.notes,
        'followUps.$.outcome': completionData.outcome,
        'followUps.$.completedBy': shelterId,
      },
      $push: {
        timeline: {
          status: `follow_up_${completionData.outcome || 'completed'}`,
          note: `Follow-up ${completionData.outcome || 'completed'}: ${completionData.notes || ''}`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request or follow-up not found');
  }

  return request;
};

// Get follow-ups for a specific request
export const getFollowUps = async (requestId, userId, role) => {
  const query = { _id: requestId };

  // Filter based on user role
  if (role === 'shelter' || role === 'shelter_admin' || role === 'admin') {
    query.shelter = userId;
  } else {
    query.user = userId;
  }

  const request = await AdoptionRequest.findOne(query)
    .populate(['user', 'pet', 'shelter'])
    .select('followUps');

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  return request.followUps || [];
};

// Reschedule a follow-up
export const rescheduleFollowUp = async (
  requestId,
  shelterId,
  followUpId,
  newScheduledDate
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: requestId,
      shelter: shelterId,
      'followUps._id': followUpId,
    },
    {
      $set: {
        'followUps.$.scheduledDate': new Date(newScheduledDate),
        'followUps.$.status': 'scheduled', // Reset to scheduled when rescheduled
        'followUps.$.rescheduledAt': new Date(),
        'followUps.$.rescheduledBy': shelterId,
      },
      $push: {
        timeline: {
          status: 'follow_up_rescheduled',
          note: `Follow-up rescheduled to ${new Date(newScheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request or follow-up not found');
  }

  return request;
};

// Cancel a follow-up
export const cancelFollowUp = async (
  requestId,
  shelterId,
  followUpId,
  reason = ''
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: requestId,
      shelter: shelterId,
      'followUps._id': followUpId,
    },
    {
      $set: {
        'followUps.$.status': 'cancelled',
        'followUps.$.cancelledAt': new Date(),
        'followUps.$.cancelledBy': shelterId,
        'followUps.$.cancellationReason': reason,
      },
      $push: {
        timeline: {
          status: 'follow_up_cancelled',
          note: `Follow-up cancelled${reason ? `: ${reason}` : ''}`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  return request;
};

// Additional Information Request Functions

export const createInformationRequest = async (
  requestId,
  shelterId,
  informationRequestData
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: requestId,
      shelter: shelterId,
    },
    {
      $push: {
        informationRequests: {
          ...informationRequestData,
          requestedBy: shelterId,
          status: 'pending',
          createdAt: new Date(),
          dueDate: informationRequestData.dueDate
            ? new Date(informationRequestData.dueDate)
            : null,
          requiredFields: informationRequestData.requiredFields || [],
        },
        timeline: {
          status: 'information_requested',
          note: `Additional information requested: ${informationRequestData.title}`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  ).populate(['user', 'pet']);

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  // Create notification for user about information request
  try {
    await notificationService.createInformationRequestNotification(
      request._id,
      request.user._id,
      informationRequestData
    );
  } catch (error) {
    console.error('Failed to create information request notification:', error);
  }

  return request;
};

export const submitInformationResponse = async (
  requestId,
  userId,
  informationRequestId,
  responseData
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: requestId,
      user: userId,
      'informationRequests._id': informationRequestId,
    },
    {
      $set: {
        'informationRequests.$.status': 'submitted',
        'informationRequests.$.submittedAt': new Date(),
        'informationRequests.$.submittedBy': userId,
        'informationRequests.$.response': responseData,
      },
      $push: {
        timeline: {
          status: 'information_submitted',
          note: 'Additional information submitted by applicant',
          updatedBy: userId,
        },
      },
    },
    { new: true }
  ).populate(['user', 'pet', 'shelter']);

  if (!request) {
    throw new Error('Adoption request or information request not found');
  }

  // Create notification for shelter about submitted information
  try {
    await notificationService.createInformationSubmittedNotification(
      request._id,
      request.shelter._id,
      informationRequestId
    );
  } catch (error) {
    console.error(
      'Failed to create information submitted notification:',
      error
    );
  }

  return request;
};

export const reviewInformationRequest = async (
  requestId,
  shelterId,
  informationRequestId,
  reviewData
) => {
  // Validate that the status is one of the allowed information request statuses
  const allowedStatuses = ['approved', 'needs_revision'];
  if (!allowedStatuses.includes(reviewData.status)) {
    throw new Error(
      `Invalid information request status: ${reviewData.status}. Must be one of: ${allowedStatuses.join(', ')}`
    );
  }

  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: requestId,
      shelter: shelterId,
      'informationRequests._id': informationRequestId,
    },
    {
      $set: {
        'informationRequests.$.status': reviewData.status,
        'informationRequests.$.reviewedAt': new Date(),
        'informationRequests.$.reviewedBy': shelterId,
        'informationRequests.$.reviewNotes': reviewData.reviewNotes,
      },
      $push: {
        timeline: {
          status: `information_${reviewData.status}`,
          note: `Information request ${reviewData.status}: ${reviewData.reviewNotes || ''}`,
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  ).populate(['user', 'pet']);

  if (!request) {
    throw new Error('Adoption request or information request not found');
  }

  // Create notification for user about information review
  try {
    await notificationService.createInformationReviewNotification(
      request._id,
      request.user._id,
      informationRequestId,
      reviewData.status
    );
  } catch (error) {
    console.error('Failed to create information review notification:', error);
  }

  return request;
};

export const updateInformationRequest = async (
  requestId,
  shelterId,
  informationRequestId,
  updateData
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: requestId,
      shelter: shelterId,
      'informationRequests._id': informationRequestId,
    },
    {
      $set: {
        'informationRequests.$.title': updateData.title,
        'informationRequests.$.description': updateData.description,
        'informationRequests.$.dueDate': updateData.dueDate,
        'informationRequests.$.isUrgent': updateData.isUrgent,
        'informationRequests.$.priority': updateData.priority,
        'informationRequests.$.requiredFields': updateData.requiredFields,
      },
    },
    { new: true }
  ).populate(['user', 'pet']);

  if (!request) {
    throw new Error('Adoption request or information request not found');
  }

  return request;
};

export const deleteInformationRequest = async (
  requestId,
  shelterId,
  informationRequestId
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: requestId,
      shelter: shelterId,
    },
    {
      $pull: {
        informationRequests: { _id: informationRequestId },
      },
      $push: {
        timeline: {
          status: 'information_request_cancelled',
          note: 'Information request cancelled by shelter',
          updatedBy: shelterId,
        },
      },
    },
    { new: true }
  ).populate(['user', 'pet']);

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  return request;
};

export const getInformationRequests = async (requestId, userId, role) => {
  const query = { _id: requestId };

  // Filter based on user role
  if (role === 'shelter' || role === 'shelter_admin' || role === 'admin') {
    query.shelter = userId;
  } else {
    query.user = userId;
  }

  const request = await AdoptionRequest.findOne(query)
    .populate(['user', 'pet', 'shelter'])
    .select('informationRequests');

  if (!request) {
    throw new Error('Adoption request not found or unauthorized');
  }

  return request.informationRequests || [];
};

export const sendInformationRequestReminder = async (
  requestId,
  shelterId,
  informationRequestId,
  reminderMethod = 'email'
) => {
  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: requestId,
      shelter: shelterId,
      'informationRequests._id': informationRequestId,
    },
    {
      $push: {
        'informationRequests.$.reminders': {
          sentAt: new Date(),
          method: reminderMethod,
          by: shelterId,
        },
      },
    },
    { new: true }
  ).populate(['user', 'pet']);

  if (!request) {
    throw new Error('Adoption request or information request not found');
  }

  // Send actual reminder notification
  try {
    await notificationService.createInformationRequestReminder(
      request._id,
      request.user._id,
      informationRequestId,
      reminderMethod
    );
  } catch (error) {
    console.error('Failed to send information request reminder:', error);
  }

  return request;
};

// New service functions using virtual fields and helper methods
export const getAdoptionRequestsWithVirtuals = async (
  query = {},
  options = {}
) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

  const paginateOptions = {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'name email phone firstName lastName avatar' },
      { path: 'pet', select: 'name photos type breed age gender description' },
      { path: 'shelter', select: 'name email phone' },
    ],
    customLabels: {
      docs: 'requests',
      totalDocs: 'total',
      limit: 'limit',
      page: 'page',
      totalPages: 'pages',
      hasNextPage: 'hasNextPage',
      hasPrevPage: 'hasPrevPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage',
    },
  };

  const result = await AdoptionRequest.paginate(query, paginateOptions);

  // Add computed virtual fields
  const requestsWithVirtuals = result.requests.map((request) => {
    const requestObj = request.toObject();
    return {
      ...requestObj,
      userFullName: request.userFullName,
      petName: request.petName,
      shelterName: request.shelterName,
      applicationAge: request.applicationAge,
      statusDisplayName: request.statusDisplayName,
      currentTimelineStatus: request.currentTimelineStatus,
      isOverdue: request.isOverdue(),
      nextStep: request.getNextStep(),
    };
  });

  return {
    requests: requestsWithVirtuals,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      nextPage: result.nextPage,
      prevPage: result.prevPage,
    },
  };
};

export const getOverdueAdoptionRequests = async () => {
  return await AdoptionRequest.findOverdue();
};

export const getAdoptionRequestsByUser = async (userId) => {
  return await AdoptionRequest.findByUser(userId);
};

export const getAdoptionRequestsByShelter = async (shelterId) => {
  return await AdoptionRequest.findByShelter(shelterId);
};

export const getAdoptionRequestsByStatus = async (status) => {
  return await AdoptionRequest.findByStatus(status);
};

export const addTimelineEvent = async (requestId, status, note, updatedBy) => {
  const request = await AdoptionRequest.findById(requestId);
  if (!request) {
    throw new Error('Adoption request not found');
  }

  return await request.addTimelineEvent(status, note, updatedBy);
};

export const addNoteToRequest = async (
  requestId,
  content,
  author,
  isInternal = false
) => {
  const request = await AdoptionRequest.findById(requestId);
  if (!request) {
    throw new Error('Adoption request not found');
  }

  return await request.addNote(content, author, isInternal);
};

export const updateRequestStatus = async (
  requestId,
  newStatus,
  note,
  updatedBy
) => {
  const request = await AdoptionRequest.findById(requestId);
  if (!request) {
    throw new Error('Adoption request not found');
  }

  const updatedRequest = await request.updateStatus(newStatus, note, updatedBy);

  // Update pet status based on adoption status
  if (newStatus === 'approved') {
    await Pet.findByIdAndUpdate(request.pet, { status: 'adopted' });
  } else if (newStatus === 'rejected') {
    // Check if there are any other pending requests for this pet
    const pendingRequestsCount = await AdoptionRequest.countDocuments({
      pet: request.pet,
      status: 'pending',
    });

    // If no more pending requests exist for this pet, reset pet status to adoptable
    if (pendingRequestsCount === 0) {
      await Pet.findByIdAndUpdate(request.pet, { status: 'adoptable' });
    }
  }

  return updatedRequest;
};

// Check for overdue information requests
export const checkOverdueInformationRequests = async () => {
  const now = new Date();

  const requests = await AdoptionRequest.find({
    'informationRequests.status': 'pending',
    'informationRequests.dueDate': { $lt: now },
  });

  for (const request of requests) {
    for (const infoRequest of request.informationRequests) {
      if (
        infoRequest.status === 'pending' &&
        infoRequest.dueDate &&
        infoRequest.dueDate < now
      ) {
        await AdoptionRequest.findOneAndUpdate(
          { _id: request._id, 'informationRequests._id': infoRequest._id },
          {
            $set: {
              'informationRequests.$.status': 'overdue',
            },
            $push: {
              timeline: {
                status: 'information_overdue',
                note: `Information request overdue: ${infoRequest.title}`,
                updatedBy: 'system',
              },
            },
          }
        );
      }
    }
  }

  return requests.length;
};

// Additional pagination functions for specific use cases
export const getAdoptionRequestsByStatusPaginated = async (
  status,
  options = {}
) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

  const paginateOptions = {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'name email phone firstName lastName avatar' },
      { path: 'pet', select: 'name photos type breed age gender description' },
      { path: 'shelter', select: 'name email phone' },
    ],
    customLabels: {
      docs: 'requests',
      totalDocs: 'total',
      limit: 'limit',
      page: 'page',
      totalPages: 'pages',
      hasNextPage: 'hasNextPage',
      hasPrevPage: 'hasPrevPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage',
    },
  };

  return await AdoptionRequest.paginate({ status }, paginateOptions);
};

export const getAdoptionRequestsByShelterPaginated = async (
  shelterId,
  options = {}
) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

  const paginateOptions = {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'name email phone firstName lastName avatar' },
      { path: 'pet', select: 'name photos type breed age gender description' },
      { path: 'shelter', select: 'name email phone' },
    ],
    customLabels: {
      docs: 'requests',
      totalDocs: 'total',
      limit: 'limit',
      page: 'page',
      totalPages: 'pages',
      hasNextPage: 'hasNextPage',
      hasPrevPage: 'hasPrevPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage',
    },
  };

  return await AdoptionRequest.paginate(
    { shelter: shelterId },
    paginateOptions
  );
};

export const getAdoptionRequestsByUserPaginated = async (
  userId,
  options = {}
) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

  const paginateOptions = {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'name email phone firstName lastName avatar' },
      { path: 'pet', select: 'name photos type breed age gender description' },
      { path: 'shelter', select: 'name email phone' },
    ],
    customLabels: {
      docs: 'requests',
      totalDocs: 'total',
      limit: 'limit',
      page: 'page',
      totalPages: 'pages',
      hasNextPage: 'hasNextPage',
      hasPrevPage: 'hasPrevPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage',
    },
  };

  return await AdoptionRequest.paginate({ user: userId }, paginateOptions);
};

export const getOverdueAdoptionRequestsPaginated = async (options = {}) => {
  const { page = 1, limit = 10, sort = { applicationDate: 1 } } = options;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const query = {
    applicationDate: { $lt: thirtyDaysAgo },
    status: 'pending',
  };

  const paginateOptions = {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'name email phone firstName lastName avatar' },
      { path: 'pet', select: 'name photos type breed age gender description' },
      { path: 'shelter', select: 'name email phone' },
    ],
    customLabels: {
      docs: 'requests',
      totalDocs: 'total',
      limit: 'limit',
      page: 'page',
      totalPages: 'pages',
      hasNextPage: 'hasNextPage',
      hasPrevPage: 'hasPrevPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage',
    },
  };

  return await AdoptionRequest.paginate(query, paginateOptions);
};

export const searchAdoptionRequestsPaginated = async (
  searchQuery,
  options = {}
) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

  // Build search query
  const query = {};

  if (searchQuery.status) {
    query.status = searchQuery.status;
  }

  if (searchQuery.shelter) {
    query.shelter = searchQuery.shelter;
  }

  if (searchQuery.user) {
    query.user = searchQuery.user;
  }

  if (searchQuery.pet) {
    query.pet = searchQuery.pet;
  }

  if (searchQuery.dateFrom || searchQuery.dateTo) {
    query.applicationDate = {};
    if (searchQuery.dateFrom) {
      query.applicationDate.$gte = new Date(searchQuery.dateFrom);
    }
    if (searchQuery.dateTo) {
      query.applicationDate.$lte = new Date(searchQuery.dateTo);
    }
  }

  const paginateOptions = {
    page,
    limit,
    sort,
    populate: [
      { path: 'user', select: 'name email phone firstName lastName avatar' },
      { path: 'pet', select: 'name photos type breed age gender description' },
      { path: 'shelter', select: 'name email phone' },
    ],
    customLabels: {
      docs: 'requests',
      totalDocs: 'total',
      limit: 'limit',
      page: 'page',
      totalPages: 'pages',
      hasNextPage: 'hasNextPage',
      hasPrevPage: 'hasPrevPage',
      nextPage: 'nextPage',
      prevPage: 'prevPage',
    },
  };

  return await AdoptionRequest.paginate(query, paginateOptions);
};
