# PageableAR
Model, Collection, and Pageable Collection for Angular Active Record

## Installation
```
bower install PageableAR
```

## Demo
Compile and start http server
```
  npm install && bower install
  node_modules/.bin/gulp
  node_modules/.bin/http-server
```

Browse the testing page
```
  open browser to visit http://localhost:8080/test/test.html
  scroll down to reach the page bottom and trigger next page loading
```

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

To interface with socket.io (sails) server, simply override the static method pagaable.Model.sync with the pre-defined pageableAR.Model.iosync. The default is to interface with restful Web Server by pageableAR.Model.restsync.
```
angular.module('model', ['PageableAR'])
	.factory 'resource', (pageableAR) ->
		pageableAR.Model.sync = pageableAR.Model.iosync
	
		class RosterItem extends pageableAR.Model
			$urlRoot: ->
				if @transport() == 'io' then "/api/roster" else "#{context}/api/roster"
```