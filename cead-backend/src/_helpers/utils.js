const fs = require('fs');


function isNull(val) {
  return val === null || val === undefined;
}


async function readJson(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(require.resolve(path), (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}


async function jsonBatchLoad(array) {
  let promises = [];
  for (let file of array) {
    promises.push(readJson(file));
  }
  return Promise.all(promises);
}


function swapValue(obj, a, b) {
  let temp;
  if (!(obj.hasOwnProperty(a) && obj.hasOwnProperty(b))) {
    throw new Error('wrong key name in swapValue function');
  }
  temp = obj[a];
  obj[a] = obj[b];
  obj[b] = temp;
}


function objFlatten(ob, saveKeyName) {

  // The object which contains the
  // final result
  let result = {};

  // loop through the object "ob"
  for (const i in ob) {

    // We check the type of the key using
    // typeof() function and recursively
    // call the function again
    if ((typeof ob[i]) === 'object' && !Array.isArray(ob[i])) {
      const temp = objFlatten(ob[i]);
      for (const j in temp) {
        // Store temp in result
        if (saveKeyName)
          result[i + '.' + j] = temp[j];
        else
          result[j] = temp[j];
      }
    }

    // Else store ob[i] in result directly
    else {
      result[i] = ob[i];
    }
  }
  return result;
}


function getMaxKey(obj) {
  if ((typeof obj) === 'object' && !Array.isArray(obj)) {
    return Object.keys(obj).
        map(v => parseInt(v, 10)).
        sort((a, b) => b - a)[0] || 0;
  }
}


function removeNullKeys(obj) {
  for (let firstKey in obj) {
    if (obj.hasOwnProperty(firstKey))
      for (let secondKey in obj[firstKey]) {
        if (isNull(obj[firstKey][secondKey]))
          delete obj[firstKey][secondKey];
      }
  }
}


function changeKeysToString(obj, keys) {
  if (obj && Array.isArray(keys))
    for (let firstKey in obj) {
      if (obj.hasOwnProperty(firstKey))
        for (let secondKey in obj[firstKey]) {
          if (keys.includes(secondKey))
            obj[firstKey][secondKey] = obj[firstKey][secondKey].toString();
        }
    }
}


/**
 * Returns maximum element of an array even if the array has undefined value
 * @param array
 * @returns {*}
 */
function getMax(array) {
  return array.reduce(function(a, b) {
    return Math.max(a || 0, b);
  }, -Infinity);
}


module.exports = {
  readJson,
  jsonBatchLoad,
  swapValue,
  getMaxKey,
  removeNullKeys,
  changeKeysToString,
  getMax,
};
