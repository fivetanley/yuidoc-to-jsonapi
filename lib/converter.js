'use strict';

let values = require('lodash.values');
let assign = require('lodash.assign');
let _      = require('lodash');

exports = module.exports = function converter(document) {
  let classes = values(document.classes);
  classes = classes.map(klass => extractClass(document, klass));

  let modules = values(document.modules).map(module => extractModule(document, module));
  let methods = values(document.classitems)
    .filter(item => item.itemtype === 'method')
    .map(method => extractMethod(document, method));

  let properties = values(document.classitems)
    .filter(item => item.itemtype === 'property')
    .map(property => extractProperty(document, property));

  let events = values(document.classitems)
    .filter(item => item.itemtype === 'event')
    .map(event => extractEvent(document, event));

  let data = _.flatten([classes, modules, methods, properties, events]);

  return {
    data: data
  };
};

let CLASS_ATTRIBUTES = ['name', 'shortname', 'file', 'line', 'description'];

function extractClass(document, klass) {
  let classes = values(document.classes);

  return {
    id: klass.name,
    type: 'class',
    attributes: attributes(document, klass),
    relationships: relationships(document, klass, classes)
  };
}

function attributes(document, klass) {
  let attributes = {};
  CLASS_ATTRIBUTES.forEach(attr => attributes[attr] = klass[attr]);

  return attributes;
}

function descendants(document, klass, classes) {
  return classes
    .filter(c => c.extends === klass.name)
    .map(c => ({type: 'class', id: c.name}));
}

function belongsTo(object, field, modelName) {
  if (object[field]) {
    return {
      id: object[field],
      type: modelName
    };
  }
  return null;
}

function classItems(klass, itemType, document) {
  return (
    document.classitems
    .filter(item => item.itemtype === itemType && item.class === klass.name)
    .map(item => ({type: item.itemtype, id: item.class + '#' + item.name}))
  );
}

function relationships(document, klass, classes) {
  return {
    parentClass: { data: belongsTo(klass, 'extends', 'class') },
    descendants: { data: descendants(document, klass, classes) },
    module: { data: belongsTo(klass, 'module', 'module') },
    methods: { data: classItems(klass, 'method', document) },
    events: { data: classItems(klass, 'event', document) }
  };
}

let MODULE_ATTRIBUTES = ['file', 'line', 'tag', 'description', 'itemtype'];

function extractModule(document, module) {
  let classes = Object.keys(module.classes || {});
  let attributes = {};

  MODULE_ATTRIBUTES.forEach(attr => attributes[attr] = module[attr]);

  return {
    id: module.name,
    type: 'module',
    attributes: attributes,

    relationships: {
      classes: {
        data: classes.map(klass => ({type: 'class', id: klass}))
      }
    }
  }
}

let METHOD_ATTRIBUTES = [
  'file',
  'line',
  'description',
  'name',
  'params',
  'return'
];

function extractMethod(document, method) {

  return {
    id: method.class + '#' + method.name,
    type: 'method',

    attributes: _.pick(method, METHOD_ATTRIBUTES),
    relationships: {
      class: {
        data: belongsTo(method, 'class', 'class')
      }
    }
  }
}

function extractProperty(document, property) {
  return {
    id: property.class + '#' + property.name,
    type: 'property',
    attributes: _.omit(property, ['class', 'module']),
    relationships: {
      class: {
        data: belongsTo(property, 'class', 'class')
      }
    }
  };
}

function extractEvent(document, event) {
  return {
    id: event.class + '#' + event.name,
    type: 'event',
    attributes: _.omit(event, ['class', 'module']),
    relationships: {
      class: {
        data: belongsTo(event, 'class', 'class')
      }
    }
  };
}
