const Response = async (res, success, status, message, data = null) => {
    return res.status(status).json({
        success: success,
        message: message,
        data: data
    })
}
export default Response;