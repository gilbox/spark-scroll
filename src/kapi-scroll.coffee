define [
  'angular'
  'rekapi'
  'animation-frame'
], (angular, Rekapi, AnimationFrame) ->
  angular.module('gilbox.kapiScroll', [])
    .factory 'rekapi', ($document) -> new Rekapi($document[0].body)
    .directive 'kapiScroll', (rekapi, $window) ->
      (scope, element, attr) ->
        actor = rekapi.addActor({ context: element[0] })
        y = 0
        scrollY = 0
        animationFrame = new AnimationFrame()
        updating = false

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

        scope.$watch attr.kapiScroll, (data) ->
          return unless data

          # element ease property
          elmEase = data.ease || 'linear';
          delete data.ease

          # setup the rekapi keyframes
          for scrollY, keyFrame of data

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

          y = scrollY = $window.scrollY
          update()
        , true  # deep watch

        # respond to scroll event
        angular.element($window).on 'scroll', ->
          scrollY = $window.scrollY
          update() if !updating # debounced update

        scope.$on '$destroy', -> rekapi.removeActor(actor)