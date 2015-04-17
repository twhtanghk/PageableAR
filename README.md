# PageableAR
Model, Collection, and Pageable Collection for Angular Active Record

## Installation
```
  npm install && bower install
  node_modules/.bin/gulp
  node_modules/.bin/http-server
```

## Demo
`
  open browser to visit http://localhost:8080/test/test.html
  scroll down to reach the page bottom and trigger next page loading
`

## Usage
Follow the prototype of Model, Collection, and PageableCollection defined in bacbkonejs
`
  $scope.collection = new pageableAR.Collection (i for i in [1..100]) 
  $scope.controller = new ListView collection: $scope.collection
  
  <ul ng-controller="ListCtrl">
	<li ng-repeat="model in collection.models">{{model}}</li>
	<div infinite-scroll="controller.loadMore()"></div>
  </ul>
`