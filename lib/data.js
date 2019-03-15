/*
    Library for storing and editing data

*/

var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

var lib = {};

//base dir for data folder
lib.baseDir = path.join(__dirname, '/../.data/')

lib.baseDir = path.join(__dirname,'/../.data/');

// Write data to a file
lib.create = function(dir,file,data,callback){
  let subdirs = dir.split('/')
  let path = lib.baseDir;

  for (let dir of subdirs) {
    path += dir + '/'
    if (!fs.existsSync(path)){
      fs.mkdirSync(path);
    }
  }
  // Open the file for writing
  fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
    if(!err && fileDescriptor){
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData,function(err){
        if(!err){
          fs.close(fileDescriptor,function(err){
            if(!err){
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file, it may already exist');
    }
  });

};

//read the file
lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', (err, data) => {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data)
      callback(false, parsedData)
    } 
    else {
      callback(err, data)
    }
    
  })
}

//update

lib.update = (dir, file, data, callback) => {
  //open the file
  fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      var stringData = JSON.stringify(data);

      fs.truncate(fileDescriptor, (err) => {
        if (!err) {
          //write to the file
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err) => {
                if (!err) {
                  callback(false)
                }
                else {
                  callback('error closing file!')
                }
              })
            }
            else {
              callback('error writing to existing file!')
            }
          })
        }
        else {
          callback('error truncating file')
        }
      })
    } 
    else {
      callback('could not open file for update, it may not exists yet')
    }
  })
}

//delete
lib.delete = (dir, file, callback) => {
  //unlink the file
  fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err) => {
    if (!err) {
      callback(false)
    }
    else {
      callback('error deleting file!!')
    }
  })
}


lib.list = (dir, callback) => {
  fs.readdir(lib.baseDir+dir+'/', (err, data) => {
    if (!err && data && data.length > 0) {
      var trimmedFileNames = [];
      data.forEach((fileName) => {
        trimmedFileNames.push(fileName.replace('.json', ''))
      })
      callback(false, trimmedFileNames)
    } else {
      callback('Error opening dir!')
    }
  })
}
module.exports = lib;
