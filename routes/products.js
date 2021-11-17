const express = require('express');
const router = express.Router();  // create a router object from express
const { 
    createProductForm,
    bootstrapField,
    createSearchForm 
} = require('../forms');
const { checkIfAuthenticated } = require('../middlewares');

// import Product, Category, Tag models from models/index.js
const { 
    Product, 
    Category, 
    Tag 
} = require('../models');

// move to DAL
// async function getProductById(productId) {
//     // first arg: obj of settings 
//     // db.collection('products').find({'_id'})
//     let product = await Product.where({
//         'id': productId
//     }).fetch({
//         'required': true,
//         'withRelated': ['tags']
//     });

//     return product;
// }

// import from DAL the repository functions
// repository in this context does not refer to github
// rather it's a generic term to refer to a function
// that retrieves data from the database
const {
    getProductById, 
    getAllCategories, 
    getAllTags
} = require('../dal/product.js')

// router.get('/', async function(req, res) {
//     // select * from products;
//     let products = await Product.collection().fetch({
//         withRelated:['category', 'tags'] // load in category and tags info
//     });
//     res.render('products/index', {
//         'products': products.toJSON()
//     });
// })

// search form included
router.get('/', async function (req, res) {
    // retrieve an array of all available categories
    const allCategories = await getAllCategories();

    // create a fake category that represents search all
    allCategories.unshift([0, '----'])

    // retrieve an array of all the tags
    const allTags = await getAllTags();

    let searchForm = createSearchForm(allCategories, allTags);

    // create a base query which is deferred => select * from products;
    let q = Product.collection();

    searchForm.handle(req,{
        'success': async function(form) {
            if (form.data.name) {
                q.where('name', 'like', '%' + form.data.name + '%');
            }

            if (form.data.min_cost) {
                q.where('cost', '>=', form.data.min_cost);
            }

            if (form.data.max_cost) {
                q.where('cost', '<=', form.data.max_cost);
            }

            if (form.data.category_id && form.data.category_id != "0") {
                q.where('category_id', '=', form.data.category_id)
            }

            if (form.data.tags) {
                q.query('join', 'products_tags', 'products.id', 'product_id')
                .where('tag_id', 'in', form.data.tags.split(','))
            }

            let products = await q.fetch({
                withRelated:['category', 'tags']
            })

            res.render('products/index', {
                'products': products.toJSON(),
                'form': form.toHTML(bootstrapField)
            });
        },
        'error': async function(form) {
            let products = await q.fetch({
                withRelated:['category', 'tags']
            });
            res.render('products/index', {
                'products': products.toJSON(),
                'form': form.toHTML(bootstrapField)
            });
        },
        'empty': async function(form) {
            let products = await q.fetch({
                withRelated:['category', 'tags']
            });
            res.render('products/index', {
                'products': products.toJSON(),
                'form': form.toHTML(bootstrapField)
            });
        }
    })
})

router.get('/create', checkIfAuthenticated, async function(req, res) {
    // retrieve array of all categories
    // map to customise the array
    const allCategories = await getAllCategories();
    //console.log(await allCategories.toJSON());

    // fetch all tags
    const allTags = await getAllTags();

    const productForm = createProductForm(allCategories, allTags);

    res.render('products/create', {
        'form': productForm.toHTML(bootstrapField),
        'cloudinaryName': process.env.CLOUDINARY_NAME,
        'cloudinaryApiKey': process.env.CLOUDINARY_API_KEY,
        'cloudinaryPreset': process.env.CLOUDINARY_UPLOAD_PRESET
    })
})

router.post('/create', checkIfAuthenticated, async function(req, res) {
    // Read in all the categories
    const allCategories = await getAllCategories();

    // fetch all tags
    const allTags = await getAllTags();

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
            newProduct.set('image_url', form.data.image_url);
            
            // save new row to db
            await newProduct.save();

            // check if user select any tags
            // can only save relationship after product is created
            if (form.data.tags) {
                // form.data.tags -> array string e.g 1,2....
                await newProduct.tags().attach(form.data.tags.split(','));
            }

            // add flash message to indicate adding product is successful
            // 1st arg: key to add to
            // 2nd arg: message to display
            req.flash("success_messages", "New product created.");
            
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
    const allCategories = await getAllCategories();

    // fetch all tags
    const allTags = await getAllTags();
    
    // fetch details of product to update
    let product = await getProductById(req.params.product_id);
    
    // create product form
    let productForm = createProductForm(allCategories, allTags);
    // retrieve values of columns from product obj
    productForm.fields.name.value = product.get('name');
    productForm.fields.cost.value = product.get('cost');
    productForm.fields.description.value = product.get('description');
    productForm.fields.category_id.value = product.get('category_id');
    productForm.fields.image_url.value = product.get('image_url');

    // fetch all the related tags of the product
    let selectedTags = await product.related('tags').pluck('id');
    productForm.fields.tags.value = selectedTags;

    res.render('products/update', {
        'form': productForm.toHTML(bootstrapField),
        'product': product.toJSON(),
        'cloudinaryName': process.env.CLOUDINARY_NAME,
        'cloudinaryApiKey': process.env.CLOUDINARY_API_KEY,
        'cloudinaryPreset': process.env.CLOUDINARY_UPLOAD_PRESET
    });
})

router.post('/:product_id/update', async function(req, res) {
    // fetch all the categories
    const allCategories = await getAllCategories();

    // fetch all tags
    const allTags = await getAllTags();

    // fetch the product to update
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
    
    // delete a row from table
    await product.destroy();

    res.redirect('/products');
})

module.exports = router;