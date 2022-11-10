const multer = require('multer');
const uuid = require('uuid/v4');

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};
const fileUpload = multer({
    limits: 500000,
    storage: multer.diskStorage({
        destination:(req, file, cb) =>{
            cb(null, 'uploads/images')
        },
        filename:(req, file, cb) =>{
            const ext = MIME_TYPE_MAP[file.mimetype];
            console.log('ext',ext);
            cb(null,uuid()+'.'+ext);
        }
    }),
    fileFilter: (req, file, cb)=>{
        const isValid= !!MIME_TYPE_MAP[file.mimetype];
        let error = isValid ? null : new Error('Invalid MIME Type');
        cb(error, isValid );
    }
});//its a middleware - its a group of middleware

module.exports = fileUpload;