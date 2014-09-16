kapi-scroll
===========

rekapi-based angular directive for scroll-based animations

Setup
=====

kapi-scroll currently depends on requirejs. This is likely to change in the future. For now, see **[this plunker](http://plnkr.co/edit/rOwTO4?p=preview)**

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
