$(window).on('action:app.load', function () {
  var parseAndTranslate = app.parseAndTranslate;
  app.parseAndTranslate = function (template, blockName, data, callback) {
    require(['opencc'], function (opencc) {
      opencc.convertData(data, config.userLang, function (err, newData) {
        parseAndTranslate.call(app, template, blockName, newData, callback);
      });
    })
  }
});