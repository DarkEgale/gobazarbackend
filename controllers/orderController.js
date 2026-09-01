import { createOrder, getMyOrders, getAllOrders, getOrderById } from '../modules/serviceModule.js';
import { Response } from '../modules/module.js';


const createOrderController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { products, paymentMethod, address } = req.body;
        console.log('[Product]', products)
        const order = await createOrder(userId, products, paymentMethod, address)
        console.log(order)
        return Response(res, true, 201, 'Order Successful', order)
    } catch (error) {
        console.log('[Create Order]', error)
        Response(res, false, 400, error.message)
    }
}


// Get logged-in user's orders
const getOrdersController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orders = await getMyOrders(userId);
        return Response(res, true, 200, 'Orders Found', orders);
    } catch (error) {
        console.log('[Get Orders]', error);
        return Response(res, false, 500, error.message || 'Failed to fetch orders');
    }
}

// Get all orders (Admin only)
const getAllOrdersController = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 50;
        const result = await getAllOrders(page, limit);
        return Response(res, true, 200, 'Orders fetched successfully', result);
    } catch (error) {
        console.log('[Get All Orders]', error);
        return Response(res, false, 500, error.message || 'Failed to fetch orders');
    }
}

// Get a single order of the logged-in user by id
const getOrderByIdController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const order = await getOrderById(userId, id);
        return Response(res, true, 200, 'Order found', order);
    } catch (error) {
        console.log('[Get Order By Id]', error);
        const statusCode = error.message === 'Order not found' ? 404 : 500;
        return Response(res, false, statusCode, error.message || 'Failed to fetch order');
    }
}

export { createOrderController, getOrdersController, getAllOrdersController, getOrderByIdController }
