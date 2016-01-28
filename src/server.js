"use strict";
var _ = require('lodash'),
  express = require('express'),
  bodyParser = require('body-parser'),
  http = require('http'),
  socketIO = require('socket.io'),
  Client = require('./client');

class Server {
  constructor () {
    this._app = express();
    this._http = http.Server(this._app);
    this._io = socketIO(this._http);
    this._clients = [];
    this._configureApp();
    this._configureSocket();
  }

  start (port) {
    let deferred = Promise.defer();
    this._http.once('listening', () => deferred.resolve());
    this._http.once('error', () => deferred.reject());
    this._http.listen(port);
    return deferred.promise;
  }

  _configureApp () {
    this._app.use(bodyParser.urlencoded({extended: false}));
    this._app.use(bodyParser.json());
    this._app.use(function (err, req, res, next) {
      console.error(err.stack);
      res.status(500).send('Internal error.');
      next(err);
    });
    this._app.get('/v', function (req, res) {
      res.send('walris-central:dev');
    });
    this._app.post('/sendCommand', (req, res) => {
      _.forEach(this._clients, (client) => {
        let profile = client.profiles[req.body.profile];
        if(profile)
          profile.execute(req.body.action, req.body.data);
      });
      res.sendStatus(200);
    });
  }

  _configureSocket () {
    this._io.on('connection', (socket) => {
      let client = new Client(socket);
      this._clients.push(client);
      client.on('up', () => this._clients.push(client));
      client.on('down', () => _.remove(this._clients, (c) => c === client));
    });
  }
}

module.exports = Server;
