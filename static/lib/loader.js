$(window).on('action:app.load', function () {
  var parseAndTranslate = app.parseAndTranslate;
  var convertPaths = [
    ['topics', 'title'],
    ['topics', 'category.name'],
    ['topics', 'teaser.content'],
    ['posts', 'content'],
    ['posts', 'category.name'],
    ['posts', 'user.groupTitle'],
    ['posts', 'user.signature']
  ];
  app.parseAndTranslate = function (template, blockName, data, callback) {
    var oldData = data;
    if (typeof blockName !== 'string') {
      oldData = blockName;
    }
    require(['opencc'], function (opencc) {
      opencc.convertData(oldData, convertPaths, config.userLang, function (err, newData) {
        parseAndTranslate.call(app, template, blockName, newData, callback);
      });
    })
  }
});