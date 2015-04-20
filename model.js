var _, config, model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

require('angular-activerecord');

_ = require('underscore');

model = function(ActiveRecord) {
  var Collection, Model, PageableCollection, View;
  Model = (function(superClass) {
    extend(Model, superClass);

    function Model(attrs, opts) {
      if (attrs == null) {
        attrs = {};
      }
      if (opts == null) {
        opts = {};
      }
      this.$initialize(attrs, opts);
    }

    Model.prototype.$changedAttributes = function(diff) {
      return _.omit(Model.__super__.$changedAttributes.call(this, diff), '$$hashKey');
    };

    Model.prototype.$save = function(values, opts) {
      if (this.$hasChanged()) {
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

    Collection.prototype.$fetch = function(opts) {
      if (opts == null) {
        opts = {};
      }
      return new Promise((function(_this) {
        return function(fulfill, reject) {
          return _this.$sync('read', _this, opts).then(function(res) {
            var data;
            data = _this.$parse(res.data, opts);
            if (_.isArray(data)) {
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

    function PageableCollection(models, opts) {
      if (models == null) {
        models = [];
      }
      if (opts == null) {
        opts = {};
      }
      this.state = {
        count: 0,
        page: 0,
        per_page: 10,
        total_page: 0
      };
      PageableCollection.__super__.constructor.call(this, models, opts);
    }


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
      opts.params = opts.params || {};
      opts.params.page = this.state.page + 1;
      opts.params.per_page = opts.params.per_page || this.state.per_page;
      return new Promise((function(_this) {
        return function(fulfill, reject) {
          return _this.$sync('read', _this, opts).then(function(res) {
            var data;
            data = _this.$parse(res.data, opts);
            if ((data.count != null) && (data.results != null)) {
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
  View = (function() {
    function View(opts) {
      if (opts == null) {
        opts = {};
      }
      _.extend(this, _.pick(opts, 'model', 'collection', 'el', 'id', 'className', 'tagName', 'events'));
      _.each(this.events, (function(_this) {
        return function(handler, event) {
          return $scope.$on(event, _this[handler]);
        };
      })(this));
    }

    return View;

  })();
  return {
    Model: Model,
    Collection: Collection,
    PageableCollection: PageableCollection,
    View: View
  };
};

config = function() {};

angular.module('PageableAR', ['ActiveRecord']).config([config]);

angular.module('PageableAR').factory('pageableAR', ['ActiveRecord', model]);
