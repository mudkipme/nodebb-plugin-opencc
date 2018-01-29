'use strict';

(function (factory) {
  function loadClient(language, namespace) {
    return Promise.resolve(jQuery.getJSON(config.relative_path + '/plugins/nodebb-plugin-opencc/static/dictionary.json?' + config['cache-buster']));
  }
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as a named module
    define('opencc', ['lodash.getset'], function (lodash) {
      return factory(loadClient, lodash);
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node
    (function () {
      function loadServer() {
        return Promise.resolve(require('../dictionary.json'));
      }

      module.exports = factory(loadServer, require('./lodash'));
    }());
  }
}(function (load, _) {

  var dictionaries = null;

  function loadCache() {
    if (dictionaries) {
      return Promise.resolve();
    }
    return load().then(function (dict) {
      dictionaries = dict;
    });
  }

  // node-opencc
  // The MIT License (MIT)
  // Copyright(c) 2017 William Wong

  var cachedDictionaries = {};

  function getDictionary(name, options) {
    options = options || {};
    var reverse = options.reverse;
    var cacheName = reverse ? ('R_' + name) : name;
    var dictionary = cachedDictionaries[cacheName];

    return dictionary || (cachedDictionaries[cacheName] = dictionaries[name].reduce(function (map, entry) {
      var first = options.reverse ? 1 : 0;

      map[entry[first]] = entry[1 - first];

      return map;
    }, {}));
  }

  function convertChain(input, chains) {
    return chains.reduce(function (input, chain) {
      var dictionaries = chain.slice();

      dictionaries.splice(0, 0, {});

      return translate(input, Object.assign.apply(null, dictionaries));
    }, input);
  }

  function simplifiedToTraditional(text) {
    return convertChain(text, [
      [
        getDictionary('STPhrases'),
        getDictionary('STCharacters')
      ]
    ]);
  };

  function traditionalToSimplified(text) {
    return convertChain(text, [
      [
        getDictionary('TSPhrases'),
        getDictionary('TSCharacters')
      ]
    ]);
  };

  function translate(text, dictionary) {
    var maxLength = Object.keys(dictionary).reduce(function (maxLength, word) {
      return Math.max(maxLength, word.length);
    }, 0);
    var translated = [];

    var found;
    for (var i = 0, length = text.length; i < length; i++) {
      found = 0;

      for (var j = maxLength; j > 0; j--) {
        var target = text.substr(i, j);

        if (Object.hasOwnProperty.call(dictionary, target)) {
          i += j - 1;
          translated.push(dictionary[target]);
          found = 1;
          break;
        }
      }

      !found && translated.push(text[i]);
    }

    return translated.join('');
  }

  function translatePath(data, newData, path) {
    if (!Array.isArray(path)) {
      path = [path];
    }
    if (path.length === 0) {
      return data;
    }
    var item = _.get(data, path[0]);
    var newItem = _.get(newData, path[0]);
    if (path.length === 1) {
      if (typeof item === 'string') {
        _.set(data, path[0], newItem);
      }
      return data;
    }
    if (Array.isArray(item)) {
      _.set(data, path[0], item.map(function (entry, index) {
        return translatePath(entry, newItem[index], path.slice(1));
      }));
    }
    return data;
  }

  return {
    convertData: function (data, convertPaths, userLang, callback) {
      if (!userLang || !userLang.toLowerCase().match(/^zh-(hans|cn|sg|my|hant|tw|hk|mo)$/)) {
        return callback(null, data);
      } 
      loadCache().then(function () {
        var str = JSON.stringify(data);
        if (userLang.toLowerCase().match(/^zh-(hans|cn|sg|my)$/)) {
          str = traditionalToSimplified(str);
        } else {
          str = simplifiedToTraditional(str);
        }
        var newData = JSON.parse(str);
        convertPaths.forEach(function (path) {
          data = translatePath(data, newData, path);
        });
        callback(null, data);
      }).catch(function (err) {
        callback(err);
      });
    }
  };
}));