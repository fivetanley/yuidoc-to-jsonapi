'use strict'

let values = require('lodash.values')
let _ = require('lodash')

exports = module.exports = function converter (document) {
  let classes = values(document.classes)
  classes = classes.map(klass => extractClass(document, klass))

  let modules = values(document.modules).map(module => extractModule(document, module))

  let data = _.flatten([classes, modules])

  return {
    data: data
  }
}

function extractClass (document, klass) {
  let classes = values(document.classes)

  return {
    id: klass.name,
    type: 'class',
    attributes: attributes(document, klass),
    relationships: relationships(document, klass, classes)
  }
}

function attributes (document, klass) {
  let attrs = _.omit(klass, ['class', 'itemtype'])
  let methods = classItems(klass, 'method', document)
  let events = classItems(klass, 'event', document)
  let properties = classItems(klass, 'property', document)

  return _.merge(attrs, {
    methods: methods,
    events: events,
    properties: properties
  })
}

function descendants (document, klass, classes) {
  return classes
    .filter(c => c.extends === klass.name)
    .map(c => ({type: 'class', id: c.name}))
}

function belongsTo (object, field, modelName) {
  if (object[field]) {
    return {
      id: object[field],
      type: modelName
    }
  }
  return null
}

function classItems (klass, itemType, document) {
  return (
  document.classitems
    .filter(item => item.itemtype === itemType && item.class === klass.name)
  )
}

function relationships (document, klass, classes) {
  return {
    'parent-class': { data: belongsTo(klass, 'extends', 'class') },
    descendants: { data: descendants(document, klass, classes) },
    module: { data: belongsTo(klass, 'module', 'module') }
  }
}

function extractModule (document, module) {
  let classes = Object.keys(module.classes || {})

  return {
    id: module.name,
    type: 'module',
    attributes: _.omit(module, ['class', 'module']),

    relationships: {
      classes: {
        data: classes.map(klass => ({type: 'class', id: klass}))
      }
    }
  }
}

