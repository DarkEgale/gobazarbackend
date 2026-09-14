import { createReturnRequest, getMyReturns, getAllReturns, updateReturnStatus, ALLOWED_RETURN_STATUSES } from '../modules/serviceModule.js';
import { Response } from '../modules/module.js';

// Customer creates a return request (only after delivery, within 7 days)
const createReturnRequestController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { orderId, phone, products } = req.body;

        const returnRequest = await createReturnRequest(userId, orderId, phone, products);
        return Response(res, true, 201, 'Return request created successfully', returnRequest);
    } catch (error) {
        console.log('[Create Return]', error);
        return Response(res, false, 400, error.message || 'Failed to create return request');
    }
}

// Customer: my return requests
const getMyReturnsController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const returns = await getMyReturns(userId);
        return Response(res, true, 200, 'Returns found', returns);
    } catch (error) {
        console.log('[Get My Returns]', error);
        return Response(res, false, 500, error.message || 'Failed to fetch returns');
    }
}

// Admin: all return requests (Return Collection)
const getAllReturnsController = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 50;
        const result = await getAllReturns(page, limit);
        return Response(res, true, 200, 'Returns fetched successfully', result);
    } catch (error) {
        console.log('[Get All Returns]', error);
        return Response(res, false, 500, error.message || 'Failed to fetch returns');
    }
}

// Admin: update return status (pending / on_the_way / returned)
const updateReturnStatusController = async (req, res) => {
    try {
        const { returnId, status } = req.body;

        if (!returnId) {
            return Response(res, false, 400, 'returnId is required');
        }

        if (!status || !ALLOWED_RETURN_STATUSES.includes(status)) {
            return Response(res, false, 400, `Invalid return status. Allowed: ${ALLOWED_RETURN_STATUSES.join(', ')}`);
        }

        const updatedReturn = await updateReturnStatus(returnId, status);
        return Response(res, true, 200, 'Return status updated successfully', updatedReturn);
    } catch (error) {
        console.log('[Update Return Status]', error);
        const statusCode = error.message === 'Return request not found' ? 404 : 400;
        return Response(res, false, statusCode, error.message || 'Failed to update return status');
    }
}

export { createReturnRequestController, getMyReturnsController, getAllReturnsController, updateReturnStatusController };