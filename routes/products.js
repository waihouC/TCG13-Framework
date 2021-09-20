const express = require('express');
const router = express.Router();  // create a router object from express
const { createProductForm, bootstrapField } = require('../forms');

// import Product model from models/index.js
const { Product } = require('../models');

async function getProductById(productId) {
    // first arg: obj of settings 
    // db.collection('products').find({'_id'})
    let product = await Product.where({
        'id': productId
    }).fetch({
        'required': true
    });

    return product;
}

router.get('/', async function(req, res) {
    // select * from products;
    let products = await Product.collection().fetch();
    res.render('products/index', {
        'products': products.toJSON()
    });
})

router.get('/create', function(req, res) {
    const productForm = createProductForm();
    res.render('products/create', {
        'form': productForm.toHTML(bootstrapField)
    })
})

router.post('/create', function(req, res) {
    const productForm = createProductForm();
    productForm.handle(req, {
        // form param is the submitted processed form
        "success": async function(form) {
            // form submitted successfully
            // create an instance of the Prodcut model
            // Product model => table
            // instance of Product model => row
            let newProduct = new Product();
            newProduct.set('name', form.data.name);
            newProduct.set('cost', form.data.cost);
            newProduct.set('description', form.data.description);
            // save new row to db
            await newProduct.save();
            res.redirect('/products');
        },
        "empty": function() {
            res.send("All fields are empty!");
        },
        "error": function(form) {
            // submitted form with errors
            res.render('products/create', {
                'form': form.toHTML(bootstrapField)
            })
        }
    });
})

router.get('/:product_id/update', async function(req, res) {
    // fetch details of product to update
    let product = await getProductById(req.params.product_id);

    // create product form
    let productForm = createProductForm();
    // retrieve values of columns from product obj
    productForm.fields.name.value = product.get('name');
    productForm.fields.cost.value = product.get('cost');
    productForm.fields.description.value = product.get('description');

    res.render('products/update', {
        'form': productForm.toHTML(bootstrapField),
        'product': product.toJSON()
    });
})

router.post('/:product_id/update', async function(req, res) {
    // fetch details of product to update
    let product = await getProductById(req.params.product_id);

     // process the form
     const productForm = createProductForm();
     productForm.handle(req, {
         'success': async function(form) {
             // can only use if form.data have exactly
             // the same keys as columns in table
             product.set(form.data); // = product.set(..)
             await product.save();
             res.redirect('/products');
         }
     })
})

router.get('/:product_id/delete', async function(req, res) {
    // fetch details of product to update
    let product = await getProductById(req.params.product_id);

    res.render('products/delete', {
        'product': product.toJSON()
    });
})

router.post('/:product_id/delete', async function(req, res) {
    // fetch details of product to update
    let product = await getProductById(req.params.product_id);
    
    // delete a row
    await product.destroy();

    res.redirect('/products');
})

module.exports = router;