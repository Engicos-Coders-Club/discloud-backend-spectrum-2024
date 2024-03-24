// Inside your CustomAPIError file (e.g., src/errors/custom-api-error.ts)
export class CustomAPIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, CustomAPIError.prototype);
    }
}
export default CustomAPIError;
