"use strict";
var _ = require('lodash'),
  Profile = require('./profile'),
  EventEmitter = require('events');

class Client {
  constructor (socket) {
    this._socket = socket;
    this._eventEmitter = new EventEmitter();
    this.on = this._eventEmitter.on;
    this._configureSocket();
  }

  _configureSocket () {
    this._socket.on('connect', this._eventEmitter.emit.bind(this, 'up'));
    this._socket.on('disconnect', this._eventEmitter.emit.bind(this, 'down'));
    this._socket.on('register', (config) => {this.config = config;});
  }

  get profiles () {
    let profileNames = _.get(this.config, 'profiles');
    if(!profileNames) return {};
    return _.zipObject(profileNames, _.map(profileNames, (name) => new Profile(name, this._socket)));
  }
}

module.exports = Client;
