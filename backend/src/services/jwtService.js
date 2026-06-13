'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
};

module.exports = { signToken, signRefreshToken, verifyToken };
