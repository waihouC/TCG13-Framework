const jwt = require('jsonwebtoken');

const checkIfAuthenticated = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.flash('error_messages', "You must log in to view this page.");
        res.redirect('/users/login');
    }
}

// can just use function without const
const checkIfAuthenticatedJWT = function(req, res, next) {
    // extract the header from the request
    const authHeader = req.headers.authorization;
    if (authHeader) {
        // get access token
        const token = authHeader.split(' ')[1];

        // use jwt to verify
        jwt.verify(token, process.env.TOKEN_SECRET, function(err, payload) {
            // if err is not null or undefined
            if (err) {
                return res.sendStatus(403);
            }
            
            req.user = payload;
            next();
        })
    } else {
        return res.sendStatus(401);
    }
}

module.exports = {
    checkIfAuthenticated,
    checkIfAuthenticatedJWT
}