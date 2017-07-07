// Add a getElementsByClassName function if the browser doesn't have one
// Limitation: only works with one class name
// Copyright: Eike Send http://eike.se/nd
// License: MIT License

if (!document.getElementsByClassName) {
    document.getElementsByClassName = function(search) {
        var d = document, elements, pattern, i, results = [];
        if (d.querySelectorAll) { // IE8
            return d.querySelectorAll("." + search);
        }
        if (d.evaluate) { // IE6, IE7
            pattern = ".//*[contains(concat(' ', @class, ' '), ' " + search + " ')]";
            elements = d.evaluate(pattern, d, null, 0, null);
            while ((i = elements.iterateNext())) {
                results.push(i);
            }
        } else {
            elements = d.getElementsByTagName("*");
            pattern = new RegExp("(^|\\s)" + search + "(\\s|$)");
            for (i = 0; i < elements.length; i++) {
                if ( pattern.test(elements[i].className) ) {
                    results.push(elements[i]);
                }
            }
        }
        return results;
    };
}

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {

      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

// Source: https://github.com/Alhadis/Snippets/blob/master/js/polyfills/IE8-child-elements.js
if(!("previousElementSibling" in document.documentElement)){
    Object.defineProperty(Element.prototype, "previousElementSibling", {
        get: function(){
            var e = this.previousSibling;
            while(e && 1 !== e.nodeType)
                e = e.previousSibling;
            return e;
        }
    });
}

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce#Polyfill
// Production steps of ECMA-262, Edition 5, 15.4.4.21
// Reference: http://es5.github.io/#x15.4.4.21
// https://tc39.github.io/ecma262/#sec-array.prototype.reduce
if (!Array.prototype.reduce) {
  Object.defineProperty(Array.prototype, 'reduce', {
    value: function(callback /*, initialValue*/) {
      if (this === null) {
        throw new TypeError('Array.prototype.reduce called on null or undefined');
      }
      if (typeof callback !== 'function') {
        throw new TypeError(callback + ' is not a function');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // Steps 3, 4, 5, 6, 7
      var k = 0;
      var value;

      if (arguments.length == 2) {
        value = arguments[1];
      } else {
        while (k < len && !(k in o)) {
          k++;
        }

        // 3. If len is 0 and initialValue is not present, throw a TypeError exception.
        if (k >= len) {
          throw new TypeError('Reduce of empty array with no initial value');
        }
        value = o[k++];
      }

      // 8. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kPresent be ? HasProperty(O, Pk).
        // c. If kPresent is true, then
        //    i. Let kValue be ? Get(O, Pk).
        //    ii. Let accumulator be ? Call(callbackfn, undefined, « accumulator, kValue, k, O »).
        if (k in o) {
          value = callback(value, o[k], k, o);
        }

        // d. Increase k by 1.
        k++;
      }

      // 9. Return accumulator.
      return value;
    }
  });
}

(function () {

    if (typeof window.Element === "undefined" || "classList" in document.documentElement) return;

    var prototype = Array.prototype,
        push = prototype.push,
        splice = prototype.splice,
        join = prototype.join;

    function DOMTokenList(el) {
        this.el = el;
        // The className needs to be trimmed and split on whitespace
        // to retrieve a list of classes.
        var classes = el.className.replace(/^\s+|\s+$/g,'').split(/\s+/);
        for (var i = 0; i < classes.length; i++) {
            push.call(this, classes[i]);
        }
    }

    DOMTokenList.prototype = {
        add: function(token) {
            if(this.contains(token)) return;
            push.call(this, token);
            this.el.className = this.toString();
        },
        contains: function(token) {
            return this.el.className.indexOf(token) != -1;
        },
        item: function(index) {
            return this[index] || null;
        },
        remove: function(token) {
            if (!this.contains(token)) return;
            for (var i = 0; i < this.length; i++) {
                if (this[i] == token) break;
            }
            splice.call(this, i, 1);
            this.el.className = this.toString();
        },
        toString: function() {
            return join.call(this, ' ');
        },
        toggle: function(token) {
            if (!this.contains(token)) {
                this.add(token);
            } else {
                this.remove(token);
            }

            return this.contains(token);
        }
    };

    window.DOMTokenList = DOMTokenList;

    function defineElementGetter (obj, prop, getter) {
        if (Object.defineProperty) {
            Object.defineProperty(obj, prop,{
                get : getter
            });
        } else {
            obj.__defineGetter__(prop, getter);
        }
    }

    defineElementGetter(Element.prototype, 'classList', function () {
        return new DOMTokenList(this);
    });

})();

window.ExtL = window.ExtL || {};

(function() {
    var matchesSelector = (function () {
        var el = document.documentElement,
            w3 = 'matches',
            wk = 'webkitMatchesSelector',
            ms = 'msMatchesSelector',
            mz = 'mozMatchesSelector';

        return el[w3] ? w3 : el[wk] ? wk : el[ms] ? ms : el[mz] ? mz : null;
    })();

    // cache of document elements
    var els = {};
    var arrayPrototype = Array.prototype;
    var supportsIndexOf = 'indexOf' in arrayPrototype;

    /**
     * Checks if the specified CSS class exists on this element's DOM node.
     * @param {Element} el The element to check
     * @param {String} cls The CSS to check for
     */
    ExtL.hasCls = function(el, cls) {
        return !!( el && el.className && el.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)')));
    };

    /**
     * Adds a CSS class to the top level element representing this component.
     * @param {Element} el The target element to add the class to
     * @param {String} cls The CSS to add
     */
    ExtL.addCls = function(el, cls) {
        this.toggleCls(el, cls, true);
    };

    /**
     * Returns the first instance of a found class
     * @param cls
     */
    ExtL.getByCls = function(cls) {
        return document.getElementsByClassName(cls)[0];
    };

    /**
     * Removes a CSS class from the top level element representing this component.
     * @param {Element} el The target element to remove the class from
     * @param {String} cls The CSS to remove
     */
    ExtL.removeCls = function(el, cls) {
        this.toggleCls(el, cls, false);
    };

    /**
     * Toggles the specified CSS class on this element (removes it if it already exists,
     * otherwise adds it).
     * @param {Element/String} el The target element to toggle the class on.  May also be
     * the id of the target element
     * @param {String} cls The CSS to toggle
     * @param {Boolean} [state] (optional) If specified as true, causes the class to be
     * added. If specified as false, causes the class to be removed.
     */
    ExtL.toggleCls = function(el, cls, state) {
        var reg;

        if (ExtL.isString(el)) {
            el = ExtL.get(el);
        }

        if (!el) {
            return false;
        }

        if (this.isEmpty(state)) {
            state = !this.hasCls(el, cls);
        } else {
            state = !!state;
        }

        if (state === true) {
            if (!this.hasCls(el, cls)) {
                el.className += ' ' + this.trim(cls);
                el.className = ExtL.trim(el.className).replace(/  +/g, ' ');
            }
        } else {
            if (ExtL.hasCls(el, cls)) {
                reg = new RegExp(cls + '(?:\\s|$)');
                el.className = el.className.replace(reg, '');
            }
        }
    };

    /**
     *
     */
    ExtL.canLocalStorage = function() {
        var ls = ExtL.hasLocalStorage,
            uid = new Date(),
            result;

        try {
            localStorage.setItem(uid, uid);
            result = localStorage.getItem(uid) == uid;
            localStorage.removeItem(uid);
            ls = ExtL.hasLocalStorage = result && localStorage;
        } catch (exception) {}

        return !!ls;
    };

    /**
     * Returns true if the passed value is empty, false otherwise. The value is deemed to
     * be empty if it is either:
     *
     *  - null
     *  - undefined
     *  - a zero-length array
     *  - a zero-length string (Unless the allowEmptyString parameter is set to true)
     *
     * @return {Boolean}
     */
    ExtL.isEmpty = function(value, allowEmptyString) {
        return (value === null || value === undefined) || (!allowEmptyString ? value === '' : false) || (this.isArray(value) && value.length === 0);
    };

    /**
     * Return an element by id.  An element instance may also be passed and will simply
     * be returned;
     * @param {String/HTMLElement} id The id of the element to fetch
     * @return {HTMLElement} The element with the passed id
     */
    ExtL.get = function (id) {
        if (!ExtL.isString(id)) {
            return id;
        }
        return els[id] || (els[id] = document.getElementById(id));
    };

    /**
     * Gets the value at `path` of object (`obj`). If the resolved value is undefined,
     * the `defaultValue` is returned in its place.
     * @param {Object} obj The object to query
     * @param {String} path The path of the property to get
     * @param {Object} [defaultValue] The value for undefined resolved values
     * @return {Object} The property located within the `obj` at `path` or the
     * `defaultValue`
     */
    ExtL.valueFromPath = function (obj, path, defaultValue) {
        var pathArr = path.split('.');

        return pathArr.reduce(function (src, key) {
            return src[key];
        }, obj) || defaultValue;
    };

    /**
     * Returns true if the passed value is a JavaScript Date object, false otherwise.
     * @param {Object} value The object to test.
     * @return {Boolean}
     */
    ExtL.isDate = function(value) {
        return Object.prototype.toString.call(value) === '[object Date]';
    };

    /**
     * Returns true if the passed value is a JavaScript Array, false otherwise.
     * @param {Object} value The target to test.
     * @return {Boolean}
     */
    ExtL.isArray = ('isArray' in Array) ? Array.isArray : function(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    };

    /**
     * Validates that a value is numeric.
     * @param {Number/String} value Examples: 1, '1', '2.34'
     * @return {Boolean} True if numeric, false otherwise
     */
    ExtL.isNumeric = function(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    };

    /**
     * Returns true if the passed value is a JavaScript Object, false otherwise.
     * @param {Object} value The value to test.
     * @return {Boolean}
     */
    ExtL.isObject = (Object.prototype.toString.call(null) === '[object Object]') ?
        function(value) {
            // check ownerDocument here as well to exclude DOM nodes
            return value !== null && value !== undefined && Object.prototype.toString.call(value) === '[object Object]' && value.ownerDocument === undefined;
        } :
        function(value) {
            return Object.prototype.toString.call(value) === '[object Object]';
        };

    /**
     * Returns true if the passed value is a string.
     * @param {Object} value The value to test.
     * @return {Boolean}
     */
    ExtL.isString = function(value) {
        return typeof value === 'string';
    };

    /**
     * @method
     * Get the index of the provided `item` in the given `array`, a supplement for the
     * missing arrayPrototype.indexOf in Internet Explorer.
     *
     * @param {Array} array The array to check.
     * @param {Object} item The item to find.
     * @param {Number} from (Optional) The index at which to begin the search.
     * @return {Number} The index of item in the array (or -1 if it is not found).
     */
    ExtL.indexOf = supportsIndexOf ? function(array, item, from) {
        return arrayPrototype.indexOf.call(array, item, from);
     } : function(array, item, from) {
        var i, length = array.length;

        for (i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++) {
            if (array[i] === item) {
                return i;
            }
        }
        return -1;
    };

    /**
     * Copies the values of all enumerable own properties from one or more source objects
     * to a target object. It will return the target object.
     * @param {Object} target The object into which all subsequent objects are merged
     * @param {Object...} varArgs Any number of objects to merge into the target
     * @return {Object} merged The destination object with all passed objects merged in
     */
    ExtL.assign = function(target, varArgs) { // .length of function is 2
        'use strict';
        if (target === null) { // TypeError if undefined or null
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource !== null) { // Skip over if undefined or null
                for (var nextKey in nextSource) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };

    /**
     * Returns an array of a given object's own enumerable properties, in the same order
     * as that provided by a for...in loop (the difference being that a for-in loop
     * enumerates properties in the prototype chain as well)
     * @param {Object} obj The object to return the keys from
     * @return {String[]} Array of keys from the target object
     */
    ExtL.keys = (function() {
        'use strict';
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({
                toString: null
            }).propertyIsEnumerable('toString'),
            dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            dontEnumsLength = dontEnums.length;

        return function(obj) {
            if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                throw new TypeError('Object.keys called on non-object');
            }

            var result = [],
                prop, i;

            for (prop in obj) {
                if (hasOwnProperty.call(obj, prop)) {
                    result.push(prop);
                }
            }

            if (hasDontEnumBug) {
                for (i = 0; i < dontEnumsLength; i++) {
                    if (hasOwnProperty.call(obj, dontEnums[i])) {
                        result.push(dontEnums[i]);
                    }
                }
            }
            return result;
        };
    }());

    ExtL.bindReady = function (handler){
        var called = false,
            isFrame;

        function ready() {
            if (called)
                return;
            called = true;
            handler();
        }

        if ( document.addEventListener ) { // native event
            document.addEventListener( "DOMContentLoaded", ready, false );
        } else if ( document.attachEvent ) {  // IE

            try {
                isFrame = window.frameElement !== null;
            } catch(e) {}

            // IE, the document is not inside a frame
            if (document.documentElement.doScroll && !isFrame ) {
                function tryScroll(){
                    if (called)
                        return;
                    try {
                        document.documentElement.doScroll("left");
                        ready();
                    } catch(e) {
                        setTimeout(tryScroll, 10);
                    }
                }
                tryScroll();
            }

            // IE, the document is inside a frame
            document.attachEvent("onreadystatechange", function(){
                if ( document.readyState === "complete" ) {
                    ready();
                }
            });
        }

        // Old browsers
        ExtL.on(window, 'load', ready);
    };

    /**
     *
     */
    ExtL.monitorMouseLeave = function (el, delay, handler, scope) {
        var timer;

        ExtL.on(el, 'mouseleave', function (e) {
            e = e || window.event;
            var obj = {
                target : e.target || e.srcElement
            };
            timer = setTimeout(function () {
                handler.call(scope || ExtL, obj);
            }, delay);
        });

        ExtL.on(el, 'mouseenter', function () {
            clearTimeout(timer);
        });
    };

    /**
     *
     */
    ExtL.monitorMouseEnter = function (el, delay, handler, scope) {
        var timer;

        ExtL.on(el, 'mouseenter', function (e) {
            e = e || window.event;
            var obj = {
                target : e.target || e.srcElement
            };
            timer = setTimeout(function () {
                handler.call(scope || ExtL, obj);
            }, delay);
        });
        ExtL.on(el, 'mouseleave', function () {
            clearTimeout(timer);
        });
    };

    ExtL.on = function (el, event, handler) {
        if (el.addEventListener) {
            el.addEventListener(event, handler);
        } else if (el.attachEvent)  {
            el.attachEvent('on' + event, handler);
        }

        return el;
    };

    /**
     *
     */
    ExtL.un = function (el, event, handler) {
        if (el.removeEventListener) {
            el.removeEventListener(event, handler, false);
        } else if (el.detachEvent) {
            el.detachEvent("on" + event, handler);
        } else {
            el["on" + event] = null;
        }

        return el;
    };

    /**
     *
     */
    ExtL.getWidth = function (el) {
        var box = el.getBoundingClientRect();

        return box.right - box.left;
    };

    /**
     *
     */
    ExtL.getHeight = function (el) {
        var box = el.getBoundingClientRect();

        return box.bottom - box.top;
    };

    /**
     *
     */
    ExtL.getSize = function (el) {
        return {
            width: ExtL.getWidth(el),
            height: ExtL.getHeight(el)
        };
    };

    /**
     * @param {Element} el The element to apply the styles to
     * @param {String/Object} styles The styles to apply to the element.  This can be a string
     * to append to the element's style attribute directly or an object of style key /
     * value pairs.
     */
    ExtL.applyStyles = function (el, styles) {
        var style;

        if (ExtL.isObject(styles)) {
            ExtL.each(styles, function (key, val) {
                el.style[key] = val;
            });
        } else {
            style = el.getAttribute('style') || '';
            el.setAttribute('style', style + styles);
        }
    };

    /**
     * Converts a query string back into an object.
     *
     * Non-recursive:
     *
     *     Ext.Object.fromQueryString("foo=1&bar=2"); // returns {foo: '1', bar: '2'}
     *     Ext.Object.fromQueryString("foo=&bar=2"); // returns {foo: '', bar: '2'}
     *     Ext.Object.fromQueryString("some%20price=%24300"); // returns {'some price': '$300'}
     *     Ext.Object.fromQueryString("colors=red&colors=green&colors=blue"); // returns {colors: ['red', 'green', 'blue']}
     *
     * Recursive:
     *
     *     Ext.Object.fromQueryString(
     *         "username=Jacky&"+
     *         "dateOfBirth[day]=1&dateOfBirth[month]=2&dateOfBirth[year]=1911&"+
     *         "hobbies[0]=coding&hobbies[1]=eating&hobbies[2]=sleeping&"+
     *         "hobbies[3][0]=nested&hobbies[3][1]=stuff", true);
     *
     *     // returns
     *     {
     *         username: 'Jacky',
     *         dateOfBirth: {
     *             day: '1',
     *             month: '2',
     *             year: '1911'
     *         },
     *         hobbies: ['coding', 'eating', 'sleeping', ['nested', 'stuff']]
     *     }
     *
     * @param {String} queryString The query string to decode
     * @param {Boolean} [recursive=false] Whether or not to recursively decode the string. This format is supported by
     * PHP / Ruby on Rails servers and similar.
     * @return {Object}
     */
    ExtL.fromQueryString = function(queryString, recursive) {
        var parts = queryString.replace(/^\?/, '').split('&'),
            plusRe = /\+/g,
            object = {},
            temp, components, name, value, i, ln,
            part, j, subLn, matchedKeys, matchedName,
            keys, key, nextKey;

        for (i = 0, ln = parts.length; i < ln; i++) {
            part = parts[i];

            if (part.length > 0) {
                components = part.split('=');
                name = components[0];
                name = name.replace(plusRe, '%20');
                name = decodeURIComponent(name);

                value = components[1];
                if (value !== undefined) {
                    value = value.replace(plusRe, '%20');
                    value = decodeURIComponent(value);
                } else {
                    value = '';
                }

                if (!recursive) {
                    if (object.hasOwnProperty(name)) {
                        if (!ExtL.isArray(object[name])) {
                            object[name] = [object[name]];
                        }

                        object[name].push(value);
                    }
                    else {
                        object[name] = value;
                    }
                }
                else {
                    matchedKeys = name.match(keyRe);
                    matchedName = name.match(nameRe);

                    //<debug>
                    if (!matchedName) {
                        throw new Error('[Ext.Object.fromQueryString] Malformed query string given, failed parsing name from "' + part + '"');
                    }
                    //</debug>

                    name = matchedName[0];
                    keys = [];

                    if (matchedKeys === null) {
                        object[name] = value;
                        continue;
                    }

                    for (j = 0, subLn = matchedKeys.length; j < subLn; j++) {
                        key = matchedKeys[j];
                        key = (key.length === 2) ? '' : key.substring(1, key.length - 1);
                        keys.push(key);
                    }

                    keys.unshift(name);

                    temp = object;

                    for (j = 0, subLn = keys.length; j < subLn; j++) {
                        key = keys[j];

                        if (j === subLn - 1) {
                            if (ExtL.isArray(temp) && key === '') {
                                temp.push(value);
                            }
                            else {
                                temp[key] = value;
                            }
                        }
                        else {
                            if (temp[key] === undefined || typeof temp[key] === 'string') {
                                nextKey = keys[j+1];

                                temp[key] = (ExtL.isNumeric(nextKey) || nextKey === '') ? [] : {};
                            }

                            temp = temp[key];
                        }
                    }
                }
            }
        }

        return object;
    };

    /**
     * Returns `true` if the passed value is a boolean.
     *
     * @param {Object} value The value to test.
     * @return {Boolean}
     */
    ExtL.isBoolean = function(value) {
        return typeof value === 'boolean';
    };


    /**
     *
     */
    ExtL.fromNodeList = function (nodelist) {
        var len = nodelist.length,
            i = 0,
            arr = [];

        for (; i < len; i++) {
            arr.push(nodelist.item(i));
        }

        return arr;
    };

    ExtL.encodeValue = function(value){
        var flat = '',
            i = 0,
            enc, len, key;

        if (value === null) {
            return 'e:1';
        } else if(typeof value === 'number') {
            enc = 'n:' + value;
        } else if(typeof value === 'boolean') {
            enc = 'b:' + (value ? '1' : '0');
        } else if(ExtL.isDate(value)) {
            enc = 'd:' + value.toUTCString();
        } else if(ExtL.isArray(value)) {
            for (len = value.length; i < len; i++) {
                flat += ExtL.encodeValue(value[i]);
                if (i !== len - 1) {
                    flat += '^';
                }
            }
            enc = 'a:' + flat;
        } else if (typeof value === 'object') {
            for (key in value) {
                if (typeof value[key] !== 'function' && value[key] !== undefined) {
                    flat += key + '=' + ExtL.encodeValue(value[key]) + '^';
                }
            }
            enc = 'o:' + flat.substring(0, flat.length-1);
        } else {
            enc = 's:' + value;
        }
        return escape(enc);
    };

    ExtL.decodeValue = function(value){

        // a -> Array
        // n -> Number
        // d -> Date
        // b -> Boolean
        // s -> String
        // o -> Object
        // -> Empty (null)

        var re = /^(a|n|d|b|s|o|e)\:(.*)$/,
            matches = re.exec(unescape(value)),
            all, type, keyValue, values, vLen, v;

        if (!matches || !matches[1]) {
            return; // non state
        }

        type = matches[1];
        value = matches[2];
        switch (type) {
            case 'e':
                return null;
            case 'n':
                return parseFloat(value);
            case 'd':
                return new Date(Date.parse(value));
            case 'b':
                return (value === '1');
            case 'a':
                all = [];
                if (value) {
                    values = value.split('^');
                    vLen   = values.length;

                    for (v = 0; v < vLen; v++) {
                        value = values[v];
                        all.push(ExtL.decodeValue(value));
                    }
                }
                return all;
           case 'o':
                all = {};
                if (value) {
                    values = value.split('^');
                    vLen   = values.length;

                    for (v = 0; v < vLen; v++) {
                        value = values[v];
                        keyValue         = value.split('=');
                        all[keyValue[0]] = ExtL.decodeValue(keyValue[1]);
                    }
                }
                return all;
           default:
                return value;
        }
    };

    /**
     *
     */
    ExtL.capitalize = function (text) {
        return text.substr(0, 1).toUpperCase() + text.substr(1);
    };

    /**
     * @private
     * Helper method for the up method
     */
    ExtL.collectionHas = function(a, b) { //helper function for up()
        for(var i = 0, len = a.length; i < len; i ++) {
            if(a[i] == b) return true;
        }
        return false;
    };

    /**
     * Finds the parent node matching the passed selector
     */
    ExtL.up = function (el, selector) {
        var target = el.parentNode || null;

        while (target && target.nodeType === 1) {
            if (ExtL.is(target, selector)) {
                return target;
            }
            target = target.parentNode;
        }

        return false;
    };

    ExtL.is = function (el, selector) {
        if (matchesSelector) {
            return el[matchesSelector](selector);
        } else {
            return (function () {
                // http://tanalin.com/en/blog/2012/12/matches-selector-ie8/
                var elems = el.parentNode.querySelectorAll(selector),
                    count = elems.length;

                for (var i = 0; i < count; i++) {
                    if (elems[i] === el) {
                        return true;
                    }
                }
                return false;
            })();
        }
    };

    ExtL.createBuffered = function(fn, buffer, scope, args) {
        var timerId;

        return function() {
            var callArgs = args || Array.prototype.slice.call(arguments, 0),
                me = scope || this;

            if (timerId) {
                clearTimeout(timerId);
            }

            timerId = setTimeout(function(){
                fn.apply(me, callArgs);
            }, buffer);
        };
    };

    /**
     * Trims whitespace from either end of a string, leaving spaces within the string intact.  Example:
     * @param {String} str The string to trim.
     * @return {String} The trimmed string.
     */
    ExtL.trim = function (str) {
        return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };

    /**
     * Converts a value to an array if it's not already an array; returns an the param
     * wrapped as an array (or the array itself if it's an already an array)
     * @return {Array}
     */
    ExtL.from = function (obj) {
        return ExtL.isArray(obj) ? obj : [obj];
    };

    /**
     *
     */
    ExtL.isIE8 = function () {
        return typeof XDomainRequest !== "undefined";
    };

    /**
     *
     */
    ExtL.isIE9 = function () {
        return (typeof XDomainRequest !== "undefined" && typeof window.msPerformance !== "undefined");
    };

    /**
     * Creates a DOM element
     * @param {Object} cfg (optional) An array of attributes to set on the element
     * @param {String} cfg.tag The tag type to create
     * @param {String} cfg.text (optional) Text to insert in the element
     * @param {Array/Object} cfg.cn (optional) Array, or array of [tag, attributes, text, children] to append to the element
     * @param {Boolean} cfg.insertBefore True to insert child elements prior to inserting text
     * @return {Element} The created element
     */
    ExtL.createElement = function (cfg) {
        var tag = cfg.tag || 'div',
            html = cfg.html,
            children = cfg.cn,
            insertBefore = cfg.insertBefore,
            el = document.createElement(tag),
            textNode;

        delete cfg.tag;
        delete cfg.html;
        delete cfg.cn;
        delete cfg.insertBefore;

        ExtL.each(cfg, function (key, val) {
            el.setAttribute(key, val);
        });

        if (html && !insertBefore) {
            textNode = document.createTextNode(html);
            el.appendChild(textNode);
        }

        if (children) {
            children = ExtL.from(children);
            ExtL.each(children, function (child) {
                el.appendChild(ExtL.createElement(child));
            });
        }

        if (html && insertBefore) {
            textNode = document.createTextNode(html);
            el.appendChild(textNode);
        }

        return el;
    };

    /**
     *
     */
    ExtL.removeChildNodes = function (el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    };

    /**
     * Convenience array / object looping function
     * @param {Object/Array} object The object or array to loop through
     * @param {Function} fn Callback function to call on each array item / object key.
     * The callback is passed the following params:
     *
     *  - array: array item, index, the original array
     *  - object: object key, object value, original object
     *
     * @param {Object} [scope] (optional) The scope (this reference) in which the specified
     * function is executed.
     */
    ExtL.each = function (object, fn, scope) {
        if (ExtL.isEmpty(object)) {
            return;
        }

        if (scope === undefined) {
            scope = object;
        }

        if (ExtL.isArray(object)) {
            ExtL.arrEach.call(ExtL, object, fn, scope);
        }
        else {
            ExtL.objEach.call(ExtL, object, fn, scope);
        }
    };

    /**
     * Replaces curly-bracket-wrapped tokens or object keys in a string with either n
     * number of arguments or the values from an object.  Format may be used in the
     * following ways:
     * 1)  Allows you to define a tokenized string and pass an arbitrary number of
     * arguments to replace the tokens. Each token must be unique, and must increment in
     * the format {0}, {1}, etc. Example usage:
     *
     *     var cls = 'my-class',
     *         text = 'Some text';
     *     var s = Ext.String.format('<div class="{0}">{1}</div>', cls, text);
     *     alert(s); // '<div class="my-class">Some text</div>'
     *
     * 2) Allows you to define a parameterized string and pass in an key/value hash to
     * replace the parameters.  Example usage:
     *
     *     var obj = {
     *         cls: 'my-class',
     *         text: 'Some text'
     *     };
     *     var s = Ext.String.format('<div class="{cls}">{text}</div>', obj);
     *     alert(s); // '<div class="my-class">Some text</div>'
     *
     * @param {String} string The tokenized string to be formatted.
     * @param {String.../Object} values First param value to replace token `{0}`, then
     * next param to replace `{1}` etc.  May also be an object of key / value pairs to
     * replace `{key}` instance in the passed string with the paired key's value.
     * @return {String} The formatted string.
     */
    ExtL.format = function () {
        var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments)),
            string = args.shift(),
            len = args.length,
            i = 0,
            key, val;

        if (Object.prototype.toString.call(args[0]) === '[object Object]') {
            for (key in args[0]) {
                if (!args[0].hasOwnProperty(key)) continue;

                val = args[0][key];
                string = string.replace(new RegExp("\\{" + key + "\\}", "g"), val);
            }
        } else {
            for (; i < len; i++) {
                string = string.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
            }
        }

        return string;
    };

    /**
     * Iterates an array invokes the given callback function for each item.
     * @param {Array} array The object or array to loop through
     * @param {Function} fn Callback function to call on each array item / object key.
     * The callback is passed the following params:
     *
     *  - array: array item, index, the original array
     *
     * @param {Object} scope (optional) The scope (this reference) in which the specified
     * function is executed.
     * @param {Boolean} reverse (optional) Reverse the iteration order (loop from the end
     * to the beginning).
     */
    ExtL.arrEach = function (array, fn, scope, reverse) {
        array = ExtL.from(array);

        var i,
            ln = array.length;

        if (reverse !== true) {
            for (i = 0; i < ln; i++) {
                if (fn.call(scope || array[i], array[i], i, array) === false) {
                    return i;
                }
            }
        }
        else {
            for (i = ln - 1; i > -1; i--) {
                if (fn.call(scope || array[i], array[i], i, array) === false) {
                    return i;
                }
            }
        }

        return true;
    };

    /**
     * Convenience array / object looping function
     * @param {Object} object The object or array to loop through
     * @param {Function} fn Callback function to call on each array item / object key.
     * The callback is passed the following params:
     *
     *  - object: object key, object value, original object
     *
     * @param {Object} scope (optional) The scope (this reference) in which the specified
     * function is executed.
     */
    ExtL.objEach = function (object, fn, scope) {
        var property;

        if (object) {
            scope = scope || object;

            for (property in object) {
                if (object.hasOwnProperty(property)) {
                    if (fn.call(scope, property, object[property], object) === false) {
                        return;
                    }
                }
            }
        }
    };

    /**
     * Convert certain characters (&, <, >, ', and ") to their HTML character equivalents
     * for literal display in web pages
     * @param {String} html The string to encode
     * @return {String} The encoded text
     */
    ExtL.htmlEncode = function (html) {
        return document.createElement( 'a' ).appendChild(
            document.createTextNode( html ) ).parentNode.innerHTML;
    };

    /**
     *
     */
    ExtL.htmlDecode = function (input){
        var e = document.createElement('div');
        e.innerHTML = input;
        return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
    };
})();
