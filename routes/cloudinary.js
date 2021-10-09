const express = require('express');
const cloudinary = require('cloudinary');

const router = express.Router();

router.get('/sign', function(req, res) {
    // retrieve the params of the upload that we are signing
    // e.g. file size, image name, timestamp
    // cloudinary will give a signature base that is for limited duration and one-use

    const params_to_sign = JSON.parse(req.query.params_to_sign);
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // get the signiture
    const signature = cloudinary.utils.api_sign_request(params_to_sign, apiSecret);

    res.send(signature);
})

module.exports = router;