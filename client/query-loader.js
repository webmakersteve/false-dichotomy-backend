const fs = require('fs');
const glob = require('glob');
const pathUtil = require('path');

module.exports.loadFolder = function loadFolderOfQueries(path) {
  return new Promise((resolve, reject) => {
    glob(`${path}/*`, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(files);
      resolve(files);
    });
  });
};
