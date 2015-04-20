require 'angular'
require '../model.coffee'
require 'ngInfiniteScroll'

ListCtrl = ($scope, pageableAR) ->
	class ListView
		constructor: (opts = {}) ->
			@collection = opts.collection
			
		loadMore: ->
			first = @collection.length
			for i in [1..10]
				@collection.add first + i
			return @
		
	$scope.collection = new pageableAR.PageableCollection (i for i in [1..100])
	$scope.controller = new ListView collection: $scope.collection
	
config = ->
	return

angular.module('app', ['PageableAR', 'infinite-scroll']).config [config]
angular.module('app').controller 'ListCtrl', ['$scope', 'pageableAR', ListCtrl]