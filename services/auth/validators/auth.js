export const validateRegistration = (method) => {
    body('username').exists().isString().trim();
}