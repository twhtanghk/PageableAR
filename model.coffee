require 'angular-activerecord'
_ = require 'underscore'

model = (ActiveRecord) ->
	
	class Model extends ActiveRecord
		constructor: (attrs = {}, opts = {}) ->
			@$initialize(attrs, opts)
			
		$changedAttributes: (diff) ->
			_.omit super(diff), '$$hashKey' 
		
		$save: (values, opts) ->
			if @$hasChanged()
				super(values, opts)
			else
				return new Promise (fulfill, reject) ->
					fulfill @
		
	class Collection extends Model
		constructor: (@models = [], opts = {}) ->
			super({}, opts)
			@length = @models.length
					
		add: (models, opts = {}) ->
			singular = not _.isArray(models)
			if singular and models?
				models = [models]
			_.each models, (item) =>
				if not @contains item 
					@models.push item
					@length++
				
		remove: (models, opts = {}) ->
			singular = not _.isArray(models)
			if singular and models?
				models = [models]
			_.each models, (model) =>
				model.$destroy().then =>
					@models = _.filter @models, (item) =>
						item[@$idAttribute] != model[@$idAttribute]
			@length = @models.length
				
		contains: (model) ->
			cond = (a, b) ->
				a == b
			if typeof model == 'object'
				cond = (a, b) =>
					a[@$idAttribute] == b[@$idAttribute]
			ret = _.find @models, (elem) =>
				cond(model, elem) 
			return ret?	
		
		$fetch: (opts = {}) ->
			return new Promise (fulfill, reject) =>
				@$sync('read', @, opts)
					.then (res) =>
						data = @$parse(res.data, opts)
						if _.isArray data
							@add data
							fulfill @
						else
							reject 'Not a valid response type'
					.catch reject
		
	class PageableCollection extends Collection
		constructor: (models = [], opts = {}) ->
			@state =
				count:		0
				page:		0
				per_page:	10
				total_page:	0
			super(models, opts)
				
		###
		opts:
			params:
				page:		page no to be fetched (first page = 1)
				per_page:	no of records per page
		###
		$fetch: (opts = {}) ->
			opts.params = opts.params || {}
			opts.params.page = @state.page + 1
			opts.params.per_page = opts.params.per_page || @state.per_page
			return new Promise (fulfill, reject) =>
				@$sync('read', @, opts)
					.then (res) =>
						data = @$parse(res.data, opts)
						if data.count? and data.results?
							@add data.results
							@state = _.extend @state,
								count:		data.count
								page:		opts.params.page
								per_page:	opts.params.per_page
								total_page:	Math.ceil(data.count / opts.params.per_page)
							fulfill @
						else
							reject 'Not a valid response type'
					.catch reject

	class View
		constructor: (opts = {}) ->
			_.extend @, _.pick(opts, 'model', 'collection', 'el', 'id', 'className', 'tagName', 'events')
			
			_.each @events, (handler, event) =>
				$scope.$on event, @[handler]
				
	Model:				Model
	Collection:			Collection
	PageableCollection:	PageableCollection
	View:				View
				
config = ->
	return

angular.module('PageableAR', ['ActiveRecord']).config [config]

angular.module('PageableAR').factory 'pageableAR', ['ActiveRecord', model]