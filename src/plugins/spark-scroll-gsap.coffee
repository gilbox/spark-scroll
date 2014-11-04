class Actor
  constructor: (@tl, @context) ->
    @frames = []
    @frameHash = {}
    @normalizedFrames = []

  normalizeFrames: ->
    @normalizedFrames = _.sortBy(_.cloneDeep(@frames), 'scrollY')

    # frame inheritance
    _.forEach @normalizedFrames, (frame, index, arr) ->  # @todo: regular for loop would be faster?
      _.defaults(frame.anims, arr[index-1].anims) if index
    @

  keyframe: (scrollY, anims, ease) ->
    frame =
      scrollY: scrollY
      anims: anims
      ease: ease
    @frames.push(frame)
    @frameHash[scrollY] = frame
    @
    
  buildTimeline: ->
    @tl.clear()
    _.forEach @normalizedFrames, (frame, index, arr) =>
      if index
        prevFrame = arr[index-1]

        # for easing, instead of this:
        # @tl.fromTo(@context, frame.scrollY - prevFrame.scrollY, prevFrame.anims, frame.anims, prevFrame.scrollY)

        # ...do this:
        # creating a new fromTo for each property to support per-property easing
        # this seems pretty inefficient
        duration = frame.scrollY - prevFrame.scrollY
        for k,v of frame.anims
          a = {}
          pa = {}
          a[k] = v
          a.ease = frame.ease[k]
          pa[k] = prevFrame.anims[k]
          @tl.fromTo(@context, duration, pa, a, prevFrame.scrollY)
          @tl.pause()
      return true
    @
    
  finishedAddingKeyframes: ->
    @normalizeFrames()
    @buildTimeline()
    @

  moveKeyframe: (oldPos, newPos) ->
    frame = @frameHash[oldPos]
    @frameHash[newPos] = frame
    frame.scrollY = newPos
    delete @frameHash[oldPos]
    @normalizeFrames()
    @buildTimeline()  # todo: use change detection to optimize ?
    @

  removeAllKeyframes: ->
    @tl.clear()
    @frames = []
    @


class GSAPAnimator
  constructor: ->
    @tl = new TimelineLite({useFrames:true})

  addActor: (options) ->
    @context = options.context
    @actor = new Actor(@tl, @context)

  update: (pos) ->
    @tl.seek(pos, false) if pos>=0 # It balks at negative pos values
    @


angular.module('gilbox.sparkScroll').factory 'sparkAnimator', ->
  instance: ->
    new GSAPAnimator()