(function() {
  angular.module('gilbox.kapiScroll', []).factory('rekapi', function($document) {
    return new Rekapi($document[0].body);
  }).directive('kapiScroll', function(rekapi, $window) {
    return function(scope, element, attr) {
      var actor, animationFrame, classFrameIdx, classFrames, classes, classesUpdate, lastScrollY, scrollY, update, updating, y;
      actor = rekapi.addActor({
        context: element[0]
      });
      y = 0;
      lastScrollY = 0;
      scrollY = 0;
      animationFrame = new AnimationFrame();
      updating = false;
      classes = {};
      classFrames = [];
      classFrameIdx = -1;
      classesUpdate = function(d) {
        var c, idx, _results;
        if (d < 0 && classFrameIdx >= 0) {
          idx = classFrameIdx >= classFrames.length ? classFrameIdx - 1 : classFrameIdx;
          while (idx >= 0 && y < classFrames[idx]) {
            c = classes[classFrames[idx]];
            if (c["class"]) {
              element.removeClass(c["class"]);
            }
            if (c.classUp) {
              element.addClass(c.classUp);
            }
            if (c.classUpRemove) {
              element.removeClass(c.classUpRemove);
            }
            classFrameIdx = --idx;
          }
        }
        if (d >= 0 && classFrameIdx < classFrames.length) {
          idx = classFrameIdx < 0 ? 0 : classFrameIdx;
          _results = [];
          while (idx < classFrames.length && y > classFrames[idx]) {
            c = classes[classFrames[idx]];
            if (c["class"]) {
              element.addClass(c["class"]);
            }
            if (c.classUp) {
              element.removeClass(c.classUp);
            }
            if (c.classRemove) {
              element.removeClass(c.classRemove);
            }
            _results.push(classFrameIdx = ++idx);
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
        return classesUpdate(d);
      };
      scope.$watch(attr.kapiScroll, function(data) {
        var ease, elmEase, keyFrame, kfEase, o, prop, val;
        if (!data) {
          return;
        }
        elmEase = data.ease || 'linear';
        delete data.ease;
        classes = {};
        classFrames = [];
        for (scrollY in data) {
          keyFrame = data[scrollY];
          if ((keyFrame["class"] != null) || (keyFrame.classUp != null) || (keyFrame.classRemove != null) || (keyFrame.classUpRemove != null)) {
            classFrames.push(parseInt(scrollY));
          }
          if (keyFrame["class"] != null) {
            classes[scrollY] || (classes[scrollY] = {});
            angular.extend(classes[scrollY], {
              "class": keyFrame["class"]
            });
            delete keyFrame["class"];
          }
          if (keyFrame.classUp != null) {
            classes[scrollY] || (classes[scrollY] = {});
            angular.extend(classes[scrollY], {
              classUp: keyFrame.classUp
            });
            delete keyFrame.classUp;
          }
          if (keyFrame.classRemove != null) {
            classes[scrollY] || (classes[scrollY] = {});
            angular.extend(classes[scrollY], {
              classRemove: keyFrame.classRemove
            });
            delete keyFrame.classRemove;
          }
          if (keyFrame.classUpRemove != null) {
            classes[scrollY] || (classes[scrollY] = {});
            angular.extend(classes[scrollY], {
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
        classFrames.sort(function(a, b) {
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