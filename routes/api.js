'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
  console.log('we are conncected to the db!');
});

// To delete all documents in the database everytime restart the server!
// db.dropDatabase();

/////////////////// Schemas
///////////////////////////

const issueSchema = new Schema({
  project: { type: String, required: true },
  issue_title: {
    type: String,
    required: true,
  },
  issue_text: {
    type: String,
    required: true,
  },
  created_on: {
    type: Date,
    default: Date.now(),
  },
  updated_on: Date,
  created_by: {
    type: String,
    required: true,
  },
  assigned_to: String,
  open: {
    type: Boolean,
    default: true,
  },
  status_text: String,
});

/////////////////// Models
///////////////////////////
const Issue = mongoose.model('Issue', issueSchema);

module.exports = function (app) {
  app
    .route('/api/issues/:project')

    .get(async function (req, res) {
      try {
        let filter;
        if (req.params.project) filter = { project: req.params.project };
        if (req.query.open) filter.open = req.query.open;
        if (req.query.assigned_to) filter.assigned_to = req.query.assigned_to;

        await Issue.find(filter, (err, arrayOfResults) => {
          if (!err && arrayOfResults) {
            return res.json(arrayOfResults);
          }
        }).select('-project');
      } catch (err) {
        res.status(400);
        console.error(err);
      }
    })

    .post(async function (req, res) {
      try {
        let project = req.params.project;
        let {
          issue_title,
          issue_text,
          created_by,
          assigned_to,
          status_text,
        } = req.body;

        if (!project || !issue_title || !issue_text || !created_by)
          res.json({ error: 'Required field missing from request!' });

        let newIssue = await new Issue({
          issue_title,
          issue_text,
          created_by,
          assigned_to,
          status_text,
          project,
        });

        newIssue.save((err, savedIssue) => {
          if (!err && savedIssue) {
            return res.json(savedIssue);
          }
        });
        // res.status(201).json(doc);
      } catch (err) {
        console.error(err);
      }
    })

    .put(async function (req, res) {
      try {
        if (!req.body._id) return res.json('no id supplied');

        let updatedObject = {};
        Object.keys(req.body).forEach((key) => {
          if (req.body[key] != '') {
            updatedObject[key] = req.body[key];
          }
        });

        if (Object.keys(updatedObject).length < 2)
          return res.json('no updated fields sent');

        updatedObject.updated_on = new Date();

        await Issue.findByIdAndUpdate(
          req.body._id,
          updatedObject,
          {
            new: true,
          },
          (err, updatedIssue) => {
            if (!err && updatedIssue) {
              return res.json(updatedIssue);
            } else if (!updatedIssue)
              return res.json('could not update ' + req.body._id);
          }
        );
      } catch (err) {
        console.error(err);
      }
    })

    .delete(async function (req, res) {
      try {
        if (!req.body._id) {
          return res.json('error, not found!');
        }
        await Issue.findByIdAndDelete(req.body._id, (err, deletedIssue) => {
          if (!err && deletedIssue) {
            res.json('deleted ' + deletedIssue._id);
          } else if (!deletedIssue) {
            res.json('could not delete ' + req.body._id);
          }
        });
      } catch (err) {
        console.error(err);
      }
    });
};
