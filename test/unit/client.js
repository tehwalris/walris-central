"use strict";
var _ = require('lodash'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  proxyquire = require('proxyquire'),
  socketMocks = require('socket-io-mocks');

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('client', function () {
  var client, deps, socket;
  beforeEach(function () {
    socket = new socketMocks.socket();
    deps = {
      './profile': function (p, s) {return {fakeProfileFor: p, socket: s};}
    };
    var Client = proxyquire('../../src/client', deps);
    client = new Client(socket);
  });
  it('exposes config once client registers', function () {
    let config = {};
    expect(client.config).to.be.undefined;
    socket._handlers.register(config);
    expect(client.config).to.equal(config);
  });
  it('provides array of profile objects', function () {
    socket._handlers.register({
      profiles: ['walrus', 'fish']
    });
    expect(client.profiles).to.be.an.array;
    let fishProfile = _.find(client.profiles, ['fakeProfileFor', 'fish']);
    let walrusProfile = _.find(client.profiles, ['fakeProfileFor', 'walrus']);
    expect(fishProfile.socket).to.equal(socket);
    expect(walrusProfile.socket).to.equal(socket);
  });
  it('notifies when client comes up or goes down', function () {
    var upSpy = sinon.spy(), downSpy = sinon.spy();
    client.on('up', upSpy);
    client.on('down', downSpy);
    expect(upSpy).not.to.have.been.called;
    expect(downSpy).not.to.have.been.called;
    socket._handlers.connect();
    expect(upSpy).to.have.been.calledOnce;
    expect(downSpy).not.to.have.been.called;
    socket._handlers.disconnect();
    expect(upSpy).to.have.been.calledOnce;
    expect(downSpy).to.have.been.calledOnce;
    socket._handlers.connect();
    expect(upSpy).to.have.been.calledTwice;
    expect(downSpy).to.have.been.calledOnce;
  });
});
