"use strict";
var _ = require('lodash');

class Profile {
  constructor (name, socket) {
    this.name = name;
    this._socket = socket;
  }

  execute (action, data) {
    this._socket.emit('runAction', {
      profile: this.name,
      action: action,
      data: data
    });
  }
}

module.exports = Profile;
