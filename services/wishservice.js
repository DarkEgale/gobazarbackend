import WishList from "../models/wisthLisht.model.js";

const CreateWish = async (userId, productId) => {
    try {
        const exist = await WishList.findOne({
            userId,
            productId
        });

        // Already exists → remove
        if (exist) {
            const remove = await WishList.findByIdAndDelete(exist._id);

            return {
                action: "removed",
                data: remove
            };
        }

        // Doesn't exist → create
        const wish = await WishList.create({
            userId,
            productId
        });

        if (!wish) {
            throw new Error("Failed to set wish");
        }

        return {
            action: "added",
            data: wish
        };

    } catch (error) {
        throw error;
    }
};


const getMyWish = async (userId) => {
    try {
        // productId is stored without a ref → populate with explicit model
        const wish = await WishList.find({ userId })
            .populate({
                path: 'productId',
                model: 'Products',
                select: 'title thumbnil price discount'
            })
            .sort({ createdAt: -1 });
        return wish;
    } catch (error) {
        throw error;
    }
}


export { CreateWish, getMyWish }