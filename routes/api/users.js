const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function generateToken(user, secretKey) {
    // first arg of sign is payload object,
    // info that we want to encrypt into json web token (jwt)
    let token = jwt.sign({
        'username': user.username,
        'id': user.id,
        'email': user.email
    }, secretKey, {
        'expiresIn': '1h' // 1h = 1 hour
                          // 1d = 1 day
                          // 1w = 1 week
                          // 1m = 1 month
    });

    return token;
}

function getHashedPassword(password) {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

const { User } = require('../../models');

router.post('/login', async function(req, res) {
    // extract email from request body
    let email = req.body.email;
    let password = req.body.password;
    let user = await User.where({
        'email': email
    }).fetch({
        'require': false
    })

    // check correct user and send back access token
    if (user && user.get('password') == getHashedPassword(password)) {
        let accessToken = generateToken(user.toJSON(), process.env.TOKEN_SECRET);
        res.send({
            'accessToken': accessToken
        });
    } else {
        res.status(401);
        res.send({
            "error":"Wrong email or password"
        });
    }
})

module.exports = router;