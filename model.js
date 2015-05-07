var _, model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

require('angular-activerecord');

_ = require('underscore');

model = function(ActiveRecord) {
  var Collection, Model, PageableCollection;
  Model = (function(superClass) {
    extend(Model, superClass);

    function Model(attrs, opts) {
      if (attrs == null) {
        attrs = {};
      }
      if (opts == null) {
        opts = {
          parse: true
        };
      }
      this.$initialize(attrs, opts);
    }

    Model.prototype.$hasChanged = function() {
      return Model.__super__.$hasChanged.call(this) || _.some(this.$previousAttributes(), function(attr) {
        return _.isObject(attr);
      });
    };

    Model.prototype.$changedAttributes = function(diff) {
      return _.omit(Model.__super__.$changedAttributes.call(this, diff), '$$hashKey');
    };

    Model.prototype.$save = function(values, opts) {
      if (this.$isNew() || this.$hasChanged()) {
        return Model.__super__.$save.call(this, values, opts);
      } else {
        return new Promise(function(fulfill, reject) {
          return fulfill(this);
        });
      }
    };

    return Model;

  })(ActiveRecord);
  Collection = (function(superClass) {
    extend(Collection, superClass);

    function Collection(models1, opts) {
      this.models = models1 != null ? models1 : [];
      if (opts == null) {
        opts = {};
      }
      Collection.__super__.constructor.call(this, {}, opts);
      this.length = this.models.length;
    }

    Collection.prototype.add = function(models, opts) {
      var singular;
      if (opts == null) {
        opts = {};
      }
      singular = !_.isArray(models);
      if (singular && (models != null)) {
        models = [models];
      }
      return _.each(models, (function(_this) {
        return function(item) {
          if (!_this.contains(item)) {
            _this.models.push(item);
            return _this.length++;
          } else {
            model = _.find(_this.models, function(model) {
              return model[_this.idAttribute] === item[_this.idAttribute];
            });
            return _.extend(model, _.omit(item, '$$hashKey'));
          }
        };
      })(this));
    };

    Collection.prototype.remove = function(models, opts) {
      var singular;
      if (opts == null) {
        opts = {};
      }
      singular = !_.isArray(models);
      if (singular && (models != null)) {
        models = [models];
      }
      _.each(models, (function(_this) {
        return function(model) {
          return model.$destroy().then(function() {
            return _this.models = _.filter(_this.models, function(item) {
              return item[_this.$idAttribute] !== model[_this.$idAttribute];
            });
          });
        };
      })(this));
      return this.length = this.models.length;
    };

    Collection.prototype.contains = function(model) {
      var cond, ret;
      cond = function(a, b) {
        return a === b;
      };
      if (typeof model === 'object') {
        cond = (function(_this) {
          return function(a, b) {
            return a[_this.$idAttribute] === b[_this.$idAttribute];
          };
        })(this);
      }
      ret = _.find(this.models, (function(_this) {
        return function(elem) {
          return cond(model, elem);
        };
      })(this));
      return ret != null;
    };

    Collection.prototype.reset = function() {
      this.length = 0;
      this.models = [];
      return this.$initialize({}, {
        reset: true
      });
    };

    Collection.prototype.$fetch = function(opts) {
      if (opts == null) {
        opts = {};
      }
      if (opts.reset) {
        this.reset();
      }
      return new Promise((function(_this) {
        return function(fulfill, reject) {
          return _this.$sync('read', _this, opts).then(function(res) {
            var data;
            data = _this.$parse(res.data, opts);
            if (_.isArray(data)) {
              data = _.map(data, function(value) {
                return new _this.model(value);
              });
              _this.add(data);
              return fulfill(_this);
            } else {
              return reject('Not a valid response type');
            }
          })["catch"](reject);
        };
      })(this));
    };

    return Collection;

  })(Model);
  PageableCollection = (function(superClass) {
    extend(PageableCollection, superClass);

    function PageableCollection() {
      return PageableCollection.__super__.constructor.apply(this, arguments);
    }

    PageableCollection.prototype.$defaults = function() {
      return {
        state: {
          count: 0,
          page: 0,
          per_page: 10,
          total_page: 0
        }
      };
    };


    /*
    		opts:
    			params:
    				page:		page no to be fetched (first page = 1)
    				per_page:	no of records per page
     */

    PageableCollection.prototype.$fetch = function(opts) {
      if (opts == null) {
        opts = {};
      }
      if (opts.reset) {
        this.reset();
      }
      opts.params = opts.params || {};
      opts.params.page = this.state.page + 1;
      opts.params.per_page = opts.params.per_page || this.state.per_page;
      return new Promise((function(_this) {
        return function(fulfill, reject) {
          return _this.$sync('read', _this, opts).then(function(res) {
            var data;
            data = _this.$parse(res.data, opts);
            if ((data.count != null) && (data.results != null)) {
              data.results = _.map(data.results, function(value) {
                return new _this.model(value);
              });
              _this.add(data.results);
              _this.state = _.extend(_this.state, {
                count: data.count,
                page: opts.params.page,
                per_page: opts.params.per_page,
                total_page: Math.ceil(data.count / opts.params.per_page)
              });
              return fulfill(_this);
            } else {
              return reject('Not a valid response type');
            }
          })["catch"](reject);
        };
      })(this));
    };

    return PageableCollection;

  })(Collection);
  return {
    Model: Model,
    Collection: Collection,
    PageableCollection: PageableCollection
  };
};

angular.module('PageableAR', ['ActiveRecord']).factory('pageableAR', ['ActiveRecord', model]);
