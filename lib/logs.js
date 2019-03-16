var fs = require('fs');
var path = require('path');
var zlib = require('zlib');


var lib = {};

lib.baseDir = path.join(__dirname,'/../.logs/');


lib.append = (file, str, callback) => {
    //open the file for appending
    fs.open(lib.baseDir+file+'.log', 'a', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            fs.appendFile(fileDescriptor, str+'\n\n', (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false)
                        } else {
                            callback('Error closing file!')
                        }
                    })
                } else {
                    callback('Error appending to a file!')
                }
            });
        } else {
            callback('Could not open file for appending')
        }
    })
}

lib.list = (includeCompressedLogs, callback) => {
    fs.readdir(lib.baseDir, (err, data) => {
        if (!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach((fileName) => {
                //add the .log files
                if (fileName.indexOf('.log') > -1 ) {
                    trimmedFileNames.push(fileName.replace('.log', ''))
                }

                if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''))
                }
            })
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    })
}

lib.compress = (logId, newFileId, callback) => {
    var sourceFile = logId+'.log';
    var destFile = newFileId+'.gz.b64';

    //Read the source file
    fs.readFile(lib.baseDir+sourceFile, 'utf8', (err, inputString) => {
        if (!err && inputString) {
            //compress using zlib
            zlib.gzip(inputString, (err, buffer) => {
                if (!err && buffer) {
                    fs.open(lib.baseDir+destFile, 'wx', (err, fileDescriptor) => {
                        if (!err && fileDescriptor) {
                           //write the dest file
                           fs.writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
                               if (!err) {
                                   fs.close(fileDescriptor, (err) => {
                                       if (!err) {
                                            callback(false)
                                       } else {
                                           callback(err)
                                       }
                                   })

                               } else {
                                   callback(err)
                               }
                           }) 
                        } else {
                            callback(err)
                        }
                    })
                } else {
                    callback(err)
                }
            })
        } else {
            callback(err)
        }
    })

} 


lib.decompress = (fileId, callback) => {
    var fieName = fileId + '.gz.b64';

    fs.readFile(lib.baseDir+fileName, 'utf8', (err, data) => {
        if (!err && str) {
            //decompress the string!
            var inputBuffer = Buffer.from(str, 'pase64');

            zlib.unzip(inputBuffer, (err, outputBuffer) => {
                if (!err && outputBuffer) {
                    //callback
                    var uncompressedStr = outputBuffer.toString();
                    callback(false, str);s
                } else {
                    callback(err)
                }
            })
        } else {
            callback(err)
        }
    })
}

lib.truncate = (logId, callback) => {
    fs.truncate(lib.baseDir+logId+'.log', 0, (err) => {
        if (!err) {
            callback(false)
        } else {
            callback(err)
        }
    })
}




module.exports = lib;