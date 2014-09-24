app = angular.module('myApp', ['gilbox.sparkScroll']);

app.controller('appCtrl', function($scope) {
  var tweenable = new Tweenable();

  this.upFn = function (kf) {
    console.log("upFn!", kf);

    tweenable.tween({
      from:     { strokeDashoffset: 0  },
      to:       { strokeDashoffset: ~~kf.pathLength },
      duration: 3000,
      start: function (state) {
        kf.domElm.style.strokeDasharray = kf.pathLength + ' ' + kf.pathLength;
      },
      step: function (state) {
        kf.domElm.style.strokeDashoffset = ~~state.strokeDashoffset;
      },
      finish: function (state) {
        console.log("-->state: ", state);
      }
    });
  };

  this.downFn = function (kf) {
    console.log("downFn!", kf);

    tweenable.tween({
      from:     { strokeDashoffset: ~~kf.pathLength  },
      to:       { strokeDashoffset: 0 },
      duration: 3000,
      start: function (state) {
        kf.domElm.style.strokeDasharray = kf.pathLength + ' ' + kf.pathLength;
      },
      step: function (state) {
        kf.domElm.style.strokeDashoffset = ~~state.strokeDashoffset;
      },
      finish: function (state) {
        console.log("-->state: ", state);
      }
    });
    //strokeDashoffset: 0, strokeDasharray
  }

});

app.directive('calcSvgLength', function () {
  return {
    scope: true,
    priority: 1,
    link: function (scope, element, attr) {
      scope.svgLength = element[0].getTotalLength();
    }
  }
});
