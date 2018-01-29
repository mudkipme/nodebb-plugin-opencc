const opencc = require('./static/lib/opencc');
const _ = module.parent.require('lodash');
const User = module.parent.require('./user');

const convertPaths = [
    ['breadcrumbs', 'text'],
    ['categories', 'descriptionParsed'],
    ['categories', 'name'],
    ['categories', 'posts', 'content'],
    ['groups', 'displayName'],
    'location',
    'signature',
    'description',
    ['posts', 'content'],
    ['posts', 'category.name'],
    'descriptionParsed',
    'name',
    ['topics', 'title'],
    ['topics', 'category.name'],
    'title',
    ['posts', 'user.groupTitle'],
    ['posts', 'user.signature'],
    'category.name',
    'config.siteTitle',
    'config.browserTitle',
    ['categories', 'children', 'name'],
    ['categories', 'children', 'descriptionParsed'],
    ['topics', 'teaser.content'],
    ['children', 'name'],
    ['children', 'descriptionParsed'],
    ['children', 'posts', 'content'],
];

const OpenCC = {
    render({ req, res, templateData }, next) {
        const userLang = res.locals.config && res.locals.config.userLang;
        if (userLang) {
            opencc.convertData(templateData, convertPaths, userLang, function (err, data) {
                next(err, { req: req, res: res, templateData: data });
            });
        } else if (req.uid) {
            User.getSettings(req.uid, function (err, settings) {
                if (err) {
                    return next(err);
                }
                opencc.convertData(templateData, convertPaths, settings.userLang, function (err, data) {
                    next(err, { req: req, res: res, templateData: data });
                });
            });
        } else {
            next(null, { req: req, res: res, templateData: templateData });
        }
    },
    renderHeaderFooter({ req, res, templateValues }, next) {
        const userLang = res.locals.config && res.locals.config.userLang;
        opencc.convertData(templateValues, convertPaths, userLang, function (err, data) {
            next(err, { req: req, res: res, templateValues: data });
        });
    }
};

module.exports = OpenCC;