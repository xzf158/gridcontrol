
var path            = require('path');
var request         = require('request');
var constants       = require('../lib/constants.js');
var FilesManagement = require('../lib/files/file_manager.js');
var Compress        = require('../lib/files/compress.js');
var fs              = require('fs');
var Helper          = require('./helpers.js');
var should          = require('should');

var src_folder = path.join(__dirname, 'fixtures');
var dst_gzip   = path.join(__dirname, 'sync.tar.gz');

// Expose sample server that exposes synchronized file
function sampleServer(cb) {
  var express    = require('express');
  var app  = express();

  app.get('/files/get_current_sync', function(req, res, next) {
    var sync = fs.createReadStream(dst_gzip);
    sync.pipe(res);
  });

  app.listen(10000, function() {
    console.log('Compressing to %s', dst_gzip);
    Compress.pack(src_folder, dst_gzip, function(err) {
      if (err) console.error('WTF');
      cb();
    });
  });
}

describe('Files', function() {
  var file_manager_slave;

  before(function(done) {
    sampleServer(done);
  });

  it('should instanciate new file manager', function(done) {
    file_manager_slave = new FilesManagement({
      dest_file   : '/tmp/nene.tar.gz',
      dest_folder : '/tmp/glouglou'
    });
    done();
  });

  it('should file manager be slave', function(done) {
    should(file_manager_slave.isFileMaster()).be.false;
    done();
  });

  it('should file manager has no file to sync', function() {
    should(file_manager_slave.hasFileToSync()).be.false;
  });

  it('should file path be right', function() {
    should(file_manager_slave.getFilePath()).eql('/tmp/glouglou');
  });

  it('should synchronize (get tarball + unzip)', function(done) {
    file_manager_slave.synchronize('localhost', 10000, function() {
      done();
    });
  });

  it('should synchronized file manager stay slave', function() {
    should(file_manager_slave.isFileMaster()).be.false;
  });

  it('should synchronized file manager has not file to sync', function() {
    should(file_manager_slave.hasFileToSync()).be.false;
  });

  it('should have the tarball existing', function(done) {
    fs.lstatSync('/tmp/nene.tar.gz');
    done();
  });

  it('should have the tarball unzipped', function(done) {
    fs.lstatSync('/tmp/glouglou');
    done();
  });

  it('should clear all tmp files/folder', function(done) {
    file_manager_slave.clear(done);
  });

});