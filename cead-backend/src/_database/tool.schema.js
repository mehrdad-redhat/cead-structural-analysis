const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {customAlphabet} = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 12);

const tool = new Schema({
	                        _id: {
		                        type: String,
		                        default: () => nanoid()
	                        },
	                        title: {
		                        type: String,
		                        required: true,
	                        },
	                        slug: {
		                        type: String,
	                        },
	                        status: {
		                        type: String,
		                        required: true,
		                        enum: ['enabled', 'disabled', 'soon'],
	                        },
	                        icon: {
		                        type: String,
	                        },
	                        new: {
		                        type: Boolean,
		                        default: true,
	                        },
                        });

tool.pre('save', function(next) {
	this.slug = this.title.toLowerCase().replaceAll(' ', '-');
	next();
});

tool.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: function(doc, ret) {
		// remove these props when object is serialized
		delete ret.id;
	},
});

module.exports = mongoose.model('Tool', tool);
