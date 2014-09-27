  if (typeof define == 'function' && define.amd)
    # When using rekapi with requirejs, you must handle the dependencies yourself, because
    # here we assume that if require is being used then rekapi has already been loaded in
    Rekapi = window.Rekapi or require('rekapi')

    # If any other deps are being loaded in without being exposed in the global namespace,
    # the same as above applies
    _ = window._ or (if require.defined('lodash') then require('lodash') else require('underscore'))
    AnimationFrame = window.AnimationFrame or (if require.defined('animationFrame') then require('animationFrame') else require('AnimationFrame'))

  angular.module('gilbox.kapiScroll', [])
    .factory 'rekapi', ($document) -> new Rekapi($document[0].body)
    .directive 'kapiScroll', (rekapi, $window) ->
      (scope, element, attr) ->
        actor = rekapi.addActor({ context: element[0] })
        y = 0
        scrollY = 0
        animationFrame = new AnimationFrame()
        updating = false

        actionProps = {

          # When the up, down fns are called, `this` is the current keyFrame object

          # keyframe onUp property
          # fn reference that is called when scrolled up past keyframe
          'onUp':
            up: -> @onUp()

          # keyframe onDown property
          # fn reference that is called when scrolled down past keyframe
          'onDown':
            down: -> @onDown()

          # keyframe class property
          # class(es) added when scrolled down past keyframe,
          # but removed when scrolled up past keyframe
          'class':
            up: -> element.removeClass(this['class'])
            down: -> element.addClass(this['class'])

          # keyframe classUp property
          # class(es) added when scrolled up past keyframe,
          # but removed when scrolled down past keyframe
          'classUp':
            up: -> element.addClass(@classUp)
            down: -> element.removeClass(@classUp)

          # keyframe classRemove property
          # class(es) removed when scrolled down past keyframe
          'classRemove':
            down: -> element.removeClass(@classRemove)

          # keyframe classUpRemove property
          # class(es) removed when scrolled up past keyframe
          'classUpRemove':
            up: -> element.removeClass(@classUpRemove)

        }
        actionPropKeys = _.keys(actionProps)
        actions = {}
        actionFrames = []
        actionFrameIdx = -1

        actionsUpdate = ->

          d = scrollY - y

          if d<0 and actionFrameIdx >= 0  # scroll up: don't apply on page load (only apply on page load for downward movement)
            idx = if (actionFrameIdx >= actionFrames.length) then actionFrameIdx-1 else actionFrameIdx
            while (idx >= 0 and y < actionFrames[idx])
              c = actions[actionFrames[idx]]

              for prop of c
                actionProp = actionProps[prop]
                actionProp.up.apply(c) if actionProp.up

              actionFrameIdx = --idx

          if d>=0 and actionFrameIdx < actionFrames.length  # scroll down: will apply on page load
            idx = if (actionFrameIdx < 0) then 0 else actionFrameIdx
            while (idx < actionFrames.length and y > actionFrames[idx])
              c = actions[actionFrames[idx]]

              for prop of c
                actionProp = actionProps[prop]
                actionProp.down.apply(c) if actionProp.down

              actionFrameIdx = ++idx


        actionsUpdate = _.debounce(actionsUpdate, 33, {leading: true, maxWait: 33})


        update = ->
          d = scrollY - y
          ad = Math.abs(d)
          if ad < 1.5
            updating = false
            y = scrollY
            rekapi.update(y)
          else
            updating = true
            y += if ad>8 then d*0.25 else (if d > 0 then 1 else -1) # ease the scroll
            rekapi.update(parseInt(y))
            animationFrame.request(update)


        # automatic conversion from camelCase to dashed-case
        dashersize = (str) ->
          str.replace(/\W+/g, '-').replace(/([a-z\d])([A-Z])/g, '$1-$2')


        ksWatchCancel = scope.$watch attr.kapiScroll, (data) ->
          return unless data

          # useful in angular < v1.3 where one-time binding isn't available
          if attr.kapiScrollBindOnce? then ksWatchCancel()

          # element ease property
          elmEase = data.ease || 'linear';
          delete data.ease

          actions = {}
          actionFrames = []

          # setup the rekapi keyframes
          for scrollY, keyFrame of data

            actionCount = 0

            # custom actions not supported by rekapi
            for actionProp in actionPropKeys
              if keyFrame[actionProp]
                actionCount++
                actions[scrollY] or= {}
                actions[scrollY][actionProp] = keyFrame[actionProp]
                delete keyFrame[actionProp]

            actionFrames.push(parseInt(scrollY)) if actionCount

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

            # comprehension of array-notation for easing
            # (will override or fall back to keyframe ease propery as needed)
            for prop, val of keyFrame
              prop = dashersize(prop)
              val = [val, kfEase] if not angular.isArray(val)
              o = {}
              o[prop] = val[1]
              angular.extend(ease, o)
              keyFrame[prop] = val[0]

            actor.keyframe(scrollY, keyFrame, ease)

          actionFrames.sort (a,b) -> a > b

          y = scrollY = $window.scrollY
          update()
          actionsUpdate()
        , true  # deep watch

        # respond to scroll event
        angular.element($window).on 'scroll', ->
          scrollY = $window.scrollY
          actionsUpdate()
          update() if !updating # debounced update

        scope.$on '$destroy', ->
          rekapi.removeActor(actor)
          angular.element($window).off 'scroll'