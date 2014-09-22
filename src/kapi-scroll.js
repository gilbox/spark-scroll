(function() {
  angular.module('gilbox.kapiScroll', []).factory('rekapi', function($document) {
    return new Rekapi($document[0].body);
  }).directive('kapiScroll', function(rekapi, $window) {
    return function(scope, element, attr) {
      var actionFrameIdx, actionFrames, actions, actionsUpdate, actor, animationFrame, lastScrollY, scrollY, update, updating, y;
      actor = rekapi.addActor({
        context: element[0]
      });
      y = 0;
      lastScrollY = 0;
      scrollY = 0;
      animationFrame = new AnimationFrame();
      updating = false;
      actions = {};
      actionFrames = [];
      actionFrameIdx = -1;
      actionsUpdate = function(d) {
        var c, idx, _results;
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
            if (c.cbUp) {
              c.cbUp();
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
            if (c.cbDown) {
              c.cbDown();
            }
            _results.push(actionFrameIdx = ++idx);
          }
          return _results;
        }
      };
      update = function() {
        var ad, d;
        d = scrollY - y;
        ad = Math.abs(d);
        if (ad < 1.5) {
          updating = false;
          y = scrollY;
          rekapi.update(y);
        } else {
          updating = true;
          y += ad > 8 ? d * 0.25 : (d > 0 ? 1 : -1);
          rekapi.update(parseInt(y));
          animationFrame.request(update);
        }
        return actionsUpdate(d);
      };
      scope.$watch(attr.kapiScroll, function(data) {
        var ease, elmEase, keyFrame, kfEase, o, prop, val;
        if (!data) {
          return;
        }
        elmEase = data.ease || 'linear';
        delete data.ease;
        actions = {};
        actionFrames = [];
        for (scrollY in data) {
          keyFrame = data[scrollY];
          if (keyFrame["class"] || keyFrame.classUp || keyFrame.classRemove || keyFrame.classUpRemove || keyFrame.cbUp || keyFrame.cbDown) {
            actionFrames.push(parseInt(scrollY));
          }
          if (keyFrame.cbUp) {
            actions[scrollY] || (actions[scrollY] = {});
            angular.extend(actions[scrollY], {
              cbUp: keyFrame.cbUp
            });
            delete keyFrame.cbUp;
          }
          if (keyFrame.cbDown) {
            actions[scrollY] || (actions[scrollY] = {});
            angular.extend(actions[scrollY], {
              cbDown: keyFrame.cbDown
            });
            delete keyFrame.cbDown;
          }
          if (keyFrame["class"]) {
            actions[scrollY] || (actions[scrollY] = {});
            angular.extend(actions[scrollY], {
              "class": keyFrame["class"]
            });
            delete keyFrame["class"];
          }
          if (keyFrame.classUp) {
            actions[scrollY] || (actions[scrollY] = {});
            angular.extend(actions[scrollY], {
              classUp: keyFrame.classUp
            });
            delete keyFrame.classUp;
          }
          if (keyFrame.classRemove) {
            actions[scrollY] || (actions[scrollY] = {});
            angular.extend(actions[scrollY], {
              classRemove: keyFrame.classRemove
            });
            delete keyFrame.classRemove;
          }
          if (keyFrame.classUpRemove) {
            actions[scrollY] || (actions[scrollY] = {});
            angular.extend(actions[scrollY], {
              classUpRemove: keyFrame.classUpRemove
            });
            delete keyFrame.classUpRemove;
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
        return update();
      }, true);
      angular.element($window).on('scroll', function() {
        lastScrollY = scrollY;
        scrollY = $window.scrollY;
        if (!updating) {
          return update();
        }
      });
      return scope.$on('$destroy', function() {
        return rekapi.removeActor(actor);
      });
    };
  });

}).call(this);

//# sourceMappingURL=kapi-scroll.js.map