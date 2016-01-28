"use strict";
var _ = require('lodash'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  proxyquire = require('proxyquire'),
  socketMocks = require('socket-io-mocks'),
  express = require('express'),
  request = require('supertest'),
  EventEmitter = require('events');

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('server', function () {
  var Server, app, http, io, deps;
  beforeEach(function () {
    app = express();
    http = new EventEmitter();
    http.listen = sinon.spy();
    deps = {
      'socket.io': new socketMocks.server(),
      'http': {Server: sinon.stub().returns(http)},
      'express': sinon.stub().returns(app),
      './client': sinon.stub()
    };
    io = deps['socket.io']._io;
    Server = proxyquire('../../src/server', deps);
  });
  it('creates an express and socket.io server and starts listening', function () {
    let server = new Server(), started = false;
    let startPromise = server.start(4321).then(() => {started = true;});
    expect(deps.http.Server).to.have.been.calledWith(app);
    expect(deps['socket.io']).to.have.been.calledWith(http);
    expect(http.listen).to.have.been.calledOnce;
    expect(http.listen).to.have.been.calledWith(4321);
    expect(started).to.be.false;
    http.emit('listening');
    return expect(startPromise).to.be.fulfilled;
  });
  it('does not start if http server has an error', function () {
    let server = new Server();
    let startPromise = server.start(4321);
    http.emit('error');
    return expect(startPromise).to.be.rejected;
  });
  describe('(after startup)', function () {
      var server;
      beforeEach(function () {
        server = new Server();
        let startPromise = server.start(4321);
        http.emit('listening');
        return startPromise;
      });
      it('exposes itself as walris-central over http', function (done) {
        request(app).get('/v').expect((res) => {
          expect(_.startsWith(res.text, 'walris-central')).to.be.true;
        }).end(done);
      });
      describe('(with clients)', function () {
        var clients;
        beforeEach(function () {
          let profiles = _.times(3, function () {return {execute: sinon.spy()};});
          clients = _.times(2, () => new EventEmitter());
          clients[0].profiles = {'a': profiles[0], 'b': profiles[1]};
          clients[1].profiles = {'b': profiles[2]};
        });
        it('initializes clients with the correct socket', function () {
          deps['./client'].returns(clients[0]);
          let socket = io._connect();
          expect(deps['./client']).to.have.been.calledWith(socket);
        });
        it('executes action on all matching profiles', function (done) {
          deps['./client'].returns(clients[0]);
          io._connect();
          deps['./client'].returns(clients[1]);
          io._connect();
          let postData = {
            profile: 'b',
            action: 'testAction',
            data: {key: 'value'}
          };
          request(app).post('/sendCommand').send(postData).expect(200).expect(() => {
            expect(clients[0].profiles.a.execute).not.to.have.been.called;
            expect(clients[0].profiles.b.execute).to.have.been.calledOnce;
            expect(clients[0].profiles.b.execute.args[0]).to.eql(['testAction', postData.data]);
            expect(clients[1].profiles.b.execute).to.have.been.calledOnce;
            expect(clients[1].profiles.b.execute.args[0]).to.eql(['testAction', postData.data]);
          }).end(done);
        });
        it('does not send anything to disconnected clients', function (done) {
          deps['./client'].returns(clients[0]);
          io._connect();
          clients[0].emit('down');
          let postData = {profile: 'a', action: 'testAction'};
          request(app).post('/sendCommand').send(postData).expect(200).expect(() => {
            expect(clients[0].profiles.a.execute).not.to.have.been.called;
          }).end(done);
        });
      });
      it('has no problem if no profiles are found for executing action', function (done) {
          let postData = {profile: 'b', action: 'testAction'};
          request(app).post('/sendCommand').send(postData).expect(200, done);
      });
  });
});
