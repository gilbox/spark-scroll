(function() {
  angular.module('gilbox.sparkScroll', []).constant('sparkFormulas', {
    top: function(element, container, rect, containerRect, offset) {
      return ~~(rect.top - containerRect.top + offset);
    },
    center: function(element, container, rect, containerRect, offset) {
      return ~~(rect.top - containerRect.top - container.clientHeight / 2 + offset);
    },
    bottom: function(element, container, rect, containerRect, offset) {
      return ~~(rect.top - containerRect.top - container.clientHeight + offset);
    }
  }).constant('sparkActionProps', {
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
  }).service('sparkSetup', function($interval, $rootScope) {
    var int;
    int = 0;
    this.enableInvalidationInterval = function(delay) {
      if (delay == null) {
        delay = 1000;
      }
      if (int) {
        $interval.cancel(int);
      }
      return int = $interval((function() {
        return $rootScope.$broadcast('sparkInvalidate');
      }), delay, 0, false);
    };
    this.disableInvalidationInterval = function() {
      return $interval.cancel(int);
    };
    return this;
  }).directive('sparkScroll', function($window, sparkFormulas, sparkActionProps) {
    return function(scope, element, attr) {
      var actionFrameIdx, actionFrames, actionsUpdate, container, onInvalidate, onScroll, prevScrollY, recalcFormulas, scrollY, sparkData, watchCancel;
      prevScrollY = 0;
      scrollY = 0;
      sparkData = {};
      actionFrames = [];
      actionFrameIdx = -1;
      container = document.documentElement;
      actionsUpdate = function() {
        var a, actionProp, c, d, idx, o, prop, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
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
            actionFrameIdx = ++idx;
          }
        }
        return prevScrollY = scrollY;
      };
      actionsUpdate = _.throttle(actionsUpdate, 66, {
        leading: true,
        maxWait: 66
      });
      recalcFormulas = function() {
        var changed, containerRect, keyFrame, newScrollY, rect;
        changed = false;
        rect = element[0].getBoundingClientRect();
        containerRect = container.getBoundingClientRect();
        for (scrollY in sparkData) {
          keyFrame = sparkData[scrollY];
          if (!keyFrame.formula) {
            continue;
          }
          newScrollY = keyFrame.formula.fn(element, container, rect, containerRect, keyFrame.formula.offset);
          if (newScrollY !== ~~scrollY) {
            changed = true;
            sparkData[newScrollY] = keyFrame;
            delete sparkData[scrollY];
          }
        }
        if (changed) {
          actionFrames = [];
          for (scrollY in sparkData) {
            actionFrames.push(~~scrollY);
          }
          return actionFrames.sort(function(a, b) {
            return a > b;
          });
        }
      };
      watchCancel = scope.$watch(attr.sparkScroll, function(data) {
        var c, containerRect, k, keyFrame, ksplit, parts, rect, v;
        if (!data) {
          return;
        }
        if (attr.sparkScrollBindOnce != null) {
          watchCancel();
        }
        sparkData = {};
        actionFrames = [];
        rect = element[0].getBoundingClientRect();
        containerRect = container.getBoundingClientRect();
        for (scrollY in data) {
          keyFrame = data[scrollY];
          c = scrollY.charCodeAt(0);
          if (c < 48 || c > 57) {
            parts = scrollY.match(/^(\w+)(.*)$/);
            keyFrame.formula = {
              fn: sparkFormulas[parts[1]],
              offset: ~~parts[2]
            };
            scrollY = keyFrame.formula.fn(element, container, rect, containerRect, keyFrame.formula.offset);
            if (sparkData[scrollY]) {
              return;
            }
          }
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
          sparkData[scrollY] = keyFrame;
        }
        for (scrollY in sparkData) {
          actionFrames.push(~~scrollY);
        }
        actionFrames.sort(function(a, b) {
          return a > b;
        });
        prevScrollY = scrollY = $window.scrollY;
        return actionsUpdate();
      }, true);
      onScroll = function() {
        scrollY = $window.scrollY;
        return actionsUpdate();
      };
      onInvalidate = _.debounce(recalcFormulas, 100, {
        leading: false
      });
      angular.element($window).on('scroll', onScroll);
      angular.element($window).on('resize', onInvalidate);
      scope.$on('sparkInvalidate', onInvalidate);
      return scope.$on('$destroy', function() {
        angular.element($window).off('scroll', onScroll);
        return angular.element($window).off('resize', onInvalidate);
      });
    };
  });

}).call(this);

//# sourceMappingURL=spark-scroll.js.map