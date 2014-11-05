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
.factory 'sparkAnimator', ['$document', ($document) ->
  instance: ->
    Rekapi && new Rekapi($document[0].body)
]

.constant 'sparkFormulas', {

  # formulas are always in the format: variable or variable<offset>
  #   (note that you cannot combine formula variables)
  # for example:
  #
  #      topTop+40
  #      topBottom-120
  #      topCenter
  #      centerTop
  #      centerCenter-111
  #
  # are valid formulas. (topTop40 is valid as well but less intuitive)
  #
  # each property of the sparkFormulas object is a formula variable

  # top of the element hits the top of the viewport
  topTop: `function topTop(element, container, rect, containerRect, offset) { return ~~(rect.top - containerRect.top + offset) }`

  # top of the element hits the center of the viewport
  topCenter: `function topCenter(element, container, rect, containerRect, offset) { return ~~(rect.top - containerRect.top - container.clientHeight/2 + offset) }`

  # top of the element hits the bottom of the viewport
  topBottom: `function topBottom(element, container, rect, containerRect, offset) {  return ~~(rect.top - containerRect.top - container.clientHeight + offset) }`

  # center of the element hits the top of the viewport
  centerTop: `function centerTop(element, container, rect, containerRect, offset) { return ~~(rect.top + rect.height/2 - containerRect.top + offset) }`

  # center of the element hits the center of the viewport
  centerCenter: `function centerCenter(element, container, rect, containerRect, offset) { return ~~(rect.top + rect.height/2 - containerRect.top - container.clientHeight/2 + offset) }`

  # center of the element hits the bottom of the viewport
  centerBottom: `function centerBottom(element, container, rect, containerRect, offset) {  return ~~(rect.top + rect.height/2 - containerRect.top - container.clientHeight + offset) }`

  # bottom of the element hits the top of the viewport
  bottomTop: `function bottomTop(element, container, rect, containerRect, offset) { return ~~(rect.bottom - containerRect.top + offset) }`

  # bottom of the element hits the bottom of the viewport
  bottomBottom: `function bottomBottom(element, container, rect, containerRect, offset) { return ~~(rect.bottom - containerRect.top - container.clientHeight + offset) }`

  # bottom of the element hits the center of the viewport
  bottomCenter: `function bottomCenter(element, container, rect, containerRect, offset) { return ~~(rect.bottom - containerRect.top - container.clientHeight/2 + offset) }`
}

.constant 'sparkActionProps', {

  # When the up, down fns are called, `this` is the current keyFrame object and `o` is the action object
  # therefore @element and @scope refer to the current element and it's scope

  # fn reference that is called when scrolled down past keyframe
  'onDown':
    down: (o)-> if _.isString(o.val) then @scope.$eval(o.val)(@, 'onDown', o) else o.val(@, 'onDown', o)

  # fn reference that is called when scrolled up past keyframe
  'onUp':
    up: (o)-> if _.isString(o.val) then @scope.$eval(o.val)(@, 'onUp', o) else o.val(@, 'onUp', o)

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

.service 'sparkSetup', [ '$interval', '$rootScope', ($interval, $rootScope) ->
  int = 0
  @enableInvalidationInterval = (delay = 1000) ->
    $interval.cancel(int) if int
    int = $interval (-> $rootScope.$broadcast 'sparkInvalidate'), delay, 0, false

  @disableInvalidationInterval = -> $interval.cancel(int)

  # enable/disable spark-scroll-animate
  @disableSparkScrollAnimate = false

  # enable/disable spark-scroll
  @disableSparkScroll = false

  # enable/disable logging
  @debug = false
  @
]

.service 'sparkId', ->
  @elements = {}
  @registerElement = (id, element) ->
    @elements[id] = element
  @

.directive 'sparkId', [ 'sparkId', (sparkId)->
  (scope, element, attr) ->
    sparkId.registerElement(attr.sparkId, element)
    scope.$on '$destroy', -> delete sparkId.elements[attr.sparkId]
]

directiveFn = ($window, $timeout, sparkFormulas, sparkActionProps, sparkAnimator, sparkId, sparkSetup) ->
  (scope, element, attr) ->

    hasAnimateAttr = attr.hasOwnProperty('sparkScrollAnimate')  # when using spark-scroll-animate directive animation is enabled
    isAnimated = hasAnimateAttr
    return if hasAnimateAttr and sparkSetup.disableSparkScrollAnimate
    return if !hasAnimateAttr and sparkSetup.disableSparkScroll

    # all callback-related vars
    callback = false
    prevRatio = 0
    minScrollY = 0
    maxScrollY = 0

    animator = hasAnimateAttr && sparkAnimator.instance()
    actor = isAnimated && animator.addActor({ context: element[0] })
    y = 0
    prevy = 0
    scrollY = 0
    animationFrame = AnimationFrame && new AnimationFrame()
    updating = false

    data = null
    sparkData = null
    actionFrames = []
    actionFrameIdx = -1
    container = document.documentElement

    triggerElement = element

    if attr.sparkTrigger
      setTriggerElement = ->
        if sparkId.elements[attr.sparkTrigger]
          triggerElement = sparkId.elements[attr.sparkTrigger]
          recalcFormulas() if recalcFormulas
        else
          # aggressively poll for the trigger element if we don't find it (because it's not ready yet)
          $timeout setTriggerElement, 0, false
      setTriggerElement()

    actionsUpdate = ->

      d = y - prevy

      if d<0 and actionFrameIdx >= 0  # scroll up: don't apply on page load (only apply on page load for downward movement)
        idx = if (actionFrameIdx >= actionFrames.length) then actionFrameIdx-1 else actionFrameIdx
        while (idx >= 0 and y < actionFrames[idx])
          c = sparkData[actionFrames[idx]]

          for a, o of c.actions
            for prop in o.props
              actionProp = sparkActionProps[prop]
              actionProp.up.call(c, o) if actionProp.up

          actionFrameIdx = --idx

      if d>=0 and actionFrameIdx < actionFrames.length  # scroll down: will apply on page load
        idx = if (actionFrameIdx < 0) then 0 else actionFrameIdx
        while (idx < actionFrames.length and y > actionFrames[idx])
          c = sparkData[actionFrames[idx]]

          for a, o of c.actions
            for prop in o.props
              actionProp = sparkActionProps[prop]
              actionProp.down.call(c, o) if actionProp.down

          actionFrameIdx = ++idx

      prevy = y
      updating = false


    # update for spark-scroll-animate (sparkAnimator-based) animation
    if attr.hasOwnProperty('sparkScrollEase')
      update = ->
        d = scrollY - y
        ad = Math.abs(d)
        doCallback() if callback
        actionsUpdate() # sets updating = false
        if ad < 1.5
          y = scrollY
          animator.update(y)
        else
          updating = true
          y += if ad>8 then d*0.25 else (if d > 0 then 1 else -1) # ease the scroll
          animator.update(~~y)
          animationFrame.request(update)
    else
      update = ->
        y = scrollY
        animator.update(y)
        doCallback() if callback
        actionsUpdate() # sets updating = false


    # @todo: we could use $parse instead for a more flexible solution but is the addt'l overhead worth it?
    if attr.hasOwnProperty('sparkScrollCallback')
      attr.$observe 'sparkScrollCallback', (v) ->
        callback = scope.$eval(v)
        callback = false unless _.isFunction(callback)
        recalcMinMax() unless maxScrollY


    recalcMinMax = ->
      idx = 0
      for scrY of sparkData
        scrY = ~~ scrY
        if idx++
          if scrY > maxScrollY
            maxScrollY = scrY
          else if scrY < minScrollY
            minScrollY = scrY
        else
          maxScrollY = minScrollY = scrY


    doCallback = ->
      ratio = Math.max(0, Math.min(y/(maxScrollY-minScrollY), 1))
      callback ratio if ratio != prevRatio
      prevRatio = ratio


    recalcFormulas = ->
      if sparkData
        changed = false
        rect = triggerElement[0].getBoundingClientRect()
        containerRect = container.getBoundingClientRect()

        for scrY, keyFrame of sparkData when keyFrame.formula
          newScrY = keyFrame.formula.fn(triggerElement, container, rect, containerRect, keyFrame.formula.offset)
          if newScrY != ~~scrY
            changed = true
            actor.moveKeyframe(~~scrY, newScrY) if keyFrame.anims and hasAnimateAttr # the ~~ is necessary :(
            sparkData[newScrY] = keyFrame
            delete sparkData[scrY]

        if changed
          recalcMinMax() if callback
          actionFrames = []
          actionFrames.push(~~scrY) for scrY, kf of sparkData when kf.actionCount
          actionFrames.sort (a,b) -> a > b
          onScroll()  # todo: this is checking scrollY unnecessarily
          # @todo: now are we screwed if something was already passed by ?
      else
        parseData()
        recalcFormulas() if sparkData


    parseData = ->
      return unless data

      actor.removeAllKeyframes() if hasAnimateAttr

      # element ease property
      elmEase = data.ease || 'linear';
      delete data.ease
      animCount = 0

      sparkData = {}
      actionFrames = []

      # this is used for formula comprehension... a possible performance improvement might
      # forgo these calculations by adding some option or deferring calculation automatically
      rect = triggerElement[0].getBoundingClientRect()
      containerRect = container.getBoundingClientRect()

      for scrY, keyFrame of data
        keyFrame = _.clone(keyFrame)  # clone for cases when parseData fails and needs to be called again
        actionCount = 0

        # formula comprehension
        # when scrollY first char is not a digit, we assume this is a formula
        c = scrY.charCodeAt(0)
        if (c < 48 or c > 57)
          parts = scrY.match(/^(\w+)(.*)$/)
          formula =
            fn: sparkFormulas[parts[1]],
            offset: ~~parts[2]

          scrY = formula.fn(triggerElement, container, rect, containerRect, formula.offset)
          if sparkData[scrY]  # silent death for overlapping scrY's (assume that the element isn't ready)
            console.log "warning: spark-scroll failed to calculate formulas", (attr.sparkScroll || attr.sparkScrollAnimate) if sparkSetup.debug
            sparkData = null
            return

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
            v = [v, kfEase] unless angular.isArray(v)
            o = {}
            o[k] = v[1]
            angular.extend(ease, o)

            keyFrame.anims[k] = v[0]
            delete keyFrame[k]

        if keyFrame.anims && hasAnimateAttr
          actor.keyframe(scrY, keyFrame.anims, ease)
          animCount++

        keyFrame.formula = formula
        keyFrame.element = element
        keyFrame.scope = scope
        keyFrame.actionCount = actionCount

        sparkData[scrY] = keyFrame
        actionFrames.push(~~scrY) if actionCount

      isAnimated = hasAnimateAttr && !! animCount

      # actors can optionally expose this function to receive a notification that parsing completed
      actor.finishedAddingKeyframes && actor.finishedAddingKeyframes() if isAnimated

      actionFrames.sort (a,b) -> a > b
      recalcMinMax() if callback

      y = prevy = scrollY = $window.pageYOffset
      update() if isAnimated
      actionsUpdate()

    watchCancel = scope.$watch attr[if hasAnimateAttr then 'sparkScrollAnimate' else 'sparkScroll'], (d) ->
      return unless d
      data = _.clone(d)   # clone for cases when parseData fails and needs to be called again

      # useful in angular < v1.3 where one-time binding isn't available
      if attr.sparkScrollBindOnce? then watchCancel()

      parseData()
    , true  # deep watch


    nonAnimatedUpdate = ->
      doCallback() if callback
      actionsUpdate()


    # respond to scroll event
    onScroll = ->
      scrollY = $window.pageYOffset

      unless updating # debounced update
        updating = true # in-case multiple scroll events can occur in one frame (possible?)
        if isAnimated
            animationFrame.request(update)
        else
          y = scrollY
          animationFrame.request(nonAnimatedUpdate) # @todo: do these calls get queued between frames ?

    # a simple leading:false debounce based on underscore
    debounce = (func, wait) ->
      timeout = 0
      f = ->
        context = this
        args = arguments
        later = ->
          timeout = null
          func.apply(context, args)

        clearTimeout(timeout)
        timeout = setTimeout(later, wait)

      f.cancel = ->
        clearTimeout(timeout)
      f

    onInvalidate = debounce(recalcFormulas, 100)

    angular.element($window).on 'scroll', onScroll
    angular.element($window).on 'resize', onInvalidate
    scope.$on 'sparkInvalidate', onInvalidate

    scope.$on '$destroy', ->
      animator.removeActor(actor) if isAnimated
      angular.element($window).off 'scroll', onScroll
      angular.element($window).off 'resize', onInvalidate
      onInvalidate.cancel()


angular.module('gilbox.sparkScroll')
  .directive 'sparkScroll',        ['$window', '$timeout', 'sparkFormulas', 'sparkActionProps', 'sparkAnimator', 'sparkId', 'sparkSetup', directiveFn]
  .directive 'sparkScrollAnimate', ['$window', '$timeout', 'sparkFormulas', 'sparkActionProps', 'sparkAnimator', 'sparkId', 'sparkSetup', directiveFn]
