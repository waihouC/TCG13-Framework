const express = require('express');
const router = express.Router();

// import user model
const { User } = require('../models');

// import form
const { createRegistrationForm, createLoginForm, bootstrapField } = require('../forms');

router.get('/register', (req,res)=>{
    // create an instance of the registration form
    const registerForm = createRegistrationForm();
    res.render('users/register', {
        'form': registerForm.toHTML(bootstrapField)
    })
})

router.post('/register', (req, res)=>{
    const registerForm = createRegistrationForm();
    registerForm.handle(req, {
        'success': async(form) => {
            const user = new User({
                'username': form.data.username,
                'password': form.data.password,
                'email': form.data.email
            });

            await user.save();
            req.flash("success_messages", "User signed up successfully!");
            res.redirect('/users/register');
        },
        'error': (form) => {
            res.render('users/register', {
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})

router.get('/login', (req, res)=>{
    const loginForm = createLoginForm();
    res.render('users/login', {
        'form': loginForm.toHTML(bootstrapField)
    })
})

router.post('/login', (req, res)=>{
    const loginForm = createLoginForm();
    loginForm.handle(req, {
        'success': async(form) => {
            // find user by email provided in the request
            let user = await User.where({
                'email': form.data.email
            }).fetch({
                require: false
            });

            if (!user) {
                req.flash('error_messages', "Sorry, the login details provided is not correct.");
                res.redirect('/users/login');
            }

            // if user exists, check if password matches
            if (user.get('password') == form.data.password) {
                // if matches, store user in client session
                req.session.user = {
                    id: user.get('id'),
                    username: user.get('username'),
                    email: user.get('email')
                }

                req.flash("success_messages", "Welcome back, " + user.get('username'));
                res.redirect('/users/profile');

                // if user exists and password matches, save the user as logged in the session
            } else {
                // password does not match
                req.flash('error_messages', "Sorry, the login details provided is not correct.");
                res.redirect('/users/login');
            }
        },
        'error': (form) => {
            res.render('users/login', {
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})

// profile page
router.get('/profile', (req,res)=>{
    // once an object has been saved to session, we can retrieve it by `req.session.<key>`
    const user = req.session.user;

    if (!user) {
        req.flash('error_messages', 'You do not have permission to view this page');
        res.redirect('/users/login');
    }

    res.render('users/profile',{
        'user': user
    })
})

// logout page
router.get('/logout', (req,res)=>{
    req.session.user = null;
    req.flash('success_messages', "You have logged out of your account");
    res.redirect('/users/login');
})

module.exports = router;