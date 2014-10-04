angular.module('gilbox.sparkScroll', [])

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

.directive 'sparkScroll', ($window, sparkFormulas, sparkActionProps) ->
  (scope, element, attr) ->
    prevScrollY = 0
    scrollY = 0

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


    recalcFormulas = ->
      changed = false
      rect = element[0].getBoundingClientRect()
      containerRect = container.getBoundingClientRect()

      for scrollY, keyFrame of sparkData when keyFrame.formula
        newScrollY = sparkFormulas[keyFrame.formula.variable](element, container, rect, containerRect, keyFrame.formula.offset)
        if newScrollY != ~~scrollY
          changed = true
          sparkData[newScrollY] = keyFrame
          delete sparkData[scrollY]

      if changed
        actionFrames = []
        actionFrames.push(~~scrollY) for scrollY of sparkData
        actionFrames.sort (a,b) -> a > b
        # @todo: now are we screwed if something was already passed by ?


    watchCancel = scope.$watch attr.sparkScroll, (data) ->
      return unless data

      # useful in angular < v1.3 where one-time binding isn't available
      if attr.sparkScrollBindOnce? then watchCancel()

      sparkData = {}
      actionFrames = []

      # this is used for formula comprehension... a possible performance improvement might
      # forgo these calculations by adding some option or deferring calculation automatically
      rect = element[0].getBoundingClientRect()
      containerRect = container.getBoundingClientRect()

      for scrollY, keyFrame of data
#        actionCount = 0
#        grossActionCount = 0

        # formula comprehension
        # when scrollY first char is not a digit, we assume this is a formula
        c = scrollY.charCodeAt(0)
        if (c < 48 or c > 57)
          keyFrame.formula = { f: scrollY }
          parts = scrollY.match(/^(\w+)(.*)$/)
          scrollY = sparkFormulas[keyFrame.formula.variable = parts[1]](
            element, container, rect, containerRect, keyFrame.formula.offset = ~~parts[2]
          )
          return if sparkData[scrollY]  # silent death for overlapping scrollY's (assume that the element isn't ready)

        # put actions in actions sub-object
        for k,v of keyFrame
          ksplit = k.split(',')
          if sparkActionProps[ksplit[0]] # @todo: rigorous check ? (we assume that if the first action is legit then they all are)
            keyFrame.actions or= { }  # could be more efficient to make actions an array
            keyFrame.actions[k] = # action object
              props: ksplit
              val: v
            delete keyFrame[k]
#           actionCount++
#           grossActionCount += ksplit.length

        keyFrame.element = element
        keyFrame.scope = scope
#        keyFrame.actionCount = actionCount
#        keyFrame.grossActionCount = grossActionCount

        sparkData[scrollY] = keyFrame

      actionFrames.push(~~scrollY) for scrollY of sparkData
      actionFrames.sort (a,b) -> a > b

      prevScrollY = scrollY = $window.scrollY
      actionsUpdate()

    , true  # deep watch

    # respond to scroll event

    onScroll = ->
      scrollY = $window.scrollY
      actionsUpdate()

    onResize = _.debounce(recalcFormulas, 100, {leading: false})

    angular.element($window).on 'scroll', onScroll
    angular.element($window).on 'resize', onResize

    scope.$on '$destroy', ->
      angular.element($window).off 'scroll', onScroll
      angular.element($window).off 'resize', onResize