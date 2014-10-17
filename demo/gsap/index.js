app = angular.module('myApp', ['gilbox.sparkScroll']);

app.controller('appCtrl', function($scope, sparkSetup) {
  sparkSetup.enableInvalidationInterval();
  sparkSetup.debug = true;
});

app.directive('scopeElm', function () {
  return {
    scope: true,
    controllerAs: 'elm',
    controller: function($element) {
      this.css = function (k, v) {
        return function () {
          $element.css(k,v);
        };
      };

      this.text = function (s) {
        return function () {
          $element.text(s);
        };
      };
    }
  }
});
