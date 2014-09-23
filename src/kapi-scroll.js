(function() {
  angular.module('gilbox.kapiScroll', []).factory('rekapi', function($document) {
    return new Rekapi($document[0].body);
  }).directive('kapiScroll', function(rekapi, $window) {
    return function(scope, element, attr) {
      var actionFrameIdx, actionFrames, actionPropKeys, actionProps, actions, actionsUpdate, actor, animationFrame, dashersize, ksWatchCancel, scrollY, update, updating, y;
      actor = rekapi.addActor({
        context: element[0]
      });
      y = 0;
      scrollY = 0;
      animationFrame = new AnimationFrame();
      updating = false;
      actionProps = {
        'onUp': {
          up: function() {
            return this.onUp();
          }
        },
        'onDown': {
          down: function() {
            return this.onDown();
          }
        },
        'class': {
          up: function() {
            return element.removeClass(this['class']);
          },
          down: function() {
            return element.addClass(this['class']);
          }
        },
        'classUp': {
          up: function() {
            return element.addClass(this.classUp);
          },
          down: function() {
            return element.removeClass(this.classUp);
          }
        },
        'classRemove': {
          down: function() {
            return element.removeClass(this.classRemove);
          }
        },
        'classUpRemove': {
          up: function() {
            return element.removeClass(this.classUpRemove);
          }
        }
      };
      actionPropKeys = _.keys(actionProps);
      actions = {};
      actionFrames = [];
      actionFrameIdx = -1;
      actionsUpdate = function() {
        var actionProp, c, d, idx, prop, _results;
        d = scrollY - y;
        if (d < 0 && actionFrameIdx >= 0) {
          idx = actionFrameIdx >= actionFrames.length ? actionFrameIdx - 1 : actionFrameIdx;
          while (idx >= 0 && y < actionFrames[idx]) {
            c = actions[actionFrames[idx]];
            for (prop in c) {
              actionProp = actionProps[prop];
              if (actionProp.up) {
                actionProp.up.apply(c);
              }
            }
            actionFrameIdx = --idx;
          }
        }
        if (d >= 0 && actionFrameIdx < actionFrames.length) {
          idx = actionFrameIdx < 0 ? 0 : actionFrameIdx;
          _results = [];
          while (idx < actionFrames.length && y > actionFrames[idx]) {
            c = actions[actionFrames[idx]];
            for (prop in c) {
              actionProp = actionProps[prop];
              if (actionProp.down) {
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
      update = function() {
        var ad, d;
        d = scrollY - y;
        ad = Math.abs(d);
        if (ad < 1.5) {
          updating = false;
          y = scrollY;
          return rekapi.update(y);
        } else {
          updating = true;
          y += ad > 8 ? d * 0.25 : (d > 0 ? 1 : -1);
          rekapi.update(parseInt(y));
          return animationFrame.request(update);
        }
      };
      dashersize = function(str) {
        return str.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2');
      };
      ksWatchCancel = scope.$watch(attr.kapiScroll, function(data) {
        var actionCount, actionProp, ease, elmEase, keyFrame, kfEase, o, prop, val, _i, _len;
        if (!data) {
          return;
        }
        if (attr.kapiScrollBindOnce != null) {
          ksWatchCancel();
        }
        elmEase = data.ease || 'linear';
        delete data.ease;
        actions = {};
        actionFrames = [];
        for (scrollY in data) {
          keyFrame = data[scrollY];
          actionCount = 0;
          for (_i = 0, _len = actionPropKeys.length; _i < _len; _i++) {
            actionProp = actionPropKeys[_i];
            if (keyFrame[actionProp]) {
              actionCount++;
              actions[scrollY] || (actions[scrollY] = {});
              actions[scrollY][actionProp] = keyFrame[actionProp];
              delete keyFrame[actionProp];
            }
          }
          if (actionCount) {
            actionFrames.push(parseInt(scrollY));
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
          for (prop in keyFrame) {
            val = keyFrame[prop];
            prop = dashersize(prop);
            if (!angular.isArray(val)) {
              val = [val, kfEase];
            }
            o = {};
            o[prop] = val[1];
            angular.extend(ease, o);
            keyFrame[prop] = val[0];
          }
          actor.keyframe(scrollY, keyFrame, ease);
        }
        actionFrames.sort(function(a, b) {
          return a > b;
        });
        y = scrollY = $window.scrollY;
        update();
        return actionsUpdate();
      }, true);
      angular.element($window).on('scroll', function() {
        scrollY = $window.scrollY;
        actionsUpdate();
        if (!updating) {
          return update();
        }
      });
      return scope.$on('$destroy', function() {
        rekapi.removeActor(actor);
        return angular.element($window).off('scroll');
      });
    };
  });

}).call(this);

//# sourceMappingURL=kapi-scroll.js.map