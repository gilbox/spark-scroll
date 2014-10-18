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

app.directive('scopeSvgReveal', function () {
  return {
    scope: true,
    priority: 1,
    controllerAs: 'svgReveal',
    controller: function ($element) {
      var svgLength = ~~ $element[0].getTotalLength();
      var offsetTarget = svgLength;
      $element[0].style.strokeDasharray = svgLength + ' ' + svgLength;

      this.update = function (ratio) {
        $element[0].style.strokeDashoffset = ~~(offsetTarget*ratio);
      }

    }
  }
});