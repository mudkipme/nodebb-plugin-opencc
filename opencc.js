const opencc = require('./static/lib/opencc');
const _ = module.parent.require('lodash');
const User = module.parent.require('./user');

const convertPaths = [
    ['breadcrumbs', 'text'],
    ['categories', 'descriptionParsed'],
    ['categories', 'name'],
    ['categories', 'posts', 'content'],
    ['categories', 'posts', 'topic.title'],
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
    'config.browserTitle'
];

function translatePath(data, newData, path) {
    if (!Array.isArray(path)) {
        path = [path];
    }
    if (path.length === 0) {
        return data;
    }
    const item = _.get(data, path[0]);
    const newItem = _.get(newData, path[0]);
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

function translate(userLang, data, callback) {
    opencc.convertData(data, userLang, function (err, newData) {
        if (err) {
            return callback(err);
        }
        convertPaths.forEach(function (path) {
            data = translatePath(data, newData, path);
        });
        callback(null, data);
    });
}

const OpenCC = {
    render({ req, res, templateData }, next) {
        const userLang = res.locals.config && res.locals.config.userLang;
        if (userLang) {
            translate(userLang, templateData, function (err, data) {
                next(err, { req: req, res: res, templateData: data });
            });
        } else if (req.uid) {
            User.getSettings(req.uid, function (err, settings) {
                if (err) {
                    return next(err);
                }
                translate(settings.userLang, templateData, function (err, data) {
                    next(err, { req: req, res: res, templateData: data });
                });
            });
        }
    },
    renderHeaderFooter({ req, res, templateValues }, next) {
        const userLang = res.locals.config && res.locals.config.userLang;
        translate(userLang, templateValues, function (err, data) {
            next(err, { req: req, res: res, templateValues: data });
        });
    }
};

module.exports = OpenCC;