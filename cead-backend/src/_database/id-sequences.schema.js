const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const idSeq = new Schema({
	                         model_name: {
		                         type: String,
		                         unique: true,
	                         },
	                         last_id: {
		                         type: Number,
	                         },
                         });

idSeq.virtual('next_id').get(function() {
	const {last_id} = this;
	return last_id + 1;
});

idSeq.set('toJSON', {
	virtuals: true,
	versionKey: false,
});

const IDSeq = mongoose.model('ID_Sequence', idSeq);

async function seedInitialSequences(modelName, startValue) {
	return new Promise((resolve, reject) => {
		const collectionName = modelName.charAt(0).toUpperCase() +
				modelName.slice(1);
		IDSeq.create(
				     {model_name: modelName, last_id: startValue ? startValue - 1 : 0})
		     .then(() => {
			     console.info(`${collectionName} sequence have been seeded...✔️`);
			     resolve();
		     })
		     .catch((err) => {
			     if (err.message.startsWith('E11000'))
				     reject(
						     `${collectionName} collection is already seeded, remove it from list and try again with others⛔.`);
			     else
				     reject(err.message);
		     });
	});
}

async function seedAllSequences(models) {
	return Promise.all(
			models.map(m => seedInitialSequences(m.modelName, m.startValue)));
}

async function getNewId(model_name) {
	return new Promise((resolve, reject) => {
		IDSeq.findOne({model_name})
		     .then(idSeq => {
			     const newId = idSeq['next_id'];
			     idSeq.last_id = newId;
			     idSeq.save().then(() => {
				     resolve(newId);
			     });
			
		     });
	});
}

module.exports = {
	seedAllSequences,
	getNewId,
};
