import jwt from 'jsonwebtoken';
import { UnauthenticatedError } from '../errors/index.js';
// This middleware will be for all coordinator request
const authenticationMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthenticatedError("No Token provided");
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const { userId, department, email, isAdmin } = payload; // destructuring payload data
        req.user = { userId, email, department, isAdmin }; // passing to req.user as this middleware will pass control to controller function
    }
    catch (err) {
        throw new UnauthenticatedError("Not allowed to access this route");
    }
    next();
};
export default authenticationMiddleware;
