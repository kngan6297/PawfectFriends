import mongoose from 'mongoose';
import { catchAsync } from '../../middleware/async.js';
import {
  createAdoptionRequest as createAdoptionRequest_service,
  getAdoptionRequests as getAdoptionRequests_service,
  getAdoptionRequestById as getAdoptionRequestById_service,
  updateAdoptionRequest as updateAdoptionRequest_service,
  addNote as addNote_service,
  scheduleMeeting as scheduleMeeting_service,
  scheduleHandover as scheduleHandover_service,
  completeHandover as completeHandover_service,
  completeAdoption as completeAdoption_service,
  cancelFollowUp as cancelFollowUp_service,
  updateMeetingStatus as updateMeetingStatus_service,
  uploadDocument as uploadDocument_service,
  verifyDocument as verifyDocument_service,
  deleteDocument as deleteDocument_service,
  makeFinalDecision as makeFinalDecision_service,
  scheduleFollowUp as scheduleFollowUp_service,
  performPreliminaryEvaluation as performPreliminaryEvaluation_service,
  updateInterviewResults as updateInterviewResults_service,
  updateHomeVisitResults as updateHomeVisitResults_service,
  approveAdoptionRequest as approveAdoptionRequest_service,
  generateContract as generateContract_service,
  sendContract as sendContract_service,
  signContract as signContract_service,
  schedulePostAdoptionFollowUp as schedulePostAdoptionFollowUp_service,
  completeFollowUp as completeFollowUp_service,
  createInformationRequest as createInformationRequest_service,
  submitInformationResponse as submitInformationResponse_service,
  reviewInformationRequest as reviewInformationRequest_service,
  updateInformationRequest as updateInformationRequest_service,
  deleteInformationRequest as deleteInformationRequest_service,
  getInformationRequests as getInformationRequests_service,
  sendInformationRequestReminder as sendInformationRequestReminder_service,
  getAdoptionRequestsWithVirtuals as getAdoptionRequestsWithVirtuals_service,
  getOverdueAdoptionRequests as getOverdueAdoptionRequests_service,
  getAdoptionRequestsByUser as getAdoptionRequestsByUser_service,
  getAdoptionRequestsByShelter as getAdoptionRequestsByShelter_service,
  getAdoptionRequestsByStatus as getAdoptionRequestsByStatus_service,
  addTimelineEvent as addTimelineEvent_service,
  addNoteToRequest as addNoteToRequest_service,
  updateRequestStatus as updateRequestStatus_service,
  getAdoptionRequestsByStatusPaginated as getAdoptionRequestsByStatusPaginated_service,
  getAdoptionRequestsByShelterPaginated as getAdoptionRequestsByShelterPaginated_service,
  getAdoptionRequestsByUserPaginated as getAdoptionRequestsByUserPaginated_service,
  getOverdueAdoptionRequestsPaginated as getOverdueAdoptionRequestsPaginated_service,
  searchAdoptionRequestsPaginated as searchAdoptionRequestsPaginated_service,
} from './adoption.service.js';
import { AdoptionRequest } from './adoption.model.js';
import { ApiError } from '../../utils/errors.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
import { logAdoptionActivity } from '../../utils/activityLogger.js';

export const createAdoptionRequest = catchAsync(async (req, res) => {
  const { petId } = req.params;
  const applicationDetails = req.body;
  const adoptionRequest = await createAdoptionRequest_service(
    req.user._id,
    petId,
    applicationDetails
  );

  // Log activity
  await logAdoptionActivity(
    req.user,
    'adoption_request_created',
    adoptionRequest,
    req
  );

  res.status(201).json({
    status: 'success',
    data: adoptionRequest,
  });
});

export const getAdoptionRequests = catchAsync(async (req, res) => {
  const query = {};
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: { createdAt: -1 },
  };

  const result = await getAdoptionRequests_service(query, options);
  res.status(200).json({
    status: 'success',
    data: result.requests,
    pagination: result.pagination,
  });
});

export const getAdoptionRequestById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_ID',
      message: 'Invalid adoption request id',
    });
  }

  const request = await getAdoptionRequestById_service(id);
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const updateAdoptionRequest = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_ID',
      message: 'Invalid adoption request id',
    });
  }

  const request = await updateAdoptionRequest_service(
    id,
    req.user._id,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const addNote = catchAsync(async (req, res) => {
  console.log('📝 Backend received note request:', {
    body: req.body,
    contentType: req.get('Content-Type'),
    params: req.params,
    user: req.user._id,
  });

  const noteData = {
    content: req.body.content,
    isInternal: req.body.isInternal || false,
    isMilestone: req.body.isMilestone || false,
    timelineStatus: req.body.timelineStatus,
  };

  console.log('📝 Processed note data:', noteData);

  const request = await addNote_service(req.params.id, req.user._id, noteData);
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const addTimelineEvent = catchAsync(async (req, res) => {
  const request = await addTimelineEvent_service(
    req.params.id,
    req.body.status,
    req.body.note,
    req.user._id
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const scheduleMeeting = catchAsync(async (req, res) => {
  const request = await scheduleMeeting_service(req.params.id, {
    ...req.body,
    updatedBy: req.user._id,
  });

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const scheduleHandover = catchAsync(async (req, res) => {
  const request = await scheduleHandover_service(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const completeHandover = catchAsync(async (req, res) => {
  const request = await completeHandover_service(
    req.params.id,
    req.user._id,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const completeAdoption = catchAsync(async (req, res) => {
  const request = await completeAdoption_service(req.params.id, req.user._id);
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const cancelFollowUp = catchAsync(async (req, res) => {
  const request = await cancelFollowUp_service(
    req.params.id,
    req.user._id,
    req.params.followUpId,
    req.body.reason
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const getAdoptionRequestMeetings = catchAsync(async (req, res) => {
  const request = await AdoptionRequest.findById(req.params.id)
    .populate('meetings.participants', 'name email')
    .select('meetings');

  if (!request) {
    throw new ApiError.notFound('Adoption request not found');
  }

  res.status(200).json({
    status: 'success',
    data: {
      meetings: request.meetings || [],
    },
  });
});

export const updateMeetingStatus = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const { status, notes } = req.body;

  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: req.params.id,
      'meetings._id': meetingId,
    },
    {
      $set: {
        'meetings.$.status': status,
        'meetings.$.notes': notes,
        'meetings.$.completedDate':
          status === 'completed' ? new Date() : undefined,
      },
      $push: {
        timeline: {
          status: `${status}_meeting`,
          note: `Meeting ${status}: ${notes || ''}`,
          updatedBy: req.user._id,
        },
      },
    },
    { new: true }
  ).populate('user', '_id name email');

  if (!request) {
    throw new ApiError.notFound('Adoption request or meeting not found');
  }

  // Send notification to user about meeting status change
  try {
    const { default: notificationService } = await import(
      '../notification/notification.service.js'
    );

    // Create a custom notification for meeting status changes
    await notificationService.createNotification({
      recipient: request.user._id,
      sender: req.user._id,
      type: 'meeting_status_change',
      title: 'Meeting Update',
      message: `Your meeting has been ${status}. ${notes ? `Notes: ${notes}` : ''}`,
      data: {
        adoptionRequestId: req.params.id,
        meetingId: meetingId,
        status: status,
        actionUrl: `/adoption-tracker?requestId=${req.params.id}&tab=meetings`,
        actionText: 'View Details',
      },
      sendEmail: status === 'completed' || status === 'cancelled', // Send email for important status changes
    });
  } catch (error) {
    console.error('Failed to create meeting status notification:', error);
    // Don't fail the status update if notification fails
  }

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const rescheduleMeeting = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const { scheduledDate, location, reason } = req.body;

  // First, get the current meeting to check reschedule count and store previous date
  const currentRequest = await AdoptionRequest.findOne({
    _id: req.params.id,
    'meetings._id': meetingId,
  });

  if (!currentRequest) {
    throw new ApiError.notFound('Adoption request or meeting not found');
  }

  const currentMeeting = currentRequest.meetings.find(
    (meeting) => meeting._id.toString() === meetingId
  );

  if (!currentMeeting) {
    throw new ApiError.notFound('Meeting not found');
  }

  // Check if reschedule limit has been reached
  if (currentMeeting.rescheduleCount >= 3) {
    throw new ApiError.badRequest(
      'Maximum reschedule limit (3) has been reached for this meeting'
    );
  }

  // Prepare the update object
  const updateObj = {
    'meetings.$.scheduledDate': new Date(scheduledDate),
    'meetings.$.location': location,
    'meetings.$.status': 'scheduled',
    'meetings.$.previousDate': currentMeeting.scheduledDate,
    'meetings.$.rescheduleCount': currentMeeting.rescheduleCount + 1,
  };

  // Set originalDate if this is the first time
  if (!currentMeeting.originalDate) {
    updateObj['meetings.$.originalDate'] = currentMeeting.scheduledDate;
  }

  // Add to reschedule history
  const rescheduleHistoryEntry = {
    fromDate: currentMeeting.scheduledDate,
    toDate: new Date(scheduledDate),
    reason: reason || 'No reason provided',
    rescheduledBy: req.user._id,
    rescheduledAt: new Date(),
  };

  const request = await AdoptionRequest.findOneAndUpdate(
    {
      _id: req.params.id,
      'meetings._id': meetingId,
    },
    {
      $set: updateObj,
      $push: {
        'meetings.$.rescheduleHistory': rescheduleHistoryEntry,
        timeline: {
          status: 'meeting_rescheduled',
          note: `Meeting rescheduled to ${new Date(scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} (Reschedule #${currentMeeting.rescheduleCount + 1})`,
          updatedBy: req.user._id,
        },
      },
    },
    { new: true }
  ).populate('user', '_id name email');

  if (!request) {
    throw new ApiError.notFound('Adoption request or meeting not found');
  }

  // Send notification to user about meeting rescheduled
  try {
    const { default: notificationService } = await import(
      '../notification/notification.service.js'
    );
    await notificationService.createAdoptionStatusChangeNotification(
      req.params.id,
      'scheduled',
      request.user._id
    );
  } catch (error) {
    console.error('Failed to create meeting rescheduled notification:', error);
    // Don't fail the reschedule if notification fails
  }

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const getAllShelterMeetings = catchAsync(async (req, res) => {
  const { startDate, endDate, status } = req.query;
  const shelterId = req.user._id;

  console.log('🔍 Starting getAllShelterMeetings for shelterId:', shelterId);

  // Ensure shelterId is an ObjectId
  const mongoose = await import('mongoose');
  const objectIdShelterId = mongoose.Types.ObjectId.isValid(shelterId)
    ? new mongoose.Types.ObjectId(shelterId)
    : shelterId;

  const query = { shelter: objectIdShelterId };

  if (startDate && endDate) {
    query['meetings.scheduledDate'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (status) {
    query['meetings.status'] = status;
  }

  console.log('🔍 Query:', JSON.stringify(query, null, 2));

  const requests = await AdoptionRequest.find(query)
    .populate('user', 'name email')
    .populate('pet', 'name photos')
    .populate('meetings.participants', 'name email')
    .select('meetings user pet status');

  console.log('📊 Found requests:', requests.length);

  const allMeetings = requests.flatMap((request) => {
    if (!request.meetings || !Array.isArray(request.meetings)) {
      console.log('📊 No meetings for request:', request._id);
      return [];
    }

    return request.meetings
      .map((meeting) => {
        try {
          console.log(
            '>>> meeting:',
            meeting,
            'type:',
            typeof meeting,
            'constructor:',
            meeting?.constructor?.name
          );
          return {
            ...(typeof meeting.toObject === 'function'
              ? meeting.toObject()
              : meeting),
            requestData: {
              user: request.user,
              pet: request.pet,
              requestId: request._id,
            },
          };
        } catch (meetingError) {
          console.error('🔥 Error processing meeting:', meetingError);
          console.error('🔥 Meeting object:', meeting);
          return null;
        }
      })
      .filter((meeting) => meeting !== null);
  });

  console.log('📊 Total meetings found:', allMeetings.length);

  res.status(200).json({
    status: 'success',
    data: allMeetings,
  });
});

export const uploadDocument = catchAsync(async (req, res) => {
  const request = await uploadDocument_service(
    req.params.id,
    req.user._id,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError.badRequest('No file uploaded');
  }

  try {
    // Upload file to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'adoption-documents',
      resource_type: 'auto',
    });

    res.status(200).json({
      status: 'success',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
      },
    });
  } catch (error) {
    throw new ApiError.internal('Failed to upload file');
  }
});

export const verifyDocument = catchAsync(async (req, res) => {
  const { documentId } = req.params;
  const { status, reason } = req.body;

  const request = await verifyDocument_service(
    req.params.id,
    documentId,
    req.user._id,
    status,
    reason
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const deleteDocument = catchAsync(async (req, res) => {
  const { documentId } = req.params;

  const request = await deleteDocument_service(
    req.params.id,
    documentId,
    req.user._id
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const makeFinalDecision = catchAsync(async (req, res) => {
  const request = await makeFinalDecision_service(
    req.params.id,
    req.user._id,
    req.body
  );

  // Log activity based on decision
  const action =
    req.body.decision === 'approved'
      ? 'adoption_request_approved'
      : 'adoption_request_rejected';
  await logAdoptionActivity(req.user, action, request, req, {
    reason: req.body.reason,
    decision: req.body.decision,
  });

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const scheduleFollowUp = catchAsync(async (req, res) => {
  const request = await scheduleFollowUp_service(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const getShelterAdoptionRequests = catchAsync(async (req, res) => {
  const shelterId = req.user._id;
  const { status } = req.query;

  const query = { shelter: shelterId };
  if (status && status !== 'all') {
    query.status = status;
  }

  // console.log('🔍 Shelter adoption requests query:', {
  //   shelterId: shelterId.toString(),
  //   status,
  //   query,
  //   user: req.user,
  // });

  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: { createdAt: -1 },
  };

  const result = await getAdoptionRequests_service(query, options);

  // console.log('📊 Shelter adoption requests result:', {
  //   totalRequests: result.requests.length,
  //   pagination: result.pagination,
  //   firstRequest: result.requests[0]
  //     ? {
  //         id: result.requests[0]._id,
  //         shelter: result.requests[0].shelter,
  //         status: result.requests[0].status,
  //       }
  //     : null,
  // });

  res.status(200).json({
    status: 'success',
    data: result.requests,
    pagination: result.pagination,
  });
});

export const getUserAdoptionRequests = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { status } = req.query;

  const query = { user: userId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: { createdAt: -1 },
  };

  const result = await getAdoptionRequests_service(query, options);
  res.status(200).json({
    status: 'success',
    data: result.requests,
    pagination: result.pagination,
  });
});

// New workflow controller methods
export const performPreliminaryEvaluation = catchAsync(async (req, res) => {
  const request = await performPreliminaryEvaluation_service(
    req.params.id,
    req.user._id,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const updateInterviewResults = catchAsync(async (req, res) => {
  const request = await updateInterviewResults_service(
    req.params.id,
    req.user._id,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const updateHomeVisitResults = catchAsync(async (req, res) => {
  const request = await updateHomeVisitResults_service(
    req.params.id,
    req.user._id,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const approveAdoptionRequest = catchAsync(async (req, res) => {
  const request = await approveAdoptionRequest_service(
    req.params.id,
    req.user._id,
    req.body
  );

  // Log activity
  await logAdoptionActivity(
    req.user,
    'adoption_request_approved',
    request,
    req
  );

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const generateContract = catchAsync(async (req, res) => {
  console.log('📄 Generate Contract - Request received:', {
    body: req.body,
    requestId: req.params.id,
    user: req.user._id,
  });

  // Validate required fields
  const {
    language = 'en',
    customTerms = '',
    version = '1.0',
    generatePdf = true,
  } = req.body;

  const contractDetails = {
    language,
    customTerms,
    version,
    generatePdf,
    title: req.body.title,
    description: req.body.description,
    terms: req.body.terms, // Legacy support
  };

  console.log('📋 Generate Contract - Contract details prepared:', {
    language: contractDetails.language,
    version: contractDetails.version,
    hasCustomTerms: !!contractDetails.customTerms,
    generatePdf: contractDetails.generatePdf,
  });

  const request = await generateContract_service(
    req.params.id,
    req.user._id,
    contractDetails
  );

  console.log('✅ Generate Contract - Service completed:', {
    requestId: req.params.id,
    hasContractDetails: !!request.contractDetails,
    isGenerated: request.contractDetails?.generated,
    contractId: request.contractDetails?.contractId,
    hasPdf: !!request.contractDetails?.file,
  });

  res.status(200).json({
    status: 'success',
    data: request,
    message: 'Contract generated successfully',
  });
});

export const sendContract = catchAsync(async (req, res) => {
  const request = await sendContract_service(req.params.id, req.user._id);
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const signContract = catchAsync(async (req, res) => {
  const request = await signContract_service(
    req.params.id,
    req.user._id,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const getContractFile = catchAsync(async (req, res) => {
  const request = await getAdoptionRequestById_service(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Adoption request not found');
  }

  // Permission check: user must be the requester, shelter staff, or admin
  const userId = req.user._id.toString();

  // Handle both populated and non-populated user/shelter fields
  const requestUserId = request.user._id
    ? request.user._id.toString()
    : request.user.toString();
  const requestShelterId = request.shelter._id
    ? request.shelter._id.toString()
    : request.shelter.toString();

  const isRequester = requestUserId === userId;
  const isShelterStaff = requestShelterId === userId;
  const isAdmin = req.user.role === 'admin';

  console.log('🔍 Contract File Permission Check:', {
    userId,
    requestUserId,
    requestShelterId,
    userRole: req.user.role,
    isRequester,
    isShelterStaff,
    isAdmin,
    requestId: req.params.id,
  });

  if (!isRequester && !isShelterStaff && !isAdmin) {
    throw new ApiError(403, 'Unauthorized to access contract file');
  }

  // Check if contract exists
  if (!request.contractDetails) {
    console.log('❌ Contract File - No contractDetails found');
    throw new ApiError(404, 'Contract not found');
  }

  console.log('📋 Contract File - Contract details found:', {
    hasFile: !!request.contractDetails.file,
    fileKeys: request.contractDetails.file
      ? Object.keys(request.contractDetails.file)
      : 'no file',
    contractStatus: request.contractDetails.status,
  });

  // Check if contract has a file
  if (!request.contractDetails.file) {
    console.log('❌ Contract File - No file in contractDetails');
    throw new ApiError(
      404,
      'Contract file not found - this contract has no uploaded file'
    );
  }

  const contractFile = request.contractDetails.file;

  // If file has a URL (stored in cloud storage), redirect to it
  if (contractFile.url) {
    // Set proper headers for the redirect
    res.set({
      'Content-Type': contractFile.mimetype || 'application/pdf',
      'Content-Disposition': `inline; filename="${contractFile.originalName || 'contract.pdf'}"`,
    });
    return res.redirect(contractFile.url);
  }

  // If file is stored as buffer (local storage), send it directly
  if (contractFile.buffer) {
    res.set({
      'Content-Type': contractFile.mimetype || 'application/pdf',
      'Content-Disposition': `attachment; filename="${contractFile.originalName || 'contract.pdf'}"`,
      'Content-Length': contractFile.size || contractFile.buffer.length,
    });
    return res.send(contractFile.buffer);
  }

  // If neither URL nor buffer exists, it's a real error
  throw new ApiError(404, 'Contract file data not available');
});

export const schedulePostAdoptionFollowUp = catchAsync(async (req, res) => {
  const request = await schedulePostAdoptionFollowUp_service(
    req.params.id,
    req.user._id,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const completeFollowUp = catchAsync(async (req, res) => {
  const { followUpId } = req.params;
  const request = await completeFollowUp_service(
    req.params.id,
    req.user._id,
    followUpId,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const createInformationRequest = catchAsync(async (req, res) => {
  const request = await createInformationRequest_service(
    req.params.id,
    req.user._id,
    req.body
  );

  // Log activity
  await logAdoptionActivity(
    req.user,
    'information_request_created',
    request,
    req,
    {
      requestId: request._id,
      type: request.type,
    }
  );

  res.status(201).json({
    status: 'success',
    data: request,
  });
});

export const submitInformationResponse = catchAsync(async (req, res) => {
  const { informationRequestId, ...responseData } = req.body;

  const request = await submitInformationResponse_service(
    req.params.id,
    req.user._id,
    informationRequestId,
    responseData
  );

  // Log activity
  await logAdoptionActivity(
    req.user,
    'information_response_submitted',
    request,
    req,
    {
      requestId: informationRequestId,
      responseData: responseData,
    }
  );

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const reviewInformationRequest = catchAsync(async (req, res) => {
  const { informationRequestId, ...reviewData } = req.body;

  const request = await reviewInformationRequest_service(
    req.params.id,
    req.user._id,
    informationRequestId,
    reviewData
  );

  // Log activity
  await logAdoptionActivity(
    req.user,
    'information_request_reviewed',
    request,
    req,
    {
      requestId: informationRequestId,
      reviewDecision: reviewData.decision,
    }
  );

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const updateInformationRequest = catchAsync(async (req, res) => {
  const { informationRequestId, ...updateData } = req.body;

  const request = await updateInformationRequest_service(
    req.params.id,
    req.user._id,
    informationRequestId,
    updateData
  );

  // Log activity
  await logAdoptionActivity(
    req.user,
    'information_request_updated',
    request,
    req,
    {
      requestId: informationRequestId,
      changes: Object.keys(updateData),
    }
  );

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const deleteInformationRequest = catchAsync(async (req, res) => {
  const { informationRequestId } = req.params;

  const request = await deleteInformationRequest_service(
    req.params.id,
    req.user._id,
    informationRequestId
  );

  // Log activity
  await logAdoptionActivity(
    req.user,
    'information_request_deleted',
    request,
    req,
    {
      requestId: informationRequestId,
    }
  );

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const getInformationRequests = catchAsync(async (req, res) => {
  const requests = await getInformationRequests_service(
    req.params.id,
    req.user._id,
    req.user.role
  );

  res.status(200).json({
    status: 'success',
    data: requests,
  });
});

export const sendInformationRequestReminder = catchAsync(async (req, res) => {
  const { informationRequestId, reminderMethod = 'email' } = req.body;

  const request = await sendInformationRequestReminder_service(
    req.params.id,
    req.user._id,
    informationRequestId,
    reminderMethod
  );

  // Log activity
  await logAdoptionActivity(
    req.user,
    'information_request_reminder_sent',
    request,
    req,
    {
      informationRequestId,
      reminderMethod,
    }
  );

  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const getAdoptionRequestsWithVirtuals = catchAsync(async (req, res) => {
  const query = {};
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: { createdAt: -1 },
  };

  const result = await getAdoptionRequestsWithVirtuals_service(query, options);
  res.status(200).json({
    status: 'success',
    data: result.requests,
    pagination: result.pagination,
  });
});

export const getOverdueAdoptionRequests = catchAsync(async (req, res) => {
  const requests = await getOverdueAdoptionRequests_service();
  res.status(200).json({
    status: 'success',
    data: requests,
  });
});

export const getAdoptionRequestsByUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const requests = await getAdoptionRequestsByUser_service(userId);
  res.status(200).json({
    status: 'success',
    data: requests,
  });
});

export const getAdoptionRequestsByShelter = catchAsync(async (req, res) => {
  const { shelterId } = req.params;
  const requests = await getAdoptionRequestsByShelter_service(shelterId);
  res.status(200).json({
    status: 'success',
    data: requests,
  });
});

export const getAdoptionRequestsByStatus = catchAsync(async (req, res) => {
  const { status } = req.params;
  const requests = await getAdoptionRequestsByStatus_service(status);
  res.status(200).json({
    status: 'success',
    data: requests,
  });
});

export const addNoteToRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content, isInternal } = req.body;

  const request = await addNoteToRequest_service(
    id,
    content,
    req.user._id,
    isInternal
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const updateRequestStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const request = await updateRequestStatus_service(
    id,
    status,
    note,
    req.user._id
  );
  res.status(200).json({
    status: 'success',
    data: request,
  });
});

export const getAdoptionRequestsByStatusPaginated = catchAsync(
  async (req, res) => {
    const { status } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 },
    };

    const result = await getAdoptionRequestsByStatusPaginated_service(
      status,
      options
    );
    res.status(200).json({
      status: 'success',
      data: result.requests,
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
    });
  }
);

export const getAdoptionRequestsByShelterPaginated = catchAsync(
  async (req, res) => {
    const { shelterId } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 },
    };

    const result = await getAdoptionRequestsByShelterPaginated_service(
      shelterId,
      options
    );
    res.status(200).json({
      status: 'success',
      data: result.requests,
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
    });
  }
);

export const getAdoptionRequestsByUserPaginated = catchAsync(
  async (req, res) => {
    const { userId } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 },
    };

    const result = await getAdoptionRequestsByUserPaginated_service(
      userId,
      options
    );
    res.status(200).json({
      status: 'success',
      data: result.requests,
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
    });
  }
);

export const getOverdueAdoptionRequestsPaginated = catchAsync(
  async (req, res) => {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: req.query.sort
        ? JSON.parse(req.query.sort)
        : { applicationDate: 1 },
    };

    const result = await getOverdueAdoptionRequestsPaginated_service(options);
    res.status(200).json({
      status: 'success',
      data: result.requests,
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
    });
  }
);

export const searchAdoptionRequestsPaginated = catchAsync(async (req, res) => {
  const searchQuery = req.query;
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 },
  };

  const result = await searchAdoptionRequestsPaginated_service(
    searchQuery,
    options
  );
  res.status(200).json({
    status: 'success',
    data: result.requests,
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
  });
});

// User-specific functions for accessing their own adoption request data
export const getUserAdoptionRequestDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Validate ObjectId format
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_ID',
      message: 'Invalid adoption request id',
    });
  }

  // Get adoption request and verify user owns it
  const adoptionRequest = await AdoptionRequest.findOne({
    _id: id,
    user: userId,
  })
    .populate('pet', 'name breed age gender images')
    .populate('shelter', 'name address phone email')
    .populate('user', 'name email phone');

  if (!adoptionRequest) {
    throw new ApiError.notFound('Adoption request not found or access denied');
  }

  res.status(200).json({
    status: 'success',
    data: adoptionRequest,
  });
});

export const getUserAdoptionRequestMeetings = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Get adoption request and verify user owns it
  const adoptionRequest = await AdoptionRequest.findOne({
    _id: id,
    user: userId,
  });

  if (!adoptionRequest) {
    throw new ApiError.notFound('Adoption request not found or access denied');
  }

  // Return the embedded meetings from the adoption request
  res.status(200).json({
    status: 'success',
    data: adoptionRequest.meetings || [],
  });
});

export const getUserInformationRequests = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Get adoption request and verify user owns it
  const adoptionRequest = await AdoptionRequest.findOne({
    _id: id,
    user: userId,
  });

  if (!adoptionRequest) {
    throw new ApiError.notFound('Adoption request not found or access denied');
  }

  // Return the embedded information requests from the adoption request
  res.status(200).json({
    status: 'success',
    data: adoptionRequest.informationRequests || [],
  });
});
