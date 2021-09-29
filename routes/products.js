const express = require('express');
const router = express.Router();  // create a router object from express
const { createProductForm, bootstrapField } = require('../forms');

// import Product, Category, Tag models from models/index.js
const { Product, Category, Tag } = require('../models');

async function getProductById(productId) {
    // first arg: obj of settings 
    // db.collection('products').find({'_id'})
    let product = await Product.where({
        'id': productId
    }).fetch({
        'required': true,
        'withRelated': ['tags']
    });

    return product;
}

router.get('/', async function(req, res) {
    // select * from products;
    let products = await Product.collection().fetch({
        withRelated:['category', 'tags'] // load in category and tags info
    });
    res.render('products/index', {
        'products': products.toJSON()
    });
})

router.get('/create', async function(req, res) {
    // retrieve array of all categories
    // map to customise the array
    const allCategories = await Category.fetchAll().map(function(category) {
        return [ category.get('id'), category.get('name') ];
    });
    //console.log(await allCategories.toJSON());

    // fetch all tags
    const allTags = await Tag.fetchAll().map(function(tag) {
        return [tag.get('id'), tag.get('name')]
    });

    const productForm = createProductForm(allCategories, allTags);

    res.render('products/create', {
        'form': productForm.toHTML(bootstrapField)
    })
})

router.post('/create', async function(req, res) {
    // Read in all the categories
    const allCategories = await Category.fetchAll().map((category) => {
        return [category.get('id'), category.get('name')];
    })

    // fetch all tags
    const allTags = await Tag.fetchAll().map(function(tag) {
        return [tag.get('id'), tag.get('name')]
    });

    // set all categories in Product form
    const productForm = createProductForm(allCategories, allTags);
    
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
            newProduct.set('category_id', form.data.category_id);
            
            // save new row to db
            await newProduct.save();

            // check if user select any tags
            // can only save relationship after product is created
            if (form.data.tags) {
                // form.data.tags -> array string e.g 1,2....
                await newProduct.tags().attach(form.data.tags.split(','));
            }

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
    // fetch all the categories
    const allCategories = await Category.fetchAll().map((category)=>{
        return [category.get('id'), category.get('name')];
    })

    // fetch all tags
    const allTags = await Tag.fetchAll().map(function(tag) {
        return [tag.get('id'), tag.get('name')]
    });
    
    // fetch details of product to update
    let product = await getProductById(req.params.product_id);
    
    // create product form
    let productForm = createProductForm(allCategories, allTags);
    // retrieve values of columns from product obj
    productForm.fields.name.value = product.get('name');
    productForm.fields.cost.value = product.get('cost');
    productForm.fields.description.value = product.get('description');
    productForm.fields.category_id.value = product.get('category_id');

    // fetch all the related tags of the product
    let selectedTags = await product.related('tags').pluck('id');
    productForm.fields.tags.value = selectedTags;

    res.render('products/update', {
        'form': productForm.toHTML(bootstrapField),
        'product': product.toJSON()
    });
})

router.post('/:product_id/update', async function(req, res) {
    // fetch all the categories
    const allCategories = await Category.fetchAll().map((category)=>{
        return [category.get('id'), category.get('name')];
    })

    // fetch all tags
    const allTags = await Tag.fetchAll().map(function(tag) {
        return [tag.get('id'), tag.get('name')]
    });
    
    // fetch details of product to update
    let product = await getProductById(req.params.product_id);

     // process the form
     const productForm = createProductForm(allCategories, allTags);
     productForm.handle(req, {
         'success': async function(form) {
             // can only use if form.data have exactly
             // the same keys as columns in table
             //product.set(form.data); // = product.set(..)

             // extract tags key from form.data into tags variable,
             // place the rest into productData
             let {tags, ...productData} = form.data; // use Object Restructuring here
             product.set(productData);
             
             await product.save();

             // update the relationship here
             // currently selected tags
             let tagIds = tags.split(',');

             // get all the tags that are selected first
             let existingTagIds = await product.related('tags').pluck('id');
            
             // remove the tags that are not selected anymore
             let toRemove = existingTagIds.filter(function(id){
                 return tagIds.includes(id) === false;
             });
             await product.tags().detach(toRemove);

             // add in all tags selected
             await product.tags().attach(tagIds);

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