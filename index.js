const express = require('express');
const hbs = require('hbs');
const wax = require('wax-on');
require('dotenv').config();
const session = require('express-session');
const flash = require('connect-flash');
const FileStore = require('session-file-store')(session);
const csrf = require('csurf');
const cors = require('cors');

// create express app
let app = express();

// set the view engine
app.set('view engine', 'hbs');

// set static folder (js, css files)
app.use(express.static('public'));

// set up handlebars to use wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

// enable forms
app.use(
    express.urlencoded({
      extended: false
    })
);

// cors must be enabled before session
app.use(cors());

// setup session
app.use(session({
    'store': new FileStore(),
    'secret': process.env.SESSION_SECRET_KEY,
    'resave': false,
    'saveUninitialized': true
}));

// setup flash
app.use(flash());

// register flash middleware to display flash messages in hbs files
app.use(function(req, res, next){
    // adding to hbs template variables: success_messages & error_messages
    res.locals.success_messages = req.flash('success_messages');
    res.locals.error_messages = req.flash('error_messages');
    next();
});

// enable protection from csrf
//app.use(csrf());
const csurfInstance = csrf();
app.use(function(req, res, next) {
    // exclude from CSRF for /checkout/process_payment
    // and any routes which begins with '/api/'
    if (req.url == "/checkout/process_payment" || req.url.slice(0, 5) == '/api/') {
        return next();
    } else {
        // manually call csurfInstance to check the request
        csurfInstance(req, res, next);
    }
});

// middleware to inject csrf token into all hbs files
app.use(function(req, res, next){
    //res.locals.csrfToken = req.csrfToken();
    if (req.csrfToken) {
        res.locals.csrfToken = req.csrfToken();
    }
    next();
});

// share user data with all hbs files
app.use(function(req, res, next) {
    res.locals.user = req.session.user;
    next(); // call the next middleware or route if no middleware
});

const landingRoutes = require('./routes/landing');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const cloudinaryRoutes = require('./routes/cloudinary');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');

const api = {
    'products': require('./routes/api/products'),
    'users': require('./routes/api/users')
}

async function main() {
    app.use('/', landingRoutes);
    app.use('/products', productRoutes);
    app.use('/users', userRoutes);
    app.use('/cloudinary', cloudinaryRoutes);
    app.use('/cart', cartRoutes);
    app.use('/checkout', checkoutRoutes);
    app.use('/api/products', express.json(), api.products);
    app.use('/api/users', express.json(), api.users);
}

main();

app.listen(process.env.PORT, () => {
    console.log("Server has started");
});