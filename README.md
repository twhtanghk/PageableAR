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

To interface with socket.io (sails) server, simply define the configuration variable 'serverType' as 'io'. The default serverType 'rest' is to interface with rest server
```
angular.module 'app', ['PageableAR']
	.value 'server', 
		type: 'io'
```