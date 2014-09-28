spark-scroll
============

angular directive for scroll-based actions

Setup
=====

see the included `demo/spiral.html`

Usage
=====

## Basic Example

```html
<h1 spark-scroll="::{
    120:{ onUp: myUpFn },
    121:{ 'onUp,onDown': myUpDownFn, 'downAddClass,upRemoveClass': 'my-class my-other-class' },
    140:{ 'upBroadcast': 'event-to-broadcast', 'upEmit,downEmit': 'event-to-emit' }
    }">
  This Title is Spark
</h1>
```

## Register a custom action

```javascript
app.config(function(sparkActionProps) {

    angular.extend(sparkActionProps, {
        downText: {
            down: function(o) {
                this.element.text(o.val);
            }
        },
        upText: {
            up: function(o) {
                this.element.text(o.val);
            }
        }
    });
    
});
```

## Built-in Actions

```coffeescript
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
  # class(es) added when scrolled up past keyframe,
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
```
