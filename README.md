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
<h1 kapi-scroll="::{
    ease:'easeOutQuad',
    120:{opacity:'0'},
    121:{opacity:'0.8', top:'151px', color:'#fff'},
    140:{opacity:'1.0', top:'0px', color:'#444'}
    }">
  This Title is Kapimated
</h1>
 ```
 
## Override element-wide easing at a specific keyframe

```html
<h1 kapi-scroll="::{
    ease:'easeOutQuad',
    120:{opacity:'0'},
    121:{opacity:'0.8', top:'151px', color:'#fff'},
    140:{opacity:'1.0', top:'0px', color:'#444', ease: 'linear'}
    }">
  This Title is Kapimated
</h1>
 ```
 
The title will use `easeOutQuad` in all cases except for the scroll position range [`121`, `141`]
