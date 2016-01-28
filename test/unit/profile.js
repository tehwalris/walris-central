"use strict";
var _ = require('lodash'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  proxyquire = require('proxyquire'),
  socketMocks = require('socket-io-mocks'),
  Profile = require('../../src/profile');

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('profile', function () {
  var profile, socket;
  beforeEach(function () {
    socket = new socketMocks.socket();
    profile = new Profile('testProfile', socket);
  });
  it('allows sending an action', function () {
    let data = {};
    profile.execute('testAction', data);
    expect(socket.emit.args[0]).to.eql(['runAction', {
      profile: 'testProfile',
      action: 'testAction',
      data: data
    }]);
  });
  it('allows sending an action without data', function () {
    profile.execute('testAction');
    expect(socket.emit.args[0]).to.eql(['runAction', {
      profile: 'testProfile',
      action: 'testAction',
      data: undefined
    }]);
  });
});
