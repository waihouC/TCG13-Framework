const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cors = require('cors');

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

const { User, BlacklistedToken } = require('../../models');
const { checkIfAuthenticatedJWT } = require('../../middlewares');

router.post('/login', async function(req, res) {
    // extract email from request body
    // email key is sent via POST
    let email = req.body.email;
    let password = req.body.password;
    let user = await User.where({
        'email': email
    }).fetch({
        'require': false
    })

    // check correct user and send back access token
    if (user && user.get('password') == getHashedPassword(password)) {
        let accessToken = generateToken(user.toJSON(), process.env.TOKEN_SECRET, '15m');
        let refreshToken = generateToken(user.toJSON(), process.env.REFRESH_TOKEN_SECRET, '3w');
        res.send({
            'accessToken': accessToken,
            'refreshToken': refreshToken
        });
    } else {
        res.status(401);
        res.send({
            "error":"Wrong email or password"
        });
    }
})

router.post('/refresh', async function(req, res) {
    let refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.sendStatus(401);
    }

    let blacklistedToken = await BlacklistedToken.where({
        'token': refreshToken
    }).fetch({
        // must false, may not find any
        'require': false
    })

    // if the refresh token is already blacklisted
    if (blacklistedToken) {
        res.status(401);
        res.send("The refresh token has already expired");
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, function(err, payload) {
        if (err) {
            return res.sendStatus(403);
        }

        let accessToken = generateToken(payload, process.env.TOKEN_SECRET, '15m');
        res.send({
            'accessToken': accessToken
        })
    })
})

router.get('/profile', [checkIfAuthenticatedJWT, cors()], async function(req, res) {
    const user = req.user;
    res.send(user);
})

router.post('/logout', async function(req, res) {
    let refreshToken = req.body.refreshToken;
    if (refreshToken) {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async function(err, payload) {
            if (err) {
                return res.sendStatus(403);
            } else {
                const token = new BlacklistedToken();
                token.set('token', refreshToken);
                token.set('date_created', new Date());
                await token.save();
                res.send({
                    'message': 'logged out'
                })
            }
        })
    } else {
        res.sendStatus(401);
    }
})

module.exports = router;