// if require refers to a folder, index.js is automatically used
const bookshelf = require('../bookshelf')

// create Product model
// a model is one table in db
// first arg is name of the model
// use singular capitalised form for table name
const Product = bookshelf.model('Product', {
    'tableName':'products'
})

module.exports = {
    Product
}