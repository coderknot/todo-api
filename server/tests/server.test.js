const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

var { app } = require('./../server');
const { Todo } = require('./../models/todo');
const { User } = require('./../models/user');
const { users, todos, populateUsers, populateTodos } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    var text = 'test todo text';

    request(app)
      .post('/todos')
      .send({
        text
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e) => {
          done(e);
        });
      });
  });

  it('should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find().then((todos) => {
          expect(todos.length).toBe(2);
          done();
        }).catch((e) => {
          done(e);
        });
      });
  });
});

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    var testID = new ObjectID().toHexString();

    request(app)
      .get(`/todos/${testID}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    var testID = '123abc';

    request(app)
      .get(`/todos/${testID}`)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should remove a todo', () => {
    var testID = todos[0]._id.toHexString();

    request(app)
      .delete(`/todos/${testID}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(testID);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(testID).then((todo) => {
          expect(todo).toNotExist();
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return 404 if todo not found', (done) => {
    var testID = new ObjectID().toHexString();

    request(app)
      .get(`/todos/${testID}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 if object id is invalid', (done) => {
    var testID = '123abc';

    request(app)
      .delete(`/todos/${testID}`)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    var testID = todos[0]._id.toHexString();
    var text = 'updated text test';
    var completed = true;

    request(app)
      .patch(`/todos/${testID}`)
      .send({
        text,
        completed
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(completed);
        expect(res.body.todo.completedAt).toBeA('number');
      })
      .end(done);
  });

  it('should clear completedAt when todo is not completed', (done) => {
    var testID = todos[1]._id.toHexString();
    var text = 'second updated text test';
    var completed = false;

    request(app)
      .patch(`/todos/${testID}`)
      .send({
        text,
        completed
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(completed);
        expect(res.body.todo.completedAt).toNotExist();
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    var email = 'test@example.com';
    var password = '123test!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        });
      });
  });

  it('should return validation error if email is invalid', (done) => {
    var email = 'test';
    var password = '123test!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .end(done);
  });

  it('should return validation error if password is invalid', (done) => {
    var email = 'test@example.com';
    var password = '1a';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .end(done);
  });

  it('should not create the user if email is in use', (done) => {
    var email = users[0].email;
    var password = '123test!';

    request(app)
      .post('/users/')
      .send({email, password})
      .expect(400)
      .end(done);
  });
});
