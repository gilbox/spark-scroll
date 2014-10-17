(function() {
  var Actor, GSAPAnimator;

  Actor = (function() {
    function Actor(tl, context) {
      this.tl = tl;
      this.context = context;
      this.frames = [];
      this.frameHash = {};
      this.normalizedFrames = [];
    }

    Actor.prototype.normalizeFrames = function() {
      this.normalizedFrames = _.sortBy(_.cloneDeep(this.frames), 'scrollY');
      _.forEach(this.normalizedFrames, function(frame, index, arr) {
        if (index) {
          return _.defaults(frame.anims, arr[index - 1].anims);
        }
      });
      return this;
    };

    Actor.prototype.keyframe = function(scrollY, anims, ease) {
      var frame;
      frame = {
        scrollY: scrollY,
        anims: anims,
        ease: ease
      };
      this.frames.push(frame);
      this.frameHash[scrollY] = frame;
      return this;
    };

    Actor.prototype.buildTimeline = function() {
      this.tl.clear();
      _.forEach(this.normalizedFrames, (function(_this) {
        return function(frame, index, arr) {
          var a, k, pa, prevFrame, v, _ref, _results;
          if (index) {
            prevFrame = arr[index - 1];
            _ref = frame.anims;
            _results = [];
            for (k in _ref) {
              v = _ref[k];
              a = {};
              pa = {};
              a[k] = v;
              a.ease = frame.ease[k];
              pa[k] = prevFrame.anims[k];
              _results.push(_this.tl.fromTo(_this.context, frame.scrollY - prevFrame.scrollY, pa, a, prevFrame.scrollY));
            }
            return _results;
          }
        };
      })(this));
      return this;
    };

    Actor.prototype.finishedAddingKeyframes = function() {
      this.normalizeFrames();
      this.buildTimeline();
      return this;
    };

    Actor.prototype.moveKeyframe = function(oldPos, newPos) {
      var frame;
      frame = this.frameHash[oldPos];
      this.frameHash[newPos] = frame;
      frame.scrollY = newPos;
      delete this.frameHash[oldPos];
      this.normalizeFrames();
      this.buildTimeline();
      return this;
    };

    Actor.prototype.removeAllKeyframes = function() {
      this.tl.clear();
      this.frames = [];
      return this;
    };

    return Actor;

  })();

  GSAPAnimator = (function() {
    function GSAPAnimator() {
      this.tl = new TimelineLite({
        useFrames: false
      });
    }

    GSAPAnimator.prototype.addActor = function(options) {
      this.context = options.context;
      return this.actor = new Actor(this.tl, this.context);
    };

    GSAPAnimator.prototype.update = function(pos) {
      if (pos >= 0) {
        this.tl.seek(pos);
      }
      return this;
    };

    return GSAPAnimator;

  })();

  angular.module('gilbox.sparkScroll').factory('sparkAnimator', function($document) {
    return {
      instance: function() {
        return new GSAPAnimator();
      }
    };
  });

}).call(this);

//# sourceMappingURL=../plugins/spark-scroll-gsap.js.map