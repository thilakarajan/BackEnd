const jwt = require('jsonwebtoken')
const HttpError = require('../models/http-error')

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]
    if (!token) {
      throw new Error('Authentication Failed')
    }
    const decodedToken = jwt.verify(token, process.env.JWT)
    req.userData = { userId: decodedToken.userId }
    next()
  } catch (err) {
    return next(new HttpError('Authentication failed', 500))
  }
}
