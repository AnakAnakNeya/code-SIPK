import { AppError } from '../utils/AppError.js';

/** validate(schema, 'body' | 'query' | 'params') -> hasil parse Zod menggantikan req[source]. */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (result.success) {
      req[source] = result.data;
      return next();
    }
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return next(AppError.validation('Data yang dikirim belum valid. Periksa kolom yang ditandai.', fields));
  };
}
