'use strict';

var convert = require('../lib/converter');
var document = require('./fixtures/ember-data-docs');
var assert = require('chai').assert;
var _ = require('lodash');

let findClasses = (document) => document.data.filter(doc => doc.type === 'class');

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

    it('attaches classItems to the attributes object', function() {
      let classes = findClasses(this.model);

      let items = _.chain(document.classitems)
                    .values()
                    .groupBy('class')
                    .value();

      classes.forEach(klass => {
        let classItems = klass.attributes.classItems;

        assert.deepEqual(classItems, items[klass.id] || []);
      });
    });
  });

});

