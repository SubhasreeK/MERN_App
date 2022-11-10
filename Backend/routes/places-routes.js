const express = require("express");
const { check } = require("express-validator");

const placesControllers = require('../controllers/places-controllers');
const fileupload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');
const router = express.Router();

router.get('/:pid', placesControllers.getPlaceById);
router.get('/user/:uid', placesControllers.getPlacesByUserId);
//creating a middleware here- we can't allow request without token to process next to this middleware
router.use(checkAuth);

router.post('/',
    fileupload.single('image'),
    [
    check('title').not().isEmpty(),
    check('description').isLength({min : 5}),
    check('address').not().isEmpty()
    ],
    placesControllers.createPlace);
router.patch('/:pid',[
    check('title').not().isEmpty(),
    check('description').isLength({min:5}),
    check('address').not().isEmpty()
],placesControllers.updatePlace);
router.delete('/:pid',placesControllers.deletePlace);

module.exports = router;