  angular.module('gilbox.kapiScroll', [])
    .factory 'rekapi', ($document) -> new Rekapi($document[0].body)
    .directive 'kapiScroll', (rekapi, $window) ->
      (scope, element, attr) ->
        actor = rekapi.addActor({ context: element[0] })
        y = 0
        lastScrollY = 0
        scrollY = 0
        animationFrame = new AnimationFrame()
        updating = false

        classes = {}
        classes.frames = []
        classFrameIdx = -1

        classesUpdate = (d) ->

          if d<=0 and classFrameIdx >= 0
            idx = if (classFrameIdx >= classes.frames.length) then classFrameIdx-1 else classFrameIdx
            while (idx >= 0 and y < classes.frames[idx])
              element.removeClass(classes[classes.frames[idx]])
              classFrameIdx = --idx

          if d>=0 and classFrameIdx < classes.frames.length
            idx = if (classFrameIdx < 0) then 0 else classFrameIdx
            while (idx < classes.frames.length and y > classes.frames[idx])
              element.addClass(classes[classes.frames[idx]])
              classFrameIdx = ++idx


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

          classesUpdate(d)  # todo: debounce this more ?

        scope.$watch attr.kapiScroll, (data) ->
          return unless data

          # element ease property
          elmEase = data.ease || 'linear';
          delete data.ease

          classes = {}
          classes.frames = []

          # setup the rekapi keyframes
          for scrollY, keyFrame of data

            # keyframe class property
            # this is not handled by rekapi, so we pull it out and tcb
            if keyFrame.class?
              classes[scrollY] = keyFrame.class
              classes.frames.push(scrollY)
              delete keyFrame.class

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
              val = [val, kfEase] if not angular.isArray(val)
              o = {}
              o[prop] = val[1]
              angular.extend(ease, o)
              keyFrame[prop] = val[0]

            actor.keyframe(scrollY, keyFrame, ease)

          classes.frames.sort (a,b) -> a>b

          y = scrollY = $window.scrollY
          update()
        , true  # deep watch

        # respond to scroll event
        angular.element($window).on 'scroll', ->
          lastScrollY = scrollY
          scrollY = $window.scrollY
          update() if !updating # debounced update

        scope.$on '$destroy', -> rekapi.removeActor(actor)