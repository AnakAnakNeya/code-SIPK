export function ok(res, data = null, message = 'Berhasil', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

export function sendSuccess(res, status = 200, message = 'Berhasil', data = null) {
  return res.status(status).json({ success: true, data, message });
}

export function created(res, data = null, message = 'Berhasil dibuat') {
  return ok(res, data, message, 201);
}

export function paginated(res, items, { page, limit, total }, message = 'Berhasil') {
  return ok(
    res,
    { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } },
    message,
  );
}

// Parsing ?page=&limit= dengan batas maksimum 50.
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
