const fs = require('fs');
const uuid = require('uuid/v4');

const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const Place = require('../models/place');//constructor function Place should start with caps
const User = require('../models/user');
const mongoose = require('mongoose');


const getPlaceById = async (req,res,next) =>{
    const placeId = req.params.pid; //{pid:p1} getting from url
    let place;
    try{
     place = await Place.findById(placeId);
    }catch(err){
        const error = new HttpError('Something went worng',500);
        return next(error);
    }
    if(!place){
    const error =  new HttpError('could not find a place for the given place Id',404); // Since it is sync function we can use throw for async func we have to use return next(error)
    return next(error);
    }
    res.json({place: place.toObject( {getters:true})});//by adding getter  we can add id property from the request url to created object
};
//Alternate options are
// function getPlaceById(){...logic}
// const getPlaceById = function(){...logic}

const getPlacesByUserId = async (req,res,next) => {
    const userId = req.params.uid;
    let places;
    try{
       places = await Place.find({creator : userId});
    }catch(err){
        const errors = new HttpError('Could not find record with the user id',500);
        return next(errors);
    }
    if(!places || places.length === 0 ){
        return next(new HttpError('could not find places for the given user Id',404)); 
        }
    res.json({places: places.map(place => place.toObject({ getters: true}))});
};

const createPlace =async (req,res,next) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        throw new HttpError('Invalid Inputs passed',422);
    }
    const { title, description , coordinates , address , creator} = req.body;
    const createdPlace = new Place({
            title,
            description,
            location: coordinates,
            address,
            image:req.file.path,
            creator
    });
    //leave it object literal for a moment
    //DUMMY_PLACES.push(createdPlace);

    let user;
    try{
        user = await User.findById(creator);
    }catch(err){
        const errors = new HttpError('Creating place failed, Please try again',500);
        return next(errors);
    }
    //if(!user){
     //   const error = new HttpError('Could not find user for provided ID',404);
     //   return next(error);
   // }
    console.log(user);
    try{
        await createdPlace.save();
        //transactions allows you to perform multiple operations in isolation. It is build on so called session
        //const sess = await mongoose.startSession();
        //sess.startTransaction();
        //await createdPlace.save({session:sess});
        //user.places.push(createdPlace);
       // await user.save({session:sess});
       // await sess.commitTransaction();
    }catch(err){
        console.log(err);
        const error = new HttpError('Creating place failed, please try again later', 500);
        return next(error)
    }
    
    res.status(201).json({place: createdPlace});
};

const updatePlace = async (req,res,next) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors);
        return next(new HttpError('Invalid Inputs , please enter valid inputs',422));
    }
    const { title, description, address} = req.body;
    const placeId = req.params.pid;

    let place;
    try{
        place = await Place.findById(placeId);
    }catch(err){
        const errors = new HttpError('Could not identify the place with placeId',500);
        return next(errors);
    }
    place.title = title;
    place.description = description;

    try{
        await place.save();
    }catch(err){
        const errors = new HttpError("Something went wrong could not update the place",500);
        return next(errors);
    }
    res.status(200).json({place: place.toObject({getters:true})});
};
const deletePlace = async(req,res,next) => {
    const placeId = req.params.pid;
    let place;
    try{
        place = await Place.findById(placeId);
    }catch(err){
        const errors = new HttpError('Something went wrong , Could not find the place with ID',500);
        return next(errors);
    }
    if(!place){
        const error = new HttpError("Could not find the place for given ID",404);
        return next(error);
    }
    const imagePath = place.image;
    try{
        await place.remove();
    }catch(err){
        const errors = new HttpError('Something went wrong unable to delete record',500);
        return next(errors);
    }
    fs.unlink(imagePath, err =>{
        console.log(err);
    });
    res.status(200).json({message:'place deleted'});
};
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace= createPlace;
exports.updatePlace= updatePlace;
exports.deletePlace= deletePlace;