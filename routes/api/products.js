const express = require('express');
const router = express.Router();
// going up 2 levels here
const { Product } = require('../../models');
const { createProductForm } = require('../../forms');

// will import all functions in the dal.product.js
// and store into productDataLayer object
const productDataLayer = require('../../dal/product');

router.get('/', async function(req, res) {
    let allProducts = await productDataLayer.getAllProducts();
    res.json(allProducts.toJSON());
})

// endpoint to create new product
router.post('/', async function(req, res) {
    const allCategories = await productDataLayer.getAllCategories();
    const allTags = await productDataLayer.getAllTags();
    const productForm = createProductForm(allCategories, allTags);

    productForm.handle(req, {
        'success': async function(form) {
            let { tags, ...productData } = form.data;
            const product = new Product(productData);
            await product.save();

            if (tags) {
                await product.tags().attach(tags.split(","));
            }

            res.send(product);
        },
        'error': async function(form) {
            let errors = {};
            for (let key in form.fields) {
                if (form.fields[key].error) {
                    errors[key] = form.fields[key].error;
                }
            }

            res.send(errors);
        }
    })
})

module.exports = router;