// if require refers to a folder, index.js is automatically used
const bookshelf = require('../bookshelf')

// create Product model
// a model is one table in db
// first arg is name of the model
// use singular capitalised form for table name
const Product = bookshelf.model('Product', {
    'tableName':'products', // name of table in mysql db
    category() {
        return this.belongsTo('Category'); // belongsTo -> use singular of its model
    },
    tags() {
        return this.belongsToMany('Tag');
    }
})

const Category = bookshelf.model('Category', {
    'tableName':'categories',
    products() {
        return this.hasMany('Product'); // hasMany -> use plural of its model
    }
})

const Tag = bookshelf.model('Tag',{
    'tableName':'tags',
    products() {
        return this.belongsToMany('Product')
    }
})

const User = bookshelf.model('User', {
    'tableName':'users'
})

const CartItem = bookshelf.model('CartItem', {
    'tableName':'cart_items',
    product() {
        return this.belongsTo('Product');
    },
    user() {
        return this.belongsTo('User');
    }
})

module.exports = {
    Product,
    Category,
    Tag,
    User,
    CartItem
}