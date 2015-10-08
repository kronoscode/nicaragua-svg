(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

var NicSvg = require("./model/nic-svg").NicSvg;

global.app = function (element, config_path) {
    var nicaragua = new NicSvg(element, config_path);
    nicaragua.svgToDom();
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9vc2Nhcm1jbS9Db2RlL2h0bWwvbmljYXJhZ3VhLXN2Zy9zcmMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxZQUFZLENBQUM7O0FBRWIsSUFGUSxNQUFNLEdBQUEsT0FBQSxDQUFPLGlCQUFpQixDQUFBLENBQTlCLE1BQU0sQ0FBQTs7QUFFZCxNQUFNLENBQUMsR0FBRyxHQUFHLFVBQVUsT0FBTyxFQUFFLFdBQVcsRUFBRTtBQUN6QyxRQUFJLFNBQVMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDakQsYUFBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO0NBQ3hCLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7TmljU3ZnfSBmcm9tICcuL21vZGVsL25pYy1zdmcnO1xuXG5nbG9iYWwuYXBwID0gZnVuY3Rpb24gKGVsZW1lbnQsIGNvbmZpZ19wYXRoKSB7XG4gICAgdmFyIG5pY2FyYWd1YSA9IG5ldyBOaWNTdmcoZWxlbWVudCwgY29uZmlnX3BhdGgpO1xuICAgIG5pY2FyYWd1YS5zdmdUb0RvbSgpO1xufTsiXX0=
},{"./model/nic-svg":3}],2:[function(require,module,exports){
/**
 * SVGInjector v1.1.3 - Fast, caching, dynamic inline SVG DOM injection library
 * https://github.com/iconic/SVGInjector
 *
 * Copyright (c) 2014-2015 Waybury <hello@waybury.com>
 * @license MIT
 */

(function (window, document) {

  'use strict';

  // Environment
  var isLocal = window.location.protocol === 'file:';
  var hasSvgSupport = document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1');

  function uniqueClasses(list) {
    list = list.split(' ');

    var hash = {};
    var i = list.length;
    var out = [];

    while (i--) {
      if (!hash.hasOwnProperty(list[i])) {
        hash[list[i]] = 1;
        out.unshift(list[i]);
      }
    }

    return out.join(' ');
  }

  /**
   * cache (or polyfill for <= IE8) Array.forEach()
   * source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
   */
  var forEach = Array.prototype.forEach || function (fn, scope) {
    if (this === void 0 || this === null || typeof fn !== 'function') {
      throw new TypeError();
    }

    /* jshint bitwise: false */
    var i, len = this.length >>> 0;
    /* jshint bitwise: true */

    for (i = 0; i < len; ++i) {
      if (i in this) {
        fn.call(scope, this[i], i, this);
      }
    }
  };

  // SVG Cache
  var svgCache = {};

  var injectCount = 0;
  var injectedElements = [];

  // Request Queue
  var requestQueue = [];

  // Script running status
  var ranScripts = {};

  var cloneSvg = function (sourceSvg) {
    return sourceSvg.cloneNode(true);
  };

  var queueRequest = function (url, callback) {
    requestQueue[url] = requestQueue[url] || [];
    requestQueue[url].push(callback);
  };

  var processRequestQueue = function (url) {
    for (var i = 0, len = requestQueue[url].length; i < len; i++) {
      // Make these calls async so we avoid blocking the page/renderer
      /* jshint loopfunc: true */
      (function (index) {
        setTimeout(function () {
          requestQueue[url][index](cloneSvg(svgCache[url]));
        }, 0);
      })(i);
      /* jshint loopfunc: false */
    }
  };

  var loadSvg = function (url, callback) {
    if (svgCache[url] !== undefined) {
      if (svgCache[url] instanceof SVGSVGElement) {
        // We already have it in cache, so use it
        callback(cloneSvg(svgCache[url]));
      }
      else {
        // We don't have it in cache yet, but we are loading it, so queue this request
        queueRequest(url, callback);
      }
    }
    else {

      if (!window.XMLHttpRequest) {
        callback('Browser does not support XMLHttpRequest');
        return false;
      }

      // Seed the cache to indicate we are loading this URL already
      svgCache[url] = {};
      queueRequest(url, callback);

      var httpRequest = new XMLHttpRequest();

      httpRequest.onreadystatechange = function () {
        // readyState 4 = complete
        if (httpRequest.readyState === 4) {

          // Handle status
          if (httpRequest.status === 404 || httpRequest.responseXML === null) {
            callback('Unable to load SVG file: ' + url);

            if (isLocal) callback('Note: SVG injection ajax calls do not work locally without adjusting security setting in your browser. Or consider using a local webserver.');

            callback();
            return false;
          }

          // 200 success from server, or 0 when using file:// protocol locally
          if (httpRequest.status === 200 || (isLocal && httpRequest.status === 0)) {

            /* globals Document */
            if (httpRequest.responseXML instanceof Document) {
              // Cache it
              svgCache[url] = httpRequest.responseXML.documentElement;
            }
            /* globals -Document */

            // IE9 doesn't create a responseXML Document object from loaded SVG,
            // and throws a "DOM Exception: HIERARCHY_REQUEST_ERR (3)" error when injected.
            //
            // So, we'll just create our own manually via the DOMParser using
            // the the raw XML responseText.
            //
            // :NOTE: IE8 and older doesn't have DOMParser, but they can't do SVG either, so...
            else if (DOMParser && (DOMParser instanceof Function)) {
              var xmlDoc;
              try {
                var parser = new DOMParser();
                xmlDoc = parser.parseFromString(httpRequest.responseText, 'text/xml');
              }
              catch (e) {
                xmlDoc = undefined;
              }

              if (!xmlDoc || xmlDoc.getElementsByTagName('parsererror').length) {
                callback('Unable to parse SVG file: ' + url);
                return false;
              }
              else {
                // Cache it
                svgCache[url] = xmlDoc.documentElement;
              }
            }

            // We've loaded a new asset, so process any requests waiting for it
            processRequestQueue(url);
          }
          else {
            callback('There was a problem injecting the SVG: ' + httpRequest.status + ' ' + httpRequest.statusText);
            return false;
          }
        }
      };

      httpRequest.open('GET', url);

      // Treat and parse the response as XML, even if the
      // server sends us a different mimetype
      if (httpRequest.overrideMimeType) httpRequest.overrideMimeType('text/xml');

      httpRequest.send();
    }
  };

  // Inject a single element
  var injectElement = function (el, evalScripts, pngFallback, callback) {

    // Grab the src or data-src attribute
    var imgUrl = el.getAttribute('data-src') || el.getAttribute('src');

    // We can only inject SVG
    if (!(/\.svg/i).test(imgUrl)) {
      callback('Attempted to inject a file with a non-svg extension: ' + imgUrl);
      return;
    }

    // If we don't have SVG support try to fall back to a png,
    // either defined per-element via data-fallback or data-png,
    // or globally via the pngFallback directory setting
    if (!hasSvgSupport) {
      var perElementFallback = el.getAttribute('data-fallback') || el.getAttribute('data-png');

      // Per-element specific PNG fallback defined, so use that
      if (perElementFallback) {
        el.setAttribute('src', perElementFallback);
        callback(null);
      }
      // Global PNG fallback directoriy defined, use the same-named PNG
      else if (pngFallback) {
        el.setAttribute('src', pngFallback + '/' + imgUrl.split('/').pop().replace('.svg', '.png'));
        callback(null);
      }
      // um...
      else {
        callback('This browser does not support SVG and no PNG fallback was defined.');
      }

      return;
    }

    // Make sure we aren't already in the process of injecting this element to
    // avoid a race condition if multiple injections for the same element are run.
    // :NOTE: Using indexOf() only _after_ we check for SVG support and bail,
    // so no need for IE8 indexOf() polyfill
    if (injectedElements.indexOf(el) !== -1) {
      return;
    }

    // Remember the request to inject this element, in case other injection
    // calls are also trying to replace this element before we finish
    injectedElements.push(el);

    // Try to avoid loading the orginal image src if possible.
    el.setAttribute('src', '');

    // Load it up
    loadSvg(imgUrl, function (svg) {

      if (typeof svg === 'undefined' || typeof svg === 'string') {
        callback(svg);
        return false;
      }

      var imgId = el.getAttribute('id');
      if (imgId) {
        svg.setAttribute('id', imgId);
      }

      var imgTitle = el.getAttribute('title');
      if (imgTitle) {
        svg.setAttribute('title', imgTitle);
      }

      // Concat the SVG classes + 'injected-svg' + the img classes
      var classMerge = [].concat(svg.getAttribute('class') || [], 'injected-svg', el.getAttribute('class') || []).join(' ');
      svg.setAttribute('class', uniqueClasses(classMerge));

      var imgStyle = el.getAttribute('style');
      if (imgStyle) {
        svg.setAttribute('style', imgStyle);
      }

      // Copy all the data elements to the svg
      var imgData = [].filter.call(el.attributes, function (at) {
        return (/^data-\w[\w\-]*$/).test(at.name);
      });
      forEach.call(imgData, function (dataAttr) {
        if (dataAttr.name && dataAttr.value) {
          svg.setAttribute(dataAttr.name, dataAttr.value);
        }
      });

      // Make sure any internally referenced clipPath ids and their
      // clip-path references are unique.
      //
      // This addresses the issue of having multiple instances of the
      // same SVG on a page and only the first clipPath id is referenced.
      //
      // Browsers often shortcut the SVG Spec and don't use clipPaths
      // contained in parent elements that are hidden, so if you hide the first
      // SVG instance on the page, then all other instances lose their clipping.
      // Reference: https://bugzilla.mozilla.org/show_bug.cgi?id=376027

      // Handle all defs elements that have iri capable attributes as defined by w3c: http://www.w3.org/TR/SVG/linking.html#processingIRI
      // Mapping IRI addressable elements to the properties that can reference them:
      var iriElementsAndProperties = {
        'clipPath': ['clip-path'],
        'color-profile': ['color-profile'],
        'cursor': ['cursor'],
        'filter': ['filter'],
        'linearGradient': ['fill', 'stroke'],
        'marker': ['marker', 'marker-start', 'marker-mid', 'marker-end'],
        'mask': ['mask'],
        'pattern': ['fill', 'stroke'],
        'radialGradient': ['fill', 'stroke']
      };

      var element, elementDefs, properties, currentId, newId;
      Object.keys(iriElementsAndProperties).forEach(function (key) {
        element = key;
        properties = iriElementsAndProperties[key];

        elementDefs = svg.querySelectorAll('defs ' + element + '[id]');
        for (var i = 0, elementsLen = elementDefs.length; i < elementsLen; i++) {
          currentId = elementDefs[i].id;
          newId = currentId + '-' + injectCount;

          // All of the properties that can reference this element type
          var referencingElements;
          forEach.call(properties, function (property) {
            // :NOTE: using a substring match attr selector here to deal with IE "adding extra quotes in url() attrs"
            referencingElements = svg.querySelectorAll('[' + property + '*="' + currentId + '"]');
            for (var j = 0, referencingElementLen = referencingElements.length; j < referencingElementLen; j++) {
              referencingElements[j].setAttribute(property, 'url(#' + newId + ')');
            }
          });

          elementDefs[i].id = newId;
        }
      });

      // Remove any unwanted/invalid namespaces that might have been added by SVG editing tools
      svg.removeAttribute('xmlns:a');

      // Post page load injected SVGs don't automatically have their script
      // elements run, so we'll need to make that happen, if requested

      // Find then prune the scripts
      var scripts = svg.querySelectorAll('script');
      var scriptsToEval = [];
      var script, scriptType;

      for (var k = 0, scriptsLen = scripts.length; k < scriptsLen; k++) {
        scriptType = scripts[k].getAttribute('type');

        // Only process javascript types.
        // SVG defaults to 'application/ecmascript' for unset types
        if (!scriptType || scriptType === 'application/ecmascript' || scriptType === 'application/javascript') {

          // innerText for IE, textContent for other browsers
          script = scripts[k].innerText || scripts[k].textContent;

          // Stash
          scriptsToEval.push(script);

          // Tidy up and remove the script element since we don't need it anymore
          svg.removeChild(scripts[k]);
        }
      }

      // Run/Eval the scripts if needed
      if (scriptsToEval.length > 0 && (evalScripts === 'always' || (evalScripts === 'once' && !ranScripts[imgUrl]))) {
        for (var l = 0, scriptsToEvalLen = scriptsToEval.length; l < scriptsToEvalLen; l++) {

          // :NOTE: Yup, this is a form of eval, but it is being used to eval code
          // the caller has explictely asked to be loaded, and the code is in a caller
          // defined SVG file... not raw user input.
          //
          // Also, the code is evaluated in a closure and not in the global scope.
          // If you need to put something in global scope, use 'window'
          new Function(scriptsToEval[l])(window); // jshint ignore:line
        }

        // Remember we already ran scripts for this svg
        ranScripts[imgUrl] = true;
      }

      // :WORKAROUND:
      // IE doesn't evaluate <style> tags in SVGs that are dynamically added to the page.
      // This trick will trigger IE to read and use any existing SVG <style> tags.
      //
      // Reference: https://github.com/iconic/SVGInjector/issues/23
      var styleTags = svg.querySelectorAll('style');
      forEach.call(styleTags, function (styleTag) {
        styleTag.textContent += '';
      });

      // Replace the image with the svg
      el.parentNode.replaceChild(svg, el);

      // Now that we no longer need it, drop references
      // to the original element so it can be GC'd
      delete injectedElements[injectedElements.indexOf(el)];
      el = null;

      // Increment the injected count
      injectCount++;

      callback(svg);
    });
  };

  /**
   * SVGInjector
   *
   * Replace the given elements with their full inline SVG DOM elements.
   *
   * :NOTE: We are using get/setAttribute with SVG because the SVG DOM spec differs from HTML DOM and
   * can return other unexpected object types when trying to directly access svg properties.
   * ex: "className" returns a SVGAnimatedString with the class value found in the "baseVal" property,
   * instead of simple string like with HTML Elements.
   *
   * @param {mixes} Array of or single DOM element
   * @param {object} options
   * @param {function} callback
   * @return {object} Instance of SVGInjector
   */
  var SVGInjector = function (elements, options, done) {

    // Options & defaults
    options = options || {};

    // Should we run the scripts blocks found in the SVG
    // 'always' - Run them every time
    // 'once' - Only run scripts once for each SVG
    // [false|'never'] - Ignore scripts
    var evalScripts = options.evalScripts || 'always';

    // Location of fallback pngs, if desired
    var pngFallback = options.pngFallback || false;

    // Callback to run during each SVG injection, returning the SVG injected
    var eachCallback = options.each;

    // Do the injection...
    if (elements.length !== undefined) {
      var elementsLoaded = 0;
      forEach.call(elements, function (element) {
        injectElement(element, evalScripts, pngFallback, function (svg) {
          if (eachCallback && typeof eachCallback === 'function') eachCallback(svg);
          if (done && elements.length === ++elementsLoaded) done(elementsLoaded);
        });
      });
    }
    else {
      if (elements) {
        injectElement(elements, evalScripts, pngFallback, function (svg) {
          if (eachCallback && typeof eachCallback === 'function') eachCallback(svg);
          if (done) done(1);
          elements = null;
        });
      }
      else {
        if (done) done(0);
      }
    }
  };

  /* global module, exports: true, define */
  // Node.js or CommonJS
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = exports = SVGInjector;
  }
  // AMD support
  else if (typeof define === 'function' && define.amd) {
    define(function () {
      return SVGInjector;
    });
  }
  // Otherwise, attach to window as global
  else if (typeof window === 'object') {
    window.SVGInjector = SVGInjector;
  }
  /* global -module, -exports, -define */

}(window, document));

},{}],3:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var key in props) {
            var prop = props[key];prop.configurable = true;if (prop.value) prop.writable = true;
        }Object.defineProperties(target, props);
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

var _classCallCheck = function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
};

Object.defineProperty(exports, "__esModule", {
    value: true
});
var injectSvg = require("svg-injector");

var NicSvg = (function () {
    function NicSvg(svgElem, jsonPath) {
        _classCallCheck(this, NicSvg);

        this.svgElem = svgElem;
        this.jsonPath = jsonPath;
    }

    _createClass(NicSvg, {
        svgToDom: {
            value: function svgToDom() {
                return injectSvg(document.getElementById(this.svgElem));
            }
        }
    });

    return NicSvg;
})();

exports.NicSvg = NicSvg;

},{"svg-injector":2}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwibm9kZV9tb2R1bGVzL3N2Zy1pbmplY3Rvci9zdmctaW5qZWN0b3IuanMiLCIvVXNlcnMvb3NjYXJtY20vQ29kZS9odG1sL25pY2FyYWd1YS1zdmcvc3JjL21vZGVsL25pYy1zdmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hkQSxZQUFZLENBQUM7O0FBRWIsSUFBSSxZQUFZLEdBQUcsQ0FBQyxZQUFZO0FBQUUsYUFBUyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFO0FBQUUsYUFBSyxJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUU7QUFBRSxnQkFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUssQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztTQUFFLE1BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FBRSxPQUFRLFVBQVUsV0FBVyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUU7QUFBRSxZQUFJLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLElBQUssV0FBVyxFQUFFLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQyxPQUFRLFdBQVcsQ0FBQztLQUFFLENBQUM7Q0FBRSxDQUFBLEVBQUcsQ0FBQzs7QUFFaGMsSUFBSSxlQUFlLEdBQUcsU0FBQSxlQUFBLENBQVUsUUFBUSxFQUFFLFdBQVcsRUFBRTtBQUFFLFFBQUksRUFBRSxRQUFRLFlBQVksV0FBVyxDQUFBLEVBQUc7QUFBRSxjQUFNLElBQUksU0FBUyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7S0FBRTtDQUFFLENBQUM7O0FBRWpLLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRTtBQUN6QyxTQUFLLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQztBQVJILElBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQzs7QUFXMUMsSUFUTSxNQUFNLEdBQUEsQ0FBQSxZQUFBO0FBQ0csYUFEVCxNQUFNLENBQ0ksT0FBTyxFQUFFLFFBQVEsRUFBRTtBQVUzQix1QkFBZSxDQUFDLElBQUksRUFYdEIsTUFBTSxDQUFBLENBQUE7O0FBRUosWUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDdkIsWUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7S0FDNUI7O0FBYUQsZ0JBQVksQ0FqQlYsTUFBTSxFQUFBO0FBTVIsZ0JBQVEsRUFBQTtBQWFBLGlCQUFLLEVBYkwsU0FBQSxRQUFBLEdBQUc7QUFDUCx1QkFBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUMzRDtTQWNJO0tBQ0osQ0FBQyxDQUFDOztBQUVILFdBekJFLE1BQU0sQ0FBQTtDQTBCWCxDQUFBLEVBQUcsQ0FBQzs7QUFFTCxPQUFPLENBaEJDLE1BQU0sR0FBTixNQUFNLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBOaWNTdmcgPSByZXF1aXJlKFwiLi9tb2RlbC9uaWMtc3ZnXCIpLk5pY1N2ZztcblxuZ2xvYmFsLmFwcCA9IGZ1bmN0aW9uIChlbGVtZW50LCBjb25maWdfcGF0aCkge1xuICAgIHZhciBuaWNhcmFndWEgPSBuZXcgTmljU3ZnKGVsZW1lbnQsIGNvbmZpZ19wYXRoKTtcbiAgICBuaWNhcmFndWEuc3ZnVG9Eb20oKTtcbn07XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5VmMyVnljeTl2YzJOaGNtMWpiUzlEYjJSbEwyaDBiV3d2Ym1sallYSmhaM1ZoTFhOMlp5OXpjbU12WVhCd0xtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdRVUZCUVN4WlFVRlpMRU5CUVVNN08wRkJSV0lzU1VGR1VTeE5RVUZOTEVkQlFVRXNUMEZCUVN4RFFVRlBMR2xDUVVGcFFpeERRVUZCTEVOQlFUbENMRTFCUVUwc1EwRkJRVHM3UVVGRlpDeE5RVUZOTEVOQlFVTXNSMEZCUnl4SFFVRkhMRlZCUVZVc1QwRkJUeXhGUVVGRkxGZEJRVmNzUlVGQlJUdEJRVU42UXl4UlFVRkpMRk5CUVZNc1IwRkJSeXhKUVVGSkxFMUJRVTBzUTBGQlF5eFBRVUZQTEVWQlFVVXNWMEZCVnl4RFFVRkRMRU5CUVVNN1FVRkRha1FzWVVGQlV5eERRVUZETEZGQlFWRXNSVUZCUlN4RFFVRkRPME5CUTNoQ0xFTkJRVU1pTENKbWFXeGxJam9pWjJWdVpYSmhkR1ZrTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYkltbHRjRzl5ZENCN1RtbGpVM1puZlNCbWNtOXRJQ2N1TDIxdlpHVnNMMjVwWXkxemRtY25PMXh1WEc1bmJHOWlZV3d1WVhCd0lEMGdablZ1WTNScGIyNGdLR1ZzWlcxbGJuUXNJR052Ym1acFoxOXdZWFJvS1NCN1hHNGdJQ0FnZG1GeUlHNXBZMkZ5WVdkMVlTQTlJRzVsZHlCT2FXTlRkbWNvWld4bGJXVnVkQ3dnWTI5dVptbG5YM0JoZEdncE8xeHVJQ0FnSUc1cFkyRnlZV2QxWVM1emRtZFViMFJ2YlNncE8xeHVmVHNpWFgwPSIsIi8qKlxuICogU1ZHSW5qZWN0b3IgdjEuMS4zIC0gRmFzdCwgY2FjaGluZywgZHluYW1pYyBpbmxpbmUgU1ZHIERPTSBpbmplY3Rpb24gbGlicmFyeVxuICogaHR0cHM6Ly9naXRodWIuY29tL2ljb25pYy9TVkdJbmplY3RvclxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1IFdheWJ1cnkgPGhlbGxvQHdheWJ1cnkuY29tPlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuKGZ1bmN0aW9uICh3aW5kb3csIGRvY3VtZW50KSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEVudmlyb25tZW50XG4gIHZhciBpc0xvY2FsID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnZmlsZTonO1xuICB2YXIgaGFzU3ZnU3VwcG9ydCA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoJ2h0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjQmFzaWNTdHJ1Y3R1cmUnLCAnMS4xJyk7XG5cbiAgZnVuY3Rpb24gdW5pcXVlQ2xhc3NlcyhsaXN0KSB7XG4gICAgbGlzdCA9IGxpc3Quc3BsaXQoJyAnKTtcblxuICAgIHZhciBoYXNoID0ge307XG4gICAgdmFyIGkgPSBsaXN0Lmxlbmd0aDtcbiAgICB2YXIgb3V0ID0gW107XG5cbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBpZiAoIWhhc2guaGFzT3duUHJvcGVydHkobGlzdFtpXSkpIHtcbiAgICAgICAgaGFzaFtsaXN0W2ldXSA9IDE7XG4gICAgICAgIG91dC51bnNoaWZ0KGxpc3RbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvdXQuam9pbignICcpO1xuICB9XG5cbiAgLyoqXG4gICAqIGNhY2hlIChvciBwb2x5ZmlsbCBmb3IgPD0gSUU4KSBBcnJheS5mb3JFYWNoKClcbiAgICogc291cmNlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9mb3JFYWNoXG4gICAqL1xuICB2YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoIHx8IGZ1bmN0aW9uIChmbiwgc2NvcGUpIHtcbiAgICBpZiAodGhpcyA9PT0gdm9pZCAwIHx8IHRoaXMgPT09IG51bGwgfHwgdHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgfVxuXG4gICAgLyoganNoaW50IGJpdHdpc2U6IGZhbHNlICovXG4gICAgdmFyIGksIGxlbiA9IHRoaXMubGVuZ3RoID4+PiAwO1xuICAgIC8qIGpzaGludCBiaXR3aXNlOiB0cnVlICovXG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGlmIChpIGluIHRoaXMpIHtcbiAgICAgICAgZm4uY2FsbChzY29wZSwgdGhpc1tpXSwgaSwgdGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFNWRyBDYWNoZVxuICB2YXIgc3ZnQ2FjaGUgPSB7fTtcblxuICB2YXIgaW5qZWN0Q291bnQgPSAwO1xuICB2YXIgaW5qZWN0ZWRFbGVtZW50cyA9IFtdO1xuXG4gIC8vIFJlcXVlc3QgUXVldWVcbiAgdmFyIHJlcXVlc3RRdWV1ZSA9IFtdO1xuXG4gIC8vIFNjcmlwdCBydW5uaW5nIHN0YXR1c1xuICB2YXIgcmFuU2NyaXB0cyA9IHt9O1xuXG4gIHZhciBjbG9uZVN2ZyA9IGZ1bmN0aW9uIChzb3VyY2VTdmcpIHtcbiAgICByZXR1cm4gc291cmNlU3ZnLmNsb25lTm9kZSh0cnVlKTtcbiAgfTtcblxuICB2YXIgcXVldWVSZXF1ZXN0ID0gZnVuY3Rpb24gKHVybCwgY2FsbGJhY2spIHtcbiAgICByZXF1ZXN0UXVldWVbdXJsXSA9IHJlcXVlc3RRdWV1ZVt1cmxdIHx8IFtdO1xuICAgIHJlcXVlc3RRdWV1ZVt1cmxdLnB1c2goY2FsbGJhY2spO1xuICB9O1xuXG4gIHZhciBwcm9jZXNzUmVxdWVzdFF1ZXVlID0gZnVuY3Rpb24gKHVybCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSByZXF1ZXN0UXVldWVbdXJsXS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgLy8gTWFrZSB0aGVzZSBjYWxscyBhc3luYyBzbyB3ZSBhdm9pZCBibG9ja2luZyB0aGUgcGFnZS9yZW5kZXJlclxuICAgICAgLyoganNoaW50IGxvb3BmdW5jOiB0cnVlICovXG4gICAgICAoZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJlcXVlc3RRdWV1ZVt1cmxdW2luZGV4XShjbG9uZVN2ZyhzdmdDYWNoZVt1cmxdKSk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSkoaSk7XG4gICAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IGZhbHNlICovXG4gICAgfVxuICB9O1xuXG4gIHZhciBsb2FkU3ZnID0gZnVuY3Rpb24gKHVybCwgY2FsbGJhY2spIHtcbiAgICBpZiAoc3ZnQ2FjaGVbdXJsXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoc3ZnQ2FjaGVbdXJsXSBpbnN0YW5jZW9mIFNWR1NWR0VsZW1lbnQpIHtcbiAgICAgICAgLy8gV2UgYWxyZWFkeSBoYXZlIGl0IGluIGNhY2hlLCBzbyB1c2UgaXRcbiAgICAgICAgY2FsbGJhY2soY2xvbmVTdmcoc3ZnQ2FjaGVbdXJsXSkpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIFdlIGRvbid0IGhhdmUgaXQgaW4gY2FjaGUgeWV0LCBidXQgd2UgYXJlIGxvYWRpbmcgaXQsIHNvIHF1ZXVlIHRoaXMgcmVxdWVzdFxuICAgICAgICBxdWV1ZVJlcXVlc3QodXJsLCBjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuXG4gICAgICBpZiAoIXdpbmRvdy5YTUxIdHRwUmVxdWVzdCkge1xuICAgICAgICBjYWxsYmFjaygnQnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IFhNTEh0dHBSZXF1ZXN0Jyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gU2VlZCB0aGUgY2FjaGUgdG8gaW5kaWNhdGUgd2UgYXJlIGxvYWRpbmcgdGhpcyBVUkwgYWxyZWFkeVxuICAgICAgc3ZnQ2FjaGVbdXJsXSA9IHt9O1xuICAgICAgcXVldWVSZXF1ZXN0KHVybCwgY2FsbGJhY2spO1xuXG4gICAgICB2YXIgaHR0cFJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgaHR0cFJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyByZWFkeVN0YXRlIDQgPSBjb21wbGV0ZVxuICAgICAgICBpZiAoaHR0cFJlcXVlc3QucmVhZHlTdGF0ZSA9PT0gNCkge1xuXG4gICAgICAgICAgLy8gSGFuZGxlIHN0YXR1c1xuICAgICAgICAgIGlmIChodHRwUmVxdWVzdC5zdGF0dXMgPT09IDQwNCB8fCBodHRwUmVxdWVzdC5yZXNwb25zZVhNTCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY2FsbGJhY2soJ1VuYWJsZSB0byBsb2FkIFNWRyBmaWxlOiAnICsgdXJsKTtcblxuICAgICAgICAgICAgaWYgKGlzTG9jYWwpIGNhbGxiYWNrKCdOb3RlOiBTVkcgaW5qZWN0aW9uIGFqYXggY2FsbHMgZG8gbm90IHdvcmsgbG9jYWxseSB3aXRob3V0IGFkanVzdGluZyBzZWN1cml0eSBzZXR0aW5nIGluIHlvdXIgYnJvd3Nlci4gT3IgY29uc2lkZXIgdXNpbmcgYSBsb2NhbCB3ZWJzZXJ2ZXIuJyk7XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gMjAwIHN1Y2Nlc3MgZnJvbSBzZXJ2ZXIsIG9yIDAgd2hlbiB1c2luZyBmaWxlOi8vIHByb3RvY29sIGxvY2FsbHlcbiAgICAgICAgICBpZiAoaHR0cFJlcXVlc3Quc3RhdHVzID09PSAyMDAgfHwgKGlzTG9jYWwgJiYgaHR0cFJlcXVlc3Quc3RhdHVzID09PSAwKSkge1xuXG4gICAgICAgICAgICAvKiBnbG9iYWxzIERvY3VtZW50ICovXG4gICAgICAgICAgICBpZiAoaHR0cFJlcXVlc3QucmVzcG9uc2VYTUwgaW5zdGFuY2VvZiBEb2N1bWVudCkge1xuICAgICAgICAgICAgICAvLyBDYWNoZSBpdFxuICAgICAgICAgICAgICBzdmdDYWNoZVt1cmxdID0gaHR0cFJlcXVlc3QucmVzcG9uc2VYTUwuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogZ2xvYmFscyAtRG9jdW1lbnQgKi9cblxuICAgICAgICAgICAgLy8gSUU5IGRvZXNuJ3QgY3JlYXRlIGEgcmVzcG9uc2VYTUwgRG9jdW1lbnQgb2JqZWN0IGZyb20gbG9hZGVkIFNWRyxcbiAgICAgICAgICAgIC8vIGFuZCB0aHJvd3MgYSBcIkRPTSBFeGNlcHRpb246IEhJRVJBUkNIWV9SRVFVRVNUX0VSUiAoMylcIiBlcnJvciB3aGVuIGluamVjdGVkLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFNvLCB3ZSdsbCBqdXN0IGNyZWF0ZSBvdXIgb3duIG1hbnVhbGx5IHZpYSB0aGUgRE9NUGFyc2VyIHVzaW5nXG4gICAgICAgICAgICAvLyB0aGUgdGhlIHJhdyBYTUwgcmVzcG9uc2VUZXh0LlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIDpOT1RFOiBJRTggYW5kIG9sZGVyIGRvZXNuJ3QgaGF2ZSBET01QYXJzZXIsIGJ1dCB0aGV5IGNhbid0IGRvIFNWRyBlaXRoZXIsIHNvLi4uXG4gICAgICAgICAgICBlbHNlIGlmIChET01QYXJzZXIgJiYgKERPTVBhcnNlciBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xuICAgICAgICAgICAgICB2YXIgeG1sRG9jO1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG4gICAgICAgICAgICAgICAgeG1sRG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyhodHRwUmVxdWVzdC5yZXNwb25zZVRleHQsICd0ZXh0L3htbCcpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgeG1sRG9jID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKCF4bWxEb2MgfHwgeG1sRG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwYXJzZXJlcnJvcicpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCdVbmFibGUgdG8gcGFyc2UgU1ZHIGZpbGU6ICcgKyB1cmwpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBDYWNoZSBpdFxuICAgICAgICAgICAgICAgIHN2Z0NhY2hlW3VybF0gPSB4bWxEb2MuZG9jdW1lbnRFbGVtZW50O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdlJ3ZlIGxvYWRlZCBhIG5ldyBhc3NldCwgc28gcHJvY2VzcyBhbnkgcmVxdWVzdHMgd2FpdGluZyBmb3IgaXRcbiAgICAgICAgICAgIHByb2Nlc3NSZXF1ZXN0UXVldWUodXJsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjaygnVGhlcmUgd2FzIGEgcHJvYmxlbSBpbmplY3RpbmcgdGhlIFNWRzogJyArIGh0dHBSZXF1ZXN0LnN0YXR1cyArICcgJyArIGh0dHBSZXF1ZXN0LnN0YXR1c1RleHQpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaHR0cFJlcXVlc3Qub3BlbignR0VUJywgdXJsKTtcblxuICAgICAgLy8gVHJlYXQgYW5kIHBhcnNlIHRoZSByZXNwb25zZSBhcyBYTUwsIGV2ZW4gaWYgdGhlXG4gICAgICAvLyBzZXJ2ZXIgc2VuZHMgdXMgYSBkaWZmZXJlbnQgbWltZXR5cGVcbiAgICAgIGlmIChodHRwUmVxdWVzdC5vdmVycmlkZU1pbWVUeXBlKSBodHRwUmVxdWVzdC5vdmVycmlkZU1pbWVUeXBlKCd0ZXh0L3htbCcpO1xuXG4gICAgICBodHRwUmVxdWVzdC5zZW5kKCk7XG4gICAgfVxuICB9O1xuXG4gIC8vIEluamVjdCBhIHNpbmdsZSBlbGVtZW50XG4gIHZhciBpbmplY3RFbGVtZW50ID0gZnVuY3Rpb24gKGVsLCBldmFsU2NyaXB0cywgcG5nRmFsbGJhY2ssIGNhbGxiYWNrKSB7XG5cbiAgICAvLyBHcmFiIHRoZSBzcmMgb3IgZGF0YS1zcmMgYXR0cmlidXRlXG4gICAgdmFyIGltZ1VybCA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKSB8fCBlbC5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuXG4gICAgLy8gV2UgY2FuIG9ubHkgaW5qZWN0IFNWR1xuICAgIGlmICghKC9cXC5zdmcvaSkudGVzdChpbWdVcmwpKSB7XG4gICAgICBjYWxsYmFjaygnQXR0ZW1wdGVkIHRvIGluamVjdCBhIGZpbGUgd2l0aCBhIG5vbi1zdmcgZXh0ZW5zaW9uOiAnICsgaW1nVXJsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIFNWRyBzdXBwb3J0IHRyeSB0byBmYWxsIGJhY2sgdG8gYSBwbmcsXG4gICAgLy8gZWl0aGVyIGRlZmluZWQgcGVyLWVsZW1lbnQgdmlhIGRhdGEtZmFsbGJhY2sgb3IgZGF0YS1wbmcsXG4gICAgLy8gb3IgZ2xvYmFsbHkgdmlhIHRoZSBwbmdGYWxsYmFjayBkaXJlY3Rvcnkgc2V0dGluZ1xuICAgIGlmICghaGFzU3ZnU3VwcG9ydCkge1xuICAgICAgdmFyIHBlckVsZW1lbnRGYWxsYmFjayA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1mYWxsYmFjaycpIHx8IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1wbmcnKTtcblxuICAgICAgLy8gUGVyLWVsZW1lbnQgc3BlY2lmaWMgUE5HIGZhbGxiYWNrIGRlZmluZWQsIHNvIHVzZSB0aGF0XG4gICAgICBpZiAocGVyRWxlbWVudEZhbGxiYWNrKSB7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnc3JjJywgcGVyRWxlbWVudEZhbGxiYWNrKTtcbiAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyBHbG9iYWwgUE5HIGZhbGxiYWNrIGRpcmVjdG9yaXkgZGVmaW5lZCwgdXNlIHRoZSBzYW1lLW5hbWVkIFBOR1xuICAgICAgZWxzZSBpZiAocG5nRmFsbGJhY2spIHtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKCdzcmMnLCBwbmdGYWxsYmFjayArICcvJyArIGltZ1VybC5zcGxpdCgnLycpLnBvcCgpLnJlcGxhY2UoJy5zdmcnLCAnLnBuZycpKTtcbiAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyB1bS4uLlxuICAgICAgZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKCdUaGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBTVkcgYW5kIG5vIFBORyBmYWxsYmFjayB3YXMgZGVmaW5lZC4nKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE1ha2Ugc3VyZSB3ZSBhcmVuJ3QgYWxyZWFkeSBpbiB0aGUgcHJvY2VzcyBvZiBpbmplY3RpbmcgdGhpcyBlbGVtZW50IHRvXG4gICAgLy8gYXZvaWQgYSByYWNlIGNvbmRpdGlvbiBpZiBtdWx0aXBsZSBpbmplY3Rpb25zIGZvciB0aGUgc2FtZSBlbGVtZW50IGFyZSBydW4uXG4gICAgLy8gOk5PVEU6IFVzaW5nIGluZGV4T2YoKSBvbmx5IF9hZnRlcl8gd2UgY2hlY2sgZm9yIFNWRyBzdXBwb3J0IGFuZCBiYWlsLFxuICAgIC8vIHNvIG5vIG5lZWQgZm9yIElFOCBpbmRleE9mKCkgcG9seWZpbGxcbiAgICBpZiAoaW5qZWN0ZWRFbGVtZW50cy5pbmRleE9mKGVsKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZW1lbWJlciB0aGUgcmVxdWVzdCB0byBpbmplY3QgdGhpcyBlbGVtZW50LCBpbiBjYXNlIG90aGVyIGluamVjdGlvblxuICAgIC8vIGNhbGxzIGFyZSBhbHNvIHRyeWluZyB0byByZXBsYWNlIHRoaXMgZWxlbWVudCBiZWZvcmUgd2UgZmluaXNoXG4gICAgaW5qZWN0ZWRFbGVtZW50cy5wdXNoKGVsKTtcblxuICAgIC8vIFRyeSB0byBhdm9pZCBsb2FkaW5nIHRoZSBvcmdpbmFsIGltYWdlIHNyYyBpZiBwb3NzaWJsZS5cbiAgICBlbC5zZXRBdHRyaWJ1dGUoJ3NyYycsICcnKTtcblxuICAgIC8vIExvYWQgaXQgdXBcbiAgICBsb2FkU3ZnKGltZ1VybCwgZnVuY3Rpb24gKHN2Zykge1xuXG4gICAgICBpZiAodHlwZW9mIHN2ZyA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHN2ZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY2FsbGJhY2soc3ZnKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW1nSWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgICBpZiAoaW1nSWQpIHtcbiAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZSgnaWQnLCBpbWdJZCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBpbWdUaXRsZSA9IGVsLmdldEF0dHJpYnV0ZSgndGl0bGUnKTtcbiAgICAgIGlmIChpbWdUaXRsZSkge1xuICAgICAgICBzdmcuc2V0QXR0cmlidXRlKCd0aXRsZScsIGltZ1RpdGxlKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ29uY2F0IHRoZSBTVkcgY2xhc3NlcyArICdpbmplY3RlZC1zdmcnICsgdGhlIGltZyBjbGFzc2VzXG4gICAgICB2YXIgY2xhc3NNZXJnZSA9IFtdLmNvbmNhdChzdmcuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8IFtdLCAnaW5qZWN0ZWQtc3ZnJywgZWwuZ2V0QXR0cmlidXRlKCdjbGFzcycpIHx8IFtdKS5qb2luKCcgJyk7XG4gICAgICBzdmcuc2V0QXR0cmlidXRlKCdjbGFzcycsIHVuaXF1ZUNsYXNzZXMoY2xhc3NNZXJnZSkpO1xuXG4gICAgICB2YXIgaW1nU3R5bGUgPSBlbC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJyk7XG4gICAgICBpZiAoaW1nU3R5bGUpIHtcbiAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBpbWdTdHlsZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENvcHkgYWxsIHRoZSBkYXRhIGVsZW1lbnRzIHRvIHRoZSBzdmdcbiAgICAgIHZhciBpbWdEYXRhID0gW10uZmlsdGVyLmNhbGwoZWwuYXR0cmlidXRlcywgZnVuY3Rpb24gKGF0KSB7XG4gICAgICAgIHJldHVybiAoL15kYXRhLVxcd1tcXHdcXC1dKiQvKS50ZXN0KGF0Lm5hbWUpO1xuICAgICAgfSk7XG4gICAgICBmb3JFYWNoLmNhbGwoaW1nRGF0YSwgZnVuY3Rpb24gKGRhdGFBdHRyKSB7XG4gICAgICAgIGlmIChkYXRhQXR0ci5uYW1lICYmIGRhdGFBdHRyLnZhbHVlKSB7XG4gICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZShkYXRhQXR0ci5uYW1lLCBkYXRhQXR0ci52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBNYWtlIHN1cmUgYW55IGludGVybmFsbHkgcmVmZXJlbmNlZCBjbGlwUGF0aCBpZHMgYW5kIHRoZWlyXG4gICAgICAvLyBjbGlwLXBhdGggcmVmZXJlbmNlcyBhcmUgdW5pcXVlLlxuICAgICAgLy9cbiAgICAgIC8vIFRoaXMgYWRkcmVzc2VzIHRoZSBpc3N1ZSBvZiBoYXZpbmcgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZVxuICAgICAgLy8gc2FtZSBTVkcgb24gYSBwYWdlIGFuZCBvbmx5IHRoZSBmaXJzdCBjbGlwUGF0aCBpZCBpcyByZWZlcmVuY2VkLlxuICAgICAgLy9cbiAgICAgIC8vIEJyb3dzZXJzIG9mdGVuIHNob3J0Y3V0IHRoZSBTVkcgU3BlYyBhbmQgZG9uJ3QgdXNlIGNsaXBQYXRoc1xuICAgICAgLy8gY29udGFpbmVkIGluIHBhcmVudCBlbGVtZW50cyB0aGF0IGFyZSBoaWRkZW4sIHNvIGlmIHlvdSBoaWRlIHRoZSBmaXJzdFxuICAgICAgLy8gU1ZHIGluc3RhbmNlIG9uIHRoZSBwYWdlLCB0aGVuIGFsbCBvdGhlciBpbnN0YW5jZXMgbG9zZSB0aGVpciBjbGlwcGluZy5cbiAgICAgIC8vIFJlZmVyZW5jZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Mzc2MDI3XG5cbiAgICAgIC8vIEhhbmRsZSBhbGwgZGVmcyBlbGVtZW50cyB0aGF0IGhhdmUgaXJpIGNhcGFibGUgYXR0cmlidXRlcyBhcyBkZWZpbmVkIGJ5IHczYzogaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHL2xpbmtpbmcuaHRtbCNwcm9jZXNzaW5nSVJJXG4gICAgICAvLyBNYXBwaW5nIElSSSBhZGRyZXNzYWJsZSBlbGVtZW50cyB0byB0aGUgcHJvcGVydGllcyB0aGF0IGNhbiByZWZlcmVuY2UgdGhlbTpcbiAgICAgIHZhciBpcmlFbGVtZW50c0FuZFByb3BlcnRpZXMgPSB7XG4gICAgICAgICdjbGlwUGF0aCc6IFsnY2xpcC1wYXRoJ10sXG4gICAgICAgICdjb2xvci1wcm9maWxlJzogWydjb2xvci1wcm9maWxlJ10sXG4gICAgICAgICdjdXJzb3InOiBbJ2N1cnNvciddLFxuICAgICAgICAnZmlsdGVyJzogWydmaWx0ZXInXSxcbiAgICAgICAgJ2xpbmVhckdyYWRpZW50JzogWydmaWxsJywgJ3N0cm9rZSddLFxuICAgICAgICAnbWFya2VyJzogWydtYXJrZXInLCAnbWFya2VyLXN0YXJ0JywgJ21hcmtlci1taWQnLCAnbWFya2VyLWVuZCddLFxuICAgICAgICAnbWFzayc6IFsnbWFzayddLFxuICAgICAgICAncGF0dGVybic6IFsnZmlsbCcsICdzdHJva2UnXSxcbiAgICAgICAgJ3JhZGlhbEdyYWRpZW50JzogWydmaWxsJywgJ3N0cm9rZSddXG4gICAgICB9O1xuXG4gICAgICB2YXIgZWxlbWVudCwgZWxlbWVudERlZnMsIHByb3BlcnRpZXMsIGN1cnJlbnRJZCwgbmV3SWQ7XG4gICAgICBPYmplY3Qua2V5cyhpcmlFbGVtZW50c0FuZFByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBlbGVtZW50ID0ga2V5O1xuICAgICAgICBwcm9wZXJ0aWVzID0gaXJpRWxlbWVudHNBbmRQcm9wZXJ0aWVzW2tleV07XG5cbiAgICAgICAgZWxlbWVudERlZnMgPSBzdmcucXVlcnlTZWxlY3RvckFsbCgnZGVmcyAnICsgZWxlbWVudCArICdbaWRdJyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBlbGVtZW50c0xlbiA9IGVsZW1lbnREZWZzLmxlbmd0aDsgaSA8IGVsZW1lbnRzTGVuOyBpKyspIHtcbiAgICAgICAgICBjdXJyZW50SWQgPSBlbGVtZW50RGVmc1tpXS5pZDtcbiAgICAgICAgICBuZXdJZCA9IGN1cnJlbnRJZCArICctJyArIGluamVjdENvdW50O1xuXG4gICAgICAgICAgLy8gQWxsIG9mIHRoZSBwcm9wZXJ0aWVzIHRoYXQgY2FuIHJlZmVyZW5jZSB0aGlzIGVsZW1lbnQgdHlwZVxuICAgICAgICAgIHZhciByZWZlcmVuY2luZ0VsZW1lbnRzO1xuICAgICAgICAgIGZvckVhY2guY2FsbChwcm9wZXJ0aWVzLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgIC8vIDpOT1RFOiB1c2luZyBhIHN1YnN0cmluZyBtYXRjaCBhdHRyIHNlbGVjdG9yIGhlcmUgdG8gZGVhbCB3aXRoIElFIFwiYWRkaW5nIGV4dHJhIHF1b3RlcyBpbiB1cmwoKSBhdHRyc1wiXG4gICAgICAgICAgICByZWZlcmVuY2luZ0VsZW1lbnRzID0gc3ZnLnF1ZXJ5U2VsZWN0b3JBbGwoJ1snICsgcHJvcGVydHkgKyAnKj1cIicgKyBjdXJyZW50SWQgKyAnXCJdJyk7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgcmVmZXJlbmNpbmdFbGVtZW50TGVuID0gcmVmZXJlbmNpbmdFbGVtZW50cy5sZW5ndGg7IGogPCByZWZlcmVuY2luZ0VsZW1lbnRMZW47IGorKykge1xuICAgICAgICAgICAgICByZWZlcmVuY2luZ0VsZW1lbnRzW2pdLnNldEF0dHJpYnV0ZShwcm9wZXJ0eSwgJ3VybCgjJyArIG5ld0lkICsgJyknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGVsZW1lbnREZWZzW2ldLmlkID0gbmV3SWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBSZW1vdmUgYW55IHVud2FudGVkL2ludmFsaWQgbmFtZXNwYWNlcyB0aGF0IG1pZ2h0IGhhdmUgYmVlbiBhZGRlZCBieSBTVkcgZWRpdGluZyB0b29sc1xuICAgICAgc3ZnLnJlbW92ZUF0dHJpYnV0ZSgneG1sbnM6YScpO1xuXG4gICAgICAvLyBQb3N0IHBhZ2UgbG9hZCBpbmplY3RlZCBTVkdzIGRvbid0IGF1dG9tYXRpY2FsbHkgaGF2ZSB0aGVpciBzY3JpcHRcbiAgICAgIC8vIGVsZW1lbnRzIHJ1biwgc28gd2UnbGwgbmVlZCB0byBtYWtlIHRoYXQgaGFwcGVuLCBpZiByZXF1ZXN0ZWRcblxuICAgICAgLy8gRmluZCB0aGVuIHBydW5lIHRoZSBzY3JpcHRzXG4gICAgICB2YXIgc2NyaXB0cyA9IHN2Zy5xdWVyeVNlbGVjdG9yQWxsKCdzY3JpcHQnKTtcbiAgICAgIHZhciBzY3JpcHRzVG9FdmFsID0gW107XG4gICAgICB2YXIgc2NyaXB0LCBzY3JpcHRUeXBlO1xuXG4gICAgICBmb3IgKHZhciBrID0gMCwgc2NyaXB0c0xlbiA9IHNjcmlwdHMubGVuZ3RoOyBrIDwgc2NyaXB0c0xlbjsgaysrKSB7XG4gICAgICAgIHNjcmlwdFR5cGUgPSBzY3JpcHRzW2tdLmdldEF0dHJpYnV0ZSgndHlwZScpO1xuXG4gICAgICAgIC8vIE9ubHkgcHJvY2VzcyBqYXZhc2NyaXB0IHR5cGVzLlxuICAgICAgICAvLyBTVkcgZGVmYXVsdHMgdG8gJ2FwcGxpY2F0aW9uL2VjbWFzY3JpcHQnIGZvciB1bnNldCB0eXBlc1xuICAgICAgICBpZiAoIXNjcmlwdFR5cGUgfHwgc2NyaXB0VHlwZSA9PT0gJ2FwcGxpY2F0aW9uL2VjbWFzY3JpcHQnIHx8IHNjcmlwdFR5cGUgPT09ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0Jykge1xuXG4gICAgICAgICAgLy8gaW5uZXJUZXh0IGZvciBJRSwgdGV4dENvbnRlbnQgZm9yIG90aGVyIGJyb3dzZXJzXG4gICAgICAgICAgc2NyaXB0ID0gc2NyaXB0c1trXS5pbm5lclRleHQgfHwgc2NyaXB0c1trXS50ZXh0Q29udGVudDtcblxuICAgICAgICAgIC8vIFN0YXNoXG4gICAgICAgICAgc2NyaXB0c1RvRXZhbC5wdXNoKHNjcmlwdCk7XG5cbiAgICAgICAgICAvLyBUaWR5IHVwIGFuZCByZW1vdmUgdGhlIHNjcmlwdCBlbGVtZW50IHNpbmNlIHdlIGRvbid0IG5lZWQgaXQgYW55bW9yZVxuICAgICAgICAgIHN2Zy5yZW1vdmVDaGlsZChzY3JpcHRzW2tdKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSdW4vRXZhbCB0aGUgc2NyaXB0cyBpZiBuZWVkZWRcbiAgICAgIGlmIChzY3JpcHRzVG9FdmFsLmxlbmd0aCA+IDAgJiYgKGV2YWxTY3JpcHRzID09PSAnYWx3YXlzJyB8fCAoZXZhbFNjcmlwdHMgPT09ICdvbmNlJyAmJiAhcmFuU2NyaXB0c1tpbWdVcmxdKSkpIHtcbiAgICAgICAgZm9yICh2YXIgbCA9IDAsIHNjcmlwdHNUb0V2YWxMZW4gPSBzY3JpcHRzVG9FdmFsLmxlbmd0aDsgbCA8IHNjcmlwdHNUb0V2YWxMZW47IGwrKykge1xuXG4gICAgICAgICAgLy8gOk5PVEU6IFl1cCwgdGhpcyBpcyBhIGZvcm0gb2YgZXZhbCwgYnV0IGl0IGlzIGJlaW5nIHVzZWQgdG8gZXZhbCBjb2RlXG4gICAgICAgICAgLy8gdGhlIGNhbGxlciBoYXMgZXhwbGljdGVseSBhc2tlZCB0byBiZSBsb2FkZWQsIGFuZCB0aGUgY29kZSBpcyBpbiBhIGNhbGxlclxuICAgICAgICAgIC8vIGRlZmluZWQgU1ZHIGZpbGUuLi4gbm90IHJhdyB1c2VyIGlucHV0LlxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gQWxzbywgdGhlIGNvZGUgaXMgZXZhbHVhdGVkIGluIGEgY2xvc3VyZSBhbmQgbm90IGluIHRoZSBnbG9iYWwgc2NvcGUuXG4gICAgICAgICAgLy8gSWYgeW91IG5lZWQgdG8gcHV0IHNvbWV0aGluZyBpbiBnbG9iYWwgc2NvcGUsIHVzZSAnd2luZG93J1xuICAgICAgICAgIG5ldyBGdW5jdGlvbihzY3JpcHRzVG9FdmFsW2xdKSh3aW5kb3cpOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbWVtYmVyIHdlIGFscmVhZHkgcmFuIHNjcmlwdHMgZm9yIHRoaXMgc3ZnXG4gICAgICAgIHJhblNjcmlwdHNbaW1nVXJsXSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIDpXT1JLQVJPVU5EOlxuICAgICAgLy8gSUUgZG9lc24ndCBldmFsdWF0ZSA8c3R5bGU+IHRhZ3MgaW4gU1ZHcyB0aGF0IGFyZSBkeW5hbWljYWxseSBhZGRlZCB0byB0aGUgcGFnZS5cbiAgICAgIC8vIFRoaXMgdHJpY2sgd2lsbCB0cmlnZ2VyIElFIHRvIHJlYWQgYW5kIHVzZSBhbnkgZXhpc3RpbmcgU1ZHIDxzdHlsZT4gdGFncy5cbiAgICAgIC8vXG4gICAgICAvLyBSZWZlcmVuY2U6IGh0dHBzOi8vZ2l0aHViLmNvbS9pY29uaWMvU1ZHSW5qZWN0b3IvaXNzdWVzLzIzXG4gICAgICB2YXIgc3R5bGVUYWdzID0gc3ZnLnF1ZXJ5U2VsZWN0b3JBbGwoJ3N0eWxlJyk7XG4gICAgICBmb3JFYWNoLmNhbGwoc3R5bGVUYWdzLCBmdW5jdGlvbiAoc3R5bGVUYWcpIHtcbiAgICAgICAgc3R5bGVUYWcudGV4dENvbnRlbnQgKz0gJyc7XG4gICAgICB9KTtcblxuICAgICAgLy8gUmVwbGFjZSB0aGUgaW1hZ2Ugd2l0aCB0aGUgc3ZnXG4gICAgICBlbC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChzdmcsIGVsKTtcblxuICAgICAgLy8gTm93IHRoYXQgd2Ugbm8gbG9uZ2VyIG5lZWQgaXQsIGRyb3AgcmVmZXJlbmNlc1xuICAgICAgLy8gdG8gdGhlIG9yaWdpbmFsIGVsZW1lbnQgc28gaXQgY2FuIGJlIEdDJ2RcbiAgICAgIGRlbGV0ZSBpbmplY3RlZEVsZW1lbnRzW2luamVjdGVkRWxlbWVudHMuaW5kZXhPZihlbCldO1xuICAgICAgZWwgPSBudWxsO1xuXG4gICAgICAvLyBJbmNyZW1lbnQgdGhlIGluamVjdGVkIGNvdW50XG4gICAgICBpbmplY3RDb3VudCsrO1xuXG4gICAgICBjYWxsYmFjayhzdmcpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTVkdJbmplY3RvclxuICAgKlxuICAgKiBSZXBsYWNlIHRoZSBnaXZlbiBlbGVtZW50cyB3aXRoIHRoZWlyIGZ1bGwgaW5saW5lIFNWRyBET00gZWxlbWVudHMuXG4gICAqXG4gICAqIDpOT1RFOiBXZSBhcmUgdXNpbmcgZ2V0L3NldEF0dHJpYnV0ZSB3aXRoIFNWRyBiZWNhdXNlIHRoZSBTVkcgRE9NIHNwZWMgZGlmZmVycyBmcm9tIEhUTUwgRE9NIGFuZFxuICAgKiBjYW4gcmV0dXJuIG90aGVyIHVuZXhwZWN0ZWQgb2JqZWN0IHR5cGVzIHdoZW4gdHJ5aW5nIHRvIGRpcmVjdGx5IGFjY2VzcyBzdmcgcHJvcGVydGllcy5cbiAgICogZXg6IFwiY2xhc3NOYW1lXCIgcmV0dXJucyBhIFNWR0FuaW1hdGVkU3RyaW5nIHdpdGggdGhlIGNsYXNzIHZhbHVlIGZvdW5kIGluIHRoZSBcImJhc2VWYWxcIiBwcm9wZXJ0eSxcbiAgICogaW5zdGVhZCBvZiBzaW1wbGUgc3RyaW5nIGxpa2Ugd2l0aCBIVE1MIEVsZW1lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0ge21peGVzfSBBcnJheSBvZiBvciBzaW5nbGUgRE9NIGVsZW1lbnRcbiAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICogQHJldHVybiB7b2JqZWN0fSBJbnN0YW5jZSBvZiBTVkdJbmplY3RvclxuICAgKi9cbiAgdmFyIFNWR0luamVjdG9yID0gZnVuY3Rpb24gKGVsZW1lbnRzLCBvcHRpb25zLCBkb25lKSB7XG5cbiAgICAvLyBPcHRpb25zICYgZGVmYXVsdHNcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIFNob3VsZCB3ZSBydW4gdGhlIHNjcmlwdHMgYmxvY2tzIGZvdW5kIGluIHRoZSBTVkdcbiAgICAvLyAnYWx3YXlzJyAtIFJ1biB0aGVtIGV2ZXJ5IHRpbWVcbiAgICAvLyAnb25jZScgLSBPbmx5IHJ1biBzY3JpcHRzIG9uY2UgZm9yIGVhY2ggU1ZHXG4gICAgLy8gW2ZhbHNlfCduZXZlciddIC0gSWdub3JlIHNjcmlwdHNcbiAgICB2YXIgZXZhbFNjcmlwdHMgPSBvcHRpb25zLmV2YWxTY3JpcHRzIHx8ICdhbHdheXMnO1xuXG4gICAgLy8gTG9jYXRpb24gb2YgZmFsbGJhY2sgcG5ncywgaWYgZGVzaXJlZFxuICAgIHZhciBwbmdGYWxsYmFjayA9IG9wdGlvbnMucG5nRmFsbGJhY2sgfHwgZmFsc2U7XG5cbiAgICAvLyBDYWxsYmFjayB0byBydW4gZHVyaW5nIGVhY2ggU1ZHIGluamVjdGlvbiwgcmV0dXJuaW5nIHRoZSBTVkcgaW5qZWN0ZWRcbiAgICB2YXIgZWFjaENhbGxiYWNrID0gb3B0aW9ucy5lYWNoO1xuXG4gICAgLy8gRG8gdGhlIGluamVjdGlvbi4uLlxuICAgIGlmIChlbGVtZW50cy5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgdmFyIGVsZW1lbnRzTG9hZGVkID0gMDtcbiAgICAgIGZvckVhY2guY2FsbChlbGVtZW50cywgZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgaW5qZWN0RWxlbWVudChlbGVtZW50LCBldmFsU2NyaXB0cywgcG5nRmFsbGJhY2ssIGZ1bmN0aW9uIChzdmcpIHtcbiAgICAgICAgICBpZiAoZWFjaENhbGxiYWNrICYmIHR5cGVvZiBlYWNoQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGVhY2hDYWxsYmFjayhzdmcpO1xuICAgICAgICAgIGlmIChkb25lICYmIGVsZW1lbnRzLmxlbmd0aCA9PT0gKytlbGVtZW50c0xvYWRlZCkgZG9uZShlbGVtZW50c0xvYWRlZCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKGVsZW1lbnRzKSB7XG4gICAgICAgIGluamVjdEVsZW1lbnQoZWxlbWVudHMsIGV2YWxTY3JpcHRzLCBwbmdGYWxsYmFjaywgZnVuY3Rpb24gKHN2Zykge1xuICAgICAgICAgIGlmIChlYWNoQ2FsbGJhY2sgJiYgdHlwZW9mIGVhY2hDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgZWFjaENhbGxiYWNrKHN2Zyk7XG4gICAgICAgICAgaWYgKGRvbmUpIGRvbmUoMSk7XG4gICAgICAgICAgZWxlbWVudHMgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBpZiAoZG9uZSkgZG9uZSgwKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyogZ2xvYmFsIG1vZHVsZSwgZXhwb3J0czogdHJ1ZSwgZGVmaW5lICovXG4gIC8vIE5vZGUuanMgb3IgQ29tbW9uSlNcbiAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBTVkdJbmplY3RvcjtcbiAgfVxuICAvLyBBTUQgc3VwcG9ydFxuICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIFNWR0luamVjdG9yO1xuICAgIH0pO1xuICB9XG4gIC8vIE90aGVyd2lzZSwgYXR0YWNoIHRvIHdpbmRvdyBhcyBnbG9iYWxcbiAgZWxzZSBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHtcbiAgICB3aW5kb3cuU1ZHSW5qZWN0b3IgPSBTVkdJbmplY3RvcjtcbiAgfVxuICAvKiBnbG9iYWwgLW1vZHVsZSwgLWV4cG9ydHMsIC1kZWZpbmUgKi9cblxufSh3aW5kb3csIGRvY3VtZW50KSk7XG4iLCJjb25zdCBpbmplY3RTdmcgPSByZXF1aXJlKCdzdmctaW5qZWN0b3InKTtcblxuY2xhc3MgTmljU3ZnIHtcbiAgICBjb25zdHJ1Y3RvcihzdmdFbGVtLCBqc29uUGF0aCkge1xuICAgICAgICB0aGlzLnN2Z0VsZW0gPSBzdmdFbGVtO1xuICAgICAgICB0aGlzLmpzb25QYXRoID0ganNvblBhdGg7XG4gICAgfVxuXG4gICAgc3ZnVG9Eb20oKSB7XG4gICAgICAgIHJldHVybiBpbmplY3RTdmcoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5zdmdFbGVtKSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCB7TmljU3ZnfVxuIl19
