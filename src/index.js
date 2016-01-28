#!/usr/bin/env node
"use strict";
var argv = require('minimist')(process.argv.slice(2)),
  Server = require('./server');

let port = argv.port || 4420;
let server = new Server();
console.log('Starting walris-central');
server.start(port)
.then(() => console.log(`Listening on port ${port}.`))
.catch(() => console.error('Failed to start.'));
