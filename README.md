spark-scroll
============

angular directive for scroll-based actions. An element with the `spark-scroll` directive can be associated with any number of scroll positions. At each scroll position you can trigger any number of actions. An action can call any function on the scope, add or remove a class to the element, and/or broadcast an event from the element's scope . You can also easily define your own actions if the built-in actions aren't enough.

Setup
=====

### HTML

    <script src="js/angular.js"></script>
    <script src="js/lodash.js"></script>
    <script src="js/spark-scroll.js"></script>
    
### JavaScript

    angular.module('app', ['gilbox.sparkScroll']);

Dependencies
=====

lodash or underscore

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

## Formula Example

```html
<h1 spark-scroll="::{
            top:{ onUp: myUpFn },
    'center-20':{ 'onUp,onDown': myUpDownFn, 'downAddClass,upRemoveClass': 'my-class my-other-class' },
         bottom:{ 'upBroadcast': 'event-to-broadcast', 'upEmit,downEmit': 'event-to-emit' }
    }">
  This Title is Spark
</h1>
```

## Built-in Actions

```coffeescript
angular.module('gilbox.sparkScroll', [])
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
```

## Register a custom action

```javascript
app.config(function(sparkActionProps) {

    angular.extend(sparkActionProps, {
    
        // Change the element's text when scrolling down past it
        downText: {
            down: function(o) {
                this.element.text(o.val);
            }
        },
        
        // Change the element's text when scrolling up past it
        upText: {
            up: function(o) {
                this.element.text(o.val);
            }
        }
        
    });
    
});
```

Here's the same thing in Coffeescript:

```coffeescript
app.config (sparkActionProps) ->
    angular.extend sparkActionProps, 
        downText:
            down: (o)-> @element.text(o.val)
            
        upText:
            up: (o)-> @element.text(o.val)
```

## Built-in Formulas

```coffeescript
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
```

## Register a Custom Formula

```coffeescript
app.config (sparkFormulas) ->
    angular.extend sparkFormulas, 
        # similar to the built-in top formula: this is triggered when the bottom of the element hits the top of the viewport
        topBottom: (element, container, rect, containerRect, offset) ->  ~~(rect.bottom - containerRect.top + offset)
```
