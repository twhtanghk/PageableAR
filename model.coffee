require 'angular-activerecord'
require 'angularSails'
_ = require 'underscore'

model = (ActiveRecord, $sailsSocket, server) ->
	class Model extends ActiveRecord
		constructor: (attrs = {}, opts = {parse: true}) ->
			@$initialize(attrs, opts)
			
		# return if changed or any attributes is object type
		$hasChanged: ->
			super() or _.some @$previousAttributes(), (attr) ->
				_.isObject attr
			
		$changedAttributes: (diff) ->
			_.omit super(diff), '$$hashKey' 
		
		$save: (values, opts) ->
			if @$isNew() or @$hasChanged() or values
				super(values, opts)
			else
				return new Promise (fulfill, reject) =>
					fulfill @
			
		# fetch the collection to current position again
		$refetch: (opts = {}) ->
			@$fetch _.defaults(opts, reset: true)
		
		@restsync: ActiveRecord.sync
		
		@iosync: (operation, model, opts = {}) ->
			crudMapping =
				create:		'POST'
				read:		'GET'
				update:		'PUT'
				'delete':	'DELETE'
			opts.method = crudMapping[operation]
			opts.url ?= _.result model, '$url'
			$sailsSocket opts
			
		@sync: Model.restsync
		
		$sync: (operation, model, options) ->
			@constructor.sync.apply(@, arguments)
			
		transport: ->
			if @constructor.sync == Model.restsync then 'rest' else 'io'
		
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
				else
					# merge input item into existing model
					model = _.find @models, (model) =>
						model[model.$idAttribute] == item[item.$idAttribute]
					_.extend model, _.omit(item, '$$hashKey')
				
		remove: (models, opts = {}) ->
			singular = not _.isArray(models)
			if singular and models?
				models = [models]
			_.each models, (model) =>
				model.$destroy().then =>
					@models = _.filter @models, (item) =>
						item[item.$idAttribute] != model[model.$idAttribute]
			@length = @models.length
				
		contains: (model) ->
			cond = (a, b) ->
				a == b
			if typeof model == 'object'
				cond = (a, b) =>
					a[a.$idAttribute] == b[b.$idAttribute]
			ret = _.find @models, (elem) =>
				cond(model, elem) 
			return ret?	
		
		reset: ->
			@length = 0
			@models = []
			@$initialize {}, reset: true
			
		$fetch: (opts = {}) ->
			if opts.reset
				@reset()
			return new Promise (fulfill, reject) =>
				@$sync('read', @, opts)
					.then (res) =>
						data = @$parse(res.data, opts)
						if _.isArray data
							data = _.map data, (value) =>
								new @model value
							@add data
							fulfill @
						else
							reject 'Not a valid response type'
					.catch reject
		
	class PageableCollection extends Collection
		$defaults: ->
			state:
				count:		0
				skip:		0
				limit:		10
				total_page:	0
		
		###
		opts:
			params:
				skip:		skip the fetch of first nth records (default = 0)
				limit:		no of records per page
		###
		$fetch: (opts = {}) ->
			if opts.reset
				@reset()
			opts.params = opts.params || {}
			opts.params.skip = @state.skip
			opts.params.limit = opts.params.limit || @state.limit
			return new Promise (fulfill, reject) =>
				@$sync('read', @, opts)
					.then (res) =>
						data = @$parse(res.data, opts)
						if data.count? and data.results?
							data.results = _.map data.results, (value) =>
								new @model value
							@add data.results
							@state = _.extend @state,
								count:		data.count
								skip:		opts.params.skip + data.results.length
								limit:		opts.params.limit
								total_page:	Math.ceil(data.count / opts.params.limit)
							fulfill @
						else
							reject 'Not a valid response type'
					.catch reject
					
		# fetch to current position again
		$refetch: (opts = {}) ->
			skip = @state.skip
			@reset()
			next = =>
				if @state.skip < skip
					@$fetch(opts)
						.then next
			next()

	Model:				Model
	Collection:			Collection
	PageableCollection:	PageableCollection
	setTransport: (type = Model.restsync) ->
		_.each [Model, Collection, PageableCollection], (resource) ->
			resource.sync = type

angular.module('PageableAR', ['ActiveRecord', 'sails.io'])
	.factory 'pageableAR', ['ActiveRecord', '$sailsSocket', model]