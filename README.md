spark-scroll
============

angular directive for scroll-based actions. An element with the `spark-scroll` 
directive can be associated with any number of scroll positions. At each scroll 
position you can trigger any number of actions. An action can call any function 
on the scope, add or remove a class to the element, and/or broadcast an event 
from the element's scope . You can also easily define your own actions if the 
built-in actions aren't enough.

Additionally, the `spark-scroll-animate` directive includes all of the features
of `spark-scroll` plus the ability to animate CSS properties in sync 
with the browser scroll position.


Setup
=====

### HTML

    <script src="js/angular.js"></script>
    <script src="js/lodash.js"></script>
    <script src="js/spark-scroll.js"></script>
    
**To use `spark-scroll-animate` requires additional JavaScript files, see the [Dependencies](#dependencies)**
    
### JavaScript

    angular.module('app', ['gilbox.sparkScroll']);


Dependencies
=====

Depending on the desired features, spark-scroll won't try to load in any libraries 
that don't get utilized.

- `spark-scroll`
    - lodash or underscore
- `spark-scroll-animate`
    - lodash or underscore
    - [animation-frame](https://github.com/kof/animation-frame)
    - Your choice of:
        - [shifty](https://github.com/jeremyckahn/shifty), and [Rekapi](http://rekapi.com/)
        - or any [custom animation engine](#custom-animation-engine)

Usage
=====

## Basic Example (spark-scroll)

    <h1 spark-scroll="{
        120:{ onUp: myUpFn },
        121:{ 'onUp,onDown': myUpDownFn, 'downAddClass,upRemoveClass': 'my-class my-other-class' },
        140:{ 'upBroadcast': 'event-to-broadcast', 'upEmit,downEmit': 'event-to-emit' }
        }">
      This Title is Spark
    </h1>


## Formula Example (spark-scroll)

    <h1 spark-scroll="{
                top:{ onUp: myUpFn },
        'center-20':{ 'onUp,onDown': myUpDownFn, 'downAddClass,upRemoveClass': 'my-class my-other-class' },
             bottom:{ 'upBroadcast': 'event-to-broadcast', 'upEmit,downEmit': 'event-to-emit' }
        }">
      This Title is Spark
    </h1>
    

## Animated Example (spark-scroll-animate)

    <h1 spark-scroll-animate="{
                top:{ color: '#f00', marginLeft: '50px' },
             bottom:{ color: '#000', marginLeft: '0px' }
        }">
      This Title is Spark Animated
    </h1>
    

## Animated Less-Basic Example with easing (spark-scroll-animate)

    <h1 spark-scroll-animate="{
        ease:'easeOutQuad',
        120:{opacity:'0'},
        121:{opacity:'0.8', top:'151px', color:'#fff'},
        140:{opacity:'1.0', top:'0px', color:'#444'}
        }">
      This Title is Kapimated
    </h1>
 
 
## Animated Example with Override element-wide easing at a specific keyframe (spark-scroll-animate)

    <h1 spark-scroll-animate="{
        ease:'easeOutQuad',
        120:{opacity:'0'},
        121:{opacity:'0.8', top:'151px', color:'#fff'},
        140:{opacity:'1.0', top:'0px', color:'#444', ease: 'linear'}
        }">
      This Title is Kapimated
    </h1>
 
 
## spark-scroll-bind-once: One-Time Binding
 
If you are using a version of angular (<=1.3) which doesn't support one-time lazy binding
you can use the `spark-scroll-bind-once` attribute to achieve the same thing. Because `kapi-scroll`
will create a rather expensive deep watch for the `spark-scroll(-animate)` attribute, it's a good idea to use 
one-time binding whenever possible.


## spark-scroll-ease: Scroll Easing

Add this attribute to ease the position of the scrollbar so jumps in scroll position will have smooth animation.
This may cause scrolling to feel laggy but animations will looks smoother.
 
## Built-in Actions

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


## Register a custom action

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


Here's the same thing in Coffeescript:

    app.config (sparkActionProps) ->
        angular.extend sparkActionProps, 
            downText:
                down: (o)-> @element.text(o.val)
                
            upText:
                up: (o)-> @element.text(o.val)


## Built-in Formulas

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


## Register a Custom Formula

    app.config (sparkFormulas) ->
        angular.extend sparkFormulas, 
            # similar to the built-in top formula: this is triggered when the bottom of the element hits the top of the viewport
            topBottom: (element, container, rect, containerRect, offset) ->  ~~(rect.bottom - containerRect.top + offset)


## Keeping Formulas up-to-date

An element with a spark-scroll(-animate) directive which utilizes formulas will need to 
recalculate formula-based scroll positions any time the element changes position relative to the document element.
With the exception of a window resize event (which spark-scroll watches for automatically), spark-scroll
doesn't know when to update formula-calculated scroll positions. In order to keep spark-scroll up-to-date 
employ one or both of the following techniques:

- Detect when an element's position changes and $broadcast the `sparkInvalidate` event on `$rootScope` or any
 scope which encapsulates all `spark-scroll`ed elements with formulas.
- Inject the `sparkSetup` service and call:
    - `sparkSetup.enableInvalidationInterval(delay)` to automatically broadcast `sparkInvalidate` on the 
    $rootScope every `delay` ms. `delay` is optional and by default is 1000 ms.
    - `sparkSetup.disableInvalidationInterval()` to disable the automatic broadcast interval


## Custom Animation Engine


`sparkAnimator` can be overridden to use any animation engine
so long as the `sparkAnimator` service supports the following [Rekapi](http://rekapi.com)-like
interface:

    actor = sparkAnimator.addActor({ context: <dom element> })  # works just like Rekapi.addActor(...)
    actor.keyframe(...)
    actor.moveKeyframe(...)
    actor.removeAllKeyframes(...)
    sparkAnimator.update(...)       # works just like Rekapi.update(...)

See the [Rekapi docs](http://rekapi.com/dist/doc/) for implementation details. 

Note that overriding the `sparkAnimator` service eliminates the Rekapi and shifty dependencies.


Limitations
=======

- **actions** and **animations** can not be trusted to be triggered in perfect sync. This may be fixed
in future versions.
