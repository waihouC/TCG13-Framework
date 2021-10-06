const forms = require('forms')

// create shortcuts
const fields = forms.fields;
const validators = forms.validators;
const widgets = forms.widgets;

// add bootstrap4
var bootstrapField = function (name, object) {
    if (!Array.isArray(object.widget.classes)) { object.widget.classes = []; }

    if (object.widget.classes.indexOf('form-control') === -1) {
        object.widget.classes.push('form-control');
    }

    var validationclass = object.value && !object.error ? 'is-valid' : '';
    validationclass = object.error ? 'is-invalid' : validationclass;
    if (validationclass) {
        object.widget.classes.push(validationclass);
    }

    var label = object.labelHTML(name);
    var error = object.error ? '<div class="invalid-feedback">' + object.error + '</div>' : '';

    var widget = object.widget.toHTML(name, object);
    return '<div class="form-group">' + label + widget + error + '</div>';
};

// 1st arg is an array of categories
// 2nd arg is an array of tags
const createProductForm = function(categories, tags) {
    return forms.create({
        // <input type="text" name="productName">
        "name": fields.string({
            required: true,
            // display error for field
            errorAfterField: true
        }),
        "cost": fields.string({
            required: true,
            errorAfterField: true,
            validators: [validators.integer(), validators.min(0)]
        }),
        "description": fields.string({
            required: true,
            errorAfterField: true
        }),
        "category_id": fields.string({
            label:'Category',
            required:true,
            errorAfterField:true,
            widget: widgets.select(), // indicate using <select><</select> to fill in the field
            choices: categories
        }),
        "tags": fields.string({
            required: true,
            errorAfterField: true,
            cssClasses: {
                label: ['form-label']
            },
            widget: widgets.multipleSelect(),
            choices: tags
        }),
        'image_url': fields.string({
            widget: widgets.hidden()
        })
    });
}

const createRegistrationForm = () => {
    return forms.create({
        'username': fields.string({
            'required': true,
            'errorAfterField': true
        }),
        'email': fields.string({
            'required': true,
            'errorAfterField': true
        }),
        'password': fields.string({
            'required': true,
            'errorAfterField': true,
            'widget': widgets.password()
        }),
        'confirm_password': fields.string({
            'required': true,
            'errorAfterField': true,
            'widget': widgets.password(),
            'validators': [ validators.matchField('password') ]
        })
    })
}

const createLoginForm = () => {
    return forms.create({
        'email': fields.string({
            'required': true,
            'errorAfterField': true
        }),
        'password': fields.string({
            'required': true,
            'errorAfterField': true,
            'widget': widgets.password()
        })
    })
}

module.exports = { 
    createProductForm,
    createRegistrationForm,
    createLoginForm,
    bootstrapField
};