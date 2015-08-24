(function() {
  var directiveFn;

  angular.module('gilbox.sparkScroll', []).factory('sparkAnimator', [
    '$document', function($document) {
      return {
        instance: function() {
          return Rekapi && new Rekapi($document[0].body);
        }
      };
    }
  ]).constant('sparkFormulas', {
    topTop: function topTop(element, container, rect, containerRect, offset) { return ~~(rect.top - containerRect.top + offset) },
    topCenter: function topCenter(element, container, rect, containerRect, offset) { return ~~(rect.top - containerRect.top - container.clientHeight/2 + offset) },
    topBottom: function topBottom(element, container, rect, containerRect, offset) {  return ~~(rect.top - containerRect.top - container.clientHeight + offset) },
    centerTop: function centerTop(element, container, rect, containerRect, offset) { return ~~(rect.top + rect.height/2 - containerRect.top + offset) },
    centerCenter: function centerCenter(element, container, rect, containerRect, offset) { return ~~(rect.top + rect.height/2 - containerRect.top - container.clientHeight/2 + offset) },
    centerBottom: function centerBottom(element, container, rect, containerRect, offset) {  return ~~(rect.top + rect.height/2 - containerRect.top - container.clientHeight + offset) },
    bottomTop: function bottomTop(element, container, rect, containerRect, offset) { return ~~(rect.bottom - containerRect.top + offset) },
    bottomBottom: function bottomBottom(element, container, rect, containerRect, offset) { return ~~(rect.bottom - containerRect.top - container.clientHeight + offset) },
    bottomCenter: function bottomCenter(element, container, rect, containerRect, offset) { return ~~(rect.bottom - containerRect.top - container.clientHeight/2 + offset) }
  }).constant('sparkActionProps', {
    'onDown': {
      down: function(o) {
        if (_.isString(o.val)) {
          return this.scope.$eval(o.val)(this, 'onDown', o);
        } else {
          return o.val(this, 'onDown', o);
        }
      }
    },
    'onUp': {
      up: function(o) {
        if (_.isString(o.val)) {
          return this.scope.$eval(o.val)(this, 'onUp', o);
        } else {
          return o.val(this, 'onUp', o);
        }
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
  }).service('sparkSetup', [
    '$interval', '$rootScope', function($interval, $rootScope) {
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
      this.disableSparkScrollAnimate = false;
      this.disableSparkScroll = false;
      this.debug = false;
      return this;
    }
  ]).service('sparkId', function() {
    this.elements = {};
    this.registerElement = function(id, element) {
      return this.elements[id] = element;
    };
    return this;
  }).directive('sparkId', [
    'sparkId', function(sparkId) {
      return function(scope, element, attr) {
        sparkId.registerElement(attr.sparkId, element);
        return scope.$on('$destroy', function() {
          return delete sparkId.elements[attr.sparkId];
        });
      };
    }
  ]);

  directiveFn = function($window, $timeout, sparkFormulas, sparkActionProps, sparkAnimator, sparkId, sparkSetup) {
    return function(scope, element, attr) {
      var actionFrameIdx, actionFrames, actionsUpdate, actor, animationFrame, animator, callback, container, data, debounce, doCallback, hasAnimateAttr, isAnimated, maxScrollY, minScrollY, nonAnimatedUpdate, onInvalidate, onScroll, parseData, prevRatio, prevy, recalcFormulas, recalcMinMax, scrollY, setTriggerElement, sparkData, triggerElement, update, updating, watchCancel, y;
      hasAnimateAttr = attr.hasOwnProperty('sparkScrollAnimate');
      isAnimated = hasAnimateAttr;
      if (hasAnimateAttr && sparkSetup.disableSparkScrollAnimate) {
        return;
      }
      if (!hasAnimateAttr && sparkSetup.disableSparkScroll) {
        return;
      }
      callback = false;
      prevRatio = 0;
      minScrollY = 0;
      maxScrollY = 0;
      animator = hasAnimateAttr && sparkAnimator.instance();
      actor = isAnimated && animator.addActor({
        context: element[0]
      });
      y = 0;
      prevy = 0;
      scrollY = 0;
      animationFrame = AnimationFrame && new AnimationFrame();
      updating = false;
      data = null;
      sparkData = null;
      actionFrames = [];
      actionFrameIdx = -1;
      container = document.documentElement;
      triggerElement = element;
      if (attr.sparkTrigger) {
        setTriggerElement = function() {
          if (sparkId.elements[attr.sparkTrigger]) {
            triggerElement = sparkId.elements[attr.sparkTrigger];
            if (recalcFormulas) {
              return recalcFormulas();
            }
          } else {
            return $timeout(setTriggerElement, 0, false);
          }
        };
        setTriggerElement();
      }
      actionsUpdate = function() {
        var a, actionProp, c, d, i, idx, j, len, len1, o, prop, ref, ref1, ref2, ref3;
        d = y - prevy;
        if (d < 0 && actionFrameIdx >= 0) {
          idx = actionFrameIdx >= actionFrames.length ? actionFrameIdx - 1 : actionFrameIdx;
          while (idx >= 0 && y < actionFrames[idx]) {
            c = sparkData[actionFrames[idx]];
            ref = c.actions;
            for (a in ref) {
              o = ref[a];
              ref1 = o.props;
              for (i = 0, len = ref1.length; i < len; i++) {
                prop = ref1[i];
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
          while (idx < actionFrames.length && y > actionFrames[idx]) {
            c = sparkData[actionFrames[idx]];
            ref2 = c.actions;
            for (a in ref2) {
              o = ref2[a];
              ref3 = o.props;
              for (j = 0, len1 = ref3.length; j < len1; j++) {
                prop = ref3[j];
                actionProp = sparkActionProps[prop];
                if (actionProp.down) {
                  actionProp.down.call(c, o);
                }
              }
            }
            actionFrameIdx = ++idx;
          }
        }
        prevy = y;
        return updating = false;
      };
      if (attr.hasOwnProperty('sparkScrollEase')) {
        update = function() {
          var ad, d;
          d = scrollY - y;
          ad = Math.abs(d);
          if (callback) {
            doCallback();
          }
          actionsUpdate();
          if (ad < 1.5) {
            y = scrollY;
            return animator.update(y);
          } else {
            updating = true;
            y += ad > 8 ? d * 0.25 : (d > 0 ? 1 : -1);
            animator.update(~~y);
            return animationFrame.request(update);
          }
        };
      } else {
        update = function() {
          y = scrollY;
          animator.update(y);
          if (callback) {
            doCallback();
          }
          return actionsUpdate();
        };
      }
      if (attr.hasOwnProperty('sparkScrollCallback')) {
        attr.$observe('sparkScrollCallback', function(v) {
          callback = scope.$eval(v);
          if (!_.isFunction(callback)) {
            callback = false;
          }
          if (!maxScrollY) {
            return recalcMinMax();
          }
        });
      }
      recalcMinMax = function() {
        var idx, results, scrY;
        idx = 0;
        results = [];
        for (scrY in sparkData) {
          scrY = ~~scrY;
          if (idx++) {
            if (scrY > maxScrollY) {
              results.push(maxScrollY = scrY);
            } else if (scrY < minScrollY) {
              results.push(minScrollY = scrY);
            } else {
              results.push(void 0);
            }
          } else {
            results.push(maxScrollY = minScrollY = scrY);
          }
        }
        return results;
      };
      doCallback = function() {
        var ratio;
        ratio = Math.max(0, Math.min(y / (maxScrollY - minScrollY), 1));
        if (ratio !== prevRatio) {
          callback(ratio);
        }
        return prevRatio = ratio;
      };
      recalcFormulas = function() {
        var changed, containerRect, keyFrame, kf, newScrY, rect, scrY;
        if (sparkData) {
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
            if (callback) {
              recalcMinMax();
            }
            actionFrames = [];
            for (scrY in sparkData) {
              kf = sparkData[scrY];
              if (kf.actionCount) {
                actionFrames.push(~~scrY);
              }
            }
            actionFrames.sort(function(a, b) {
              return a > b;
            });
            return onScroll();
          }
        } else {
          parseData();
          if (sparkData) {
            return recalcFormulas();
          }
        }
      };
      parseData = function() {
        var actionCount, animCount, c, containerRect, ease, elmEase, formula, k, keyFrame, kfEase, ksplit, o, parts, rect, scrY, v;
        if (!data) {
          return;
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
          keyFrame = _.clone(keyFrame);
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
              if (sparkSetup.debug) {
                console.log("warning: spark-scroll failed to calculate formulas", attr.sparkScroll || attr.sparkScrollAnimate);
              }
              sparkData = null;
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
          keyFrame.actionCount = actionCount;
          sparkData[scrY] = keyFrame;
          if (actionCount) {
            actionFrames.push(~~scrY);
          }
        }
        isAnimated = hasAnimateAttr && !!animCount;
        if (isAnimated) {
          actor.finishedAddingKeyframes && actor.finishedAddingKeyframes();
        }
        actionFrames.sort(function(a, b) {
          return a > b;
        });
        if (callback) {
          recalcMinMax();
        }
        y = prevy = scrollY = $window.pageYOffset;
        if (isAnimated) {
          update();
        }
        return actionsUpdate();
      };
      watchCancel = scope.$watch(attr[hasAnimateAttr ? 'sparkScrollAnimate' : 'sparkScroll'], function(d) {
        if (!d) {
          return;
        }
        data = _.clone(d);
        if (attr.sparkScrollBindOnce != null) {
          watchCancel();
        }
        return parseData();
      }, true);
      nonAnimatedUpdate = function() {
        if (callback) {
          doCallback();
        }
        return actionsUpdate();
      };
      onScroll = function() {
        scrollY = $window.pageYOffset;
        if (!updating) {
          updating = true;
          if (isAnimated) {
            return animationFrame.request(update);
          } else {
            y = scrollY;
            return animationFrame.request(nonAnimatedUpdate);
          }
        }
      };
      debounce = function(func, wait) {
        var f, timeout;
        timeout = 0;
        f = function() {
          var args, context, later;
          context = this;
          args = arguments;
          later = function() {
            timeout = null;
            return func.apply(context, args);
          };
          clearTimeout(timeout);
          return timeout = setTimeout(later, wait);
        };
        f.cancel = function() {
          return clearTimeout(timeout);
        };
        return f;
      };
      onInvalidate = debounce(recalcFormulas, 100);
      angular.element($window).on('scroll', onScroll);
      angular.element($window).on('resize', onInvalidate);
      angular.element($window).on('load', onInvalidate);
      scope.$on('sparkInvalidate', onInvalidate);
      return scope.$on('$destroy', function() {
        if (isAnimated) {
          animator.removeActor(actor);
        }
        angular.element($window).off('scroll', onScroll);
        angular.element($window).off('resize', onInvalidate);
        angular.element($window).off('load', onInvalidate);
        return onInvalidate.cancel();
      });
    };
  };

  angular.module('gilbox.sparkScroll').directive('sparkScroll', ['$window', '$timeout', 'sparkFormulas', 'sparkActionProps', 'sparkAnimator', 'sparkId', 'sparkSetup', directiveFn]).directive('sparkScrollAnimate', ['$window', '$timeout', 'sparkFormulas', 'sparkActionProps', 'sparkAnimator', 'sparkId', 'sparkSetup', directiveFn]);

}).call(this);

//# sourceMappingURL=spark-scroll.js.map