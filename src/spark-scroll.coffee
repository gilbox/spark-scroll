angular.module('gilbox.sparkScroll', [])
.constant 'sparkActionProps', {

  # When the up, down fns are called, `this` is the current keyFrame object and `o` is the action object
  # therefore @element and @scope refer to the current element and it's scope

  # keyframe onDown property
  # fn reference that is called when scrolled down past keyframe
  'onDown':
    down: (o)-> o.val(@, 'onDown', o)

  # keyframe onUp property
  # fn reference that is called when scrolled up past keyframe
  'onUp':
    up: (o)-> o.val(@, 'onUp', o)

  # keyframe classUp property
  # class(es) added when scrolled down past keyframe,
  'downAddClass':
    down: (o)-> @element.addClass(o.val)

  # keyframe class property
  # class(es) added when scrolled down past keyframe,
  # but removed when scrolled up past keyframe
  'upAddClass':
    up: (o)-> @element.addClass(o.val)

  # keyframe classRemove property
  # class(es) removed when scrolled down past keyframe
  'downRemoveClass':
    down: (o)-> @element.removeClass(o.val)

  # keyframe classUpRemove property
  # class(es) removed when scrolled up past keyframe
  'upRemoveClass':
    up: (o)-> @element.removeClass(o.val)

  # keyframe broadcast event property
  # broadcasts an event when scrolled down past keyframe
  'downBroadcast':
    down: (o)-> @scope.$broadcast(o.val, @)

  # keyframe broadcast event property
  # broadcasts an event when scrolled up past keyframe
  'upBroadcast':
    up: (o)-> @scope.$broadcast(o.val, @)

  # keyframe emit event property
  # emits an event when scrolled down past keyframe
  'downEmit':
    down: (o)-> @scope.$emit(o.val, @)

  # keyframe emit event property
  # emits an event when scrolled up past keyframe
  'upEmit':
    up: (o)-> @scope.$emit(o.val, @)
}

.directive 'sparkScroll', ($window, sparkActionProps) ->
  (scope, element, attr) ->
    prevScrollY = 0
    scrollY = 0

    sparkData = {}
    actionFrames = []
    actionFrameIdx = -1

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


    actionsUpdate = _.debounce(actionsUpdate, 33, {leading: true, maxWait: 33})


    watchCancel = scope.$watch attr.sparkScroll, (data) ->
      return unless data

      # useful in angular < v1.3 where one-time binding isn't available
      if attr.sparkScrollBindOnce? then watchCancel()

      sparkData = data
      actionFrames = []

      for scrollY, keyFrame of sparkData

#        actionCount = 0
#        grossActionCount = 0

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

      actionFrames.push(parseInt(scrollY)) for scrollY of sparkData
      actionFrames.sort (a,b) -> a > b

      prevScrollY = scrollY = $window.scrollY
      actionsUpdate()

    , true  # deep watch

    # respond to scroll event
    angular.element($window).on 'scroll', ->
      prevScrollY = scrollY
      scrollY = $window.scrollY
      actionsUpdate()

    scope.$on '$destroy', ->
      angular.element($window).off 'scroll'