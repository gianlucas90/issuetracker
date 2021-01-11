const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let id1 = '';
let id2 = '';
let invalidId = '5ffc83c19a7f7b09d01df518';

suite('Functional Tests', function () {
  // POST
  suite('POST /api/issues/{project}', function () {
    test('Fields', function (done) {
      chai
        .request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'test title',
          issue_text: 'test text',
          created_by: 'creator',
          assigned_to: 'user assigned',
          status_text: 'status text',
        })

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'test title');
          assert.equal(res.body.created_by, 'creator');
          assert.equal(res.body.assigned_to, 'user assigned');
          assert.equal(res.body.status_text, 'status text');
          id1 = res.body._id;
          done();
        });
    });

    test('Required Fields', function (done) {
      chai
        .request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'test title',
          issue_text: 'test text',
          created_by: 'creator',
          assigned_to: '',
          status_text: '',
        })

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'test title');
          assert.equal(res.body.created_by, 'creator');
          assert.equal(res.body.assigned_to, '');
          assert.equal(res.body.status_text, '');
          id2 = res.body._id;
          done();
        });
    });

    test('Required Field Missing', function (done) {
      chai
        .request(server)
        .post('/api/issues/test')
        .send({
          issue_title: '',
          issue_text: 'test text',
          created_by: '',
          assigned_to: '',
          status_text: '',
        })

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'required field(s) missing');
          done();
        });
    });
  });

  // GET
  suite('GET /api/issues/{project}', function () {
    test('View issues on a project', function (done) {
      chai
        .request(server)
        .get('/api/issues/test')

        .end(function (err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('View issues on a project with one filter', function (done) {
      chai
        .request(server)
        .get('/api/issues/test')
        .query({ open: 'true' })

        .end(function (err, res) {
          res.body.forEach(function (item) {
            assert.equal(item.open, true);
          });
          done();
        });
    });

    test('View issues on a project with multiple filters', function (done) {
      chai
        .request(server)
        .get('/api/issues/test')
        .query({ open: 'true', assigned_to: 'user assigned' })

        .end(function (err, res) {
          res.body.forEach(function (item) {
            assert.equal(item.open, true);
            assert.equal(item.assigned_to, 'user assigned');
          });
          done();
        });
    });
  });

  // PUT
  suite('PUT /api/issues/{project}', function () {
    test('Update one field on an issue', function (done) {
      chai
        .request(server)
        .put('/api/issues/test')
        .send({
          _id: id1,
          assigned_to: 'user assigned v2',
        })

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.result, 'successfully updated');
          assert.equal(res.body._id, id1);
          done();
        });
    });

    test('Update multiple fields on an issue', function (done) {
      chai
        .request(server)
        .put('/api/issues/test')
        .send({
          _id: id2,
          issue_title: 'test title v2',
          issue_text: 'test text v2',
          created_by: 'creator v2',
          assigned_to: 'user assigned v2',
          status_text: 'status text v2',
        })

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.result, 'successfully updated');
          assert.equal(res.body._id, id2);

          done();
        });
    });

    test('Update an issue with missing _id', function (done) {
      chai
        .request(server)
        .put('/api/issues/test')
        .send({
          issue_title: 'test title v2',
          issue_text: 'test text v2',
          created_by: 'creator v2',
          assigned_to: 'user assigned v2',
          status_text: 'status text v2',
        })

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'missing _id');
          done();
        });
    });

    test('Update an issue with no fields to update', function (done) {
      chai
        .request(server)
        .put('/api/issues/test')
        .send({
          _id: id2,
        })

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'no update field(s) sent');
          assert.equal(res.body._id, id2);
          done();
        });
    });

    test('Update an issue with an invalid _id', function (done) {
      chai
        .request(server)
        .put('/api/issues/test')
        .send({
          _id: invalidId,
          issue_title: 'test title v2',
        })

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'could not update');
          assert.equal(res.body._id, invalidId);
          done();
        });
    });
  });

  // DELETE
  suite('DELETE /api/issues/{project}', function () {
    test('Delete an issue', function (done) {
      chai
        .request(server)
        .delete('/api/issues/test')
        .send({
          _id: id1,
        })

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.result, 'successfully deleted');
          assert.equal(res.body._id, id1);
          done();
        });
    });

    test('Delete an issue with an invalid _id', function (done) {
      chai
        .request(server)
        .delete('/api/issues/test')
        .send({
          _id: invalidId,
        })

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'could not delete');
          assert.equal(res.body._id, invalidId);
          done();
        });
    });

    test('Delete an issue with missing _id', function (done) {
      chai
        .request(server)
        .delete('/api/issues/test')
        .send({})

        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'missing _id');

          done();
        });
    });
  });
});
