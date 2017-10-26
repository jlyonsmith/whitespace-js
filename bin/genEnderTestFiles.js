#!/usr/bin/env node

var fs = require('fs')

fs.writeFileSync('cr.txt', '\r')
fs.writeFileSync('lf.txt', '\n')
fs.writeFileSync('crlf.txt', '\r\n')
fs.writeFileSync('mixed1.txt', '\n\r\n\r')
fs.writeFileSync('mixed2.txt', '\n\n\r\n\r')
fs.writeFileSync('mixed3.txt', '\n\r\n\r\r')
fs.writeFileSync('mixed4.txt', '\n\r\n\r\r\n')
