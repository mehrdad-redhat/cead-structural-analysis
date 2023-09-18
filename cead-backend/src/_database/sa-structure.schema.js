const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {customAlphabet} = require('nanoid');
const {getNewId} = require('./id-sequences.schema');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const revision = customAlphabet(alphabet, 5);

const saStructure = new Schema({
	                               _id: {
		                               type: Number,
	                               },
	                               revision: {
		                               type: String,
		                               default: 'Undefined',
	                               },
	                               preview_url: {
		                               type: Schema.Types.Mixed,
		                               default: 'https://dummyimage.com/70x70/65cfd1/042a2b.png&text=Blank',
	                               },
	                               structure_data: {
		                               type: Schema.Types.Mixed,
	                               },
	                               skyciv_model: {
		                               type: Schema.Types.Mixed,
	                               },
	                               analyzed_data: {
		                               type: Schema.Types.Mixed,
	                               },
	                               structure_guide: {
		                               type: Schema.Types.Mixed,
	                               },
	                               structure_drafts: {
		                               type: Schema.Types.Mixed,
	                               },
	                               owner: {
		                               type: String,
		                               ref: 'User',
	                               },
                               }, {
	                               timestamps: true,
                               });

saStructure.virtual('name').get(function () {
		return this?.structure_data?.info?.structure_name;
})
saStructure.virtual('type').get(function () {
	return this?.structure_data?.info?.structure_type;
})
saStructure.virtual('location').get(function () {
	return this?.structure_data?.info?.structure_location;
})

saStructure.pre('save', async function(next) {
	if (this.isNew)
		this._id = await getNewId('sa-structure');
	next();
});

saStructure.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: function(doc, ret) {
		// remove these props when object is serialized
		delete ret.id;
	},
});

module.exports = mongoose.model('SA_Structure', saStructure);

// TODO: Put new image for preview_url default
