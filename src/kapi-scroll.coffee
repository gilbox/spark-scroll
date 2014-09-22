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
        classFrames = []
        classFrameIdx = -1

        classesUpdate = (d) ->

          if d<0 and classFrameIdx >= 0  # only apply on page load for downward movement
            idx = if (classFrameIdx >= classFrames.length) then classFrameIdx-1 else classFrameIdx
            while (idx >= 0 and y < classFrames[idx])
              c = classes[classFrames[idx]]

              element.removeClass(c.class) if c.class
              element.addClass(c.classUp) if c.classUp
              element.removeClass(c.classUpRemove) if c.classUpRemove

              classFrameIdx = --idx

          if d>=0 and classFrameIdx < classFrames.length
            idx = if (classFrameIdx < 0) then 0 else classFrameIdx
            while (idx < classFrames.length and y > classFrames[idx])
              c = classes[classFrames[idx]]

              element.addClass(c.class) if c.class
              element.removeClass(c.classUp) if c.classUp
              element.removeClass(c.classRemove) if c.classRemove

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

          classesUpdate(d)  # todo: is there a better place for this? debounce this more ?


        scope.$watch attr.kapiScroll, (data) ->
          return unless data

          # element ease property
          elmEase = data.ease || 'linear';
          delete data.ease

          classes = {}
          classFrames = []

          # setup the rekapi keyframes
          for scrollY, keyFrame of data

            classFrames.push(parseInt(scrollY)) if keyFrame.class? || keyFrame.classUp? || keyFrame.classRemove? || keyFrame.classUpRemove?

            # keyframe class property
            # added when scrolled down past keyframe
            # removed when scrolled up past keyframe
            # this is not handled by rekapi, so we pull it out and tcb
            if keyFrame.class?
              classes[scrollY] or= {}
              angular.extend(classes[scrollY], {class: keyFrame.class})
              delete keyFrame.class

            # keyframe classUp property
            # added when scrolled up past keyframe
            # removed when scrolled down past keyframe
            # this is not handled by rekapi, so we pull it out and tcb
            if keyFrame.classUp?
              classes[scrollY] or= {}
              angular.extend(classes[scrollY], {classUp: keyFrame.classUp})
              delete keyFrame.classUp

            # keyframe classUp property
            # removed when scrolled down past keyframe
            # this is not handled by rekapi, so we pull it out and tcb
            if keyFrame.classRemove?
              classes[scrollY] or= {}
              angular.extend(classes[scrollY], {classRemove: keyFrame.classRemove})
              delete keyFrame.classRemove

            # keyframe classUp property
            # removed when scrolled up past keyframe
            # this is not handled by rekapi, so we pull it out and tcb
            if keyFrame.classUpRemove?
              classes[scrollY] or= {}
              angular.extend(classes[scrollY], {classUpRemove: keyFrame.classUpRemove})
              delete keyFrame.classUpRemove


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

          classFrames.sort (a,b) -> a > b

          y = scrollY = $window.scrollY
          update()
        , true  # deep watch

        # respond to scroll event
        angular.element($window).on 'scroll', ->
          lastScrollY = scrollY
          scrollY = $window.scrollY
          update() if !updating # debounced update

        scope.$on '$destroy', -> rekapi.removeActor(actor)