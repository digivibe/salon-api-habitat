const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/exposants_profile_pic/')
    },
    filename: function (req, file, cb) {
        const newFilename = `${Date.now()}-${file.originalname}`
        cb(null, newFilename)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new Error('Not an image! Only image files are allowed.'), false)
    }
}

const upload = multer({ storage: storage, fileFilter: fileFilter })

exports.uploadProfilePic = upload.single('profilePic')