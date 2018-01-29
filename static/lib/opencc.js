'use strict';

(function (factory) {
  function loadClient(language, namespace) {
    return Promise.resolve(jQuery.getJSON(config.relative_path + '/plugin/nodebb-plugin-opencc/static/dictionary.json?' + config['cache-buster']));
  }
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as a named module
    define('opencc', [], function () {
      return factory(loadClient);
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node
    (function () {
      function loadServer() {
        return Promise.resolve(require('../dictionary.json'));
      }

      module.exports = factory(loadServer);
    }());
  }
}(function (load) {

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

  function getDictionary(name, options = {}) {
    var { reverse } = options;
    var cacheName = reverse ? `R_${name}` : name;
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
    const maxLength = Object.keys(dictionary).reduce((maxLength, word) => Math.max(maxLength, word.length), 0);
    const translated = [];

    for (let i = 0, { length } = text; i < length; i++) {
      let found;

      for (let j = maxLength; j > 0; j--) {
        const target = text.substr(i, j);

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

  return {
    convertData: function (data, userLang, callback) {
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
        callback(null, JSON.parse(str));
      }).catch(function (err) {
        callback(err);
      });
    }
  };
}));