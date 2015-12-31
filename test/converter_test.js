'use strict'

let convert = require('../lib/converter')
let document = require('./fixtures/ember-data-docs')
let assert = require('chai').assert
let _ = require('lodash')

function findType (document, type) {
  return document.data.filter(doc => doc.type === type)
}

describe('converting to a jsonapi document', function () {
  beforeEach(function () {
    this.model = convert(document)
  })

  afterEach(function () {
    this.model = null
  })

  describe('classes', function () {
    it('extracts all the classes', function () {
      let classCount = Object.keys(document.classes).length
      let classes = findType(this.model, 'class')

      assert.equal(classCount, classes.length)
    })

    it('adds the attributes to the `attributes` field', function () {
      let CLASS_ATTRIBUTES = ['name', 'shortname', 'file', 'line', 'description']
      let classes = findType(this.model, 'class')

      classes.forEach(klass => {
        let yuiDocClass = _.find(document.classes, k => klass.id === k.name)
        CLASS_ATTRIBUTES.forEach(attr => assert.equal(klass.attributes[attr], yuiDocClass[attr], 'blah should equal this property' + attr))
      })
    })

    it('adds descendants to the relationships objects', function () {
      let classes = findType(this.model, 'class')

      let parentClasses = _.uniq(_.values(document.classes)
        .filter(klass => klass.extends && !/^Ember/.exec(klass.extends))
        .map(klass => klass.extends))
        .sort()

      let classesWithDescendants = _.uniq(classes
        .filter(klass => klass.relationships.descendants.data.length)
        .map(klass => klass.attributes.name))
        .sort()

      assert.deepEqual(parentClasses, classesWithDescendants)
    })

    it('adds parentClass to the relationships object', function () {
      let classes = findType(this.model, 'class')

      let childrenFromFixtures = _.values(document.classes)
        .filter(klass => klass.extends)

      childrenFromFixtures.forEach(klass => {
        let model = _.find(classes, (c) => c.id === klass.name)
        assert.ok(model)
        assert.equal(model.relationships.parentClass.data.id, klass.extends)
        assert.equal(model.relationships.parentClass.data.type, 'class')
      })
    })

    it('adds methods as to attributes', function () {
      let classes = findType(this.model, 'class')

      let items = _.chain(document.classitems)
        .values()
        .filter('itemtype', 'method')
        .filter('class')
        .groupBy('class')
        .value()

      classes.forEach(klass => {
        let documentClassItems = klass.attributes.methods
        let classItems = items[klass.id] || []

        assert.equal(documentClassItems.length, classItems.length)

        classItems.forEach(yuiMethod => {
          let method = _.find(klass.attributes.methods, m => m.name === yuiMethod.name && yuiMethod.line === m.line)
          assert.deepEqual(method.file, yuiMethod.file)
          assert.deepEqual(method.line, yuiMethod.line)
          assert.deepEqual(method.description, yuiMethod.description)
          assert.deepEqual(method.name, yuiMethod.name)
          assert.deepEqual(method.params, yuiMethod.params)
          assert.deepEqual(method.return, yuiMethod.return)
          assert.deepEqual(method.access, yuiMethod.access)
        })
      })

      it('adds properties on the attributes object', function () {
        let classes = findType(this.model, 'class')

        let items = _.chain(document.classitems)
          .values()
          .filter('itemtype', 'property')
          .filter('class')
          .groupBy('class')
          .value()

        classes.forEach(klass => {
          let yuiProperties = items[klass.id] || []

          yuiProperties.forEach(yuiProperty => {
            let property = _.find(klass.attributes.properties, y => y.id === yuiProperty.name && yuiProperty.line === y.attributes.line)

            assert.ok(property)

            assert.equal(property.attributes.file, yuiProperty.file)
            assert.equal(property.attributes.line, yuiProperty.line)
            assert.equal(property.attributes.description, yuiProperty.description)
            assert.equal(property.attributes.name, yuiProperty.name)
            assert.equal(property.attributes.params, yuiProperty.params)
            assert.equal(property.attributes.return, yuiProperty.return)
            assert.equal(property.attributes.access, yuiProperty.access)
          })
        })
      })

      it('adds events to attributes', function () {
        let classes = findType(this.model, 'class')

        let items = _.chain(document.classitems)
          .values()
          .filter('itemtype', 'event')
          .filter('class')
          .groupBy('class')
          .value()

        classes.forEach(klass => {
          let classItems = klass.attributes.events

          let yuiEvents = items[klass.id] || []

          yuiEvents.forEach(yuiEvent => {
            let event = _.find(classItems, y => y.name === yuiEvent.name && yuiEvent.line === y.line)

            assert.ok(event)

            assert.deepEqual(event.file, yuiEvent.file)
            assert.deepEqual(event.line, yuiEvent.line)
            assert.deepEqual(event.description, yuiEvent.description)
            assert.deepEqual(event.name, yuiEvent.name)
            assert.deepEqual(event.params, yuiEvent.params)
            assert.deepEqual(event.return, yuiEvent.return)
          })
        })
      })

      it('attaches the module as a relationship', function () {
        let classes = findType(this.model, 'class')

        _.values(document.classes).forEach(docClass => {
          let klass = _.find(classes, c => c.id === docClass.name)

          if (docClass.module) {
            assert.deepEqual(klass.relationships.module.data, {
              id: docClass.module,
              type: 'module'
            })
          }
        })
      })
    })

    describe('modules', function () {
      beforeEach(function () {
        this.modules = findType(this.model, 'module')
        this.yuiModules = _.values(document.modules)
      })

      it('extracts all the modules', function () {
        this.yuiModules.forEach(module => {
          let mod = _.find(this.modules, m => m.id === module.name)

          assert.ok(mod)
          assert.equal(mod.type, 'module')
          assert.equal(mod.attributes.file, module.file)
          assert.equal(mod.attributes.line, module.line)
          assert.equal(mod.attributes.tag, module.tag)
          assert.equal(mod.attributes.description, module.description)
          assert.equal(mod.attributes.itemtype, module.itemtype)
        })
      })

      it('adds the classes as relationships', function () {
        this.yuiModules.forEach(module => {
          let mod = _.find(this.modules, m => m.id === module.name)
          let classes = Object.keys(module.classes)
          let relationshipLink = _.map(mod.relationships.classes.data, 'id')

          assert.deepEqual(relationshipLink, classes)
        })
      })
    })
  })
})
