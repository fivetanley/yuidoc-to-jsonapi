'use strict';

let values = require('lodash.values');
let assign = require('lodash.assign');

exports = module.exports = function converter(document) {
  let data = {};

  let classes = values(document.classes);
  classes = classes.map(klass => extractClass(document, klass));

  return {
    data: classes
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
  attributes.classItems = document.classitems.filter(item => item.class === klass.name);

  return attributes;
}

function descendants(document, klass, classes) {
  return classes
    .filter(c => c.extends === klass.name)
    .map(c => ({type: 'class', id: c.name}));
}

function parentClass(klass) {
  if (klass.extends) {
    return {
      id: klass.extends,
      type: 'class'
    }
  }
  return null;
}

function relationships(document, klass, classes) {
  return {
    parentClass: { data: parentClass(klass) },
    descendants: { data: descendants(document, klass, classes) }
  };
}
