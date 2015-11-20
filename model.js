var _, model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

require('angular-activerecord');

require('angularSails');

_ = require('underscore');

model = function(ActiveRecord, $sailsSocket, server) {
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
      if (this.$isNew() || this.$hasChanged() || values) {
        return Model.__super__.$save.call(this, values, opts);
      } else {
        return new Promise((function(_this) {
          return function(fulfill, reject) {
            return fulfill(_this);
          };
        })(this));
      }
    };

    Model.prototype.$refetch = function(opts) {
      if (opts == null) {
        opts = {};
      }
      return this.$fetch(_.defaults(opts, {
        reset: true
      }));
    };

    Model.restsync = ActiveRecord.sync;

    Model.iosync = function(operation, model, opts) {
      var crudMapping;
      if (opts == null) {
        opts = {};
      }
      crudMapping = {
        create: 'POST',
        read: 'GET',
        update: 'PUT',
        'delete': 'DELETE'
      };
      opts.method = crudMapping[operation];
      if (opts.url == null) {
        opts.url = _.result(model, '$url');
      }
      return $sailsSocket(opts);
    };

    Model.sync = Model.restsync;

    Model.prototype.$sync = function(operation, model, options) {
      return this.constructor.sync.apply(this, arguments);
    };

    Model.prototype.transport = function() {
      if (this.constructor.sync === Model.restsync) {
        return 'rest';
      } else {
        return 'io';
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
              return model[model.$idAttribute] === item[item.$idAttribute];
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
              return item[item.$idAttribute] !== model[model.$idAttribute];
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
            return a[a.$idAttribute] === b[b.$idAttribute];
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
          skip: 0,
          limit: 10,
          total_page: 0
        }
      };
    };


    /*
    		opts:
    			params:
    				skip:		skip the fetch of first nth records (default = 0)
    				limit:		no of records per page
     */

    PageableCollection.prototype.$fetch = function(opts) {
      if (opts == null) {
        opts = {};
      }
      if (opts.reset) {
        this.reset();
      }
      opts.params = opts.params || {};
      opts.params.skip = this.state.skip;
      opts.params.limit = opts.params.limit || this.state.limit;
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
                skip: opts.params.skip + data.results.length,
                limit: opts.params.limit,
                total_page: Math.ceil(data.count / opts.params.limit)
              });
              return fulfill(_this);
            } else {
              return reject('Not a valid response type');
            }
          })["catch"](reject);
        };
      })(this));
    };

    PageableCollection.prototype.$refetch = function(opts) {
      var next, skip;
      if (opts == null) {
        opts = {};
      }
      skip = this.state.skip;
      this.reset();
      next = (function(_this) {
        return function() {
          if (_this.state.skip < skip) {
            return _this.$fetch(opts).then(next);
          }
        };
      })(this);
      return next();
    };

    return PageableCollection;

  })(Collection);
  return {
    Model: Model,
    Collection: Collection,
    PageableCollection: PageableCollection,
    setTransport: function(type) {
      if (type == null) {
        type = Model.restsync;
      }
      return _.each([Model, Collection, PageableCollection], function(resource) {
        return resource.sync = type;
      });
    }
  };
};

angular.module('PageableAR', ['ActiveRecord', 'sails.io']).factory('pageableAR', ['ActiveRecord', '$sailsSocket', model]);
