const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { Todo } = require('./../../models/todo');
const { User } = require('./../../models/user');

const userOneID = new ObjectID();
const userTwoID = new ObjectID();

const users = [
  {
    _id: userOneID,
    email: 'chris@example.com',
    password: 'userOnePass',
    tokens: [
      {
        access: 'auth',
        token: jwt.sign({_id: userOneID, access: 'auth'}, 'abc123').toString()
      }
    ]
  },
  {
    _id: userTwoID,
    email: 'jason@example.com',
    password: 'userTwoPass'
  }
];

const todos = [
  {
    _id: new ObjectID(),
    text: 'First test todo'
  },
  {
    _id: new ObjectID(),
    text: 'Second test todo',
    completed: true,
    completedAt: 333
  }
];

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo]);
  }).then(() => done());
};

const populateTodos = (done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
};

module.exports = {
  users,
  todos,
  populateUsers,
  populateTodos
};
