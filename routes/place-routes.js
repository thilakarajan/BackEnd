const express = require('express')
const PlaceControllers = require('../controllers/places-controllers')
const { check } = require('express-validator')
const fileUpload = require('../middleware/file-upload')
const checkAuth = require('../middleware/check-auth')

const router = express.Router()

router.get('/user/:uid', PlaceControllers.getPlacesByUserId)

router.get('/', PlaceControllers.allPlaces)

router.get('/:pid', PlaceControllers.getPlaceByPlaceId)

router.use(checkAuth)

router.delete('/:pid', PlaceControllers.deletePlaceByPlaceId)

router.post(
  '/',
  fileUpload.single('image'),
  [
    check('title').notEmpty(),
    check('description').isLength({ min: 5 }),
    check('address').notEmpty(),
  ],
  PlaceControllers.createPlace
)

router.patch(
  '/:pid',
  [check('title').notEmpty(), check('description').isLength({ min: 5 })],
  PlaceControllers.updatePlaceByPlaceId
)

module.exports = router
