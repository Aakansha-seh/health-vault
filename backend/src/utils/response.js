'use strict';

/** Uniform JSON response helpers used in every controller. */

const ok = (res, data = {}, status = 200) =>
  res.status(status).json({ success: true, data });

const created = (res, data) => ok(res, data, 201);

const fail = (res, message, status = 400, errors = null) =>
  res.status(status).json({ success: false, message, ...(errors && { errors }) });

const unauthorised = (res, message = 'Unauthorised') => fail(res, message, 401);

const forbidden  = (res, message = 'Forbidden')     => fail(res, message, 403);

const notFound   = (res, message = 'Not found')     => fail(res, message, 404);

const serverError = (res, message = 'Internal server error') => fail(res, message, 500);

module.exports = { ok, created, fail, unauthorised, forbidden, notFound, serverError };
