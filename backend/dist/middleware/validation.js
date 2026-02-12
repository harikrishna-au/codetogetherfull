import { validationResult } from 'express-validator';
import { ValidationError } from '@/utils/errors.js';
export const validateRequest = (req, _res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? error.value : undefined,
        }));
        throw new ValidationError(`Validation failed: ${errorMessages.map(e => e.message).join(', ')}`);
    }
    next();
};
//# sourceMappingURL=validation.js.map