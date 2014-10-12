app = angular.module('myApp', ['gilbox.sparkScroll']);

app.constant('Tweenable', Tweenable);

app.controller('appCtrl', function($scope, Tweenable, sparkSetup) {

  sparkSetup.enableInvalidationInterval()

  this.upDown = function () {
    console.log("upDown", this);
  };

});

app.config(function (sparkFormulas) {
  angular.extend(sparkFormulas, {

    // When the bottom of the element hits the top of the viewport
    bottomTop: function (element, container, rect, containerRect, offset) {
      return ~~(rect.bottom - containerRect.top + offset);
    }

  });
});

app.directive('scopeElm', function (Tweenable) {
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
