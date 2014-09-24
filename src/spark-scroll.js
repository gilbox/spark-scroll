(function() {
  angular.module('gilbox.sparkScroll', []).directive('sparkScroll', function($window) {
    return function(scope, element, attr) {
      var actionFrameIdx, actionFrames, actionPropKeys, actionProps, actionsUpdate, prevScrollY, scrollY, sparkData, watchCancel;
      prevScrollY = 0;
      scrollY = 0;
      sparkData = {};
      actionFrames = [];
      actionFrameIdx = -1;
      actionProps = {
        'onUp': {
          up: function() {
            return this.actions.onUp(this);
          }
        },
        'onDown': {
          down: function() {
            return this.actions.onDown(this);
          }
        },
        'class': {
          up: function() {
            return element.removeClass(this.actions['class']);
          },
          down: function() {
            return element.addClass(this.actions['class']);
          }
        },
        'classUp': {
          up: function() {
            return element.addClass(this.actions.classUp);
          },
          down: function() {
            return element.removeClass(this.actions.classUp);
          }
        },
        'classRemove': {
          down: function() {
            return element.removeClass(this.actions.classRemove);
          }
        },
        'classUpRemove': {
          up: function() {
            return element.removeClass(this.actions.classUpRemove);
          }
        }
      };
      actionPropKeys = _.keys(actionProps);
      actionsUpdate = function() {
        var actionProp, c, d, idx, prop, _results;
        d = scrollY - prevScrollY;
        if (d < 0 && actionFrameIdx >= 0) {
          idx = actionFrameIdx >= actionFrames.length ? actionFrameIdx - 1 : actionFrameIdx;
          while (idx >= 0 && scrollY < actionFrames[idx]) {
            c = sparkData[actionFrames[idx]];
            for (prop in c.actions) {
              actionProp = actionProps[prop];
              if (actionProp != null ? actionProp.up : void 0) {
                actionProp.up.apply(c);
              }
            }
            actionFrameIdx = --idx;
          }
        }
        if (d >= 0 && actionFrameIdx < actionFrames.length) {
          idx = actionFrameIdx < 0 ? 0 : actionFrameIdx;
          _results = [];
          while (idx < actionFrames.length && scrollY > actionFrames[idx]) {
            c = sparkData[actionFrames[idx]];
            for (prop in c.actions) {
              actionProp = actionProps[prop];
              if (actionProp != null ? actionProp.down : void 0) {
                actionProp.down.apply(c);
              }
            }
            _results.push(actionFrameIdx = ++idx);
          }
          return _results;
        }
      };
      actionsUpdate = _.debounce(actionsUpdate, 33, {
        leading: true,
        maxWait: 33
      });
      watchCancel = scope.$watch(attr.sparkScroll, function(data) {
        var actionCount, actionProp, keyFrame, _i, _len;
        if (!data) {
          return;
        }
        if (attr.sparkScrollBindOnce != null) {
          watchCancel();
        }
        sparkData = data;
        actionFrames = [];
        for (scrollY in sparkData) {
          keyFrame = sparkData[scrollY];
          actionCount = 0;
          for (_i = 0, _len = actionPropKeys.length; _i < _len; _i++) {
            actionProp = actionPropKeys[_i];
            if (keyFrame[actionProp]) {
              actionCount++;
              keyFrame.actions || (keyFrame.actions = {});
              keyFrame.actions[actionProp] = keyFrame[actionProp];
              delete keyFrame[actionProp];
            }
          }
          keyFrame.actionCount = actionCount;
          keyFrame.elm = element;
          keyFrame.scope = scope;
          keyFrame.domElm = element[0];
        }
        for (scrollY in sparkData) {
          actionFrames.push(parseInt(scrollY));
        }
        actionFrames.sort(function(a, b) {
          return a > b;
        });
        prevScrollY = scrollY = $window.scrollY;
        return actionsUpdate();
      }, true);
      angular.element($window).on('scroll', function() {
        prevScrollY = scrollY;
        scrollY = $window.scrollY;
        return actionsUpdate();
      });
      return scope.$on('$destroy', function() {
        return angular.element($window).off('scroll');
      });
    };
  });

}).call(this);

//# sourceMappingURL=spark-scroll.js.map