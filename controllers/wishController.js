
import { CreateWish, getMyWish } from '../modules/serviceModule.js';
import { Response } from '../modules/module.js'
const createWish = async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log('[Test - 1] user Id check:', userId);

        const { productId } = req.body;

        console.log('[Test - 2] Product ID Check:', productId);

        const wish = await CreateWish(userId, productId);

        // Product removed
        if (wish.action === 'removed') {
            return res.status(200).json({
                success: true,
                action: 'removed',
                message: 'Product removed from wishlist',
                data: wish.data
            });
        }

        // Product added
        return res.status(201).json({
            success: true,
            action: 'added',
            message: 'Product added to wishlist',
            data: wish.data
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update wishlist'
        });
    }
};

const getWishList = async (req, res) => {
    try {
        const userId = req.user.userId;
        const wishList = await getMyWish(userId)
        if (!wishList) {
            Response(res, false, 404, 'No wish found')
        }
        Response(res, true, 200, 'Wish Found', wishList)
    } catch (error) {
        console.log('[Get WishLisy]:', error)
        Response(res, false, 500, 'Internal server Error')
    }
}

export { createWish, getWishList };

