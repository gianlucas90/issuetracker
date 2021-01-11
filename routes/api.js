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
  updated_on: {
    type: Date,
    default: Date.now(),
  },
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
        if (req.query._id) filter._id = req.query._id;
        if (req.query.issue_title) filter.issue_title = req.query.issue_title;
        if (req.query.issue_text) filter.issue_text = req.query.issue_text;
        if (req.query.created_on) filter.created_on = req.query.created_on;
        if (req.query.updated_on) filter.updated_on = req.query.updated_on;
        if (req.query.created_by) filter.created_by = req.query.created_by;
        if (req.query.assigned_to) filter.assigned_to = req.query.assigned_to;
        if (req.query.open) filter.open = req.query.open;
        if (req.query.status_text) filter.status_text = req.query.status_text;

        await Issue.find(filter, (err, arrayOfResults) => {
          if (!err && arrayOfResults) {
            console.log(arrayOfResults);

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

        let newIssue = await new Issue({
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to || '',
          status_text: req.body.status_text || '',
          open: true,
          created_on: new Date().toUTCString(),
          updated_on: new Date().toUTCString(),
          project,
        });
        if (
          !project ||
          !req.body.issue_title ||
          !req.body.issue_text ||
          !req.body.created_by
        )
          res.json({ error: 'required field(s) missing' });

        newIssue.save((err, savedIssue) => {
          if (!err && savedIssue) {
            console.log(newIssue);
            return res.json(newIssue);
          }
        });
        // res.status(201).json(doc);
      } catch (err) {
        console.error(err);
      }
    })

    .put(async function (req, res) {
      try {
        if (!req.body._id) return res.json({ error: 'missing _id' });

        let updatedObject = {};
        Object.keys(req.body).forEach((key) => {
          if (req.body[key] != '') {
            updatedObject[key] = req.body[key];
          }
        });

        if (Object.keys(updatedObject).length < 2)
          return res.json({
            error: 'no update field(s) sent',
            _id: req.body._id,
          });

        updatedObject.updated_on = new Date();

        await Issue.findByIdAndUpdate(
          req.body._id,
          updatedObject,
          {
            new: true,
          },
          (err, updatedIssue) => {
            if (!err && updatedIssue) {
              return res.json({
                result: 'successfully updated',
                _id: req.body._id,
              });
            } else if (!updatedIssue)
              return res.json({ error: 'could not update', _id: req.body._id });
          }
        );
      } catch (err) {
        console.error(err);
      }
    })

    .delete(async function (req, res) {
      try {
        if (!req.body._id) {
          return res.json({ error: 'missing _id' });
        }
        await Issue.findByIdAndDelete(req.body._id, (err, deletedIssue) => {
          if (!err && deletedIssue) {
            res.json({ result: 'successfully deleted', _id: deletedIssue._id });
          } else if (!deletedIssue) {
            res.json({ error: 'could not delete', _id: req.body._id });
          }
        });
      } catch (err) {
        console.error(err);
      }
    });
};
