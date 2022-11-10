const fs= require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');
const app = express();

app.use(bodyParser.json());// for getting parse body in case of handling POST request

app.use('/uploads/images', express.static(path.join('uploads','images')));
app.use((req,res,next) =>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type,Accept,Authorization');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE');
    next();
})
app.use('/api/places',placesRoutes);

app.use('/api/users',usersRoutes);
//write a middleware - which only reached if we have some request which didn't get response
app.use((req,res,next) =>{
    const error = new HttpError('could not find this route',404);
    throw error;
})  
//special middleware function - this middle ware executes if any middleware in front of it yields an error
app.use((error,req,res,next) =>{
    if(req.file){
        fs.unlink(req.file.path, (err)=>{
            console.log(err);
        });
    }
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || 'Unknown error occured!'})
});

mongoose
    .connect('mongodb://localhost:27017/places')
    .then(() => {
        console.log("Database connection Successful")
        app.listen(5000);
    })
    .catch(err => {
        console.log(err);
    });


