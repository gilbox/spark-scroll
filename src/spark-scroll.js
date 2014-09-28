(function() {
  angular.module('gilbox.sparkScroll', []).constant('sparkActionProps', {
    'onDown': {
      down: function(o) {
        return o.val(this, 'onDown', o);
      }
    },
    'onUp': {
      up: function(o) {
        return o.val(this, 'onUp', o);
      }
    },
    'downAddClass': {
      down: function(o) {
        return this.element.addClass(o.val);
      }
    },
    'upAddClass': {
      up: function(o) {
        return this.element.addClass(o.val);
      }
    },
    'downRemoveClass': {
      down: function(o) {
        return this.element.removeClass(o.val);
      }
    },
    'upRemoveClass': {
      up: function(o) {
        return this.element.removeClass(o.val);
      }
    },
    'downBroadcast': {
      down: function(o) {
        return this.scope.$broadcast(o.val, this);
      }
    },
    'upBroadcast': {
      up: function(o) {
        return this.scope.$broadcast(o.val, this);
      }
    },
    'downEmit': {
      down: function(o) {
        return this.scope.$emit(o.val, this);
      }
    },
    'upEmit': {
      up: function(o) {
        return this.scope.$emit(o.val, this);
      }
    }
  }).directive('sparkScroll', function($window, sparkActionProps) {
    return function(scope, element, attr) {
      var actionFrameIdx, actionFrames, actionsUpdate, prevScrollY, scrollY, sparkData, watchCancel;
      prevScrollY = 0;
      scrollY = 0;
      sparkData = {};
      actionFrames = [];
      actionFrameIdx = -1;
      actionsUpdate = function() {
        var a, actionProp, c, d, idx, o, prop, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _results;
        d = scrollY - prevScrollY;
        if (d < 0 && actionFrameIdx >= 0) {
          idx = actionFrameIdx >= actionFrames.length ? actionFrameIdx - 1 : actionFrameIdx;
          while (idx >= 0 && scrollY < actionFrames[idx]) {
            c = sparkData[actionFrames[idx]];
            _ref = c.actions;
            for (a in _ref) {
              o = _ref[a];
              _ref1 = o.props;
              for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                prop = _ref1[_i];
                actionProp = sparkActionProps[prop];
                if (actionProp.up) {
                  actionProp.up.call(c, o);
                }
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
            _ref2 = c.actions;
            for (a in _ref2) {
              o = _ref2[a];
              _ref3 = o.props;
              for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
                prop = _ref3[_j];
                actionProp = sparkActionProps[prop];
                if (actionProp.down) {
                  actionProp.down.call(c, o);
                }
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
        var k, keyFrame, ksplit, v;
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
          for (k in keyFrame) {
            v = keyFrame[k];
            ksplit = k.split(',');
            if (sparkActionProps[ksplit[0]]) {
              keyFrame.actions || (keyFrame.actions = {});
              keyFrame.actions[k] = {
                props: ksplit,
                val: v
              };
              delete keyFrame[k];
            }
          }
          keyFrame.element = element;
          keyFrame.scope = scope;
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