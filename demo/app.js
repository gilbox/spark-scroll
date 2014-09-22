app = angular.module('myApp', ['gilbox.kapiScroll']);

app.controller('appCtrl', function($scope) {

  this.upFn = function () {
    console.log("upFn!");
  };

  this.downFn = function () {
    console.log("downFn!");
  }

});
