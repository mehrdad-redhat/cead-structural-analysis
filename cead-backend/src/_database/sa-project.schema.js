const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {customAlphabet} = require('nanoid');
const {getNewId} = require('./id-sequences.schema');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 12);

const saProject = new Schema({
	                             _id: {
		                             type: Number,
	                             },
	                             name: {
		                             type: String,
		                             required: true,
	                             },
	                             slug: {
		                             type: String,
	                             },
	                             structures: [
		                             {
			                             type: Number,
			                             ref: 'SA_Structure',
		                             },
	                             ],
	                             owner: {
		                             type: String,
		                             ref: 'User',
	                             },
                             }, {
	                             timestamps: true,
                             });
saProject.pre('save', async function(next) {
	this.slug = this.name.toLowerCase().replaceAll(' ', '-');
	if (this.isNew)
		this._id = await getNewId('sa-project');
	next();
});

saProject.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: function(doc, ret) {
		// remove these props when object is serialized
		delete ret.id;
	},
});

module.exports = mongoose.model('SA_Project', saProject);
