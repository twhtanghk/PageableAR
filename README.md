# PageableAR
Model, Collection, and Pageable Collection for Angular Active Record

## Installation
```
bower install PageableAR
```

## Demo
Click [here](https://rawgit.com/twhtanghk/PageableAR/master/test/test.html) for demo

## Usage
Follow the prototype of Model, Collection, and PageableCollection defined in [backbonejs](http://backbonejs.org/)
```
  $scope.collection = new pageableAR.Collection (i for i in [1..100]) 
  $scope.controller = new ListView collection: $scope.collection
  
  <ul ng-controller="ListCtrl">
	<li ng-repeat="model in collection.models">{{model}}</li>
	<div infinite-scroll="controller.loadMore()"></div>
  </ul>
```

To interface with socket.io (sails) server, simply call setTransport to override the static method pagaeble.Model.sync with the pre-defined pageableAR.Model.iosync. The default is to interface with restful Web Server by pageableAR.Model.restsync. The following module is to define the default model interface to be 'io' and Device model interface to be other restful Web Server.
```
angular.module('model', ['PageableAR'])
	.factory 'resource', (pageableAR) ->
		pageableAR.setTransport(pageableAR.Model.iosync)
	
		urlRoot = (model, url, root = '/context') ->
			if model.transport() == 'io' then "#{url}" else "#{root}#{url}"
		
		class RosterItem extends pageableAR.Model
			$urlRoot: ->
				urlRoot(@, '/api/roster')
		
		class Device extends pageableAR.Model
			$urlRoot: ->
				urlRoot(@, '/api/device', 'https://mob.myvnc.com/device')
	
			@sync: pageableAR.Model.restsync
	
		RosterItem: RosterItem
		...
```
