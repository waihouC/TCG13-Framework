const express = require('express')
const router = express.Router();  // create a router object from express

// import Product model from models/index.js
const { Product } = require('../models');

router.get('/', async function(req,res) {
    // select * from products;
    let products = await Product.collection().fetch();
    res.render('products/index', {
        'products': products.toJSON()
    });
})

module.exports = router;