'use strict';

let convert = require('../lib/converter');
let document = require('./fixtures/ember-data-docs');
let assert = require('chai').assert;
let _ = require('lodash');

let findClasses = (document) => document.data.filter(doc => doc.type === 'class');
let findModules = (document) => document.data.filter(doc => doc.type === 'module');

describe('converting to a jsonapi document', function(){

  beforeEach(function(){
    this.model = convert(document);
  });

  afterEach(function() {
    this.model = null;
  });

  describe('classes', function() {

    it('extracts all the classes', function() {
      let classCount = Object.keys(document.classes).length;
      let classes = findClasses(this.model);

      assert.equal(classCount, classes.length);
    });

    it('adds the attributes to the `attributes` field', function() {
      let CLASS_ATTRIBUTES = ['name', 'shortname', 'file', 'line', 'description'];
      let classes = findClasses(this.model);

      classes.forEach(klass => {
        CLASS_ATTRIBUTES.forEach(attr => assert.property(klass.attributes, attr));
      });
    });

    it('adds descendants to the relationships objects', function() {
      let classes = findClasses(this.model);

      let parentClasses = _.uniq(_.values(document.classes)
                            .filter(klass => klass.extends && !/^Ember/.exec(klass.extends))
                            .map(klass => klass.extends))
                            .sort();

      let classesWithDescendants = _.uniq(classes
          .filter(klass => klass.relationships.descendants.data.length)
          .map(klass => klass.attributes.name))
          .sort();

      assert.deepEqual(parentClasses, classesWithDescendants);
    });

    it('adds parentClass to the relationships object', function() {
      let classes = findClasses(this.model);

      let childrenFromFixtures = _.values(document.classes)
                                 .filter(klass => klass.extends);

      childrenFromFixtures.forEach(klass => {
        let model = _.find(classes, (c) => c.id === klass.name);
        assert.ok(model);
        assert.equal(model.relationships.parentClass.data.id, klass.extends);
      });
    });

    it('attaches methods as a relationship', function() {
      let classes = findClasses(this.model);

      let items = _.chain(document.classitems)
                    .values()
                    .filter('itemtype', 'method')
                    .groupBy('class')
                    .value();

      classes.forEach(klass => {
        let classItems = klass.relationships.methods.data;

        function relationshipIDs(klass) {
          return (items[klass.id] || []).map(function(item) {
            return item.class + '#' + item.name;
          });
        }

        assert.deepEqual(_.map(classItems, 'id'), relationshipIDs(klass));
      });
    });

    it('attaches events as a relationship', function() {
      let classes = findClasses(this.model);

      let items = _.chain(document.classitems)
                    .values()
                    .filter('itemtype', 'event')
                    .groupBy('class')
                    .value();

      classes.forEach(klass => {
        let classItems = klass.relationships.events.data;

        function relationshipIDs(klass) {
          return (items[klass.id] || []).map(function(item) {
            return item.class + '#' + item.name;
          });
        }

        assert.deepEqual(_.map(classItems, 'id'), relationshipIDs(klass));
      });

    });

    it('attaches the module as a relationship', function() {
      let classes = findClasses(this.model);

      _.values(document.classes).forEach(docClass => {
        let klass = _.find(classes, c => c.id === docClass.name);

        if (docClass.module) {
          assert.deepEqual(klass.relationships.module.data, {
            id: docClass.module,
            type: 'module'
          });
        }
      });
    });

  });

  describe('modules', function() {

    beforeEach(function() {
      this.modules = findModules(this.model);
      this.yuiModules = _.values(document.modules);
    });

    it('extracts all the modules', function() {
      this.yuiModules.forEach(module => {
        let mod = _.find(this.modules, m => m.id === module.name);

        assert.ok(mod);
        assert.equal(mod.type, 'module');
        assert.equal(mod.attributes.file, module.file);
        assert.equal(mod.attributes.line, module.line);
        assert.equal(mod.attributes.tag, module.tag);
        assert.equal(mod.attributes.description, module.description);
        assert.equal(mod.attributes.itemtype, module.itemtype);
      });
    });

    it('adds the classes as relationships', function() {
      this.yuiModules.forEach(module => {
        let mod = _.find(this.modules, m => m.id === module.name);
        let classes = Object.keys(module.classes);
        let relationshipLink = _.map(mod.relationships.classes.data, 'id');

        assert.deepEqual(relationshipLink, classes);
      });
    });
  });
});

