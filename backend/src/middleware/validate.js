import { ApiError } from '../utils/http.js';

/** Validates req.body (or req.query) with a zod schema and replaces it with the cleaned data. */
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((i) =>
        i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message
      );
      return next(new ApiError(400, 'Validation failed', errors));
    }
    req[source] = result.data;
    next();
  };
