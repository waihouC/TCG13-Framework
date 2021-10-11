const {
    Product,
    Category,
    Tag
} = require('../models');

async function getProductById(productId) {
    // first arg: obj of settings 
    // db.collection('products').find({'_id'})
    let product = await Product.where({
        'id': productId
    }).fetch({
        'required': true,
        'withRelated': ['tags', 'category']
    });

    return product;
}

async function getAllCategories() {
    let allCategories = await Category.fetchAll().map(function (category) {
        return [category.get('id'), category.get('name')]
    });

    return allCategories;
}

async function getAllTags() {
    let allTags = await (await Tag.fetchAll()).map(function (tag) {
        return [tag.get('id'), tag.get('name')]
    });

    return allTags;
}

// get all products
async function getAllProducts() {
    return await Product.fetchAll();
}

module.exports = {
    getProductById,
    getAllCategories,
    getAllTags,
    getAllProducts
}