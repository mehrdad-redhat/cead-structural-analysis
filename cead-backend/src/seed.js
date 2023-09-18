require("dotenv").config();
const dbConfig = require("./app.config.json").database;
const dbName = process.env.DBNAME;
const dbUserName = process.env.DBUSER;
const dbPass = process.env.DBPASS;
const dbAuthDB = process.env.DBAUTHDB;
const mongoose = require("mongoose");
const IDSequencer = require("./_database/id-sequences.schema");
mongoose.Promise = global.Promise;

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: dbUserName,
  pass: dbPass,
  authSource: dbAuthDB,
};

let mongooseURI = `mongodb://${dbConfig.host}:${dbConfig.port}/${dbName}`;

mongoose.connect(mongooseURI, mongooseOptions).then(
  () => {
    console.log("Successfully connected to MongoDB.");
    console.log("Seeding database started...💡");
  },
  (err) => {
    console.error("Connection error", err);
    process.exit();
  }
);

// ID sequencer seed
const ModelsToSeed = [
  { modelName: "sa-structure", startValue: 1 },
  { modelName: "sa-project", startValue: 1 },
];

IDSequencer.seedAllSequences(ModelsToSeed)
  .then(() => {
    console.log("- - - - - - - - - - - - - - - ");
    console.info(
      "All collection's sequence have been initialized and are ready to use.👍🏻"
    );
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit();
  });
