(function() {
  var AnimationFrame, Rekapi, directiveFn, _, _ref;

  if (typeof define === 'function' && define.amd) {
    Rekapi = window.Rekapi || (require.defined('rekapi') && require('rekapi'));
    _ = window._ || (require.defined('lodash') ? require('lodash') : require('underscore'));
    AnimationFrame = window.AnimationFrame || (require.defined('animationFrame') ? require('animationFrame') : require('AnimationFrame'));
  } else {
    _ref = [window.Rekapi, window._, window.AnimationFrame], Rekapi = _ref[0], _ = _ref[1], AnimationFrame = _ref[2];
  }

  angular.module('gilbox.sparkScroll', []).factory('sparkAnimator', function($document) {
    return {
      instance: function() {
        return Rekapi && new Rekapi($document[0].body);
      }
    };
  }).constant('sparkFormulas', {
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
  }).service('sparkId', function() {
    this.elements = {};
    this.registerElement = function(id, element) {
      return this.elements[id] = element;
    };
    return this;
  }).directive('sparkId', function(sparkId) {
    return function(scope, element, attr) {
      sparkId.registerElement(attr.sparkId, element);
      return scope.$on('$destroy', function() {
        return delete sparkId.elements[attr.sparkId];
      });
    };
  });

  directiveFn = function($window, sparkFormulas, sparkActionProps, sparkAnimator, sparkId) {
    return function(scope, element, attr) {
      var actionFrameIdx, actionFrames, actionsUpdate, actor, animationFrame, animator, container, hasAnimateAttr, isAnimated, onInvalidate, onScroll, prevScrollY, recalcFormulas, scrollY, sparkData, triggerElement, update, updating, watchCancel, y;
      triggerElement = attr.sparkTrigger ? sparkId.elements[attr.sparkTrigger] : element;
      hasAnimateAttr = attr.hasOwnProperty('sparkScrollAnimate');
      isAnimated = hasAnimateAttr;
      animator = hasAnimateAttr && sparkAnimator.instance();
      actor = isAnimated && animator.addActor({
        context: element[0]
      });
      y = 0;
      prevScrollY = 0;
      scrollY = 0;
      animationFrame = AnimationFrame && new AnimationFrame();
      updating = false;
      sparkData = {};
      actionFrames = [];
      actionFrameIdx = -1;
      container = document.documentElement;
      actionsUpdate = function() {
        var a, actionProp, c, d, idx, o, prop, _i, _j, _len, _len1, _ref1, _ref2, _ref3, _ref4;
        d = scrollY - prevScrollY;
        if (d < 0 && actionFrameIdx >= 0) {
          idx = actionFrameIdx >= actionFrames.length ? actionFrameIdx - 1 : actionFrameIdx;
          while (idx >= 0 && scrollY < actionFrames[idx]) {
            c = sparkData[actionFrames[idx]];
            _ref1 = c.actions;
            for (a in _ref1) {
              o = _ref1[a];
              _ref2 = o.props;
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                prop = _ref2[_i];
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
            _ref3 = c.actions;
            for (a in _ref3) {
              o = _ref3[a];
              _ref4 = o.props;
              for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
                prop = _ref4[_j];
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
      if (attr.sparkScrollEase) {
        update = function() {
          var ad, d;
          d = scrollY - y;
          ad = Math.abs(d);
          if (1 || ad < 1.5) {
            updating = false;
            y = scrollY;
            return animator.update(y);
          } else {
            updating = true;
            y += ad > 8 ? d * 0.25 : (d > 0 ? 1 : -1);
            animator.update(parseInt(y));
            return animationFrame.request(update);
          }
        };
      } else {
        update = function() {
          updating = false;
          y = scrollY;
          return animator.update(y);
        };
      }
      recalcFormulas = function() {
        var changed, containerRect, keyFrame, newScrY, rect, scrY;
        changed = false;
        rect = triggerElement[0].getBoundingClientRect();
        containerRect = container.getBoundingClientRect();
        for (scrY in sparkData) {
          keyFrame = sparkData[scrY];
          if (!keyFrame.formula) {
            continue;
          }
          newScrY = keyFrame.formula.fn(triggerElement, container, rect, containerRect, keyFrame.formula.offset);
          if (newScrY !== ~~scrY) {
            changed = true;
            if (keyFrame.anims && hasAnimateAttr) {
              actor.moveKeyframe(~~scrY, newScrY);
            }
            sparkData[newScrY] = keyFrame;
            delete sparkData[scrY];
          }
        }
        if (changed) {
          actionFrames = [];
          for (scrY in sparkData) {
            actionFrames.push(~~scrY);
          }
          actionFrames.sort(function(a, b) {
            return a > b;
          });
          return onScroll();
        }
      };
      watchCancel = scope.$watch(attr[hasAnimateAttr ? 'sparkScrollAnimate' : 'sparkScroll'], function(data) {
        var actionCount, animCount, c, containerRect, ease, elmEase, formula, k, keyFrame, kfEase, ksplit, o, parts, rect, scrY, v;
        if (!data) {
          return;
        }
        if (attr.sparkScrollBindOnce != null) {
          watchCancel();
        }
        if (hasAnimateAttr) {
          actor.removeAllKeyframes();
        }
        elmEase = data.ease || 'linear';
        delete data.ease;
        animCount = 0;
        sparkData = {};
        actionFrames = [];
        rect = triggerElement[0].getBoundingClientRect();
        containerRect = container.getBoundingClientRect();
        for (scrY in data) {
          keyFrame = data[scrY];
          actionCount = 0;
          c = scrY.charCodeAt(0);
          if (c < 48 || c > 57) {
            parts = scrY.match(/^(\w+)(.*)$/);
            formula = {
              fn: sparkFormulas[parts[1]],
              offset: ~~parts[2]
            };
            scrY = formula.fn(triggerElement, container, rect, containerRect, formula.offset);
            if (sparkData[scrY]) {
              return;
            }
          }
          ease = {};
          kfEase = elmEase;
          if (keyFrame.ease != null) {
            if (angular.isObject(keyFrame.ease)) {
              ease = keyFrame.ease;
            } else {
              kfEase = keyFrame.ease;
            }
            delete keyFrame.ease;
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
              actionCount++;
            } else {
              keyFrame.anims || (keyFrame.anims = {});
              if (!angular.isArray(v)) {
                v = [v, kfEase];
              }
              o = {};
              o[k] = v[1];
              angular.extend(ease, o);
              keyFrame.anims[k] = v[0];
              delete keyFrame[k];
            }
          }
          if (keyFrame.anims && hasAnimateAttr) {
            actor.keyframe(scrY, keyFrame.anims, ease);
            animCount++;
          }
          keyFrame.formula = formula;
          keyFrame.element = element;
          keyFrame.scope = scope;
          sparkData[scrY] = keyFrame;
          if (actionCount) {
            actionFrames.push(~~scrY);
          }
        }
        isAnimated = hasAnimateAttr && !!animCount;
        actionFrames.sort(function(a, b) {
          return a > b;
        });
        prevScrollY = scrollY = $window.scrollY;
        if (isAnimated) {
          update();
        }
        return actionsUpdate();
      }, true);
      onScroll = function() {
        scrollY = $window.scrollY;
        actionsUpdate();
        if (isAnimated && !updating) {
          return update();
        }
      };
      onInvalidate = _.debounce(recalcFormulas, 100, {
        leading: false
      });
      angular.element($window).on('scroll', onScroll);
      angular.element($window).on('resize', onInvalidate);
      scope.$on('sparkInvalidate', onInvalidate);
      return scope.$on('$destroy', function() {
        if (isAnimated) {
          animator.removeActor(actor);
        }
        angular.element($window).off('scroll', onScroll);
        return angular.element($window).off('resize', onInvalidate);
      });
    };
  };

  angular.module('gilbox.sparkScroll').directive('sparkScroll', ['$window', 'sparkFormulas', 'sparkActionProps', 'sparkAnimator', 'sparkId', directiveFn]).directive('sparkScrollAnimate', ['$window', 'sparkFormulas', 'sparkActionProps', 'sparkAnimator', 'sparkId', directiveFn]);

}).call(this);

//# sourceMappingURL=spark-scroll.js.map