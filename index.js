const express = require('express');
const hbs = require('hbs');
const wax = require('wax-on');
require('dotenv').config();
const session = require('express-session');
const flash = require('connect-flash');
const FileStore = require('session-file-store')(session);
const csrf = require('csurf');

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
app.use(csrf());

// middleware to inject csrf token into all hbs files
app.use(function(req, res, next){
    res.locals.csrfToken = req.csrfToken();
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

async function main() {
    app.use('/', landingRoutes);
    app.use('/products', productRoutes);
    app.use('/users', userRoutes);
    app.use('/cloudinary', cloudinaryRoutes);
    app.use('/cart', cartRoutes);
    app.use('/checkout', checkoutRoutes);
}

main();

app.listen(3000, () => {
    console.log("Server has started");
});