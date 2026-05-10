const HttpError = require('../models/http-error')
const fs = require('fs')
const { validationResult } = require('express-validator')
const getCoordinationsByAddress = require('../util/location')
const Place = require('../models/place')
const User = require('../models/user')
const { default: mongoose } = require('mongoose')

const getPlacesByUserId = async (req, res, next) => {
  const creator = req.params.uid

  let user
  try {
    user = await User.findById(creator).populate('places')
  } catch (err) {
    return next(
      new HttpError('Something went wrong, could not find places', 500)
    )
  }

  // if (user.places.length === 0) {
  //   return next(
  //     new HttpError('Could not find any place with provided user id.', 404)
  //   )
  // }

  res
    .status(200)
    .json({ places: user.places.map((p) => p.toObject({ getters: true })) })
}

const getPlaceByPlaceId = async (req, res, next) => {
  const placeId = req.params.pid
  console.log(`GET REQUEST from /${placeId}`)

  let place
  try {
    place = await Place.findById(placeId)
  } catch (err) {
    return next(
      new HttpError('Something went wrong, could not find the place', 500)
    )
  }

  if (!place) {
    return next(
      new HttpError('Could not find any place with provided place id.', 404)
    )
  }
  res.status(200).json({ place: place.toObject({ getters: true }) })
}

const createPlace = async (req, res, next) => {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    console.log(result)
    return next(
      new HttpError('Invalid inputs passed, please check your data', 422)
    )
  }
  const { title, description, address } = req.body

  let user
  try {
    user = await User.findById(req.userData.userId)
  } catch (err) {
    return next(new HttpError('Something went wrong, please try again', 500))
  }

  if (!user) {
    return next(new HttpError('Could not find user', 404))
  }

  let coordination = await getCoordinationsByAddress(address)
  const createdPlace = new Place({
    title,
    description,
    image: req.file.path,
    address,
    location: coordination,
    creator: req.userData.userId,
  })

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    await createdPlace.save({ session: sess })
    user.places.push(createdPlace)
    await user.save({ session: sess })
    await sess.commitTransaction()
  } catch (err) {
    return next(new HttpError('Creating place failed, please try again', 500))
  }

  console.log('success')
  res.status(201).json({ place: createdPlace.toObject({ getters: true }) })
}

const deletePlaceByPlaceId = async (req, res, next) => {
  const placeId = req.params.pid

  if (!mongoose.Types.ObjectId.isValid(placeId)) {
    return next(new HttpError('invalid place id', 404))
  }

  let place
  try {
    place = await Place.findById(placeId).populate('creator')
  } catch (err) {
    return next(new HttpError('Something went wrong, please try again', 500))
  }

  if (!place) {
    return next(new HttpError('Could not find any place', 404))
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError('You are not allowed to delete this.', 401))
  }

  const imagePath = place.image

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    await place.deleteOne({ session: sess })
    place.creator.places.pull(place)
    await place.creator.save({ session: sess })
    await sess.commitTransaction()
  } catch (err) {
    return next(new HttpError('Something went wrong, please try again', 500))
  }

  fs.unlink(imagePath, (err) => console.log(err))

  res.status(201).json({ message: 'Deleted Successfully' })
}

const updatePlaceByPlaceId = async (req, res, next) => {
  const error = validationResult(req)
  if (!error.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data', 422)
    )
  }
  const placeId = req.params.pid
  const { title, description } = req.body

  let place
  try {
    place = await Place.findById(placeId)
  } catch (err) {
    return next(new HttpError('Something went wrong, Please try again 1', 500))
  }

  if(place.creator.toString() !== req.userData.userId){
    return next(new HttpError('You are not allowed to alter this.',401))
  }

  place.title = title
  place.description = description

  try {
    await place.save()
  } catch (err) {
    return next(new HttpError('Something went wrong, Please try again 2', 500))
  }

  res.status(200).json({ place: place.toObject({ getters: true }) })
}

const allPlaces = async (req, res, next) => {
  let places = []

  try {
    places = await Place.find()
  } catch (err) {
    return next(new HttpError('Something went wrong, please try again', 500))
  }
  res
    .status(200)
    .json({ places: places.map((p) => p.toObject({ getters: true })) })
}

exports.getPlaceByPlaceId = getPlaceByPlaceId
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace
exports.deletePlaceByPlaceId = deletePlaceByPlaceId
exports.updatePlaceByPlaceId = updatePlaceByPlaceId
exports.allPlaces = allPlaces
