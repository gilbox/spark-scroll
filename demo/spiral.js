app = angular.module('myApp', ['gilbox.sparkScroll']);

app.constant('Tweenable', Tweenable);

app.controller('appCtrl', function($scope, Tweenable, sparkSetup) {

//  sparkSetup.enableInvalidationInterval()

  this.upDown = function () {
    console.log("upDown", this);
  };

});

app.directive('scopeSvgReveal', function (Tweenable) {
  return {
    scope: true,
    priority: 1,
    controllerAs: 'svgReveal',
    controller: function ($element) {
      var svgLength = ~~ $element[0].getTotalLength();
      var offsetTarget = svgLength;
      $element[0].style.strokeDasharray = svgLength + ' ' + svgLength;

      var tweenConfig = {
        from:     { strokeDashoffset: 0  },
        to:       { strokeDashoffset: offsetTarget },
        duration: 3000,
        step: function (state) {
          $element[0].style.strokeDashoffset = ~~state.strokeDashoffset;
        }
      };
      var tweenable = new Tweenable();

      this.hide = function () {
        tweenConfig.to.strokeDashoffset = offsetTarget;
        tweenable.stop();
        tweenable.tween(tweenConfig);
      };

      this.show = function () {
        tweenConfig.to.strokeDashoffset = 0;
        tweenable.stop();
        tweenable.tween(tweenConfig);
      };

      
    }
  }
});