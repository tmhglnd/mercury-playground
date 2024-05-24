# DjipEvents

DjipEvents is an event-handling library that can be used in the browser and in 
[Node.js](https://nodejs.org). It is small (under 3KB) but yet powerful. It features methods to 
register, trigger and delete events. It is a mostly abstract class meant to be extended by (or mixed 
into) other objects. 
 
It is currently available in 3 flavours:

  * **ESM**: native ES6 module syntax for modern browsers
  * **CommonJS**: ES5 syntax for Node.js (and bundlers such as Webpack)
  * **IIFE**: ES5 syntax for legacy browser support (via `<script>` tag)

## Importing into project

### Native ES6 module syntax in browsers

This is for use in modern browsers that support the ECMAScript 6 syntax for module imports and 
exports. Going forward, this should be the preferred way to import the library (if your target 
environment supports it):

```javascript
import {EventEmitter} from "./node_modules/djipevents/dist/esm/djipevents.esm.min.js";
```
Note that the library (purposely) does not provide a default export. This means you have to use 
curly quotes when importing.

### Native ES6 module syntax in Node.js

Since Node.js v12 it is possible to use the "import" keyword to import external modules. In this 
case, you can use the following syntax:

```javascript
import {EventEmitter} from "djipevents";
```

Note that, to use ES6 modules in Node.js, your `package.json` file must have the following property:
```json
{
  "type": "module"
}
```

### CommonJS format in Node.js

Obviously, you can also use the traditional CommonJS syntax traditionnaly used in the Node.js world.

Even though Node.js already offers its own `EventEmitter` object, you can still use **djipevents** 
if you prefer its added functionalities: 

```javascript
const {EventEmitter} = require("djipevents");
```

### Object in global namespace (djipevents)

This is mostly for legacy-browser support and quick testing. It might be easier for some as it is a 
very common approach:

```html
<script src="node_modules/djipevents/dist/iife/djipevents.iife.min.js"></script>
```

### CDN-Hosted Versions

All three versions of the library (ES6 Module, CommonJS and IIFE) are available via a CDN. Here is
the syntax for the global version:

```html
<script src="https://cdn.jsdelivr.net/npm/djipevents@2.0.0/dist/iife/djipevents.iife.min.js"></script>
```

For the other versions, just change `iife` for `esm` (ES6 Module) or `cjs` (CommonJS) version.

## Key features

This library is nothing extraordinary but it does have some interesting features not necessarily 
found in the browser's `EventTarget`, in Node.js' `EventEmitter` or even in other libraries:

  * Listeners can be set to expire with the `duration` option;
  * The `Listener` object returned by `addListener()` has a `remove()` method that allows you to 
    easily remove the listener.
  * Listeners can be set to trigger an arbitrary number of times with the `remaining` option;
  * It is possible to listen to all events by using `EventEmitter.ANY_EVENT`.
  * The `waitFor()` method returns a promise that is fulfilled when an event occurs. A duration can 
    also be defined so that the promise is automatically rejected if the event does not occur within 
    the specified duration.
  * You can pass any number of arguments to the callback function by using the `arguments` option of
    `addListener()`. You can also prepend even more arguments by passing them to `emit()`. 
  * You can set the value of `this` in the callback by using the `context` option. This saves you 
    from using JavaScript's relatively slow `bind()` method.
  * The callback function can be accessed via the `callback` property of the `Listener` object. This
    makes it especially easy to access bound versions of functions transformed by using the 
    `context` option or by manually calling `bind()`.
  * The `emit()` method returns an array containing the return value of all the callback functions;
  
### Hidden goodies
  
As you can see in the reference, the [API](https://djipco.github.io/djipevents/EventEmitter.html) is 
lean. It is meant to be that way. That does not mean the library is less powerful than others. Some 
functionalities are just less glaringly obvious than with some other libraries. For example:

  * While **djipevents** does not have a `removeAllEventListeners()` method, you can achieve the 
    same by calling `removeListener()` with no arguments.
  
  * There is no `once()` method, use `addOneTimeListener()`.

  * There is no `prependListener()` method. Just use `addListener()` with the `prepend` option.

  * There are no `on()` and `off()` methods either. Just use `addListener()` and `removeListener()`. 
  
As far as I'm concerned, `on()`,  `off()` and `once()` are very poor method names. Once you start 
extending or mixing in this library, you realize that identifiers such as `on` and `off` are 
collision-prone and do not describe properly what the methods are actually doing, which is bad. It 
is true that `once()`is shorter than `addOneTimeListener()`. However, with auto-completion, this 
is irrelevant.

## API Reference

This library is quite straightforward and I did not take time to create usage examples. However, I 
did take some time to create a complete 
**[API Reference](https://djipco.github.io/djipevents/EventEmitter.html)** which should be enough 
for most to get started.
