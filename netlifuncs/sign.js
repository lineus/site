'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { MONGO } = process.env;
const logSchema = new Schema({
  path: String,
  when: {
    type: Date,
    default: Date.now
  }
});

const Log = mongoose.model('lineusdevlog', logSchema);

exports.handler = function(event, context, callback) {
  mongoose.connect(MONGO, (err) => {
    if (err) {
      return callback(err);
    }
    Log.create({ path: event.path }, (e, doc) => {
      if (e) {
        callback(e);
      }
      callback(null, doc);
      return mongoose.disconnect();
    });
  });
};
