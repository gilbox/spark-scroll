if (typeof define == 'function' && define.amd)
  # When using rekapi with requirejs, you must handle the dependencies yourself, because
  # here we assume that if require is being used then rekapi has already been loaded in
  Rekapi = window.Rekapi or (require.defined('rekapi') and require('rekapi'))

  # If any other deps are being loaded in without being exposed in the global namespace,
  # the same as above applies
  _ = window._ or (if require.defined('lodash') then require('lodash') else require('underscore'))
  AnimationFrame = window.AnimationFrame or (if require.defined('animationFrame') then require('animationFrame') else require('AnimationFrame'))
else
  [Rekapi, _, AnimationFrame] = [window.Rekapi, window._, window.AnimationFrame]




angular.module('gilbox.sparkScroll', [])

# sparkAnimator can be overridden to use any animation engine
# so long as the sparkAnimator service supports the following Rekapi-like
# interface:
#
# actor = sparkAnimator.addActor({ context: <dom element> })  # works just like Rekapi.addActor(...)
# actor.keyframe(...)
# actor.moveKeyframe(...)
# actor.removeAllKeyframes(...)
# sparkAnimator.update(...)       # works just like Rekapi.update(...)
#
# See the Rekapi docs for implementation details   http://rekapi.com/dist/doc/
.factory 'sparkAnimator', ($document) -> Rekapi && new Rekapi($document[0].body)

.constant 'sparkFormulas', {

  # formulas are always in the format: variable or variable<offset>
  #   (note that you cannot combine formula variables)
  # for example:
  #
  #      top+40
  #      top-120
  #      top
  #      center
  #      center-111
  #
  # are valid formulas. (top40 is valid as well but less intuitive)
  #
  # each property of the sparkFormulas object is a formula variable

  # top of the element hits the top of the viewport
  top: (element, container, rect, containerRect, offset) ->  ~~(rect.top - containerRect.top + offset)

  # top of the element hits the center of the viewport
  center: (element, container, rect, containerRect, offset) ->  ~~(rect.top - containerRect.top - container.clientHeight/2 + offset)

  # top of the element hits the bottom of the viewport
  bottom: (element, container, rect, containerRect, offset) ->  ~~(rect.top - containerRect.top - container.clientHeight + offset)
}

.constant 'sparkActionProps', {

  # When the up, down fns are called, `this` is the current keyFrame object and `o` is the action object
  # therefore @element and @scope refer to the current element and it's scope

  # fn reference that is called when scrolled down past keyframe
  'onDown':
    down: (o)-> o.val(@, 'onDown', o)

  # fn reference that is called when scrolled up past keyframe
  'onUp':
    up: (o)-> o.val(@, 'onUp', o)

  # class(es) added when scrolled down past keyframe,
  'downAddClass':
    down: (o)-> @element.addClass(o.val)

  # class(es) added when scrolled up past keyframe,
  'upAddClass':
    up: (o)-> @element.addClass(o.val)

  # class(es) removed when scrolled down past keyframe
  'downRemoveClass':
    down: (o)-> @element.removeClass(o.val)

  # class(es) removed when scrolled up past keyframe
  'upRemoveClass':
    up: (o)-> @element.removeClass(o.val)

  # broadcasts an event when scrolled down past keyframe
  'downBroadcast':
    down: (o)-> @scope.$broadcast(o.val, @)

  # broadcasts an event when scrolled up past keyframe
  'upBroadcast':
    up: (o)-> @scope.$broadcast(o.val, @)

  # emits an event when scrolled down past keyframe
  'downEmit':
    down: (o)-> @scope.$emit(o.val, @)

  # emits an event when scrolled up past keyframe
  'upEmit':
    up: (o)-> @scope.$emit(o.val, @)
}

.service 'sparkSetup', ($interval, $rootScope) ->
  int = 0
  @enableInvalidationInterval = (delay = 1000) ->
    $interval.cancel(int) if int
    int = $interval (-> $rootScope.$broadcast 'sparkInvalidate'), delay, 0, false

  @disableInvalidationInterval = -> $interval.cancel(int)
  @

.service 'sparkId', ->
  @elements = {}
  @registerElement = (id, element) ->
    @elements[id] = element
  @

.directive 'sparkId', (sparkId)->
  (scope, element, attr) ->
    sparkId.registerElement(attr.sparkId, element)
    scope.$on '$destroy', -> delete sparkId.elements[attr.sparkId]

directiveFn = ($window, sparkFormulas, sparkActionProps, sparkAnimator, sparkId) ->
  (scope, element, attr) ->

    targetElement = if attr.sparkTrigger then sparkId.elements[attr.sparkTrigger] else element

    hasAnimateAttr = attr.hasOwnProperty('sparkScrollAnimate')  # when using spark-scroll-animate directive animation is enabled
    isAnimated = hasAnimateAttr

    actor = isAnimated && sparkAnimator.addActor({ context: element[0] })
    y = 0
    prevScrollY = 0
    scrollY = 0
    animationFrame = AnimationFrame && new AnimationFrame()
    updating = false

    sparkData = {}
    actionFrames = []
    actionFrameIdx = -1
    container = document.documentElement

    actionsUpdate = ->

      d = scrollY - prevScrollY

      if d<0 and actionFrameIdx >= 0  # scroll up: don't apply on page load (only apply on page load for downward movement)
        idx = if (actionFrameIdx >= actionFrames.length) then actionFrameIdx-1 else actionFrameIdx
        while (idx >= 0 and scrollY < actionFrames[idx])
          c = sparkData[actionFrames[idx]]

          for a, o of c.actions
            for prop in o.props
              actionProp = sparkActionProps[prop]
              actionProp.up.call(c, o) if actionProp.up

          actionFrameIdx = --idx

      if d>=0 and actionFrameIdx < actionFrames.length  # scroll down: will apply on page load
        idx = if (actionFrameIdx < 0) then 0 else actionFrameIdx
        while (idx < actionFrames.length and scrollY > actionFrames[idx])
          c = sparkData[actionFrames[idx]]

          for a, o of c.actions
            for prop in o.props
              actionProp = sparkActionProps[prop]
              actionProp.down.call(c, o) if actionProp.down

          actionFrameIdx = ++idx

      prevScrollY = scrollY


    actionsUpdate = _.throttle(actionsUpdate, 66, {leading: true, maxWait: 66})


    # update for spark-scroll-animate (sparkAnimator-based) animation
    update = ->
      d = scrollY - y
      ad = Math.abs(d)
      if ad < 1.5
        updating = false
        y = scrollY
        sparkAnimator.update(y)
      else
        updating = true
        y += if ad>8 then d*0.25 else (if d > 0 then 1 else -1) # ease the scroll
        sparkAnimator.update(parseInt(y))
        animationFrame.request(update)


    # automatic conversion from camelCase to dashed-case for css properties
    dashersize = (str) ->
      str.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()


    recalcFormulas = ->
      changed = false
      rect = targetElement[0].getBoundingClientRect()
      containerRect = container.getBoundingClientRect()

      for scrollY, keyFrame of sparkData when keyFrame.formula
        newScrollY = keyFrame.formula.fn(targetElement, container, rect, containerRect, keyFrame.formula.offset)
        if newScrollY != ~~scrollY
          changed = true
          actor.moveKeyframe(~~scrollY, newScrollY) if keyFrame.anims and hasAnimateAttr # the ~~ is necessary :(
          sparkData[newScrollY] = keyFrame
          delete sparkData[scrollY]

      if changed
        actionFrames = []
        actionFrames.push(~~scrollY) for scrollY of sparkData
        actionFrames.sort (a,b) -> a > b
        onScroll()  # todo: this is checking scrollY unnecessarily
        # @todo: now are we screwed if something was already passed by ?


    watchCancel = scope.$watch attr[if hasAnimateAttr then 'sparkScrollAnimate' else 'sparkScroll'], (data) ->
      return unless data

      # useful in angular < v1.3 where one-time binding isn't available
      if attr.sparkScrollBindOnce? then watchCancel()

      actor.removeAllKeyframes() if hasAnimateAttr

      # element ease property
      elmEase = data.ease || 'linear';
      delete data.ease
      animCount = 0

      sparkData = {}
      actionFrames = []

      # this is used for formula comprehension... a possible performance improvement might
      # forgo these calculations by adding some option or deferring calculation automatically
      rect = targetElement[0].getBoundingClientRect()
      containerRect = container.getBoundingClientRect()

      for scrollY, keyFrame of data
        actionCount = 0

        # formula comprehension
        # when scrollY first char is not a digit, we assume this is a formula
        c = scrollY.charCodeAt(0)
        if (c < 48 or c > 57)
          parts = scrollY.match(/^(\w+)(.*)$/)
          formula =
            fn: sparkFormulas[parts[1]],
            offset: ~~parts[2]

          scrollY = formula.fn(targetElement, container, rect, containerRect, formula.offset)
          return if sparkData[scrollY]  # silent death for overlapping scrollY's (assume that the element isn't ready)

        # keyframe ease property
        # (will override or fallback to element ease property)
        ease = {}
        kfEase = elmEase
        if keyFrame.ease?
          if angular.isObject(keyFrame.ease)
            ease = keyFrame.ease
          else
            kfEase = keyFrame.ease
          delete keyFrame.ease

        for k,v of keyFrame
            ksplit = k.split(',')

            # put actions in actions sub-object
            if sparkActionProps[ksplit[0]] # @todo: rigorous check ? (we assume that if the first action is legit then they all are)

              keyFrame.actions or= { }  # could be more efficient to make actions an array
              keyFrame.actions[k] = # action object
                props: ksplit
                val: v
              delete keyFrame[k]
              actionCount++

            # put animations in anims sub-object
            else # since it's not an action, assume it's an animation property

              # comprehension of array-notation for easing
              # (will override or fall back to keyframe ease propery as needed)
              keyFrame.anims or= {}
              dprop = dashersize(k)
              v = [v, kfEase] unless angular.isArray(v)
              o = {}
              o[dprop] = v[1]
              angular.extend(ease, o)

              keyFrame.anims[dprop] = v[0]
              delete keyFrame[k]

        if keyFrame.anims && hasAnimateAttr
          actor.keyframe(scrollY, keyFrame.anims, ease)
          animCount++

        keyFrame.formula = formula
        keyFrame.element = element
        keyFrame.scope = scope
  #        keyFrame.actionCount = actionCount

        sparkData[scrollY] = keyFrame
        actionFrames.push(~~scrollY) if actionCount

      isAnimated = hasAnimateAttr && !! animCount

      actionFrames.sort (a,b) -> a > b

      prevScrollY = scrollY = $window.scrollY
      update() if isAnimated
      actionsUpdate()

    , true  # deep watch

    # respond to scroll event

    onScroll = ->
      scrollY = $window.scrollY
      actionsUpdate()
      update() if isAnimated && !updating # debounced update

    onInvalidate = _.debounce(recalcFormulas, 100, {leading: false})

    angular.element($window).on 'scroll', onScroll
    angular.element($window).on 'resize', onInvalidate
    scope.$on 'sparkInvalidate', onInvalidate

    scope.$on '$destroy', ->
      sparkAnimator.removeActor(actor) if isAnimated
      angular.element($window).off 'scroll', onScroll
      angular.element($window).off 'resize', onInvalidate


angular.module('gilbox.sparkScroll')
  .directive 'sparkScroll',        ['$window', 'sparkFormulas', 'sparkActionProps', 'sparkAnimator', 'sparkId', directiveFn]
  .directive 'sparkScrollAnimate', ['$window', 'sparkFormulas', 'sparkActionProps', 'sparkAnimator', 'sparkId', directiveFn]
