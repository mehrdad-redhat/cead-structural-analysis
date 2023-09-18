const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 12);

const user = new Schema({
	                        _id: {
		                        type: String,
		                        default: () => nanoid()
	                        },
	                        first_name: {
		                        type: String,
		                        required: true
	                        },
	                        last_name: {
		                        type: String,
		                        required: true
	                        },
	                        email: {
		                        type: String,
		                        required: 'Email address is required',
		                        trim: true,
		                        lowercase: true,
		                        unique: true,
		                        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
	                        },
	                        password_hash: {
		                        type: String,
		                        required: true
	                        },
	                        status: {
		                        type: String,
		                        enum:['waiting','active','disabled'],
		                        default: 'waiting',
		                        required: true
	                        },
	                        role: {
		                        type: String,
		                        enum : ['user','admin'],
		                        default: 'user'
	                        },
	                        organization: {
		                        type: String
	                        },
	                        work_field: {
		                        type: String
	                        },
	                        design_exp: {
		                        type: String,
	                        },
	                        cur_api_call: {
		                        type: Number,
		                        min: 0,
		                        default: 0
	                        },
	                        max_api_call: {
		                        type: Number,
		                        min: 0,
		                        default: 20
	                        }
                        },
                        {
	                        timestamps: true
                        });

user.virtual('FullName').get(function () {
	const {last_name, first_name} = this;
	return `${first_name} ${last_name}`;
});

user.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: function (doc, ret) {
		// remove these props when object is serialized
		delete ret.password_hash;
	}
});

module.exports = mongoose.model('User', user);
