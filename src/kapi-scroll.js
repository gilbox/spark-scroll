(function() {
  angular.module('gilbox.kapiScroll', []).factory('rekapi', function($document) {
    return new Rekapi($document[0].body);
  }).directive('kapiScroll', function(rekapi, $window) {
    return function(scope, element, attr) {
      var actionFrameIdx, actionFrames, actionProps, actions, actionsUpdate, actor, animationFrame, dashersize, ksWatchCancel, scrollY, update, updating, y;
      actor = rekapi.addActor({
        context: element[0]
      });
      y = 0;
      scrollY = 0;
      animationFrame = new AnimationFrame();
      updating = false;
      actionProps = ['onUp', 'onDown', 'class', 'classUp', 'classRemove', 'classUpRemove'];
      actions = {};
      actionFrames = [];
      actionFrameIdx = -1;
      actionsUpdate = function() {
        var c, d, idx, _results;
        d = scrollY - y;
        if (d < 0 && actionFrameIdx >= 0) {
          idx = actionFrameIdx >= actionFrames.length ? actionFrameIdx - 1 : actionFrameIdx;
          while (idx >= 0 && y < actionFrames[idx]) {
            c = actions[actionFrames[idx]];
            if (c["class"]) {
              element.removeClass(c["class"]);
            }
            if (c.classUp) {
              element.addClass(c.classUp);
            }
            if (c.classUpRemove) {
              element.removeClass(c.classUpRemove);
            }
            if (c.onUp) {
              c.onUp();
            }
            actionFrameIdx = --idx;
          }
        }
        if (d >= 0 && actionFrameIdx < actionFrames.length) {
          idx = actionFrameIdx < 0 ? 0 : actionFrameIdx;
          _results = [];
          while (idx < actionFrames.length && y > actionFrames[idx]) {
            c = actions[actionFrames[idx]];
            if (c["class"]) {
              element.addClass(c["class"]);
            }
            if (c.classUp) {
              element.removeClass(c.classUp);
            }
            if (c.classRemove) {
              element.removeClass(c.classRemove);
            }
            if (c.onDown) {
              c.onDown();
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
        var actionProp, ease, elmEase, keyFrame, kfEase, o, prop, val, _i, _len;
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
          if (keyFrame["class"] || keyFrame.classUp || keyFrame.classRemove || keyFrame.classUpRemove || keyFrame.onUp || keyFrame.onDown) {
            actionFrames.push(parseInt(scrollY));
          }
          for (_i = 0, _len = actionProps.length; _i < _len; _i++) {
            actionProp = actionProps[_i];
            if (keyFrame[actionProp]) {
              actions[scrollY] || (actions[scrollY] = {});
              actions[scrollY][actionProp] = keyFrame[actionProp];
              delete keyFrame[actionProp];
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