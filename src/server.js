"use strict";
var _ = require('lodash'),
  app = require('express')(),
  bodyParser = require('body-parser'),
  http = require('http').Server(app),
  io = require('socket.io')(http);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

let components = {};

app.get('/', function (req, res) {
  res.send('walris-central:dev');
});

app.post('/sendCommand', function (req, res) {
  console.log(req.body);
  let component = components[_.get(req, 'body.component')];
  if(component)
    component.socket.emit('runAction', req.body.action, req.body.body);
  else
    console.log('Component not found');
  res.send();
});

io.on('connection', function (socket) {
  socket.on('register', (data) => {
    components[data.component] = {socket: socket};
    console.log(`Registered ${data.component}.`);
  });
  socket.on('disconnect', (data) => {
    const component = _.findKey(components, (component) => component.socket === socket);
    if(component) {
      delete components[component];
      console.log(`Deregistered ${component}`);
    }
  });
});

const port = 4420;
http.listen(port, function () {
  console.log(`Listening on ${port}`);
});
