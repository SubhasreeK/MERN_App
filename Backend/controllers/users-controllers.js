const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
const User = require('../models/user');


const getUsers = async(req,res,next) => {
    let users;
    try{
     users = await User.find({}, '-password');
    }catch(err){
        const errors = new HttpError("Fetching Users Failed",500);
        return next(errors);
    }
    res.json({users: users.map(user => user.toObject({getters:true}))});
}

const signUpUser = async (req,res,next) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return next( new HttpError('Invalid Inputs',422));
    }
    const {name, email , password } = req.body;

    let existingUser;
    try{
        existingUser = await User.findOne({email : email});
    }catch(err){
        const errors = new HttpError('Something went wrong , could not sign up', 500);
        return next(errors) 
    }
    if(existingUser){
        const errors = new HttpError('User Already exists, try Login Instead',422);
        return next(errors);
    }

    let hashedPassword;
    try{
    hashedPassword = await bcrypt.hash(password, 12);//12 salting rounds
    }catch(err){
        const error = new HttpError('Could not create user',500);
        return next(error);
    }
    const createdUser = new User({
        name,// which is equal to name:name if key and attribute are same we can use this syntax
        email,
        image: req.file.path,
        password: hashedPassword,
        places:[]
    });
    try{
        await createdUser.save();
    }catch(err){
        const errors = new HttpError('Something went wrong , User Sign up failed',500);
        return next(errors);
    }
    let token;
    try{
        token= jwt.sign(
            {userId: createdUser.id, email:createdUser.email},
            'SuperSecreteKey_dontShare',
            {expiresIn: '1h'}
            );//returns a string at the end and this string will be the token
    }catch(err){
        const error = new HttpError('Error in Token Creation',500);
        return next(error);
    }
    res.status(201).json({
        userId:createdUser.id, 
        email: createdUser.email, 
        token:token});
};

const signInUser = async(req,res,next) =>{
    
    const {email, password} = req.body;
    let existingUser;
    try{
        existingUser = await User.findOne({email : email});
    }catch(err){
        const errors = new HttpError('Something went wrong , could not sign in', 500);
        return next(errors) ;
    }

    if(!existingUser){
       return next (new HttpError('Invalid Credentials, unable to login ',401));
    }

    let isValidPassword = false;
    try{
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    }catch(err){
        const error = new HttpError(
            'Could not log you in , please check your credentials',
            500
        );
        return next(error);
    }
        if(!isValidPassword){
            const error = new HttpError(
               'Invalid Credentials, could not login you',
               401
               );
        }
        let token;
        try{
            token= jwt.sign(
                {userId: existingUser.id, email:existingUser.email},
                'SuperSecreteKey_dontShare',
                {expiresIn: '1h'}
                );//returns a string at the end and this string will be the token
        }catch(err){
            const error = new HttpError('Error in Token Creation',500);
            return next(error);
        }
    res.status(201).json({
        userId:existingUser.id,
        email:existingUser.email,
        token:token
    });
}


exports.getUsers = getUsers;
exports.signInUser = signInUser;
exports.signUpUser = signUpUser;