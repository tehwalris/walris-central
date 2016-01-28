"use strict";
var _ = require('lodash'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  proxyquire = require('proxyquire'),
  request = require('superagent'),
  Server = require('../../src/server'),
  Client = require('walris-central-client');

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('basic server/client integration', function () {
  var server, client;
  beforeEach(function () {
    server = new Server();
    client = new Client({profiles: {}});
  });
  it('actions get sent to clients', function () {
    var actionDeffered = Promise.defer(), responseDeffered = Promise.defer();
    client.config.profiles.testProfile = {
      actions: {
        testAction: sinon.spy(() => {
          actionDeffered.resolve();
        })
      }
    };
    return expect(server.start(4321)).to.be.fulfilled.then(() => {
      return expect(client.connect('http://localhost:4321')).to.be.fulfilled;
    }).then(() => {
      request.post('http://localhost:4321/sendCommand').send({
        profile: 'testProfile',
        action: 'testAction',
        data: {bestAnimal: 'walrus'}
      }).end((err, res) => {
        expect(res.status).to.equal(200);
        responseDeffered.resolve();
      });
      return Promise.all([responseDeffered.promise, actionDeffered.promise]);
    }).then(() => {
      let action = client.config.profiles.testProfile.actions.testAction;
      expect(action).to.have.been.calledOnce;
      expect(action).to.have.been.calledWithMatch({bestAnimal: 'walrus'});
    });
  });
});
