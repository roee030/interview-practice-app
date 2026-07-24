window.CARDS = [
{
"id": "iv-ch1-q1",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "CRITICAL — Asked at Meta, Microsoft, Atlassian",
"question": "Implement Function.prototype.bind() from scratch. Support partial application and the new operator.",
"explanation": "bind() makes a new function. That new function always uses a fixed `this` value, no matter how you call it later. You can also pre-fill some arguments — this is called partial application.\nTwo tricky parts to solve:\n1. Save the original function inside a closure, so the new function can call it later with the right `this`.\n2. Handle the `new` keyword. If someone uses `new` on the bound function, `this` should be the brand-new object being created — NOT the fixed context you passed in.\nA simple version only handles `this` and extra arguments. A full version also handles `new` and keeps the prototype chain working.",
"code": "// Version 1: Basic (covers most interviews)\nFunction.prototype.myBind = function(context, ...args1) {\n  const fn = this; // the original function\n  return function(...args2) {\n    return fn.apply(context, [...args1, ...args2]);\n  };\n};\n \n// Usage:\nfunction greet(greeting, punctuation) {\n  return greeting + ', ' + this.name + punctuation;\n}\nconst person = { name: 'Roee' };\nconst hi = greet.myBind(person, 'Hi');\nhi('!'); // \"Hi, Roee!\"\n \n// Version 2: Full (with new support)\nFunction.prototype.myBind = function(context, ...args1) {\n  const fn = this;\n  if (typeof fn !== 'function') {\n    throw new TypeError('myBind must be called on a function');\n  }\n  \n  function bound(...args2) {\n    // When called with new, \"this\" is an instance of bound\n    // In that case, ignore the context and use the new instance\n    const isNewCall = this instanceof bound;\n    return fn.apply(\n      isNewCall ? this : context,\n      [...args1, ...args2]\n    );\n  }\n  \n  // Preserve the prototype chain\n  if (fn.prototype) {\n    bound.prototype = Object.create(fn.prototype);\n  }\n  \n  return bound;\n};\n \n// Test with new:\nfunction Person(name) { this.name = name; }\nconst BoundPerson = Person.myBind(null, 'Roee');\nconst p = new BoundPerson(); // instance with name='Roee'\nconsole.log(p instanceof Person); // true\n \n// Version 3: Without using call/apply (advanced)\nFunction.prototype.myBind = function(context, ...args1) {\n  const fn = this;\n  return function(...args2) {\n    const uniqueKey = Symbol(); // prevents collision\n    context[uniqueKey] = fn;\n    const result = context[uniqueKey](...args1, ...args2);\n    delete context[uniqueKey];\n    return result;\n  };\n};",
"howTo": "1. Say the one-line goal out loud: bind returns a new function that always runs with a fixed this, plus any preset arguments.\n2. Start simple — write a function that saves the original function and the context in a closure, then returns a new function that calls the original with .apply.\n3. Remember to merge two sets of arguments: the ones given now (partial application) and the ones given when the new function is later called.\n4. Mention the tricky edge case out loud before you're asked: what if someone calls the bound function with new? Then this should be the new object, not the saved context — check with instanceof.\n5. If asked to go deeper, mention preserving the prototype chain so instanceof still works correctly on the bound function.\n6. Common mistake to flag: forgetting that arguments passed at bind-time and at call-time both need to be combined, in that order.",
"dryRun": {
"input": "const hi = greet.myBind({name:'Roee'}, 'Hi'); hi('!')",
"frames": [
"myBind runs. fn = greet (the original function). args1 = ['Hi']. It returns a new function, saving fn, context and args1 in its closure.",
"hi('!') is called. Inside the returned function, args2 = ['!'].",
"It calls fn.apply(context, [...args1, ...args2]) = greet.apply({name:'Roee'}, ['Hi', '!']).",
"Inside greet, this.name is 'Roee', greeting is 'Hi', punctuation is '!'.",
"greet returns 'Hi' + ', ' + 'Roee' + '!'."
],
"result": "'Hi, Roee!'"
},
"pitfalls": [
"Forgetting to merge the bind-time args and call-time args in the right order (bind args first, then call args).",
"Not handling `new` — the bound function should ignore the saved context when called with `new`.",
"Forgetting to copy the prototype so `instanceof` still works on the bound function.",
"Using an arrow function for the returned wrapper — arrow functions can't be used with `new` and behave wrong here."
],
"patternTakeaway": "If you see 'implement bind from scratch', always think: closure saves the original function and context, return a function that applies fn with merged args, and check `this instanceof bound` to handle `new`.",
"pattern": "Functions & this"
},
{
"id": "iv-ch1-q2",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "CRITICAL — asked together with bind",
"question": "Implement Function.prototype.call() and Function.prototype.apply() from scratch.",
"explanation": "call() runs a function right away with a chosen `this` value. You pass the extra arguments one by one, separated by commas.\napply() does the same thing, but you pass the extra arguments as one array.\nThe trick for building these without using bind/call/apply: temporarily attach the function as a method on the target object. Then call it like `obj.method()`. Because of how method calls work in JS, `this` becomes `obj` automatically. After calling it, remove the temporary method again.",
"code": "// myCall\nFunction.prototype.myCall = function(context, ...args) {\n  // If context is null/undefined, default to global\n  context = context || globalThis;\n  \n  // Use Symbol to avoid overwriting an existing property\n  const fnKey = Symbol();\n  context[fnKey] = this; // \"this\" = the function we are calling myCall on\n  \n  const result = context[fnKey](...args);\n  delete context[fnKey];\n  \n  return result;\n};\n \n// myApply (same but takes an array)\nFunction.prototype.myApply = function(context, args = []) {\n  context = context || globalThis;\n  const fnKey = Symbol();\n  context[fnKey] = this;\n  const result = context[fnKey](...args);\n  delete context[fnKey];\n  return result;\n};\n \n// Tests:\nfunction greet(greeting, punctuation) {\n  return greeting + ', ' + this.name + punctuation;\n}\n \nconst person = { name: 'Roee' };\n \ngreet.myCall(person, 'Hello', '!');\n// \"Hello, Roee!\"\n \ngreet.myApply(person, ['Hi', '?']);\n// \"Hi, Roee?\"\n \n// Why Symbol and not a string?\n// Because if we used a regular string ('__fn'),\n// we might overwrite an existing property.\n// Symbol is always unique - no collisions.",
"howTo": "1. Separate the two ideas first: call and apply both run the function immediately with a chosen this — they only differ in how you pass arguments (list vs array).\n2. Say the core trick out loud: to set this without using bind/call/apply yourself, temporarily attach the function as a method on the target object, then call it as obj.method() — that's what makes this bind naturally.\n3. Walk through it in order: put the function on the object under a unique temporary key, call it, grab the result, then delete the temporary key.\n4. Explain why you use a Symbol instead of a plain string key: a string like '__fn' could collide with a real property on the object; a Symbol can't.\n5. Mention the edge case: if context is null or undefined, fall back to the global object.\n6. Common mistake to avoid: forgetting to delete the temporary property afterward, which would leave junk on the object.",
"dryRun": {
"input": "greet.myCall({name:'Roee'}, 'Hello', '!')",
"frames": [
"myCall runs. context = {name:'Roee'}. `this` inside myCall is the greet function.",
"Create a unique Symbol key. Set context[fnKey] = greet — greet is now a temporary method on context.",
"Call context[fnKey]('Hello', '!'). Because it's called as a method, `this` inside greet becomes context.",
"greet returns 'Hello' + ', ' + 'Roee' + '!'. Store it as result.",
"Delete context[fnKey] to clean up, then return result."
],
"result": "'Hello, Roee!'"
},
"pitfalls": [
"Using a plain string key like '__fn' instead of a Symbol — could overwrite a real property on the object.",
"Forgetting to delete the temporary key after calling — leaves junk on the object.",
"Forgetting to default context to globalThis when null/undefined is passed.",
"Mixing up call (arguments as a list) vs apply (arguments as an array)."
],
"patternTakeaway": "If you see 'implement call/apply from scratch', always think: attach the function as a temporary method on the context object using a Symbol key, call it, then delete it.",
"pattern": "Functions & this"
},
{
"id": "iv-ch1-q3",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "CRITICAL — Facebook, Microsoft, Atlassian",
"question": "Implement an EventEmitter class with on, off, emit, and once.",
"explanation": "EventEmitter is a common pattern, also called Observer or Pub-Sub. It lets different parts of code talk to each other through named events.\nMethods:\n- on(event, listener) — subscribe to an event.\n- off(event, listener) — unsubscribe.\n- emit(event, ...args) — fire the event, running all its listeners.\n- once(event, listener) — subscribe, but the listener only runs one time.\nThings to watch out for:\n- If a listener removes itself while emit is running, you must loop over a COPY of the array (use slice), not the live array.\n- once: the wrapper function must remove itself FIRST, then call the real listener.\n- off should find the listener by reference (the exact function), not by name.\n- Use Object.create(null) for the events object, so event names like 'toString' don't clash with built-in Object properties.",
"code": "class EventEmitter {\n  constructor() {\n    // Object.create(null) prevents collisions with\n    // prototype keys like \"toString\", \"constructor\"\n    this.events = Object.create(null);\n  }\n  \n  on(eventName, listener) {\n    if (!this.events[eventName]) {\n      this.events[eventName] = [];\n    }\n    this.events[eventName].push(listener);\n    return this; // enable chaining\n  }\n  \n  off(eventName, listener) {\n    const listeners = this.events[eventName];\n    if (!listeners) return this;\n    \n    // Remove only the first occurrence\n    const index = listeners.indexOf(listener);\n    if (index !== -1) {\n      listeners.splice(index, 1);\n    }\n    \n    if (listeners.length === 0) {\n      delete this.events[eventName];\n    }\n    \n    return this;\n  }\n  \n  emit(eventName, ...args) {\n    const listeners = this.events[eventName];\n    if (!listeners || listeners.length === 0) return false;\n    \n    // CRITICAL: slice() before iteration!\n    // A listener might remove itself (like once)\n    listeners.slice().forEach(listener => {\n      try {\n        listener(...args);\n      } catch (err) {\n        console.error('EventEmitter listener error:', err);\n      }\n    });\n    \n    return true;\n  }\n  \n  once(eventName, listener) {\n    const wrapper = (...args) => {\n      this.off(eventName, wrapper); // remove FIRST!\n      listener(...args);\n    };\n    this.on(eventName, wrapper);\n    return this;\n  }\n  \n  removeAllListeners(eventName) {\n    if (eventName) {\n      delete this.events[eventName];\n    } else {\n      this.events = Object.create(null);\n    }\n    return this;\n  }\n}\n \n// Usage:\nconst emitter = new EventEmitter();\n \nemitter.on('user:login', (user) => {\n  console.log('Welcome ' + user.name);\n});\n \nemitter.once('app:ready', () => {\n  console.log('App ready - first time only');\n});\n \nemitter.emit('user:login', { name: 'Roee' });\n// Welcome Roee\n \nemitter.emit('app:ready'); // logs\nemitter.emit('app:ready'); // nothing - once already fired",
"howTo": "1. Name the pattern first: this is the Observer / Pub-Sub pattern — a central object that lets code subscribe to named events and fire them later.\n2. Describe the data shape before any code: a map from event name to a list of listener functions.\n3. Explain each method in one sentence: on adds a listener to that list, off removes one by reference, emit calls everyone in the list with the given arguments.\n4. Call out the one trap interviewers look for: if you loop over the listener array directly during emit, and a listener removes itself mid-loop, you skip the next one — so copy the array (slice) before looping.\n5. Explain once as a small twist on on: wrap the listener so the wrapper removes itself first, then calls the real listener — removing first avoids double-calls if emit fires again during that call.\n6. Mention the smaller trick of using Object.create(null) for the event map so event names like 'toString' don't collide with inherited Object properties.",
"dryRun": {
"input": "emitter.once('ready', fn); emitter.emit('ready'); emitter.emit('ready')",
"frames": [
"once('ready', fn) wraps fn in a wrapper function, then calls on('ready', wrapper). events['ready'] = [wrapper].",
"First emit('ready') runs. listeners.slice() copies the array, then loops and calls wrapper().",
"Inside wrapper, off('ready', wrapper) runs FIRST — this removes wrapper from events['ready'], deleting the now-empty list.",
"Then wrapper calls the real fn(). fn runs once.",
"Second emit('ready') runs. events['ready'] is undefined now, so emit returns false right away — fn does NOT run again."
],
"result": "fn runs exactly once, on the first emit"
},
"pitfalls": [
"Looping over the live listeners array during emit instead of a copy — a self-removing listener (like once) can make the next listener get skipped.",
"In once, calling the real listener BEFORE removing the wrapper — this can cause it to fire twice if it re-triggers emit.",
"Using a plain object {} instead of Object.create(null) — event names like 'constructor' could collide with inherited properties.",
"Removing a listener by matching a function's name instead of by reference — unreliable in JS."
],
"patternTakeaway": "If you see 'implement EventEmitter/on/off/emit', always think: store listeners in a map of arrays, copy the array with slice() before looping in emit, and make once remove itself before calling the listener.",
"pattern": "Design Patterns"
},
{
"id": "iv-ch1-q4",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "CRITICAL — most asked polyfill",
"question": "Implement debounce() with cancel and flush methods.",
"explanation": "Debounce delays running a function until X milliseconds pass with NO new calls. Every new call resets the timer.\nUsed for: search boxes, autosave, resize handlers.\nThe advanced version also adds:\n- cancel() — cancel any call that's still waiting to run.\n- flush() — run the waiting call right now, instead of waiting.\nImportant detail: use a regular function (not an arrow function) for the returned wrapper. That way it captures the correct `this` and can pass along the real arguments when it finally calls the original function.",
"code": "// Basic debounce\nfunction debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n \n// Advanced debounce with cancel and flush\nfunction debounce(fn, delay) {\n  let timer;\n  let lastArgs;\n  let lastThis;\n  \n  const debounced = function(...args) {\n    lastArgs = args;\n    lastThis = this;\n    clearTimeout(timer);\n    timer = setTimeout(() => {\n      fn.apply(lastThis, lastArgs);\n      lastArgs = lastThis = null;\n    }, delay);\n  };\n  \n  debounced.cancel = () => {\n    clearTimeout(timer);\n    lastArgs = lastThis = null;\n  };\n  \n  debounced.flush = () => {\n    if (lastArgs) {\n      clearTimeout(timer);\n      fn.apply(lastThis, lastArgs);\n      lastArgs = lastThis = null;\n    }\n  };\n  \n  return debounced;\n}\n \n// Usage:\nconst debouncedSearch = debounce(searchAPI, 300);\ninput.addEventListener('input', (e) => debouncedSearch(e.target.value));\n \n// Cancel pending search when user clicks elsewhere\ndocument.addEventListener('click', () => debouncedSearch.cancel());\n \n// Force search now (e.g. when user presses Enter)\nform.addEventListener('submit', () => debouncedSearch.flush());",
"howTo": "1. Give the one-line definition: debounce delays running a function until the calls stop for X milliseconds — every new call resets the clock.\n2. Give a real example out loud: a search box that only fires the API request after the user stops typing.\n3. Explain the mechanism in words: keep one timer in a closure, clear it on every new call, and start a fresh setTimeout each time.\n4. Point out the detail interviewers check for: use a regular function (not an arrow) for the returned wrapper, so it can capture the caller's this and forward the real arguments.\n5. If asked for the advanced version, add cancel (clear the pending timer) and flush (run the pending call immediately) by keeping the last arguments and this around in the closure.\n6. Common mistake to mention: forgetting to clear the previous timer before setting a new one, which would let old calls slip through.",
"dryRun": {
"input": "debounced = debounce(fn, 300); debounced('a'); 100ms later debounced('b'); then nothing else",
"frames": [
"debounced('a') runs. clearTimeout(undefined) does nothing. A new 300ms timer starts. lastArgs = ['a'].",
"100ms later, debounced('b') runs. clearTimeout cancels the first timer. lastArgs is now ['b']. A fresh 300ms timer starts.",
"No more calls happen. 300ms pass with no new call, so this second timer finally fires.",
"fn.apply(lastThis, ['b']) runs — fn is called once, with 'b'. lastArgs/lastThis reset to null."
],
"result": "fn('b') runs once, 300ms after the last call; fn('a') never runs"
},
"pitfalls": [
"Forgetting to clearTimeout the previous timer before setting a new one — old calls would slip through and run multiple times.",
"Using an arrow function for the wrapper — loses the caller's `this`.",
"cancel() forgetting to also clear lastArgs/lastThis, not just the timer.",
"flush() not checking whether there's actually a pending call before running fn."
],
"patternTakeaway": "If you see 'implement debounce', always think: one timer in a closure, clearTimeout on every call, setTimeout only fires after the calls stop.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch1-q5",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "CRITICAL — most asked polyfill",
"question": "Implement throttle(). Difference from debounce?",
"explanation": "Throttle makes sure a function runs at most once every X milliseconds, even if it's called much more often.\nUsed for: scroll handlers, mousemove, limiting API calls.\nDifference from debounce:\n- Debounce waits until the calls STOP for X ms.\n- Throttle runs on a steady schedule, no matter how often it's called.\nElevator door analogy: debounce is a door that only closes after nobody presses 'hold' for a while. Throttle is a door that checks its position every 200ms, no matter what.",
"code": "// Basic throttle (timestamp-based)\nfunction throttle(fn, limit) {\n  let lastCall = 0;\n  return function(...args) {\n    const now = Date.now();\n    if (now - lastCall >= limit) {\n      lastCall = now;\n      fn.apply(this, args);\n    }\n  };\n}\n \n// Advanced: trailing call (run once more after the last call)\nfunction throttle(fn, limit) {\n  let lastCall = 0;\n  let timer;\n  let lastArgs;\n  \n  return function(...args) {\n    const now = Date.now();\n    const remaining = limit - (now - lastCall);\n    lastArgs = args;\n    \n    if (remaining <= 0) {\n      // Enough time passed - run now\n      clearTimeout(timer);\n      timer = null;\n      lastCall = now;\n      fn.apply(this, args);\n    } else if (!timer) {\n      // Schedule a trailing call\n      timer = setTimeout(() => {\n        lastCall = Date.now();\n        timer = null;\n        fn.apply(this, lastArgs);\n      }, remaining);\n    }\n  };\n}\n \n// Usage:\nconst throttledScroll = throttle(() => {\n  console.log('scroll position:', window.scrollY);\n}, 200);\n \nwindow.addEventListener('scroll', throttledScroll);",
"howTo": "1. Give the one-line definition: throttle guarantees the function runs at most once every X milliseconds, no matter how often it's called.\n2. Immediately contrast it with debounce so the interviewer sees you know both: debounce waits for calls to stop, throttle runs on a steady schedule regardless of how often events fire.\n3. Use a real analogy to make it stick: an elevator door — throttle checks its position every 200ms no matter what, debounce only closes once nobody presses 'hold' for a while.\n4. Explain the basic mechanism: remember the last time you ran, and only run again once enough time has passed.\n5. Mention the upgrade if asked: add a 'trailing' call so the very last event during the throttle window still fires once time is up, using a timer alongside the timestamp check.\n6. Give one real use case so it feels grounded: scroll or mousemove handlers, where you want smooth-ish updates without overwhelming the browser.",
"dryRun": {
"input": "throttled = throttle(fn, 200); calls happen at t=0ms, t=50ms, t=100ms, t=250ms (relative time)",
"frames": [
"t=0: lastCall starts far in the past, so now-lastCall is huge, well over 200. Runs fn immediately. lastCall updates to t=0.",
"t=50: now-lastCall = 50-0 = 50, which is under 200. Call is skipped — fn does NOT run.",
"t=100: now-lastCall = 100-0 = 100, still under 200. Skipped again.",
"t=250: now-lastCall = 250-0 = 250, which is over 200. Runs fn. lastCall updates to 250."
],
"result": "fn runs at t=0 and t=250 only — twice total, not four times"
},
"pitfalls": [
"Mixing up throttle (guarantees a maximum call rate) with debounce (waits for calls to stop) — the most common confusion between the two.",
"The basic version drops the 'trailing' call — the last event in a burst may never run unless you add a trailing timer.",
"Not resetting lastCall correctly after the trailing call fires, which can make the next call fire too early.",
"Forgetting to pass along `this` and the arguments with apply when finally calling fn."
],
"patternTakeaway": "If you see 'implement throttle', always think: check elapsed time since lastCall against the limit — run immediately if enough time passed, otherwise (in the advanced version) schedule one trailing call.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch1-q6",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "CRITICAL — almost every interview",
"question": "Implement Promise.all() from scratch. What edge cases need handling?",
"explanation": "Promise.all() takes an array of promises. It returns ONE promise that:\n- Resolves when ALL of them succeed, with an array of all their results.\n- Rejects as soon as ONE of them fails — this is called 'fail-fast'.\nYou must handle these edge cases:\n- Empty array — resolve right away with [].\n- Values that are not promises, like plain numbers — wrap them with Promise.resolve so they still work.\n- The order of results must match the ORIGINAL input order, not the order they finish in.\n- If one fails, don't wait for the rest.\n- Use the INDEX to store each result, not just a counter, because a real result could be `undefined` and a simple counter alone wouldn't tell you if a slot is actually filled.",
"code": "function promiseAll(promises) {\n  return new Promise((resolve, reject) => {\n    if (!Array.isArray(promises)) {\n      return reject(new TypeError('Argument must be an array'));\n    }\n    \n    const results = [];\n    let completed = 0;\n    \n    if (promises.length === 0) return resolve([]);\n    \n    promises.forEach((p, index) => {\n      // Promise.resolve handles non-promise values\n      Promise.resolve(p)\n        .then(value => {\n          results[index] = value; // preserve order!\n          completed++;\n          if (completed === promises.length) {\n            resolve(results);\n          }\n        })\n        .catch(reject); // fail-fast\n    });\n  });\n}\n \n// Bonus: Promise.allSettled\nfunction allSettled(promises) {\n  return Promise.all(\n    promises.map(p =>\n      Promise.resolve(p)\n        .then(value => ({ status: 'fulfilled', value }))\n        .catch(reason => ({ status: 'rejected', reason }))\n    )\n  );\n}\n \n// Bonus: Promise.race\nfunction race(promises) {\n  return new Promise((resolve, reject) => {\n    promises.forEach(p => Promise.resolve(p).then(resolve, reject));\n  });\n}\n \n// Bonus: Promise.any (resolve on first success)\nfunction any(promises) {\n  return new Promise((resolve, reject) => {\n    const errors = [];\n    let rejected = 0;\n    promises.forEach((p, i) => {\n      Promise.resolve(p)\n        .then(resolve)\n        .catch(err => {\n          errors[i] = err;\n          rejected++;\n          if (rejected === promises.length) {\n            reject(new AggregateError(errors, 'All promises rejected'));\n          }\n        });\n    });\n  });\n}",
"howTo": "1. Say the contract first: Promise.all takes an array of promises and resolves with all their results once every one succeeds, or rejects immediately if any one fails.\n2. Describe the plan before coding: loop through the input once, attach a .then to each item, and count how many have finished.\n3. Call out the tricky part immediately: results must come back in the same order as the input, not in the order they finish — so store each result at its own index, not by pushing.\n4. List the edge cases out loud, since that's what interviewers are really testing: an empty array should resolve right away with [], and non-promise values (like a plain number) need to be wrapped with Promise.resolve so they still work.\n5. Mention why a counter is safer than checking array length: some results can be undefined, so counting completions is more reliable than checking if a slot 'looks filled'.\n6. If asked for bonus points, briefly describe how allSettled, race, and any differ from all in one sentence each.",
"dryRun": {
"input": "promiseAll([p0 (resolves 'A' after 300ms), p1 (resolves 'B' after 100ms)])",
"frames": [
"results = [], completed = 0. Loop starts: index 0 gets p0, index 1 gets p1. Both start running in parallel.",
"p1 finishes first, after 100ms, with 'B'. results[1] = 'B'. completed becomes 1 — not all done yet (need 2).",
"p0 finishes later, after 300ms, with 'A'. results[0] = 'A'. completed becomes 2.",
"completed === promises.length (2 === 2), so resolve(results). results is ['A', 'B'] — order matches the INPUT, not the finish order."
],
"result": "resolves with ['A', 'B']"
},
"pitfalls": [
"Pushing results with .push() instead of storing by index — breaks the required input order, since promises can finish out of order.",
"Forgetting to resolve immediately with [] for an empty input array — would hang forever waiting for completions.",
"Not wrapping plain, non-promise values with Promise.resolve — .then would crash on a number or string.",
"Not calling reject immediately on the first failure — waiting for all promises to settle instead of failing fast."
],
"patternTakeaway": "If you see 'implement Promise.all', always think: store each result by its index (not push), count completions, resolve when the count matches the length, reject immediately on the first failure.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch1-q7",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "CRITICAL — Lodash polyfills",
"question": "Implement Array.prototype.map, filter, and reduce from scratch.",
"explanation": "This is a classic test of how well you know these three built-in array methods.\nKey points:\n- The callback you pass gets (item, index, array) as arguments.\n- map and filter always return a brand NEW array — they never change the original.\n- reduce: if you don't pass a starting value, it uses the array's FIRST element as the starting accumulator, and starts looping from the second element.\n- Sparse arrays, meaning arrays with 'holes' like [1, , 3] — the real native methods skip the holes. Check with `i in this` to know if an index actually has a value.",
"code": "// MAP\nArray.prototype.myMap = function(callback, thisArg) {\n  if (typeof callback !== 'function') {\n    throw new TypeError(callback + ' is not a function');\n  }\n  const result = [];\n  for (let i = 0; i < this.length; i++) {\n    if (i in this) { // skip sparse holes\n      result[i] = callback.call(thisArg, this[i], i, this);\n    }\n  }\n  return result;\n};\n \n// FILTER\nArray.prototype.myFilter = function(callback, thisArg) {\n  const result = [];\n  for (let i = 0; i < this.length; i++) {\n    if (i in this && callback.call(thisArg, this[i], i, this)) {\n      result.push(this[i]);\n    }\n  }\n  return result;\n};\n \n// REDUCE\nArray.prototype.myReduce = function(callback, initialValue) {\n  if (this.length === 0 && arguments.length < 2) {\n    throw new TypeError('Reduce of empty array with no initial value');\n  }\n  \n  let acc;\n  let startIdx = 0;\n  \n  if (arguments.length >= 2) {\n    acc = initialValue;\n  } else {\n    // No initial value - take first existing element\n    while (startIdx < this.length && !(startIdx in this)) {\n      startIdx++;\n    }\n    acc = this[startIdx];\n    startIdx++;\n  }\n  \n  for (let i = startIdx; i < this.length; i++) {\n    if (i in this) {\n      acc = callback(acc, this[i], i, this);\n    }\n  }\n  \n  return acc;\n};\n \n// Tests:\n[1, 2, 3].myMap(x => x * 2);          // [2, 4, 6]\n[1, 2, 3, 4].myFilter(x => x > 2);    // [3, 4]\n[1, 2, 3].myReduce((a, b) => a + b, 0); // 6\n \n// Reduce without initial:\n[1, 2, 3].myReduce((a, b) => a + b); // 6 (1+2+3)\n[].myReduce((a, b) => a + b); // TypeError\n \n// Bonus: some/every\nArray.prototype.mySome = function(callback) {\n  for (let i = 0; i < this.length; i++) {\n    if (i in this && callback(this[i], i, this)) return true;\n  }\n  return false;\n};\n \nArray.prototype.myEvery = function(callback) {\n  for (let i = 0; i < this.length; i++) {\n    if (i in this && !callback(this[i], i, this)) return false;\n  }\n  return true;\n};",
"howTo": "1. Treat this as three small, separate polyfills, and explain each one's job first: map transforms each item into a new array, filter keeps only items that pass a test, reduce boils the array down to one value.\n2. Say the shared foundation out loud: all three loop over the array with a plain for-loop and call the given callback with (item, index, array).\n3. For reduce specifically, explain the one tricky rule: if no initial value is given, use the first element as the starting accumulator and start looping from the second element — and throw if the array is empty with no initial value.\n4. Mention the lesser-known edge case that shows real depth: sparse arrays (arrays with holes) are skipped by native methods, so check 'i in this' before processing each index.\n5. Common mistake to flag: map and filter must return a brand new array and never modify the original one.\n6. If time allows, mention some/every follow the same loop shape but return early as soon as they know the answer.",
"dryRun": {
"input": "[1, 2, 3].myReduce((a, b) => a + b, 0)",
"frames": [
"Two arguments were passed (callback + initialValue), so acc = 0, startIdx = 0.",
"i=0: 0 in this is true. acc = callback(0, 1) = 1.",
"i=1: acc = callback(1, 2) = 3.",
"i=2: acc = callback(3, 3) = 6. Loop ends since i=3 is not less than length."
],
"result": "return 6"
},
"pitfalls": [
"reduce on an empty array with NO initial value should throw a TypeError, not return undefined.",
"Forgetting map/filter must return a new array and never mutate the original.",
"For reduce without an initialValue, forgetting to start the loop from the SECOND element, since the first is already used as the starting accumulator.",
"Not skipping sparse array holes with `i in this`, letting `undefined` be treated as a real value."
],
"patternTakeaway": "If you see 'implement map/filter/reduce from scratch', always think: loop with a plain for-loop, call the callback with (item, index, array), and for reduce handle the missing-initialValue case by using the first element and throwing on an empty array.",
"pattern": "Arrays & Hashing"
},
{
"id": "iv-ch1-q8",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "COMMON — GreatFrontEnd classic",
"question": "Implement memoize() function.",
"explanation": "Memoization means: cache what a function returns, based on its arguments. If it's called again with the SAME arguments, return the cached answer instead of recalculating.\nKey decisions:\n- How do you turn the arguments into a cache key? JSON.stringify is the simple choice, but it's slow and breaks on circular objects.\n- For object arguments, a WeakMap can help avoid memory leaks.\n- You can add a cache size limit, called LRU (Least Recently Used), as a bonus feature.\n- Multiple arguments need to be combined into one key somehow — this is called serialization.",
"code": "// Basic version\nfunction memoize(fn) {\n  const cache = new Map();\n  return function(...args) {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) {\n      return cache.get(key);\n    }\n    const result = fn.apply(this, args);\n    cache.set(key, result);\n    return result;\n  };\n}\n \n// Usage:\nconst slowFib = (n) => n <= 1 ? n : slowFib(n-1) + slowFib(n-2);\nconst fastFib = memoize(function fib(n) {\n  if (n <= 1) return n;\n  return fib(n - 1) + fib(n - 2);\n});\n \n// Version with custom resolver (like Lodash)\nfunction memoize(fn, resolver) {\n  const cache = new Map();\n  const memoized = function(...args) {\n    const key = resolver ? resolver(...args) : args[0];\n    if (cache.has(key)) return cache.get(key);\n    const result = fn.apply(this, args);\n    cache.set(key, result);\n    return result;\n  };\n  memoized.cache = cache;\n  return memoized;\n}\n \n// LRU version - cache size limit\nfunction memoizeLRU(fn, maxSize = 100) {\n  const cache = new Map();\n  return function(...args) {\n    const key = JSON.stringify(args);\n    \n    if (cache.has(key)) {\n      // Move to end (most recent)\n      const value = cache.get(key);\n      cache.delete(key);\n      cache.set(key, value);\n      return value;\n    }\n    \n    const result = fn.apply(this, args);\n    cache.set(key, result);\n    \n    // If size exceeded, remove oldest\n    if (cache.size > maxSize) {\n      const firstKey = cache.keys().next().value;\n      cache.delete(firstKey);\n    }\n    \n    return result;\n  };\n}",
"howTo": "1. Give the one-line idea: memoize wraps a function so that if it's called again with the same arguments, it returns the cached result instead of recomputing.\n2. Explain the main design decision first, since that's what interviewers probe: you need a way to turn the arguments into a cache key — JSON.stringify is the simple default, but it's slow and breaks on things like circular objects or functions as args.\n3. Walk through the flow in order: build the key, check if it's in the cache, return the cached value if so, otherwise call the real function, store the result, then return it.\n4. Give a concrete use case: recursive functions like Fibonacci, where the same sub-calls repeat many times.\n5. Mention the upgrade if asked: unbounded caches can leak memory, so an LRU version caps the cache size and evicts the oldest entry when full.\n6. Common mistake to flag: using object identity or a naive key for object arguments — mention WeakMap as the fix when keys themselves are objects.",
"dryRun": {
"input": "fastFib = memoize(fib); fastFib(5) called, then fastFib(5) called again",
"frames": [
"First call fastFib(5): key = JSON.stringify([5]) = '[5]'. cache.has('[5]') is false.",
"result = fib(5) runs the real, slow, recursive computation. Say it computes 5.",
"cache.set('[5]', 5). Returns 5.",
"Second call fastFib(5): key = '[5]' again. This time cache.has('[5]') is true.",
"Returns cache.get('[5]') = 5 immediately — skips recomputing fib entirely."
],
"result": "second call returns 5 instantly from cache, no recursion runs"
},
"pitfalls": [
"Using JSON.stringify on arguments that include functions or circular references — will break or silently produce a wrong key.",
"Forgetting to preserve `this` with fn.apply(this, args) when calling the wrapped function.",
"Letting the cache grow forever with no size limit — a real memory leak in long-running apps.",
"Using object arguments as raw Map keys without serializing — two different objects with the same content get treated as different keys."
],
"patternTakeaway": "If you see 'implement memoize', always think: build a cache key from the arguments (JSON.stringify or a resolver), check the cache before calling the real function, and store the result after.",
"pattern": "Functions & this"
},
{
"id": "iv-ch1-q9",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "COMMON — Microsoft, Adobe",
"question": "Implement compose() and pipe().",
"explanation": "This is a functional programming idea.\ncompose(f, g, h)(x) runs f(g(h(x))) — RIGHT to LEFT, like reading math notation.\npipe(f, g, h)(x) runs h(g(f(x))) — LEFT to RIGHT, like reading a sentence.\npipe is usually easier to read because it matches the natural order we think about data flowing through steps.",
"code": "// COMPOSE - right to left\nconst compose = (...fns) =>\n  (initialValue) => fns.reduceRight((acc, fn) => fn(acc), initialValue);\n \n// PIPE - left to right\nconst pipe = (...fns) =>\n  (initialValue) => fns.reduce((acc, fn) => fn(acc), initialValue);\n \n// Usage:\nconst add10 = x => x + 10;\nconst double = x => x * 2;\nconst square = x => x * x;\n \nconst transform1 = compose(add10, double, square);\ntransform1(3);\n// square(3) = 9\n// double(9) = 18\n// add10(18) = 28\n \nconst transform2 = pipe(add10, double, square);\ntransform2(3);\n// add10(3) = 13\n// double(13) = 26\n// square(26) = 676\n \n// Real-world example:\nconst processUser = pipe(\n  validateInput,\n  normalizeEmail,\n  hashPassword,\n  saveToDatabase\n);\n \n// Async pipe\nconst asyncPipe = (...fns) =>\n  (initialValue) => fns.reduce(\n    (chain, fn) => chain.then(fn),\n    Promise.resolve(initialValue)\n  );\n \nconst saveUser = asyncPipe(\n  validateUser,    // sync\n  fetchEnrichment, // async\n  saveToDatabase   // async\n);",
"howTo": "1. Give the definitions side by side, since the whole question is about telling them apart: compose runs functions right to left, pipe runs them left to right.\n2. Use a phrase to lock in the direction: compose reads like math, f(g(h(x))); pipe reads like a sentence, do this then this then this.\n3. Explain the shared mechanism: both take a list of functions and combine them using reduce — compose uses reduceRight, pipe uses plain reduce — starting from an initial value and feeding each function's output into the next.\n4. Give a one-line opinion to show judgment: pipe is usually preferred in real code because it matches how people naturally read a left-to-right data flow.\n5. If asked to extend it, mention async pipe: same idea, but each step is chained with .then instead of a plain function call, so it works with functions that return promises.\n6. Common mistake to avoid: mixing up which direction each one runs — always double check with a tiny concrete example before answering.",
"dryRun": {
"input": "pipe(add10, double, square)(3), where add10=x+10, double=x*2, square=x*x",
"frames": [
"fns = [add10, double, square]. reduce starts with acc = 3, the initial value.",
"Step 1: acc = add10(3) = 13.",
"Step 2: acc = double(13) = 26.",
"Step 3: acc = square(26) = 676."
],
"result": "return 676"
},
"pitfalls": [
"Mixing up the direction — compose is right-to-left, pipe is left-to-right. Always double-check with a tiny example.",
"Using reduce instead of reduceRight, or the reverse — this silently reverses the execution order.",
"Forgetting these functions expect ONE argument that flows through the whole chain — each function's output becomes the next function's single input.",
"Trying to use pipe/compose directly with async functions without chaining with .then — a plain function call won't wait for a promise to resolve."
],
"patternTakeaway": "If you see 'implement compose or pipe', always think: reduce for pipe (left-to-right) or reduceRight for compose (right-to-left), feeding each function's output into the next.",
"pattern": "Functions & this"
},
{
"id": "iv-ch1-q10",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "COMMON — currying classic",
"question": "Implement curry() function.",
"explanation": "Currying turns a function that takes several arguments into a chain of functions that each take one, or a few, arguments at a time.\nWhy it's useful:\n- You can fix some arguments early, and fill in the rest later — this is called partial application.\n- It helps with composing functions together.\n- You can build specialized versions of a general function.\nf(a, b, c) becomes curry(f)(a)(b)(c) — but it should also work as curry(f)(a, b)(c), or curry(f)(a)(b, c).",
"code": "// Basic curry\nfunction curry(fn) {\n  return function curried(...args) {\n    if (args.length >= fn.length) {\n      return fn.apply(this, args);\n    }\n    return function(...moreArgs) {\n      return curried.apply(this, [...args, ...moreArgs]);\n    };\n  };\n}\n \nconst sum = (a, b, c) => a + b + c;\nconst curriedSum = curry(sum);\n \ncurriedSum(1, 2, 3);    // 6\ncurriedSum(1)(2)(3);    // 6\ncurriedSum(1, 2)(3);    // 6\ncurriedSum(1)(2, 3);    // 6\n \n// Real-world: partial application\nconst log = curry((level, msg, data) => \n  console.log('[' + level + '] ' + msg, data)\n);\n \nconst error = log('ERROR');\nconst warn = log('WARN');\n \nerror('Failed', { id: 123 });\nwarn('Slow', { duration: 5000 });\n \n// Bonus: curry with placeholder\nconst _ = Symbol('placeholder');\nfunction curryWithPlaceholder(fn) {\n  return function curried(...args) {\n    const hasPlaceholder = args.slice(0, fn.length).includes(_);\n    if (args.length >= fn.length && !hasPlaceholder) {\n      return fn.apply(this, args);\n    }\n    return function(...newArgs) {\n      const merged = args.map(a => \n        a === _ && newArgs.length ? newArgs.shift() : a\n      );\n      return curried.apply(this, [...merged, ...newArgs]);\n    };\n  };\n}\n \nconst greet = (greeting, name, punct) => greeting + ', ' + name + punct;\nconst curriedGreet = curryWithPlaceholder(greet);\ncurriedGreet('Hi', _, '!')('Roee'); // \"Hi, Roee!\"",
"howTo": "1. Give the one-line definition: currying turns a function that takes many arguments into a chain of functions that each take one (or a few) arguments at a time.\n2. Explain why it's useful before the code: it lets you fix some arguments early and reuse the rest later, which is great for building specialized versions of a general function.\n3. Describe the core trick: keep collecting arguments in a closure until you have as many as the original function expects (check against fn.length), then finally call the original function.\n4. Walk through the shape: if you have enough arguments, call the function; if not, return a new function that collects more arguments and tries again.\n5. Give a concrete example out loud, like a logging function curried by level, so you can create specialized 'error' and 'warn' loggers from one generic function.\n6. Mention as a bonus point: real curry implementations often support calling with multiple arguments at once too, not just one at a time.",
"dryRun": {
"input": "curriedSum = curry((a,b,c) => a+b+c); curriedSum(1)(2)(3)",
"frames": [
"curriedSum(1) calls curried(1). args=[1]. fn.length is 3. Is 1 >= 3? No. Returns a new function waiting for more args.",
"That function is called with (2). It calls curried.apply(this, [1, 2]). args=[1,2]. Is 2 >= 3? No. Returns another waiting function.",
"That function is called with (3). It calls curried.apply(this, [1,2,3]). args=[1,2,3]. Is 3 >= 3? Yes!",
"Calls fn.apply(this, [1,2,3]) = sum(1,2,3) = 6."
],
"result": "return 6"
},
"pitfalls": [
"Relying on fn.length to know how many arguments are expected — this breaks if the original function uses default parameters or rest parameters, since fn.length won't count them correctly.",
"Forgetting curry should support being called with multiple arguments at once, not just one at a time — curriedSum(1,2)(3) should also work.",
"Not preserving `this` when calling the inner functions with apply.",
"Confusing curry with partial application — curry always waits until it has ALL the arguments, it never runs early."
],
"patternTakeaway": "If you see 'implement curry', always think: keep collecting arguments in a closure, compare the count against fn.length, and only call the original function once you have enough — otherwise return another function to collect more.",
"pattern": "Functions & this"
},
{
"id": "iv-ch1-q11",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "COMMON — Promises advanced",
"question": "Implement promisify() — convert callback function to Promise.",
"explanation": "promisify() converts an old-style Node.js callback function into one that returns a Promise, so you can use it with async/await.\nNode.js callback style: fn(arg1, arg2, callback), and the callback follows an 'error-first' rule: callback(error, result).\nWatch out for:\n- Some callbacks return MORE than one result value after the error argument — a complete version should handle that.\n- Some functions don't follow the error-first pattern at all, like setTimeout — those need special handling and can't just be promisified generically.",
"code": "// Basic - error-first callbacks\nfunction promisify(fn) {\n  return function(...args) {\n    return new Promise((resolve, reject) => {\n      fn.call(this, ...args, (err, result) => {\n        if (err) reject(err);\n        else resolve(result);\n      });\n    });\n  };\n}\n \n// Usage:\nconst fs = require('fs');\nconst readFileAsync = promisify(fs.readFile);\nconst data = await readFileAsync('file.txt', 'utf8');\n \n// Version with multiple args support\nfunction promisify(fn) {\n  return function(...args) {\n    return new Promise((resolve, reject) => {\n      fn.call(this, ...args, (err, ...results) => {\n        if (err) reject(err);\n        else if (results.length === 1) resolve(results[0]);\n        else resolve(results);\n      });\n    });\n  };\n}\n \n// Common helper:\nconst sleep = (ms) => new Promise(r => setTimeout(r, ms));\nawait sleep(1000); // wait 1 second",
"howTo": "1. Give the one-line goal: promisify converts an old Node-style callback function into one that returns a Promise, so you can use it with async/await.\n2. Describe the pattern it's built around: Node callbacks are always called last and follow 'error first' — callback(err, result).\n3. Explain the trick in words: wrap the original function in a new function that returns a Promise, and inside that Promise, call the original function passing a callback that resolves on success or rejects if there's an error.\n4. Mention the small but real detail: forward all the original arguments first, then append your own callback at the end, since that's where Node expects it.\n5. Call out one edge case if asked: some callbacks pass back more than one result value after the error, so a fuller version should collect all of them, not just the first.\n6. Ground it with a real example: turning fs.readFile into something you can await, or building a sleep helper with setTimeout.",
"dryRun": {
"input": "readFileAsync = promisify(fs.readFile); await readFileAsync('file.txt', 'utf8')",
"frames": [
"readFileAsync('file.txt', 'utf8') is called. args = ['file.txt', 'utf8']. It returns a new Promise.",
"Inside the Promise, fn.call(this, 'file.txt', 'utf8', callback) runs — the callback is appended as the LAST argument, exactly where Node expects it.",
"fs.readFile does its work, then eventually calls callback(null, 'file contents here') — err is null, so there is no error.",
"Since err is null, which is falsy, resolve(result) runs with 'file contents here'."
],
"result": "the Promise resolves with 'file contents here'"
},
"pitfalls": [
"Forgetting the callback must be the LAST argument passed to fn — Node's convention depends on this.",
"Not checking `if (err)` before deciding to resolve or reject — always check the error first.",
"Only capturing the first result value when the callback actually returns multiple values after the error.",
"Assuming every callback-based function follows error-first — some, like setTimeout, don't, and blindly promisifying them behaves incorrectly."
],
"patternTakeaway": "If you see 'implement promisify', always think: return a function that wraps the call in `new Promise`, forwards all original arguments, and appends a callback that does `err ? reject(err) : resolve(result)`.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch1-q12",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "COMMON — Lodash polyfills",
"question": "Implement _.get() — safe access to nested properties.",
"explanation": "lodash's get() safely reads a deep, possibly-missing property from an object, without crashing. If the path doesn't exist, it returns a default value instead of throwing an error.\nIt supports:\n- A string path like 'user.address.street'.\n- An array path like ['user', 'address', 0, 'name'].\n- A default value for when the result is undefined.\n- Bracket notation like 'users[0].name'.\nThe modern native alternative is optional chaining: obj?.a?.b.",
"code": "function get(obj, path, defaultValue) {\n  // Normalize path to array\n  const keys = Array.isArray(path)\n    ? path\n    : path\n        .replace(/\\[(\\d+)\\]/g, '.$1') // a[0] -> a.0\n        .split('.')\n        .filter(Boolean);\n  \n  let result = obj;\n  for (const key of keys) {\n    if (result == null) return defaultValue;\n    result = result[key];\n  }\n  \n  return result === undefined ? defaultValue : result;\n}\n \n// Tests:\nconst user = {\n  name: 'Roee',\n  address: {\n    city: 'Netanya',\n    coords: { lat: 32.3, lng: 34.85 }\n  },\n  hobbies: ['gaming', 'running']\n};\n \nget(user, 'address.city');\n// 'Netanya'\n \nget(user, 'address.coords.lat');\n// 32.3\n \nget(user, 'address.unknown.deep', 'N/A');\n// 'N/A'\n \nget(user, 'hobbies[0]');\n// 'gaming'\n \nget(user, ['address', 'coords', 'lng']);\n// 34.85\n \n// Native alternative (ES2020):\nuser?.address?.coords?.lat;\nuser?.address?.unknown?.deep ?? 'N/A';\n \n// Bonus: _.set()\nfunction set(obj, path, value) {\n  const keys = Array.isArray(path) ? path : path.split('.');\n  let current = obj;\n  \n  for (let i = 0; i < keys.length - 1; i++) {\n    const key = keys[i];\n    if (!(key in current) || typeof current[key] !== 'object') {\n      current[key] = {};\n    }\n    current = current[key];\n  }\n  \n  current[keys[keys.length - 1]] = value;\n  return obj;\n}\n \nset(user, 'address.zip', '12345');\nset(user, 'preferences.theme', 'dark');",
"howTo": "1. Give the one-line goal: this function safely reads a deep, possibly-missing property from an object without throwing, and returns a default value if the path doesn't exist.\n2. Explain the first step of your plan: normalize the path into a list of keys, whether it was given as a string like 'a.b.c' or an array like ['a','b','c'] — and handle bracket notation like 'a[0]' by converting it to dots first.\n3. Describe the walk: start at the object and, for each key in the path, step one level deeper — but check at every step if the current value is null or undefined, and bail out to the default immediately if so.\n4. Call out the final subtlety: only fall back to the default if the final result is actually undefined, so real falsy values like 0 or '' are still returned correctly.\n5. Mention the modern alternative in one sentence: optional chaining (?.) plus the nullish coalescing operator (??) covers most simple cases natively now.\n6. If asked, describe _.set the same way but in reverse: walk the path building missing objects along the way, then assign the value at the last key.",
"dryRun": {
"input": "get(user, 'address.unknown.deep', 'N/A'), where user.address = {city:'Netanya'}",
"frames": [
"path 'address.unknown.deep' has no brackets, so it's split into keys = ['address', 'unknown', 'deep'].",
"result = user. Loop key='address': result is not null, so result = user.address = {city:'Netanya'}.",
"Loop key='unknown': result is not null, so result = result.unknown = undefined.",
"Loop key='deep': result (undefined) == null is true! Returns defaultValue right away, without even checking 'deep'."
],
"result": "return 'N/A'"
},
"pitfalls": [
"Not converting bracket notation like 'a[0]' to a usable key before splitting on dots — 'users[0].name' needs special handling.",
"Returning the default only when the whole path throws an error, instead of checking at EVERY step whether the current value is null or undefined.",
"Only checking `=== undefined` at the very end but forgetting a real falsy value like 0 or '' should still be returned correctly, not swapped for the default.",
"Confusing get's default-on-undefined behavior with default-on-any-falsy behavior — they are not the same thing."
],
"patternTakeaway": "If you see 'implement lodash get / safe deep access', always think: normalize the path into an array of keys, walk one key at a time checking for null/undefined at each step, and only use the default when the final value is undefined.",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch1-q13",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "COMMON — comparing structures",
"question": "Implement deepEqual() — compare two objects deeply.",
"explanation": "Shallow equal just uses ===. Deep equal compares the ENTIRE structure recursively, going inside nested objects and arrays.\nThings to watch out for:\n- Arrays vs plain objects should not be treated as equal even if their contents look similar.\n- null needs special handling.\n- NaN === NaN is normally false in JS, but in deepEqual it should count as equal, so it should return true.\n- Date objects should be compared by their time value.\n- RegExp objects should be compared by their pattern.\n- Functions are usually not compared deeply.\n- Circular references, an object that contains itself, can cause infinite recursion if not handled.",
"code": "function deepEqual(a, b) {\n  // Same reference\n  if (a === b) return true;\n  \n  // Handle NaN\n  if (a !== a && b !== b) return true;\n  \n  // null/undefined\n  if (a == null || b == null) return false;\n  \n  // Different types\n  if (typeof a !== typeof b) return false;\n  \n  // Primitives (already covered by ===)\n  if (typeof a !== 'object') return false;\n  \n  // Date\n  if (a instanceof Date && b instanceof Date) {\n    return a.getTime() === b.getTime();\n  }\n  \n  // RegExp\n  if (a instanceof RegExp && b instanceof RegExp) {\n    return a.toString() === b.toString();\n  }\n  \n  // Array vs Object check\n  if (Array.isArray(a) !== Array.isArray(b)) return false;\n  \n  // Different constructors\n  if (a.constructor !== b.constructor) return false;\n  \n  // Same number of keys\n  const keysA = Object.keys(a);\n  const keysB = Object.keys(b);\n  if (keysA.length !== keysB.length) return false;\n  \n  // Recursively check each key\n  for (const key of keysA) {\n    if (!keysB.includes(key)) return false;\n    if (!deepEqual(a[key], b[key])) return false;\n  }\n  \n  return true;\n}\n \n// Tests:\ndeepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }); // true\ndeepEqual({ a: { b: 1 } }, { a: { b: 1 } }); // true\ndeepEqual([1, [2, 3]], [1, [2, 3]]); // true\ndeepEqual(NaN, NaN); // true\ndeepEqual(null, null); // true\ndeepEqual({ a: 1 }, { a: '1' }); // false\ndeepEqual(new Date(2020), new Date(2020)); // true",
"howTo": "1. Give the one-line goal: deepEqual compares two values structurally, recursing into nested objects and arrays, instead of just checking reference equality.\n2. Start with the fast exits: if they're the same reference return true immediately, and handle the NaN special case (NaN !== NaN normally, but for deep equal it should count as equal).\n3. Handle special object types explicitly before generic objects: Date should compare by getTime(), RegExp by its string form, since a generic key-by-key comparison won't work for these.\n4. Explain the general recursive case: compare the number of keys, then check that every key exists in both objects and that its value is deepEqual too.\n5. Mention the trap interviewers listen for: don't forget to also check that both values are the same 'shape' — for example one being an array and the other a plain object should not be equal.\n6. If asked about limits, mention circular references need a way to track already-visited objects, otherwise deepEqual will recurse forever.",
"dryRun": {
"input": "deepEqual({a: {b: 1}}, {a: {b: 1}})",
"frames": [
"a !== b, since they're different objects, and neither is NaN, neither is null. typeof both is 'object'.",
"Not a Date, not a RegExp. Array.isArray(a) === Array.isArray(b), both false. Same constructor, Object.",
"keysA = ['a'], keysB = ['a']. Same length, 1.",
"Loop key='a': keysB includes 'a'. Recursively calls deepEqual(a.a, b.a), which is deepEqual({b:1}, {b:1}).",
"Inside that recursive call: same steps repeat, keysA=['b'], and it compares deepEqual(1, 1) — 1===1 is true, so that inner call returns true.",
"Back in the outer call, every key matched, so the loop finishes and it returns true."
],
"result": "return true"
},
"pitfalls": [
"Forgetting the special case for NaN — plain === says NaN !== NaN, but deepEqual should treat two NaNs as equal.",
"Not checking Array.isArray on both sides — an array and a plain object with the same numeric keys should NOT be considered equal.",
"Comparing only keysA.length === keysB.length without checking every key in keysA actually EXISTS in b — this misses the case where b has different key names but the same count.",
"No protection against circular references, an object referencing itself — this causes infinite recursion and a stack overflow."
],
"patternTakeaway": "If you see 'implement deepEqual', always think: handle NaN and null as special fast-path cases, special-case Date and RegExp, then recursively compare keys and values for generic objects and arrays.",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch1-q14",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "COMMON — Lodash chunk",
"question": "Implement chunk() — split array into groups of size N.",
"explanation": "chunk() splits one array into smaller arrays, called chunks, of a fixed size. If the array doesn't divide evenly, the last chunk is just smaller.\nExample: chunk([1,2,3,4,5], 2) becomes [[1,2],[3,4],[5]].\nUsed for: pagination, processing data in batches, laying items out in a grid.",
"code": "function chunk(arr, size) {\n  if (size < 1) return [];\n  \n  const result = [];\n  for (let i = 0; i < arr.length; i += size) {\n    result.push(arr.slice(i, i + size));\n  }\n  return result;\n}\n \nchunk([1, 2, 3, 4, 5], 2);\n// [[1, 2], [3, 4], [5]]\n \nchunk(['a', 'b', 'c', 'd'], 3);\n// [['a', 'b', 'c'], ['d']]\n \n// Alternative with reduce\nconst chunk2 = (arr, size) =>\n  arr.reduce((chunks, item, index) => {\n    const chunkIndex = Math.floor(index / size);\n    if (!chunks[chunkIndex]) chunks[chunkIndex] = [];\n    chunks[chunkIndex].push(item);\n    return chunks;\n  }, []);\n \n// Bonus: groupBy (Lodash)\nfunction groupBy(arr, keyOrFn) {\n  const getKey = typeof keyOrFn === 'function' \n    ? keyOrFn \n    : item => item[keyOrFn];\n  \n  return arr.reduce((groups, item) => {\n    const key = getKey(item);\n    if (!groups[key]) groups[key] = [];\n    groups[key].push(item);\n    return groups;\n  }, {});\n}\n \ngroupBy([\n  { age: 30, name: 'A' },\n  { age: 30, name: 'B' },\n  { age: 25, name: 'C' }\n], 'age');\n// { 30: [{age:30,name:'A'},{age:30,name:'B'}], 25: [{age:25,name:'C'}] }",
"howTo": "1. Give the one-line goal: chunk splits one array into smaller arrays of a fixed size, with any leftover items in the last group.\n2. Say the core idea before code: step through the array in jumps of 'size' instead of one at a time, and slice out each group.\n3. Walk through it simply: loop with the index increasing by size each time, and each loop grabs arr.slice(i, i + size).\n4. Mention a real use case so it doesn't feel abstract: paginating a list, or laying items out in a grid of fixed columns.\n5. If asked for an alternative, mention doing it with reduce: for each item, figure out which chunk index it belongs to (Math.floor(index / size)) and push it there.\n6. Common mistake to flag: forgetting the last group can be smaller than 'size' if the array length isn't a clean multiple.",
"dryRun": {
"input": "chunk([1,2,3,4,5], 2)",
"frames": [
"i=0: result.push(arr.slice(0, 2)) = [1,2]. result = [[1,2]].",
"i becomes 2 (i += size): result.push(arr.slice(2, 4)) = [3,4]. result = [[1,2],[3,4]].",
"i becomes 4: result.push(arr.slice(4, 6)) = [5] — slice just returns whatever is left, only 1 item. result = [[1,2],[3,4],[5]].",
"i becomes 6: loop condition i < arr.length (6 < 5) is false. Loop ends."
],
"result": "return [[1,2],[3,4],[5]]"
},
"pitfalls": [
"Forgetting the last chunk can be smaller than 'size' when the array length isn't a clean multiple.",
"Not handling size < 1 — should return [] instead of looping forever or crashing.",
"Pushing items one at a time instead of slicing ranges — much slower and easier to get the grouping logic wrong.",
"Off-by-one in the slice end index — it should be i + size, not i + size - 1."
],
"patternTakeaway": "If you see 'implement chunk', always think: step through the array with a loop incrementing by `size`, and slice out arr.slice(i, i+size) each time.",
"pattern": "Arrays & Hashing"
},
{
"id": "iv-ch1-q15",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "COMMON — Lodash flatten",
"question": "Implement flatten() for deeply nested arrays.",
"explanation": "flatten() turns an array with arrays nested inside arrays, at any depth, into one single flat list.\nExample: [1, [2, [3, [4, 5]]]] becomes [1, 2, 3, 4, 5].\nThree ways to do it:\n1. arr.flat(Infinity) — the simple native built-in method.\n2. Recursion — for each item, if it's an array, flatten it and merge the result in; otherwise just add it.\n3. Stack-based loop — avoids stack overflow errors on very deeply nested arrays.",
"code": "const nested = [1, [2, [3, [4, 5]]], 6, [7, [8]]];\n \n// 1. Native (ES2019)\nconst flat1 = nested.flat(Infinity);\n \n// 2. Recursive\nfunction flatten(arr) {\n  return arr.reduce((acc, item) => {\n    return acc.concat(Array.isArray(item) ? flatten(item) : item);\n  }, []);\n}\n \n// 3. Iterative (stack-safe)\nfunction flattenIter(arr) {\n  const stack = [...arr];\n  const result = [];\n  while (stack.length) {\n    const item = stack.pop();\n    if (Array.isArray(item)) {\n      stack.push(...item);\n    } else {\n      result.push(item);\n    }\n  }\n  return result.reverse();\n}\n \n// 4. With depth control\nfunction flattenDepth(arr, depth = 1) {\n  return depth > 0\n    ? arr.reduce((acc, item) => \n        acc.concat(Array.isArray(item) ? flattenDepth(item, depth - 1) : item), []\n      )\n    : arr.slice();\n}\n \n// 5. flatMap (ES2019)\n[[1, 2], [3, 4]].flatMap(x => x); // [1, 2, 3, 4]\n// flatMap = map + flat(1) in one call",
"howTo": "1. Give the one-line goal: flatten takes an array with arrays nested inside arrays, at any depth, and turns it into one flat list.\n2. Mention the fast, native answer first, since interviewers like seeing you know it: arr.flat(Infinity) does this natively in modern JS.\n3. Then explain how you'd build it by hand: for each item, if it's an array, recursively flatten it and merge the result in; if it's not, just add it directly.\n4. Bring up the interesting follow-up before being asked: deep recursion can blow the call stack on very deeply nested input, so mention an iterative version using your own stack (push nested arrays' items back onto the stack instead of recursing).\n5. Mention flatMap as a related, smaller tool: it's just map followed by a flatten of one level, useful when each item maps to zero or more items.\n6. Common mistake to avoid: confusing 'flatten one level' with 'flatten all levels' — always clarify which one is being asked for.",
"dryRun": {
"input": "flatten([1, [2, [3]], 4])",
"frames": [
"reduce starts with acc = []. item=1: not an array, so acc.concat(1) gives [1].",
"item=[2,[3]]: this is an array! Recursively calls flatten([2,[3]]).",
"Inside that recursive call: item=2 gives acc=[2]. item=[3] is an array, so it recursively flattens [3] into [3]. acc.concat([3]) gives [2,3]. Returns [2,3].",
"Back in the outer call: acc.concat([2,3]) gives [1,2,3].",
"item=4: not an array, so acc.concat(4) gives [1,2,3,4]."
],
"result": "return [1,2,3,4]"
},
"pitfalls": [
"Confusing 'flatten one level' with 'flatten ALL levels' — always clarify which one is being asked, since flat(1) and flat(Infinity) behave very differently.",
"Deep recursion on very deeply nested arrays can hit a 'Maximum call stack size exceeded' error — mention the iterative, stack-based version as the fix.",
"Using the iterative stack version but forgetting to reverse the result at the end — pushing and popping from a stack naturally reverses the order.",
"Forgetting flatMap is map plus flat(1) combined, not flat(Infinity) — it only flattens one level."
],
"patternTakeaway": "If you see 'implement flatten for nested arrays', always think: for each item, concat it directly if it's not an array, or recursively flatten it first if it is — and mention the native arr.flat(Infinity) as the quick answer.",
"pattern": "Arrays & Hashing"
},
{
"id": "iv-ch1-q16",
"guide": "Interview Guide",
"topic": "Critical Polyfills",
"topicNum": 1,
"level": "Medium",
"badge": "COMMON — Promise edge case",
"question": "Implement deepClone() with circular reference handling.",
"explanation": "deepClone() makes a completely independent copy of an object. Changing the copy should never change the original, even for deeply nested data.\nThe quick shortcut JSON.parse(JSON.stringify(obj)) has serious problems:\n- It loses functions, undefined values, and Symbols.\n- Date objects turn into plain strings.\n- Circular references, an object referencing itself, throw an error.\n- It loses Map, Set, and RegExp.\n- It loses the prototype.\nModern fix: structuredClone() — a native browser and Node function, from 2022, that handles most of this correctly.\nFor a manual version, use a WeakMap to remember objects you've already cloned. This solves circular references, because if you meet the same object again, you reuse the clone instead of copying it forever.",
"code": "// Modern (recommended)\nconst clone = structuredClone(obj);\n// Supports: Date, Map, Set, RegExp, Blob, ArrayBuffer\n// Doesn't support: functions, DOM nodes\n \n// Manual - complete\nfunction deepClone(obj, hash = new WeakMap()) {\n  // primitives and null\n  if (obj === null || typeof obj !== 'object') return obj;\n  \n  // circular reference - critical!\n  if (hash.has(obj)) return hash.get(obj);\n  \n  // Date\n  if (obj instanceof Date) return new Date(obj);\n  \n  // RegExp\n  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);\n  \n  // Array\n  if (Array.isArray(obj)) {\n    const arr = [];\n    hash.set(obj, arr);\n    obj.forEach((item, i) => { arr[i] = deepClone(item, hash); });\n    return arr;\n  }\n  \n  // Map\n  if (obj instanceof Map) {\n    const map = new Map();\n    hash.set(obj, map);\n    obj.forEach((v, k) => map.set(deepClone(k, hash), deepClone(v, hash)));\n    return map;\n  }\n  \n  // Set\n  if (obj instanceof Set) {\n    const set = new Set();\n    hash.set(obj, set);\n    obj.forEach(v => set.add(deepClone(v, hash)));\n    return set;\n  }\n  \n  // Object - preserve prototype\n  const cloned = Object.create(Object.getPrototypeOf(obj));\n  hash.set(obj, cloned);\n  Object.keys(obj).forEach(key => {\n    cloned[key] = deepClone(obj[key], hash);\n  });\n  return cloned;\n}\n \n// Test circular:\nconst a = { name: 'test' };\na.self = a; // circular!\nconst clone = deepClone(a); // works\nconsole.log(clone.self === clone); // true",
"howTo": "1. Give the one-line goal: deepClone makes a full independent copy of an object, so changing the copy never changes the original, even for nested data.\n2. Mention the common shortcut and immediately explain why it's risky: JSON.parse(JSON.stringify(obj)) works for simple data but silently drops functions and undefined, turns Dates into strings, and crashes on circular references.\n3. Mention the modern native fix in one line: structuredClone() handles Dates, Maps, Sets, and circular references correctly, and should be your default answer today.\n4. If asked to write it by hand, explain the core trick: recurse through the object, but keep a WeakMap of objects you've already cloned, so if you hit the same object again (a circular reference) you reuse the clone instead of looping forever.\n5. Walk through the type-by-type handling briefly: primitives and null return as-is, Dates and RegExps get reconstructed, Arrays/Maps/Sets get rebuilt with their cloned contents, and plain objects get their keys cloned one by one.\n6. Common mistake to flag: registering the new empty clone in the WeakMap before recursing into its children, not after — otherwise the circular reference check comes too late.",
"dryRun": {
"input": "a = {name:'test'}; a.self = a; clone = deepClone(a)",
"frames": [
"deepClone(a, hash=new WeakMap()) starts. a is an object, and hash.has(a) is false — this is the first time seeing it.",
"Not a Date, RegExp, Array, Map, or Set — it's a plain object. Creates cloned = Object.create(Object.getPrototypeOf(a)), an empty object with the same prototype.",
"IMPORTANT: hash.set(a, cloned) happens NOW, before recursing into keys — this registers the clone before going deeper.",
"Loop key='name': cloned.name = deepClone('test', hash) = 'test', a primitive returned as-is.",
"Loop key='self': cloned.self = deepClone(a, hash). This time hash.has(a) is TRUE, since it was registered in the earlier step, so it just returns hash.get(a) = cloned — no infinite loop.",
"Returns cloned. cloned.self === cloned is true, just like the original circular reference."
],
"result": "clone.self === clone is true, no crash"
},
"pitfalls": [
"Registering the new clone in the WeakMap AFTER recursing into its children instead of BEFORE — this is the classic bug that causes infinite recursion on circular references.",
"Treating JSON.parse(JSON.stringify()) as a 'complete' solution without mentioning it breaks on Dates, functions, undefined, circular references, Maps and Sets.",
"Forgetting to clone Date, RegExp, Map, and Set specially — treating them like plain objects loses their real behavior.",
"Losing the prototype by cloning into a plain {} instead of Object.create(Object.getPrototypeOf(obj))."
],
"patternTakeaway": "If you see 'implement deepClone with circular references', always think: use a WeakMap to track already-cloned objects, and register the clone in the WeakMap BEFORE recursing into its children.",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch2-q1",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "CRITICAL — every interview",
"question": "Explain closures. Show a real React bug caused by stale closures.",
"explanation": "A closure is a function that remembers the variables around it, even after the outer function has already finished running. Closures are useful for: keeping private data, building functions that create other functions, currying (splitting a function into smaller steps), and event handlers. A common bug in React is called a \"stale closure.\" This happens when a useEffect or setTimeout keeps using an OLD value of state, instead of the newest one.",
"code": "// 1. Basic closure - private state\nfunction createCounter() {\n  let count = 0; // private!\n  return {\n    increment: () => ++count,\n    decrement: () => --count,\n    get: () => count\n  };\n}\nconst c = createCounter();\nc.increment(); c.increment();\nconsole.log(c.get()); // 2\nconsole.log(c.count); // undefined - not accessible!\n \n// 2. Stale closure in React (BUG!)\nfunction Timer() {\n  const [count, setCount] = useState(0);\n  \n  useEffect(() => {\n    const id = setInterval(() => {\n      console.log(count); // always 0! - stale closure\n      setCount(count + 1); // bug - always setCount(0+1)\n    }, 1000);\n    return () => clearInterval(id);\n  }, []); // [] = run once, count \"frozen\" at 0\n  \n  return <div>{count}</div>;\n}\n \n// 3. FIX - functional update\nuseEffect(() => {\n  const id = setInterval(() => {\n    setCount(prev => prev + 1); // always gets current value\n  }, 1000);\n  return () => clearInterval(id);\n}, []);\n \n// 4. FIX - useRef to track value\nconst countRef = useRef(count);\nuseEffect(() => { countRef.current = count; });\nuseEffect(() => {\n  const id = setInterval(() => {\n    console.log(countRef.current); // always updated!\n  }, 1000);\n  return () => clearInterval(id);\n}, []);",
"howTo": "1. Start with a one-sentence definition: a function remembers the variables from where it was created, even after the outer function has already finished running.\n2. Give a tiny example out loud, like a counter function that returns an increment function which still remembers a private count variable no one outside can touch.\n3. Connect it to a real bug: in React, a useEffect or setTimeout callback can capture an old value of state from the render it was created in — this is a 'stale closure'.\n4. Walk through why it happens: the effect ran once with count = 0, so its callback closed over that particular 0 forever, even though state changed later.\n5. Mention the fixes in order of how commonly they're used: use the functional form of setState (prev => prev + 1) so you don't need the stale variable at all, or use a ref that always points to the latest value.\n6. Common mistake to avoid: assuming adding the variable to the dependency array always fixes it — sometimes it just means the effect re-runs more often, which has its own tradeoffs.",
"dryRun": {
"input": "const c = createCounter(); c.increment(); c.increment(); c.get();",
"frames": [
"createCounter() runs. It creates a private variable count = 0 inside its own scope.",
"It returns an object with three functions. Each function still has access to that same count variable — this connection is the closure.",
"c.increment() runs. It increases count from 0 to 1.",
"c.increment() runs again. count goes from 1 to 2.",
"c.get() runs. It reads count and returns 2. Nothing outside can touch count directly (c.count is undefined)."
],
"result": "c.get() returns 2, and c.count is undefined"
},
"pitfalls": [
"Forgetting that useEffect(() => {...}, []) with an empty array only runs once, so any state it reads inside stays \"frozen\" at its initial value forever.",
"Thinking adding a variable to the dependency array always fixes stale closures — it just makes the effect re-run more often, which can cause other issues.",
"Confusing \"this\" scoping with closures — closures are about remembered variables, not about \"this\"."
],
"patternTakeaway": "If you see a function using an old value of state or a variable inside a callback (setTimeout, setInterval, useEffect), always think: stale closure — the function remembers the value from when it was created, not the current one.",
"pattern": "Closures & Scope"
},
{
"id": "iv-ch2-q2",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "CRITICAL — Google, Airbnb",
"question": "What gets logged? Explain the Event Loop step by step.",
"explanation": "The output order is: 1, 4, 3, 2. Here is why: \"1\" runs right away because it is normal code. setTimeout (even with a 0ms delay) does not run right away — it waits in the macrotask queue. Promise.then does not run right away either — it waits in the microtask queue. \"4\" runs right away too, just like \"1.\" Now the normal code is finished, so the Event Loop looks at the queues. It always checks microtasks first, so \"3\" runs. Only after all microtasks are done does the Event Loop run the macrotask, so \"2\" runs last. Golden rule: microtasks always run before macrotasks.",
"code": "console.log('1');\n \nsetTimeout(() => console.log('2'), 0);\n \nPromise.resolve().then(() => console.log('3'));\n \nconsole.log('4');\n \n// Output: 1, 4, 3, 2\n \n// Follow-up - new microtasks added during a microtask:\nconsole.log('start');\nPromise.resolve().then(() => {\n  console.log('a');\n  Promise.resolve().then(() => console.log('b'));\n});\nsetTimeout(() => console.log('timeout'));\nconsole.log('end');\n \n// Output: start, end, a, b, timeout\n// All microtasks run, including new ones created inside microtask!\n \n// Harder question - async/await:\nasync function foo() {\n  console.log('1');\n  await Promise.resolve();\n  console.log('2'); // microtask\n}\nconsole.log('3');\nfoo();\nconsole.log('4');\n// Output: 3, 1, 4, 2\n// \"1\" sync inside foo\n// After await -> rest of function becomes microtask",
"howTo": "1. Say the golden rule first, since it answers most of these questions: synchronous code always runs first, then all microtasks run, and only after the microtask queue is empty does one macrotask run.\n2. Classify each line before predicting output: plain console.log lines are synchronous, setTimeout goes to the macrotask queue, and Promise.then goes to the microtask queue.\n3. Walk through it in the order the engine actually executes: run all synchronous code top to bottom first, then drain the entire microtask queue (even new microtasks created during this drain), then run one macrotask.\n4. Point out the follow-up trap: a microtask that schedules another microtask still runs before any macrotask — the microtask queue is fully drained before moving on.\n5. For async/await specifically, explain the reframe: code before the first await runs synchronously, and everything after an await is essentially wrapped in a .then, so it becomes a microtask.\n6. If unsure while live, simplify by labeling each line 'sync', 'microtask', or 'macrotask' before writing the output order.",
"dryRun": {
"input": "console.log('1'); setTimeout(()=>console.log('2'),0); Promise.resolve().then(()=>console.log('3')); console.log('4');",
"frames": [
"Line 1 runs now: logs '1'. Normal (sync) code runs immediately.",
"setTimeout is called. Its callback does not run now — it goes into the macrotask queue to run later.",
"Promise.resolve().then(...) is called. Its callback does not run now — it goes into the microtask queue.",
"Line 4 runs now: logs '4'. This is the last line of sync code.",
"The call stack is empty now. The Event Loop checks the microtask queue first and runs it: logs '3'.",
"The microtask queue is empty now. The Event Loop finally runs the macrotask queue: logs '2'."
],
"result": "Console shows: 1, 4, 3, 2"
},
"pitfalls": [
"setTimeout(fn, 0) does NOT run immediately — it still waits for all sync code and all microtasks to finish first.",
"A microtask that creates a new microtask (like a nested .then) still runs before any macrotask — the whole microtask queue gets fully drained first.",
"In async/await, code before the first await runs synchronously; everything after await behaves like a .then callback (a microtask)."
],
"patternTakeaway": "If you see \"what gets logged\" with setTimeout and Promises mixed together, always think: sync code first, then all microtasks (Promises), then macrotasks (setTimeout) in order.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch2-q3",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "CRITICAL — Microsoft, Google",
"question": "What is the difference between var, let, const? Explain Hoisting and TDZ.",
"explanation": "var: Function-scoped, not block-scoped. It is hoisted and starts as undefined. You can redeclare it. let: Block-scoped. It is hoisted but sits in the TDZ, so you cannot use it before its declaration line. You cannot redeclare it in the same scope. const: Works like let, but you cannot reassign it. Note: if it holds an object or array, the contents can still change — only the variable itself is locked. TDZ (Temporal Dead Zone): the time between entering a scope and reaching the actual declaration line. If you try to use the variable during this time, you get a ReferenceError.",
"code": "// var hoisting\nconsole.log(a); // undefined (not error!)\nvar a = 5;\n \n// let TDZ\nconsole.log(b); // ReferenceError\nlet b = 5;\n \n// var function scope\nfor (var i = 0; i < 3; i++) {}\nconsole.log(i); // 3 - \"leaks\"\n \n// let block scope\nfor (let j = 0; j < 3; j++) {}\nconsole.log(j); // ReferenceError\n \n// const reassignment\nconst arr = [1, 2, 3];\narr.push(4);   // OK - mutating, not reassigning\narr = [];      // TypeError\n \nconst obj = { a: 1 };\nobj.b = 2;     // OK\nobj = {};      // TypeError\n \n// Object.freeze for true immutability\nconst frozen = Object.freeze({ a: 1 });\nfrozen.a = 2;  // silent fail (sloppy mode)\n \n// Function declarations vs expressions\nfoo(); // 'foo' - hoisted with body\nfunction foo() { return 'foo'; }\n \nbar(); // TypeError - var bar is undefined\nvar bar = function() { return 'bar'; };\n \nbaz(); // ReferenceError - TDZ\nlet baz = function() { return 'baz'; };",
"howTo": "1. Compare all three side by side instead of one at a time — that structure alone shows you understand the question: var is function-scoped, let and const are block-scoped, and const additionally can't be reassigned.\n2. Explain hoisting for var first, since it's the most surprising: var declarations are hoisted and initialized to undefined, so reading them early gives undefined, not an error.\n3. Explain the Temporal Dead Zone next as the let/const version of hoisting: the variable exists from the start of the block, but touching it before its declaration line throws a ReferenceError.\n4. Clarify the const nuance people get wrong: const stops you from reassigning the variable itself, but if it holds an object or array, the contents can still be mutated — mention Object.freeze if true immutability is asked.\n5. Give a tiny concrete example for each, like a for-loop with var leaking i outside the loop versus let keeping it scoped to the loop body.\n6. If asked to code it, start with the var hoisting example since it's the most common 'gotcha' one to demonstrate live.",
"dryRun": {
"input": "for (var i=0;i<3;i++){} console.log(i);   //  vs   for (let j=0;j<3;j++){} console.log(j);",
"frames": [
"var i is created with function/global scope, hoisted before the loop even starts.",
"The loop runs: i becomes 0, 1, 2, then 3 when the condition fails and the loop stops.",
"console.log(i) runs after the loop. Since var is not block-scoped, i still exists outside the loop and equals 3.",
"Now the let version: let j is created fresh for each loop iteration, scoped only to the loop's block.",
"console.log(j) runs after the loop. Since j only exists inside the loop's block, this line throws a ReferenceError."
],
"result": "console.log(i) logs 3; console.log(j) throws ReferenceError"
},
"pitfalls": [
"var read before its declaration gives undefined (no error), but let/const read before declaration throws a ReferenceError (TDZ).",
"const does not make objects/arrays immutable — you can still push to a const array or change a const object's properties, just not reassign the variable itself.",
"Function declarations are hoisted with their whole body, but function expressions assigned to var/let are not — calling them before that line throws an error or gives undefined."
],
"patternTakeaway": "If you see a variable behaving differently outside vs inside a loop, always think: var leaks out of the block, let/const stay trapped inside it.",
"pattern": "Closures & Scope"
},
{
"id": "iv-ch2-q4",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "CRITICAL — Google, Meta",
"question": "How does \"this\" work in JavaScript? Compare arrow vs regular functions.",
"explanation": "\"this\" depends on HOW a function is called, not where you wrote it. 1. Method call — obj.method() → this is obj. 2. Standalone call — fn() → this is undefined (strict mode) or window (non-strict). 3. With new — new Constructor() → this is the new object. 4. .call/.apply/.bind — this is whatever you pass as the first argument. 5. Arrow function — this comes from the surrounding code (lexical), no matter how you call it. In DOM events, this is normally the element the listener is on — but not if you use an arrow function.",
"code": "const obj = {\n  name: 'Roee',\n  regular: function() { console.log(this.name); },\n  arrow: () => console.log(this.name),\n};\n \nobj.regular();    // 'Roee' (this = obj)\nobj.arrow();      // undefined (this = global, lexical)\n \nconst fn = obj.regular;\nfn();             // undefined (standalone, strict mode)\n \nfn.call(obj);     // 'Roee' (this = obj)\n \n// Classic bug:\nclass Button {\n  constructor() { this.count = 0; }\n  \n  // BUG - this is lost in callback\n  handleClick() {\n    setTimeout(function() {\n      this.count++; // this = window!\n    }, 100);\n  }\n  \n  // FIX 1 - arrow function (lexical this)\n  handleClick() {\n    setTimeout(() => {\n      this.count++; // this = instance\n    }, 100);\n  }\n  \n  // FIX 2 - bind\n  handleClick() {\n    setTimeout(function() {\n      this.count++;\n    }.bind(this), 100);\n  }\n  \n  // FIX 3 - save in variable\n  handleClick() {\n    const self = this;\n    setTimeout(function() {\n      self.count++;\n    }, 100);\n  }\n}\n \n// React: why bind in old class components?\nclass App extends React.Component {\n  constructor() {\n    super();\n    this.handleClick = this.handleClick.bind(this); // needed!\n  }\n  handleClick() { console.log(this.props); }\n}",
"howTo": "1. Start with the core rule: 'this' is decided by how a function is called, not where it's written — that single sentence answers most of the follow-up questions.\n2. List the call patterns briefly in order of how commonly they come up: calling as obj.method() makes this the object, calling a bare function makes this undefined or global, and using new makes this the new instance.\n3. Explain arrow functions as the exception to that whole rule: they don't have their own this — they just use whatever this was in the surrounding code when they were defined.\n4. Use the classic bug as your example: a regular function passed to setTimeout loses its this (it becomes the global object), while an arrow function keeps this pointing at the class instance because it's defined inside the method.\n5. Mention the historical connection to React: this is exactly why class components used to bind their event handlers in the constructor, before hooks and function components made this less of an issue.\n6. If asked to fix broken code live, offer the three standard fixes in order of preference: use an arrow function, use .bind(this), or save this in a variable like self before the callback.",
"dryRun": {
"input": "const obj = {name:'Roee', regular(){return this.name}, arrow:()=>this.name}; obj.regular(); obj.arrow();",
"frames": [
"obj.regular() is called as a method — this is set to obj, so this.name is 'Roee'.",
"obj.arrow() is called — but arrow functions ignore how they are called. They use 'this' from where they were WRITTEN, which is the top level (global), so this.name is undefined.",
"Now: const fn = obj.regular; fn(); — this call is 'standalone' (not obj.something()), so this is undefined in strict mode.",
"fn.call(obj) forces this to be obj, so this.name is 'Roee' again."
],
"result": "obj.regular() -> 'Roee', obj.arrow() -> undefined, fn() -> undefined, fn.call(obj) -> 'Roee'"
},
"pitfalls": [
"Arrow functions do not have their own 'this' — they always borrow it from the surrounding scope where they were defined, not from where they are called.",
"Passing a regular function as a callback (like to setTimeout) loses its 'this' — it becomes the global object or undefined, not the object it came from.",
"Copying a method into a plain variable (const fn = obj.method) and calling it alone loses the object context."
],
"patternTakeaway": "If you see 'this' inside a callback or setTimeout, always think: was it an arrow function (keeps the outer this) or a regular function (this becomes global/undefined unless bound)?",
"pattern": "Functions & this"
},
{
"id": "iv-ch2-q5",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "CRITICAL — Atlassian, Coupang interview classic",
"question": "What does this output? \"this\" inside nested setTimeout.",
"explanation": "This is a classic interview question. Output: \"Crocodile\" then \"Sunglasses.\" Why: data.getStatus() is called as a normal method, so this is data, giving \"Crocodile.\" data.getStatus.call(this) forces this to be whatever 'this' means inside the setTimeout callback. That callback is an arrow function, so it has no this of its own — it borrows this from the outer scope, which is the top-level script (window). Earlier, var status = 'Sunglasses' created window.status. So this.status is \"Sunglasses.\" Note: the const status = 'Heart' inside the callback is just a local variable — it has nothing to do with this.status.",
"code": "var status = 'Sunglasses';\nsetTimeout(() => {\n  const status = 'Heart';\n  const data = {\n    status: 'Crocodile',\n    getStatus() { return this.status; },\n  };\n  console.log(data.getStatus());        // ?\n  console.log(data.getStatus.call(this)); // ?\n}, 0);\n \n// Output:\n// Crocodile\n// Sunglasses\n \n// Why?\n// 1. data.getStatus() - this = data -> Crocodile\n// 2. data.getStatus.call(this):\n//    - The outer function is an arrow -> lexical this\n//    - Lexical scope is module/script -> this = window\n//    - var status = 'Sunglasses' became window.status\n//    - The inner const status doesn't affect this.status\n//    -> Sunglasses\n \n// Variant - with regular function:\nsetTimeout(function() {\n  // this = undefined (strict) or window\n  // Same result\n}, 0);\n \n// In a class method:\nclass App {\n  start() {\n    setTimeout(function() {\n      console.log(this); // window!\n    }, 0);\n    \n    setTimeout(() => {\n      console.log(this); // App instance (lexical)\n    }, 0);\n  }\n}",
"howTo": "1. Don't try to guess the answer instantly — first identify what kind of function each 'this' belongs to, since that's the whole trick of this question.\n2. Notice the outer setTimeout callback is an arrow function, so it has no this of its own — it borrows this from the surrounding scope, which here is the top-level script, meaning this is the global object (window).\n3. Evaluate the two calls separately: data.getStatus() is a normal method call, so this is data, giving 'Crocodile'.\n4. For the second call, notice getStatus.call(this) forces this to be whatever 'this' means in that outer arrow function — which you already worked out is window — and window.status was set earlier by the outer 'var status = Sunglasses', so it prints 'Sunglasses'.\n5. Call out the trap explicitly: the inner 'const status = Heart' inside the callback is a separate local variable and has nothing to do with this.status, so it never affects the answer.\n6. General lesson to state out loud: always trace where an arrow function was physically written to find its 'this', not where it's eventually called.",
"dryRun": {
"input": "var status='Sunglasses'; setTimeout(() => { const status='Heart'; const data={status:'Crocodile', getStatus(){return this.status}}; console.log(data.getStatus()); console.log(data.getStatus.call(this)); }, 0);",
"frames": [
"var status = 'Sunglasses' runs at the top level, which creates window.status = 'Sunglasses'.",
"setTimeout schedules an arrow function callback to run later. Because it's an arrow function, its 'this' is locked to the top-level scope (window) — decided now, at creation time.",
"The callback runs later. Inside it, const status = 'Heart' and const data = {...} are created — these are just local variables, separate from window.status.",
"data.getStatus() is called as a normal method call, so this = data, and this.status = 'Crocodile'. Logs 'Crocodile'.",
"data.getStatus.call(this) forces this to be the callback's own 'this', which (from step 2) is window. window.status is still 'Sunglasses' from step 1. Logs 'Sunglasses'."
],
"result": "Console shows: Crocodile, then Sunglasses"
},
"pitfalls": [
"Assuming the inner const status = 'Heart' affects the answer — it's a separate local variable, not related to this.status.",
"Forgetting that an arrow function's 'this' is fixed at the moment it is defined, based on where it sits in the code, not on how or when it's called.",
"Mixing up data.getStatus() (this = data) with data.getStatus.call(this) (this = whatever 'this' was passed in from outside)."
],
"patternTakeaway": "If you see .call(this) inside an arrow function callback, always think: first trace what 'this' the arrow function itself borrowed from its surrounding code, then apply that to the .call().",
"pattern": "Functions & this"
},
{
"id": "iv-ch2-q6",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "CRITICAL — Airbnb, Spotify",
"question": "What does this output? Classic loop closure question.",
"explanation": "Output: 3, 3, 3 (after 100ms). Why: var is function-scoped, not block-scoped. All 3 setTimeout callbacks share the exact SAME i. By the time any callback actually runs, the loop has already finished, and i is 3. Fix 1: use let — each loop iteration gets its own separate i. Fix 2: wrap in an IIFE (a function that runs immediately) to create a new scope. Fix 3: use forEach, which naturally creates a new scope for each call. Fix 4: use .bind to lock in the current value of i.",
"code": "// BUG\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100);\n}\n// Output: 3, 3, 3\n \n// FIX 1: let (cleanest)\nfor (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100);\n}\n// Output: 0, 1, 2\n \n// FIX 2: IIFE\nfor (var i = 0; i < 3; i++) {\n  (function(j) {\n    setTimeout(() => console.log(j), 100);\n  })(i);\n}\n \n// FIX 3: forEach\n[0, 1, 2].forEach(i => {\n  setTimeout(() => console.log(i), 100);\n});\n \n// FIX 4: bind\nfor (var i = 0; i < 3; i++) {\n  setTimeout(console.log.bind(null, i), 100);\n}\n \n// Bonus - harder: with Promise\nfor (var i = 0; i < 3; i++) {\n  Promise.resolve().then(() => console.log(i));\n}\n// Output: 3, 3, 3 (same problem!)\n \nfor (let i = 0; i < 3; i++) {\n  Promise.resolve().then(() => console.log(i));\n}\n// Output: 0, 1, 2\n \n// Bonus - async/await in loop:\nasync function test() {\n  for (let i = 0; i < 3; i++) {\n    await new Promise(r => setTimeout(r, 100));\n    console.log(i);\n  }\n}\n// Output: 0 (after 100ms), 1 (after 200ms), 2 (after 300ms)\n// Each iteration waits for previous!",
"howTo": "1. Notice the setup immediately signals a classic gotcha: a for-loop using var with an async callback (setTimeout) inside it.\n2. State the reason before showing the output: var is function-scoped, so there is only ONE shared i for the whole loop, and by the time any setTimeout callback actually runs, the loop has already finished and i sits at its final value.\n3. Give the output as a consequence of that: all three callbacks print the same final value (3), not 0, 1, 2 as people expect.\n4. Present the fix as the natural contrast: switching var to let gives each loop iteration its own fresh copy of i, so each callback captures a different value.\n5. Mention the other fixes briefly as alternate ways to create a new scope per iteration: an IIFE that takes i as a parameter, using forEach (which naturally creates a new scope per call), or .bind to lock in the current value.\n6. Bring up the follow-up trap if the interviewer pushes further: the exact same bug happens with Promise.resolve().then() in a var loop, since it's about scope, not about timers specifically.",
"dryRun": {
"input": "for (var i=0;i<3;i++){ setTimeout(()=>console.log(i),100); }",
"frames": [
"Loop starts. var i is shared across the whole loop (function-scoped), not created fresh per iteration.",
"Iteration 1: i=0. setTimeout schedules a callback for 100ms later but does not run it now — the loop keeps going immediately.",
"Iteration 2: i=1, another callback scheduled. Iteration 3: i=2, another callback scheduled.",
"Loop condition fails when i becomes 3, so the loop stops. i is now permanently 3 — there's no separate copy left behind.",
"After 100ms, all three scheduled callbacks finally run. Each one reads the SAME shared i, which is now 3."
],
"result": "Console shows: 3, 3, 3"
},
"pitfalls": [
"Expecting 0, 1, 2 with var — you actually get 3, 3, 3 because var creates one shared variable for the whole loop, not a new one per iteration.",
"Forgetting the exact same bug happens with Promise.resolve().then() inside a var loop — it's not specific to setTimeout, it's about scope.",
"With let and async/await together, each iteration truly waits for the previous one (0 at 100ms, 1 at 200ms, 2 at 300ms) — that's different from let with plain setTimeout, where all three still fire around the same 100ms mark."
],
"patternTakeaway": "If you see var inside a for-loop with an async callback (setTimeout, Promise, etc), always think: shared variable, so every callback sees the loop's FINAL value — switch to let to give each iteration its own copy.",
"pattern": "Closures & Scope"
},
{
"id": "iv-ch2-q7",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "COMMON — Stripe, Microsoft",
"question": "Explain prototype chain. How does class inheritance work under the hood?",
"explanation": "JavaScript uses prototypal inheritance. Classes are just a nicer way to write the same thing. When you look up a property on an object, JS first checks the object itself. If it's not there, JS walks up the prototype chain to look further. The chain looks like: instance → Class.prototype → Parent.prototype → Object.prototype → null. Class syntax is \"syntactic sugar\" — under the hood it still creates constructor functions and prototypes, just like the old pre-class way of writing JS.",
"code": "class Animal {\n  constructor(name) { this.name = name; }\n  speak() { return this.name + ' makes a sound'; }\n}\n \nclass Dog extends Animal {\n  bark() { return 'Woof!'; }\n}\n \nconst rex = new Dog('Rex');\n \n// Prototype chain:\nObject.getPrototypeOf(rex) === Dog.prototype; // true\nObject.getPrototypeOf(Dog.prototype) === Animal.prototype; // true\nObject.getPrototypeOf(Animal.prototype) === Object.prototype; // true\n \n// Pre-class equivalent:\nfunction Animal(name) { this.name = name; }\nAnimal.prototype.speak = function() {\n  return this.name + ' makes a sound';\n};\n \nfunction Dog(name) {\n  Animal.call(this, name); // super(name)\n}\nDog.prototype = Object.create(Animal.prototype);\nDog.prototype.constructor = Dog;\nDog.prototype.bark = function() { return 'Woof!'; };\n \n// hasOwnProperty vs in:\nconst obj = { a: 1 };\n'a' in obj; // true\n'toString' in obj; // true (inherited!)\nobj.hasOwnProperty('a'); // true\nobj.hasOwnProperty('toString'); // false",
"howTo": "1. Start with the core idea: JavaScript objects don't copy behavior from a class — they link to another object (the prototype) and look up missing properties there.\n2. Describe the chain in one sentence before any code: instance to Class.prototype to Parent.prototype to Object.prototype to null.\n3. Say plainly that class syntax is 'just' a cleaner way to write the same constructor-function-plus-prototype pattern JS always had — it doesn't add a new inheritance model underneath.\n4. Walk through what extends really compiles to: the child's prototype becomes an object created from the parent's prototype, and calling super(...) is really calling the parent constructor function with the child's this.\n5. Use hasOwnProperty vs the 'in' operator as a concrete way to show you understand the chain: 'in' checks the whole chain (so it sees inherited methods like toString), while hasOwnProperty only checks the object itself.\n6. If asked to demonstrate, walk through Object.getPrototypeOf() calls to literally show each link in the chain.",
"dryRun": {
"input": "class Animal{constructor(name){this.name=name} speak(){...}} class Dog extends Animal{bark(){...}} const rex = new Dog('Rex');",
"frames": [
"new Dog('Rex') creates a new object. JS sets its internal prototype link to Dog.prototype.",
"rex.bark() is called. JS checks rex itself — no bark there directly, so it checks rex's prototype: Dog.prototype. Found it — runs bark().",
"rex.speak() is called. JS checks rex, then Dog.prototype — not found in either. It walks up one more link to Animal.prototype. Found it there — runs speak().",
"If you called rex.toString(), JS would walk even further: rex -> Dog.prototype -> Animal.prototype -> Object.prototype, where toString finally exists.",
"'toString' in rex is true (found somewhere in the chain), but rex.hasOwnProperty('toString') is false (it's inherited, not on rex itself)."
],
"result": "rex.bark() works via Dog.prototype, rex.speak() works via Animal.prototype (one level further up the chain)"
},
"pitfalls": [
"Thinking 'in' and hasOwnProperty() are the same — 'in' checks the whole prototype chain, hasOwnProperty only checks the object itself.",
"Forgetting that extends and super() are just syntax on top of the same old pattern: Dog.prototype = Object.create(Animal.prototype) and Animal.call(this, name).",
"Assuming every property lookup is equally fast — deeper chains mean more steps to walk before JS gives up and returns undefined."
],
"patternTakeaway": "If you see a question about how JS finds a method that isn't directly on an object, always think: walk up the prototype chain, one link at a time, until found or you hit null.",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch2-q8",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "COMMON — async patterns",
"question": "Explain async/await. When to use Promise.all instead of sequential await?",
"explanation": "async/await is just a nicer way to write Promises. An async function always returns a Promise. await pauses the function until a Promise finishes (or wraps a plain value in Promise.resolve if it's not a Promise). try/catch handles errors, instead of using .catch(). Compared to .then() chains, this gives flatter code, built-in error handling, and easier debugging. The downside: awaiting one thing after another runs things in sequence (slower). If you want things to run at the same time, use Promise.all instead. Rule: if you have 2 or more async operations that do not depend on each other, use Promise.all.",
"code": "// .then chain\nfunction fetchUser() {\n  return fetch('/user')\n    .then(r => r.json())\n    .then(user => fetch('/posts?id=' + user.id))\n    .then(r => r.json())\n    .catch(err => console.error(err));\n}\n \n// async/await (more readable)\nasync function fetchUser() {\n  try {\n    const userRes = await fetch('/user');\n    const user = await userRes.json();\n    const postsRes = await fetch('/posts?id=' + user.id);\n    return await postsRes.json();\n  } catch (err) {\n    console.error(err);\n  }\n}\n \n// BUG: serial fetches (slow)\nasync function bad() {\n  const a = await fetch('/a'); // 1s\n  const b = await fetch('/b'); // another 1s = total 2s\n  return [a, b];\n}\n \n// FIX: parallel\nasync function good() {\n  const [a, b] = await Promise.all([\n    fetch('/a'),\n    fetch('/b')\n  ]); // total 1s\n  return [a, b];\n}\n \n// But if b depends on a -> must be sequential:\nasync function depends() {\n  const user = await fetchUser();\n  const posts = await fetchPosts(user.id); // needs id from user\n  return { user, posts };\n}\n \n// Tip: kick off promises early, await later\nasync function smart() {\n  const userPromise = fetchUser();    // start now\n  const configPromise = fetchConfig(); // start now\n  \n  // do other sync work\n  \n  const user = await userPromise;\n  const config = await configPromise;\n  return { user, config };\n  // both run in parallel even though code looks sequential\n}",
"howTo": "1. Give the one-line definition: async/await is just nicer syntax over Promises — an async function always returns a Promise, and await pauses until a Promise settles.\n2. Mention the practical win over .then chains: try/catch handles errors in a familiar way, and the code reads top-to-bottom like normal synchronous code.\n3. State the key rule for when to use Promise.all: if you have two or more async operations that don't depend on each other's results, run them together with Promise.all instead of awaiting them one after another.\n4. Explain why sequential awaits are a trap: each await blocks the next line, so two independent 1-second calls awaited back to back take 2 seconds total, when they could both finish in 1 second run together.\n5. Give the fix pattern in words: kick off both async calls first without awaiting immediately, then await both afterward — that way they run in parallel even though the code still reads sequentially.\n6. Mention the one exception to flag: if the second call actually needs data from the first call's result, sequential awaiting is correct and unavoidable.",
"dryRun": {
"input": "async function bad(){ const a = await fetch('/a'); const b = await fetch('/b'); } // each fetch takes 1s",
"frames": [
"await fetch('/a') starts the first request and pauses the function until it finishes — takes 1 second.",
"Only after 'a' finishes does the function move to the next line: await fetch('/b') starts and pauses again — another 1 second.",
"Total time: 2 seconds, even though 'a' and 'b' don't depend on each other.",
"Now the fixed version: const [a, b] = await Promise.all([fetch('/a'), fetch('/b')]) — both fetches START at the same moment.",
"Both requests run in parallel. The await only waits once, for whichever one takes longest — about 1 second total, not 2."
],
"result": "Sequential awaits: ~2s total. Promise.all: ~1s total."
},
"pitfalls": [
"Awaiting two independent calls one after another doubles the wait time for no reason — always check if the second call actually needs data from the first.",
"Promise.all fails fast — if ANY promise in the array rejects, the whole Promise.all rejects immediately, even if the others would have succeeded.",
"You can still get parallel behavior without Promise.all by starting both promises first (without await) and awaiting them later — both calls kick off immediately either way."
],
"patternTakeaway": "If you see 2+ independent async calls awaited one after another, always think: Promise.all to run them in parallel instead of wasting time waiting in sequence.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch2-q9",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "COMMON — performance",
"question": "What is a Memory Leak? Show 5 common examples.",
"explanation": "A memory leak happens when memory is no longer needed, but something still holds a reference to it, so the garbage collector can never free it. Common causes: 1. Event listeners that are added but never removed. 2. Closures that hold onto large data they don't even use. 3. Intervals/timers that keep running after a component is gone. 4. Detached DOM nodes — removed from the page, but a JS variable still points to them. 5. Global variables (created by forgetting var/let/const). 6. Forgotten subscribers — WebSocket, EventEmitter, or RxJS subscriptions that never get closed. To find them: use Chrome DevTools → Memory → Heap Snapshot. Take a snapshot before and after an action, then compare.",
"code": "// 1. Event listener leak\nuseEffect(() => {\n  window.addEventListener('resize', handler);\n  // Missing cleanup!\n}, []);\n// FIX:\nreturn () => window.removeEventListener('resize', handler);\n \n// 2. Closure leak\nfunction createHandler() {\n  const hugeData = new Array(1_000_000).fill('data');\n  return function() {\n    // Doesn't use hugeData, but closes over it!\n    console.log('clicked');\n  };\n}\n// FIX: don't include unnecessary data in closure\n \n// 3. Timer leak\nuseEffect(() => {\n  const id = setInterval(() => {}, 1000);\n  return () => clearInterval(id);\n}, []);\n \n// 4. WebSocket leak\nuseEffect(() => {\n  const ws = new WebSocket(url);\n  ws.onmessage = handleMessage;\n  return () => ws.close();\n}, [url]);\n \n// 5. Detached DOM\nlet detachedDiv = document.createElement('div');\ndocument.body.appendChild(detachedDiv);\n// ...\ndocument.body.removeChild(detachedDiv);\n// detachedDiv still referenced! memory leak\n// FIX: detachedDiv = null;\n \n// 6. Subscription leak (RxJS, Redux)\nuseEffect(() => {\n  const subscription = observable.subscribe(handler);\n  return () => subscription.unsubscribe();\n}, []);",
"howTo": "1. Give the one-line definition first: a memory leak is memory that's no longer needed but still referenced somewhere, so the garbage collector can never free it.\n2. Structure your answer as a list of common causes rather than one long explanation — that mirrors how this question is usually asked ('give examples').\n3. Cover the most common ones in order of how often they show up in real apps: event listeners never removed, timers (setInterval) never cleared, and subscriptions (WebSockets, RxJS, EventEmitters) never unsubscribed.\n4. Mention two sneakier ones to show depth: closures that accidentally hold onto large data they don't even use, and detached DOM nodes that are removed from the page but still referenced by a JS variable.\n5. Tie each cause to its fix using the same pattern: whatever you set up in a useEffect (listener, timer, subscription) should be torn down in its cleanup function.\n6. Mention how you'd actually find one in practice: Chrome DevTools Memory tab, taking heap snapshots before and after an action, and looking for objects that keep growing instead of getting collected.",
"dryRun": {
"input": "useEffect(() => { window.addEventListener('resize', handler); }, []); // component unmounts later",
"frames": [
"Component mounts. useEffect runs once and adds a 'resize' listener to window, pointing to handler.",
"The effect has no cleanup function (no return statement), so nothing tells the browser to remove the listener later.",
"Component unmounts (user navigates away). React removes the component from the page, but window still holds a reference to handler.",
"Because window still references handler, and handler may reference the component's data through a closure, none of it can be garbage collected.",
"The fix: return () => window.removeEventListener('resize', handler); inside the effect, so cleanup runs on unmount and breaks the reference."
],
"result": "Without cleanup: the listener and its closures stay in memory forever. With cleanup: memory is freed when the component unmounts."
},
"pitfalls": [
"Adding an event listener, timer, or subscription in useEffect without a matching cleanup function in the return statement.",
"A closure keeping a reference to a huge object it doesn't even use, just because that object happened to be in scope.",
"Removing a DOM node from the page but forgetting to also clear the JS variable pointing to it — the node stays in memory as a 'detached' node."
],
"patternTakeaway": "If you see something set up inside useEffect (listener, timer, subscription), always think: does it have a cleanup function in the return statement to remove it?",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch2-q10",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "COMMON — Event handling",
"question": "Explain Event Delegation. Why is it better than attaching listeners to each element?",
"explanation": "Event Delegation: instead of putting one listener on every child element, put ONE listener on the parent, and use event bubbling to catch clicks from any child. Advantages: Better performance — one listener instead of many. Works with dynamic elements — even ones added AFTER you set up the listener. Uses less memory — fewer references kept around. Use event.target to find out exactly which child was clicked. Remember: event.target is the element that was actually clicked. event.currentTarget is the element the listener is attached to (the parent).",
"code": "// BAD: listener per li\ndocument.querySelectorAll('li').forEach(li => {\n  li.addEventListener('click', handleClick);\n});\n// Problem: new li added later won't get a listener\n \n// GOOD: event delegation\nconst list = document.getElementById('todo-list');\nlist.addEventListener('click', (e) => {\n  // closest() helps if there are nested elements\n  const deleteBtn = e.target.closest('.delete-btn');\n  if (deleteBtn) {\n    const id = deleteBtn.dataset.id;\n    deleteItem(id);\n    return;\n  }\n  \n  const editBtn = e.target.closest('.edit-btn');\n  if (editBtn) {\n    editItem(editBtn.dataset.id);\n  }\n});\n \n// React does this automatically!\n// React 17+ attaches listeners to the root container,\n// not document. All event handlers attach to root,\n// not to each individual element.\n \n// Event capturing vs bubbling:\n// Capturing: top-down (root -> target)\n// Bubbling: bottom-up (target -> root) - DEFAULT\n \nelement.addEventListener('click', handler, true); // capture\nelement.addEventListener('click', handler, false); // bubble (default)\n \n// stopPropagation() vs preventDefault():\n// stopPropagation - stops the event from bubbling up\n// preventDefault - cancels default action (form submit, link click)",
"howTo": "1. Give the one-line idea: instead of attaching a listener to every child element, attach one listener to a shared parent and let events bubble up to it.\n2. Explain why this is better with two concrete reasons: fewer listeners means better performance and less memory, and it automatically works for elements added to the page later, since you never had to attach anything to them individually.\n3. Describe the mechanism in words: when something inside the parent is clicked, the event bubbles up, and the parent's listener checks event.target to figure out which specific child was actually clicked.\n4. Mention the useful helper: event.target.closest('.some-class') is the practical way to find the relevant child even if the click landed on something nested inside it, like an icon inside a button.\n5. Clarify a term people mix up if asked: event.target is what was actually clicked, event.currentTarget is the element the listener is attached to.\n6. Bring up the React connection as a nice detail: React already does event delegation for you internally, attaching listeners near the root instead of on every element.",
"dryRun": {
"input": "list.addEventListener('click', e => { const btn = e.target.closest('.delete-btn'); if (btn) deleteItem(btn.dataset.id); });",
"frames": [
"One listener is attached to the parent <ul id='todo-list'>, not to each <li> or button inside it.",
"User clicks a delete icon inside one of the list items. The click event starts at that icon and bubbles UP through its parents.",
"The bubbling event reaches the parent <ul>, where the one listener is waiting, and the handler function runs.",
"Inside the handler, e.target is the exact element clicked (maybe the icon). e.target.closest('.delete-btn') walks up from there to find the actual button.",
"Since a delete button was found, deleteItem() runs using its data-id. If a new <li> is added later, it works automatically — no new listener needed."
],
"result": "Clicking any delete button (even ones added later) correctly calls deleteItem(), using just one listener on the parent"
},
"pitfalls": [
"Attaching a listener to every child element instead of one on the parent — this breaks for elements added to the page later.",
"Using e.target directly instead of e.target.closest(...) — if the click lands on an icon inside a button, e.target is the icon, not the button.",
"Confusing event.target (what was actually clicked) with event.currentTarget (the element the listener is attached to)."
],
"patternTakeaway": "If you see a list of dynamic/repeating elements needing click handlers, always think: event delegation — one listener on the parent, then check event.target.closest() to find which child was clicked.",
"pattern": "DOM & Events"
},
{
"id": "iv-ch2-q11",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "COMMON — Comparison",
"question": "Explain == vs ===. Show the most surprising coercions.",
"explanation": "=== (strict equality): compares values with NO type conversion. == (loose equality): converts the types first, then compares — this is why it gives surprising results. Important coercion rules: null == undefined is true. null == 0 is false (a special exception!). '' == 0 is true (the string converts to a number). [] == false is true (the array becomes '', then 0). {} == '[object Object]' is true (the object converts to a string). NaN === NaN is always false, even compared to itself! Golden rule: always use ===, except when you want to check for null or undefined together (value == null catches both).",
"code": "// Tricky outputs:\n0 == false        // true (false -> 0)\n'' == false       // true ('' -> 0, false -> 0)\nnull == undefined // true\nnull == 0         // false (exception!)\nnull >= 0         // true (null -> 0)\nNaN == NaN        // false (exception!)\n[] == false       // true ([] -> '' -> 0)\n[] == ![]         // true (![] = false; [] -> 0; false -> 0)\n{} == {}          // false (different references)\n[] == []          // false (different references)\n \n// 1 + '1' = ?\n1 + '1'           // '11' (number + string -> string)\n'1' + 1           // '11'\n1 - '1'           // 0 (- forces number)\n'1' - 1           // 0\n+'5'              // 5 (unary +)\n!!'hello'         // true\n!!''              // false\n!!0               // false\n!!{}              // true\n!![]              // true\n \n// typeof:\ntypeof null            // 'object' (known bug!)\ntypeof undefined       // 'undefined'\ntypeof []              // 'object' (use Array.isArray!)\ntypeof function(){}    // 'function'\ntypeof NaN             // 'number' (yes, NaN is number)\ntypeof 1n              // 'bigint'\ntypeof Symbol()        // 'symbol'\n \n// Golden rule: use === except for null check:\nif (value == null) { } // true for null OR undefined\nif (value === null) { } // true only for null",
"howTo": "1. Give the one-line rule up front: === compares values with no type conversion, == converts the types first and then compares, which is why it produces surprising results.\n2. Recommend the practical rule before diving into examples: always use === by default, and only reach for == in the specific case of checking value == null, which conveniently catches both null and undefined at once.\n3. Pick two or three of the most surprising == examples to walk through out loud, rather than listing all of them — for example, '' == 0 is true because the empty string converts to 0, but null == 0 is false because null only loosely equals undefined, nothing else.\n4. Mention typeof null being 'object' as a classic, unrelated but frequently-paired gotcha, and note Array.isArray() is the real way to check for arrays since typeof an array is also 'object'.\n5. Bring up NaN as its own special case: NaN === NaN is false under both operators, so Number.isNaN() is the correct way to check for it.\n6. Wrap up by connecting this to real bugs: sloppy == comparisons are a common source of subtle production bugs, which is why most linters ban == entirely.",
"dryRun": {
"input": "[] == false",
"frames": [
"JS sees == with an array and a boolean, so it converts both sides toward a common type instead of comparing directly.",
"false gets converted to a number first: false becomes 0.",
"[] (empty array) gets converted to a primitive: it becomes the empty string ''.",
"'' then gets converted to a number to compare with 0: '' becomes 0.",
"Now both sides are 0. 0 == 0 is true."
],
"result": "[] == false evaluates to true"
},
"pitfalls": [
"Assuming null == 0 is true like null == undefined — it's actually false, a special-cased exception in JS.",
"Forgetting that NaN is never equal to anything, even itself — use Number.isNaN() to check for it, not === or ==.",
"typeof null returns 'object', not 'null' — a well-known quirk, and typeof an array is also 'object' (use Array.isArray() instead)."
],
"patternTakeaway": "If you see a strange == comparison in an interview question, always think: what type conversion happens on each side before they're compared? — and remember === skips all of that.",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch2-q12",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "COMMON — Storage",
"question": "Compare cookies, localStorage, and sessionStorage.",
"explanation": "Cookies: Sent automatically with every request to the server. Small limit (about 4KB per domain). Lifetime is configurable (session-only, or until an expiry date). Good for: authentication tokens, server-side preferences. Security flags: HttpOnly, Secure, SameSite. localStorage: Stays saved across browser sessions (even after closing the tab). Limit is about 5MB per origin. Lasts until someone manually clears it. Good for: user preferences, caching data. Security: JavaScript can always read it, so it is vulnerable to XSS attacks. sessionStorage: Separate storage per browser tab. Same ~5MB limit. Lasts only until that tab is closed. Good for: temporary data that only matters for the current session.",
"code": "// Cookies\ndocument.cookie = 'userId=12345; expires=Fri, 31 Dec 2025 23:59:59 GMT; path=/; Secure; SameSite=Strict';\n \n// Read all cookies (returns string)\nconsole.log(document.cookie);\n \n// Delete\ndocument.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';\n \n// localStorage\nlocalStorage.setItem('username', 'roee');\nlocalStorage.getItem('username'); // 'roee'\nlocalStorage.removeItem('username');\nlocalStorage.clear();\n \n// Storing objects (must serialize)\nlocalStorage.setItem('user', JSON.stringify({ id: 1, name: 'Roee' }));\nconst user = JSON.parse(localStorage.getItem('user'));\n \n// sessionStorage - same API\nsessionStorage.setItem('sessionId', 'abc123');\n \n// Listening for changes (other tabs)\nwindow.addEventListener('storage', (e) => {\n  console.log('Key changed:', e.key);\n  console.log('Old value:', e.oldValue);\n  console.log('New value:', e.newValue);\n});\n// Note: only fires for OTHER tabs, not the current one",
"howTo": "1. Set up a simple table in your head before answering: for each storage type, cover where it's sent, how big it can be, and how long it lasts.\n2. Start with cookies since they're the odd one out: they're automatically sent with every HTTP request to the server, have a small size limit (~4KB), and are the right place for things like auth tokens because of flags like HttpOnly and Secure.\n3. Contrast localStorage next: it never leaves the browser automatically, holds much more data (~5MB), and persists until the user or the app clears it — good for saved preferences or client-side caching.\n4. Contrast sessionStorage last since it's the easiest to explain by difference: same API and size as localStorage, but scoped to one tab and cleared when that tab closes.\n5. Mention the security tradeoff as a key point interviewers listen for: cookies can be protected from JavaScript entirely (HttpOnly), while localStorage and sessionStorage are always readable by any script on the page, making them vulnerable to XSS if not careful.\n6. If asked how tabs can react to storage changes, mention the 'storage' event fires in other tabs, not in the tab that made the change.",
"dryRun": {
"input": "localStorage.setItem('user', JSON.stringify({id:1,name:'Roee'})); const user = JSON.parse(localStorage.getItem('user'));",
"frames": [
"JSON.stringify({id:1, name:'Roee'}) converts the object into a plain string: '{\"id\":1,\"name\":\"Roee\"}'. localStorage can only store strings.",
"localStorage.setItem('user', ...) saves that string under the key 'user'. This value now persists even if the browser tab is closed and reopened.",
"Later, localStorage.getItem('user') retrieves the raw string back — it is still just text, not an object yet.",
"JSON.parse(...) converts that string back into a real JavaScript object: {id: 1, name: 'Roee'}.",
"If this same data were saved with sessionStorage instead, it would disappear the moment the tab closes — localStorage keeps it around indefinitely."
],
"result": "user = {id: 1, name: 'Roee'}, and it stays saved even after closing and reopening the browser tab"
},
"pitfalls": [
"Trying to store an object directly with localStorage.setItem — it must be converted to a string with JSON.stringify first, and parsed back with JSON.parse when reading it.",
"Forgetting cookies are automatically sent with every HTTP request — this makes them slower for large amounts of data and is exactly why their size limit is so small.",
"Assuming the 'storage' event fires in the same tab that made the change — it only fires in OTHER open tabs, not the one that triggered the update."
],
"patternTakeaway": "If you see a question comparing storage options, always think: cookies go to the server automatically, localStorage/sessionStorage never leave the browser, and the only difference between those two is how long they last (forever vs one tab session).",
"pattern": "Browser & Storage"
},
{
"id": "iv-ch2-q13",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "COMMON — Modern features",
"question": "Explain Map vs Object. When to use which?",
"explanation": "Map vs Object: Map — keys can be ANY type, even objects. It remembers insertion order. It has a built-in .size. It's iterable by default. Object — keys can only be strings or Symbols. There's no guaranteed order (numeric keys get sorted first). It inherits properties from its prototype. Set vs Array: Set — holds only unique values. Checking if something exists (.has()) is fast, O(1). No access by index. Array — keeps order, has index access, and allows duplicate values. Rule of thumb: Need dynamic keys of any type, plus metadata? Use Map. Need uniqueness? Use Set. Need an ordered list for rendering? Use Array. Need simple, fixed config? Use Object.",
"code": "// Map vs Object\nconst map = new Map();\nmap.set({}, 'value1');  // object as key!\nmap.set('a', 'value2');\nmap.set(42, 'value3');\nmap.size; // 3\n \nconst obj = {};\nobj['a'] = 'value';\nobj.size; // undefined - no size!\nObject.keys(obj).length; // expensive for large objects\n \n// Iteration\nfor (const [key, value] of map) { } // built-in\nfor (const [key, value] of Object.entries(obj)) { }\n \n// Performance comparison:\n// Map: insert/delete - O(1), better for large collections\n// Object: read static - faster\n \n// Set vs Array - performance\nconst arr = [1, 2, 3, 4, 5];\nconst set = new Set([1, 2, 3, 4, 5]);\n \narr.includes(3);   // O(n)\nset.has(3);        // O(1)\n \n// Removing duplicates - critical!\nconst nums = [1, 2, 2, 3, 3, 4];\nconst unique = [...new Set(nums)]; // [1, 2, 3, 4]\n \n// Set operations\nconst a = new Set([1, 2, 3]);\nconst b = new Set([2, 3, 4]);\n \nconst union = new Set([...a, ...b]);\nconst intersection = new Set([...a].filter(x => b.has(x)));\nconst difference = new Set([...a].filter(x => !b.has(x)));\n \n// JSON serialization\nJSON.stringify(map); // \"{}\" - Map not serializable!\nJSON.stringify(obj); // OK\n// Workaround: [...map.entries()] -> array of [key, value]",
"howTo": "1. Frame it as two separate comparisons since the question usually blends them: Map vs Object, and Set vs Array.\n2. For Map vs Object, lead with the two biggest differences: Map allows any value (even an object) as a key, and Map remembers insertion order and has a built-in .size, while Object keys are always strings or symbols and don't track size natively.\n3. For Set vs Array, lead with the performance angle: Set gives you O(1) lookup with .has(), while Array's includes() has to scan the whole list — that's why Set is the natural choice for uniqueness checks or removing duplicates.\n4. Give the rule of thumb as a quick decision guide: dynamic key-value data reaches for Map, uniqueness reaches for Set, ordered/rendered lists reach for Array, and simple static config reaches for a plain Object.\n5. Mention one real gotcha: neither Map nor Set serialize with JSON.stringify out of the box — you need to convert them (like [...map.entries()]) first.\n6. Give a concrete one-liner as proof of practical knowledge: [...new Set(array)] is the standard idiom for deduplicating an array.",
"dryRun": {
"input": "const nums = [1,2,2,3,3,4]; const unique = [...new Set(nums)];",
"frames": [
"new Set(nums) creates a Set and adds each number from nums one at a time, in order: 1, 2, 2, 3, 3, 4.",
"A Set automatically ignores duplicates — when it tries to add the second 2, it's already there, so nothing changes. Same for the second 3.",
"After processing all items, the Set contains just the unique values, in the order they were first seen: {1, 2, 3, 4}.",
"The spread operator [...set] expands the Set back into a regular array, keeping that same order."
],
"result": "unique = [1, 2, 3, 4]"
},
"pitfalls": [
"Trying to check obj.size on a plain Object — only Map has a built-in .size property; for Object you need Object.keys(obj).length.",
"Forgetting that Map and Set are not directly JSON.stringify-able — you need to convert them first, e.g. [...map.entries()].",
"Using array.includes() to check membership on a large list when a Set with .has() would be much faster (O(1) vs O(n))."
],
"patternTakeaway": "If you see a question about removing duplicates from an array, always think: [...new Set(array)] — and if it's about arbitrary key types or fast has()/size, think Map/Set over Object/Array.",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch2-q14",
"guide": "Interview Guide",
"topic": "JavaScript Fundamentals",
"topicNum": 2,
"level": "Easy",
"badge": "COMMON — Modern syntax",
"question": "Explain spread vs rest syntax. When to use each?",
"explanation": "Spread and rest both use the same ... syntax, but they do opposite things. Spread: \"expands\" elements — used to UNPACK something. Examples: copying or merging arrays/objects, passing an array as separate function arguments. Rest: \"collects\" elements — used to PACK things together. Examples: a function parameter that gathers any number of arguments, or grabbing \"the rest\" of values during destructuring.",
"code": "// SPREAD - expand\nconst arr = [1, 2, 3];\nconst arrCopy = [...arr];        // [1, 2, 3]\nconst merged = [...arr, 4, 5];   // [1, 2, 3, 4, 5]\n \nconst obj = { a: 1, b: 2 };\nconst objCopy = { ...obj };       // { a: 1, b: 2 }\nconst extended = { ...obj, c: 3 }; // { a: 1, b: 2, c: 3 }\n \n// Function arguments\nMath.max(...arr); // Math.max(1, 2, 3)\n \n// REST - collect\nfunction sum(...numbers) { // collects ALL args\n  return numbers.reduce((a, b) => a + b, 0);\n}\nsum(1, 2, 3, 4); // 10\n \n// Destructuring\nconst [first, ...rest] = [1, 2, 3, 4];\n// first = 1, rest = [2, 3, 4]\n \nconst { name, ...otherProps } = { name: 'Roee', age: 30, city: 'Netanya' };\n// name = 'Roee', otherProps = { age: 30, city: 'Netanya' }\n \n// Common pattern - omit a property\nconst removeId = ({ id, ...rest }) => rest;\nremoveId({ id: 1, name: 'X', age: 20 }); // { name: 'X', age: 20 }\n \n// Caveat: spread is SHALLOW copy!\nconst nested = { user: { name: 'Roee' } };\nconst copy = { ...nested };\ncopy.user.name = 'Other'; // affects original too!\n \n// Solution: structuredClone or deep copy\nconst deepCopy = structuredClone(nested);",
"howTo": "1. Point out that spread and rest use the exact same three-dot syntax but do opposite jobs — that's the whole trick of the question, so say it up front.\n2. Define spread as 'expanding': it unpacks an array or object into individual elements, which is how you copy or merge arrays/objects, or pass an array as separate function arguments.\n3. Define rest as 'collecting': it's used in function parameters or destructuring to gather multiple leftover values into a single array or object.\n4. Give one example of each side by side so the contrast is clear: [...arr] to copy an array (spread) versus function(...args) to accept any number of arguments (rest).\n5. Mention a common practical pattern: destructuring rest to drop one property from an object, like const { id, ...rest } = obj to get everything except id.\n6. Flag the shared trap at the end: spread only makes a shallow copy, so a nested object inside the copy is still shared with the original — mention structuredClone if a real deep copy is needed.",
"dryRun": {
"input": "const [first, ...rest] = [1,2,3,4]; const merged = [...[1,2,3], 4, 5];",
"frames": [
"For destructuring: [first, ...rest] = [1,2,3,4]. first takes the first value: first = 1.",
"...rest (rest syntax) collects everything left over into a new array: rest = [2, 3, 4].",
"Now the spread example: [...[1,2,3], 4, 5]. The ... here expands the array [1,2,3] into its individual elements: 1, 2, 3.",
"Those expanded elements are placed into the new array along with 4 and 5, in order."
],
"result": "rest = [2, 3, 4]; merged = [1, 2, 3, 4, 5]"
},
"pitfalls": [
"Confusing spread (expanding, used when building something new) with rest (collecting, used when receiving/destructuring).",
"Assuming spread makes a deep copy — it only makes a SHALLOW copy, so a nested object inside stays shared with the original.",
"Forgetting rest parameters must be the LAST parameter in a function signature — function(a, ...rest, b) is invalid."
],
"patternTakeaway": "If you see ... on the left side of an assignment/destructuring or in function parameters, think rest (collecting); if you see it while building a new array/object/argument list, think spread (expanding).",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch3-q1",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "CRITICAL — every interview",
"question": "What is the Virtual DOM? How does Reconciliation work?",
"explanation": "The Virtual DOM is a small copy of the real webpage, kept as a plain JavaScript object. It is much faster to work with than the real DOM.\nReact keeps two versions of this copy: the old one (before the update) and the new one (after the update). React compares them. This comparison process is called 'reconciliation'.\nReact does not redraw everything. It only changes the small parts that are different. This keeps updates fast (the algorithm checks each item roughly once, instead of comparing everything to everything).\nThree rules React uses when comparing:\n1. If the element type changed (like a div became a span), React throws away the old one and builds a new one.\n2. If the element type is the same, React only updates the parts that changed (like a new color or new text).\n3. For lists, React uses the 'key' prop to match old items to new items.\nThe 'key' prop is very important. Without a good key, React cannot tell if an item moved, was added, or was deleted. This can cause bugs.",
"code": "// BAD - index as key\nitems.map((item, i) => <Item key={i} data={item} />)\n// Problem: removing items[0] causes state mismatch\n \n// GOOD\nitems.map(item => <Item key={item.id} data={item} />)\n \n// Bug example with index keys:\n// State inside Item is stored by key.\n// If key={index} and you remove the first item,\n// the second item's state \"moves\" to the first!\n \n// When index keys ARE OK:\n// 1. Static list (never changes)\n// 2. No state in children\n// 3. No side effects depending on values\n \n// Trick: force remount with different key\nfunction Form({ userId }) {\n  // When userId changes, the form completely resets\n  return <FormInner key={userId} />;\n}\n \n// Instead of:\nuseEffect(() => {\n  // reset all form fields\n}, [userId]);",
"howTo": "1. Start simple: React keeps a JS copy of the UI (Virtual DOM) so it can compare old vs new before touching the real, slow DOM.\n2. Say the word \"reconciliation\" and explain it means comparing the old tree and the new tree to find the smallest set of changes.\n3. Mention the diffing shortcuts React uses: different tag type means throw away and rebuild, same type means just patch the changed attributes.\n4. For lists, explain why key matters: React uses key to match old items to new items. Without a stable key (like using index), React can mix up which item is which after a reorder or removal.\n5. If asked for an example, describe the trick of changing a key on purpose (like key={userId}) to force React to fully throw away and rebuild a component.",
"dryRun": {
"input": "A list of 3 items renders, then the first item is removed",
"frames": [
"Initial render: items = [A, B, C], each rendered with key={item.id} (a-1, b-2, c-3).",
"User removes item A. New state: items = [B, C].",
"React builds the new virtual tree: [B, C] with keys b-2, c-3.",
"React compares old keys (a-1, b-2, c-3) to new keys (b-2, c-3). It sees a-1 is gone, and b-2/c-3 still exist.",
"React removes only the DOM node for a-1. It does NOT touch B or C — their internal state stays intact."
],
"result": "Only item A's DOM node is removed; B and C keep their state and are not re-created."
},
"pitfalls": [
"Using the array index as key — this breaks when items are reordered or removed, because React matches the wrong item to the wrong state.",
"Forgetting that different element types (div vs span) force a full remount, losing any state and DOM focus inside.",
"Thinking the Virtual DOM makes everything free — diffing still costs time, it's just cheaper than touching the real DOM."
],
"patternTakeaway": "If you are rendering a list of items and it asks how React tracks them, always think key prop tied to a stable unique id, never the array index.",
"pattern": "React Rendering & Performance"
},
{
"id": "iv-ch3-q2",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "CRITICAL — every interview",
"question": "Explain useState and useEffect. What is the dependency array?",
"explanation": "useState lets a function component remember a value between renders.\n- It gives you back two things: the current value, and a function to change it (setState).\n- Calling setState makes the component render again.\n- If your new value depends on the old value, use the function form: setCount(prev => prev + 1). This is safer because it always uses the latest value.\nuseEffect lets you run code after the component renders (a 'side effect', like fetching data or setting up a timer).\n- The first argument is the function to run. It can return a 'cleanup' function.\n- The second argument is the dependency array. It controls when the effect runs again:\n  - No array at all: runs after every render.\n  - Empty array []: runs only once, when the component first appears.\n  - [a, b]: runs again whenever a or b changes.\n- The cleanup function runs right before the effect runs again, and also when the component disappears (unmounts).",
"code": "// useState basics\nconst [count, setCount] = useState(0);\n \n// Direct update (uses current value)\nsetCount(count + 1);\n \n// Functional update (uses latest value - SAFER)\nsetCount(prev => prev + 1);\n \n// Lazy initial state (expensive computation)\nconst [data, setData] = useState(() => {\n  return expensiveComputation();\n}); // runs only once, not on every render\n \n// useEffect patterns\nuseEffect(() => {\n  console.log('runs after every render');\n}); // no deps\n \nuseEffect(() => {\n  console.log('runs only on mount');\n}, []); // empty deps\n \nuseEffect(() => {\n  console.log('runs when count changes');\n}, [count]);\n \nuseEffect(() => {\n  const subscription = subscribe();\n  return () => {\n    // Cleanup - runs before next effect AND on unmount\n    subscription.unsubscribe();\n  };\n}, []);\n \n// Common bug: missing dependency\nuseEffect(() => {\n  fetchData(userId);\n}, []); // BUG! userId not in deps - stale\n \nuseEffect(() => {\n  fetchData(userId);\n}, [userId]); // FIX\n \n// Race condition fix\nuseEffect(() => {\n  const controller = new AbortController();\n  fetch(url, { signal: controller.signal })\n    .then(r => r.json())\n    .then(setData)\n    .catch(err => {\n      if (err.name !== 'AbortError') console.error(err);\n    });\n  return () => controller.abort();\n}, [url]);",
"howTo": "1. Split the answer in two: useState is for remembering a value across renders, useEffect is for doing something after the render happens (side effects).\n2. For useState, mention the update trap: if your new value depends on the old one, use the function form setCount(prev => prev+1), not setCount(count+1), because count in that render can be stale.\n3. For useEffect, explain the dependency array is just \"when should this re-run\": no array = every render, empty array = once on mount, [x] = whenever x changes.\n4. Say out loud why cleanup exists: anything you start (subscription, timer, listener) needs to be stopped, and the cleanup function runs before the next effect and on unmount.\n5. If asked about a common bug, mention forgetting to add a used variable to the deps array causes stale data, and fetching without cleanup can cause old requests to overwrite new ones.",
"dryRun": {
"input": "A component that fetches user data: useEffect(() => { fetchData(userId) }, [userId]), userId changes from 1 to 2",
"frames": [
"Component mounts with userId=1. Render happens. After render, effect runs: fetchData(1) starts.",
"fetchData(1) resolves, setData is called, component re-renders with the new data.",
"Parent changes userId to 2. Component re-renders with userId=2.",
"React compares dependency array: old [1] vs new [2] — they differ, so cleanup from the previous effect runs first (if any), then the effect runs again: fetchData(2) starts.",
"fetchData(2) resolves, setData updates state, component re-renders showing user 2's data."
],
"result": "Every time userId changes, the effect re-runs and fetches fresh data for that user."
},
"pitfalls": [
"Using setCount(count + 1) instead of setCount(prev => prev + 1) when the new value depends on the old one — count can be stale.",
"Forgetting to add a variable used inside useEffect to the dependency array — causes stale data (the 'exhaustive-deps' bug).",
"Forgetting the cleanup function for subscriptions, timers, or fetch requests — causes memory leaks or race conditions.",
"Passing an empty array [] when the effect actually uses a prop or state value — the effect will keep using the old value forever."
],
"patternTakeaway": "If a component needs to run code after render but only when a specific value changes, always think useEffect with that value listed in the dependency array.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch3-q3",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "CRITICAL — Atlassian, Uber",
"question": "Build a custom hook useDebounce.",
"explanation": "useDebounce is a very common custom hook. The idea: wait until the user stops typing before reacting to the value.\nThere are two versions:\n- useDebounce(value, delay): give it a value, it gives you back a 'debounced' version that only updates after the value stops changing for `delay` milliseconds.\n- useDebouncedCallback(fn, delay): give it a function, it gives you back a version of that function that only actually runs after the pause.\nThe most important detail: you must clean up the timer inside useEffect. If you don't, a new timer is created every time without canceling the old one, and the debounce won't work correctly.",
"code": "// 1. useDebounce(value)\nimport { useState, useEffect } from 'react';\n \nfunction useDebounce(value, delay = 500) {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n  \n  useEffect(() => {\n    const timer = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n    \n    return () => clearTimeout(timer); // critical!\n  }, [value, delay]);\n  \n  return debouncedValue;\n}\n \n// 2. useDebouncedCallback\nfunction useDebouncedCallback(callback, delay) {\n  const callbackRef = useRef(callback);\n  \n  // Update ref so we always call the latest callback\n  useEffect(() => { callbackRef.current = callback; });\n  \n  return useMemo(() => {\n    let timer;\n    return (...args) => {\n      clearTimeout(timer);\n      timer = setTimeout(() => callbackRef.current(...args), delay);\n    };\n  }, [delay]);\n}\n \n// Usage in search:\nfunction SearchBox() {\n  const [query, setQuery] = useState('');\n  const debouncedQuery = useDebounce(query, 300);\n  const [results, setResults] = useState([]);\n  \n  useEffect(() => {\n    if (!debouncedQuery) {\n      setResults([]);\n      return;\n    }\n    \n    const controller = new AbortController();\n    fetch('/api/search?q=' + debouncedQuery, { signal: controller.signal })\n      .then(r => r.json())\n      .then(setResults)\n      .catch(err => { if (err.name !== 'AbortError') console.error(err); });\n    \n    return () => controller.abort();\n  }, [debouncedQuery]);\n  \n  return <input value={query} onChange={e => setQuery(e.target.value)} />;\n}",
"howTo": "1. Notice the goal: delay reacting to fast changes (typing) until the user pauses. That's the debounce pattern.\n2. Core idea in words: every time the value changes, cancel the previous timer and start a new one. Only when no new change comes in for X ms does the timer finish and update the output.\n3. Build it with useState to hold the debounced value, and useEffect that sets a setTimeout on every change of the input value.\n4. The most important line: the cleanup function in useEffect must clearTimeout the old timer, or you'll pile up timers instead of resetting them.\n5. If asked for a debounced function version instead of a value, use a ref to store the timer id so it survives across renders without needing state.",
"dryRun": {
"input": "User types 'cat' into a search box with useDebounce(query, 300)",
"frames": [
"User types 'c'. query becomes 'c'. Effect runs: starts a 300ms timer to update debouncedValue to 'c'.",
"50ms later, user types 'a'. query becomes 'ca'. Effect re-runs: cleanup cancels the old timer, starts a new 300ms timer for 'ca'.",
"50ms later, user types 't'. query becomes 'cat'. Effect re-runs again: cleanup cancels the 'ca' timer, starts a new 300ms timer for 'cat'.",
"User stops typing. 300ms pass with no new keystrokes.",
"The timer for 'cat' finally completes. setDebouncedValue('cat') runs. debouncedValue updates to 'cat', triggering the search API call."
],
"result": "The API is called once with 'cat', instead of three times for 'c', 'ca', and 'cat'."
},
"pitfalls": [
"Forgetting return () => clearTimeout(timer) in the cleanup — old timers pile up and fire late instead of getting canceled.",
"Putting delay outside the dependency array when it can change — a stale delay value gets used.",
"Using useDebounce on a callback (function) without useRef — the closure inside can call an old, stale version of the function.",
"Debouncing too aggressively (large delay) makes the UI feel slow to respond."
],
"patternTakeaway": "If a value changes very fast (typing, resizing, scrolling) and you only care about the value after it settles, always think a debounce hook with a setTimeout reset in useEffect cleanup.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch3-q4",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "CRITICAL — common",
"question": "Build custom hooks: useFetch, useLocalStorage, useIntersectionObserver, usePrevious.",
"explanation": "These are the four custom hooks interviewers ask about most often.\nusePrevious: remembers the value a state or prop had before the current render. It works by storing the value in a ref, and updating that ref inside useEffect — since useEffect runs AFTER the render, the ref still holds the old value during the render itself.\nuseFetch: fetches data and tracks three states — data, loading, and error. It uses AbortController in the cleanup function, so if the component unmounts or the URL changes, the old request is canceled and can't overwrite newer data.\nuseLocalStorage: keeps a piece of state in sync with the browser's localStorage. It reads the saved value once at the start, saves any new value immediately, and listens for the browser's 'storage' event so changes in other browser tabs are picked up too.\nuseIntersectionObserver: tells you when a DOM element becomes visible on screen (enters or leaves the viewport). It uses the browser's IntersectionObserver API inside useEffect, and gives you a ref to attach to the element plus a boolean for whether it's visible.",
"code": "// 1. usePrevious\nfunction usePrevious(value) {\n  const ref = useRef();\n  \n  useEffect(() => {\n    ref.current = value; // updates AFTER render\n  }, [value]);\n  \n  return ref.current; // returns value from BEFORE this render\n}\n \n// 2. useFetch\nfunction useFetch(url, options = {}) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n  \n  useEffect(() => {\n    const controller = new AbortController();\n    setLoading(true);\n    setError(null);\n    \n    fetch(url, { ...options, signal: controller.signal })\n      .then(res => {\n        if (!res.ok) throw new Error('HTTP ' + res.status);\n        return res.json();\n      })\n      .then(setData)\n      .catch(err => {\n        if (err.name !== 'AbortError') setError(err);\n      })\n      .finally(() => setLoading(false));\n    \n    return () => controller.abort();\n  }, [url]);\n  \n  return { data, loading, error };\n}\n \n// 3. useLocalStorage\nfunction useLocalStorage(key, initialValue) {\n  const [value, setValue] = useState(() => {\n    if (typeof window === 'undefined') return initialValue;\n    try {\n      const item = localStorage.getItem(key);\n      return item ? JSON.parse(item) : initialValue;\n    } catch {\n      return initialValue;\n    }\n  });\n  \n  const setStoredValue = useCallback((newValue) => {\n    try {\n      const valueToStore = newValue instanceof Function \n        ? newValue(value) \n        : newValue;\n      setValue(valueToStore);\n      localStorage.setItem(key, JSON.stringify(valueToStore));\n    } catch (err) {\n      console.error(err);\n    }\n  }, [key, value]);\n  \n  // Sync across tabs\n  useEffect(() => {\n    const handler = (e) => {\n      if (e.key === key && e.newValue) {\n        setValue(JSON.parse(e.newValue));\n      }\n    };\n    window.addEventListener('storage', handler);\n    return () => window.removeEventListener('storage', handler);\n  }, [key]);\n  \n  return [value, setStoredValue];\n}\n \n// 4. useIntersectionObserver\nfunction useIntersectionObserver(options = {}) {\n  const [isIntersecting, setIsIntersecting] = useState(false);\n  const ref = useRef(null);\n  \n  useEffect(() => {\n    if (!ref.current) return;\n    \n    const observer = new IntersectionObserver(([entry]) => {\n      setIsIntersecting(entry.isIntersecting);\n    }, options);\n    \n    observer.observe(ref.current);\n    return () => observer.disconnect();\n  }, [options.threshold, options.rootMargin]);\n  \n  return [ref, isIntersecting];\n}\n \n// Usage:\nconst [ref, isVisible] = useIntersectionObserver({ threshold: 0.5 });\n<div ref={ref}>{isVisible ? 'In view!' : 'Hidden'}</div>",
"howTo": "1. Treat this as four small, separate stories — don't try to memorize all the code, just remember the core idea behind each hook.\n2. usePrevious: store the value in a ref and update the ref inside useEffect (after render) — this way the ref still holds the OLD value during the current render.\n3. useFetch: it's just useEffect plus three pieces of state (data, loading, error), with an AbortController in cleanup so an old request can't overwrite state after the component moves on.\n4. useLocalStorage: read from localStorage once as initial state, then every time you set a new value also write it to localStorage, and listen for the browser's storage event to catch changes from other tabs.\n5. useIntersectionObserver: create an IntersectionObserver on a DOM node in useEffect, save a ref to attach to the node, and update state when the browser says the element is visible or not.\n6. Watch for the shared mistake: forgetting the cleanup function (disconnect observer, unsubscribe, abort fetch) — that's the interviewer's favorite follow-up question.",
"dryRun": {
"input": "usePrevious tracks count, which starts at 0 and becomes 1",
"frames": [
"Render 1: count=0. ref.current is still undefined (nothing set yet). usePrevious returns undefined.",
"After render 1 finishes, the effect runs: ref.current = 0.",
"User clicks a button, count becomes 1. Render 2 happens: usePrevious returns ref.current, which is still 0 (the value from before this render).",
"After render 2 finishes, the effect runs again (count changed): ref.current = 1.",
"If another render happens with count still 1, usePrevious would now return 1."
],
"result": "During render 2, the actual count is 1 but usePrevious(count) correctly returns 0, the previous value."
},
"pitfalls": [
"Updating the ref for usePrevious inside the render body instead of inside useEffect — this would make it return the CURRENT value instead of the previous one.",
"Forgetting AbortController cleanup in useFetch — a slow old request can overwrite a newer response (race condition).",
"Wrapping localStorage.getItem/JSON.parse without try/catch in useLocalStorage — corrupted storage data crashes the app.",
"Forgetting to disconnect the IntersectionObserver in cleanup — causes memory leaks when the component unmounts."
],
"patternTakeaway": "If you need a piece of behavior in more than one component (fetching, storage syncing, visibility tracking, remembering old values), always think custom hook wrapping useState/useEffect/useRef, not repeated logic in each component.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch3-q5",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "CRITICAL — every interview",
"question": "Build a Modal component with React Portal.",
"explanation": "A Portal lets you render a component's content into a different part of the HTML page, outside of its normal parent, while it still behaves like a normal part of the React tree (for example, click events still bubble up normally).\nWhy do we need this for modals?\n- A parent element with overflow:hidden or a low z-index can visually cut off or hide the modal.\n- Modals and tooltips need to appear on top of everything else, so they should live directly under the page's <body>.\nBesides the Portal itself, a good modal needs:\n- A way to close on Escape key.\n- Locking page scroll while it's open.\n- Focus management: move keyboard focus into the modal when it opens, and back to the button that opened it when it closes.\n- Accessibility attributes: role=\"dialog\" and aria-modal=\"true\", so screen readers understand it's a modal.",
"code": "import { useEffect, useRef } from 'react';\nimport { createPortal } from 'react-dom';\n \nfunction Modal({ isOpen, onClose, children, title }) {\n  const modalRef = useRef(null);\n  const previousActiveElement = useRef(null);\n  \n  // Escape key\n  useEffect(() => {\n    if (!isOpen) return;\n    const handler = (e) => { if (e.key === 'Escape') onClose(); };\n    document.addEventListener('keydown', handler);\n    return () => document.removeEventListener('keydown', handler);\n  }, [isOpen, onClose]);\n  \n  // Lock body scroll\n  useEffect(() => {\n    if (!isOpen) return;\n    const original = document.body.style.overflow;\n    document.body.style.overflow = 'hidden';\n    return () => { document.body.style.overflow = original; };\n  }, [isOpen]);\n  \n  // Focus management\n  useEffect(() => {\n    if (!isOpen) return;\n    previousActiveElement.current = document.activeElement;\n    modalRef.current?.focus();\n    return () => {\n      previousActiveElement.current?.focus(); // restore focus\n    };\n  }, [isOpen]);\n  \n  if (!isOpen) return null;\n  \n  return createPortal(\n    <div\n      className=\"modal-overlay\"\n      onClick={onClose}\n      role=\"dialog\"\n      aria-modal=\"true\"\n      aria-labelledby=\"modal-title\"\n    >\n      <div\n        ref={modalRef}\n        tabIndex={-1}\n        className=\"modal-content\"\n        onClick={(e) => e.stopPropagation()}\n      >\n        <h2 id=\"modal-title\">{title}</h2>\n        <button onClick={onClose} aria-label=\"Close\">x</button>\n        {children}\n      </div>\n    </div>,\n    document.body\n  );\n}",
"howTo": "1. First ask yourself why a normal div won't work: modals need to sit above everything, but a parent with overflow:hidden or a low z-index can trap it. That's the clue to use a Portal.\n2. Core idea: createPortal renders your JSX into a different DOM node (like document.body) while keeping it logically part of the same React tree (events still bubble normally).\n3. Build the skeleton first: isOpen check that returns null when closed, then createPortal(yourJSX, document.body) when open.\n4. Layer on the UX details one at a time: close on Escape key, lock body scroll while open, and manage focus (focus the modal on open, return focus to the trigger button on close).\n5. Don't forget accessibility: role=\"dialog\", aria-modal=\"true\", and stopPropagation on the inner content so clicking inside doesn't trigger the overlay's close-on-click.",
"dryRun": {
"input": "isOpen becomes true, user presses Escape",
"frames": [
"isOpen changes from false to true. Component no longer returns null — it renders via createPortal into document.body.",
"Effects run: previousActiveElement.current stores the currently focused button, modalRef.current.focus() moves keyboard focus into the modal, and document.body.style.overflow is set to 'hidden'.",
"A keydown listener is attached (added inside a useEffect that depends on isOpen).",
"User presses Escape. The keydown handler fires, sees e.key === 'Escape', and calls onClose().",
"onClose sets isOpen to false. Component re-renders and returns null. Cleanup functions run: body scroll is restored, the keydown listener is removed, and focus returns to the original trigger button."
],
"result": "Modal disappears, page scroll works again, and keyboard focus is back on the button that opened it."
},
"pitfalls": [
"Forgetting to reset document.body.style.overflow in the cleanup — the page stays scroll-locked even after the modal closes.",
"Not calling e.stopPropagation() on the inner content — a click inside the modal bubbles up to the overlay and closes it unintentionally.",
"Skipping focus management — keyboard and screen-reader users lose track of where they are after the modal opens or closes.",
"Trying to portal into document.body before it exists (e.g. during server-side rendering) — needs a mounted check first."
],
"patternTakeaway": "If a component needs to visually escape its parent's layout (modal, tooltip, dropdown that must sit above everything), always think createPortal into document.body.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch3-q6",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "CRITICAL — Meta, Amazon",
"question": "Build an Autocomplete / Search Suggestions component.",
"explanation": "This question tests whether you think about edge cases when building a real feature, not just rendering a dropdown.\nEdge cases to handle:\n1. Race conditions — make sure an old, slow API response can't overwrite a newer one (use AbortController).\n2. Debouncing — don't call the API on every single keystroke, wait for the user to pause.\n3. Empty state — show something when there are no results.\n4. Loading state — show a spinner or 'Loading...' text.\n5. Error state — handle when the API call fails.\n6. Keyboard navigation — Arrow Up/Down to move between suggestions, Enter to pick one, Escape to close.\n7. Click outside — close the dropdown when the user clicks elsewhere.\n8. Accessibility — use aria-autocomplete and aria-activedescendant so screen readers understand what's happening.\n9. Caching — remember results for queries you already searched, so you don't refetch them.",
"code": "function Autocomplete({ fetchSuggestions }) {\n  const [query, setQuery] = useState('');\n  const [suggestions, setSuggestions] = useState([]);\n  const [activeIndex, setActiveIndex] = useState(-1);\n  const [loading, setLoading] = useState(false);\n  const debouncedQuery = useDebounce(query, 300);\n  const cacheRef = useRef(new Map());\n  \n  useEffect(() => {\n    if (!debouncedQuery) {\n      setSuggestions([]);\n      return;\n    }\n    \n    // Check cache\n    if (cacheRef.current.has(debouncedQuery)) {\n      setSuggestions(cacheRef.current.get(debouncedQuery));\n      return;\n    }\n    \n    const controller = new AbortController();\n    setLoading(true);\n    \n    fetchSuggestions(debouncedQuery, controller.signal)\n      .then(data => {\n        cacheRef.current.set(debouncedQuery, data);\n        setSuggestions(data);\n        setActiveIndex(-1);\n      })\n      .catch(err => { if (err.name !== 'AbortError') console.error(err); })\n      .finally(() => setLoading(false));\n    \n    return () => controller.abort();\n  }, [debouncedQuery]);\n  \n  const handleKeyDown = (e) => {\n    if (e.key === 'ArrowDown') {\n      e.preventDefault();\n      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));\n    } else if (e.key === 'ArrowUp') {\n      e.preventDefault();\n      setActiveIndex(i => Math.max(i - 1, 0));\n    } else if (e.key === 'Enter' && activeIndex >= 0) {\n      selectSuggestion(suggestions[activeIndex]);\n    } else if (e.key === 'Escape') {\n      setSuggestions([]);\n    }\n  };\n  \n  return (\n    <div role=\"combobox\" aria-expanded={suggestions.length > 0}>\n      <input\n        value={query}\n        onChange={e => setQuery(e.target.value)}\n        onKeyDown={handleKeyDown}\n        aria-autocomplete=\"list\"\n        aria-activedescendant={activeIndex >= 0 ? 'item-' + activeIndex : undefined}\n      />\n      {loading && <div>Loading...</div>}\n      {!loading && suggestions.length === 0 && debouncedQuery && (\n        <div>No results found</div>\n      )}\n      <ul role=\"listbox\">\n        {suggestions.map((s, i) => (\n          <li\n            key={s.id}\n            id={'item-' + i}\n            role=\"option\"\n            aria-selected={i === activeIndex}\n            className={i === activeIndex ? 'active' : ''}\n          >\n            {s.label}\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}",
"howTo": "1. Treat this as a checklist question — the interviewer wants to see you think of edge cases, not just render a dropdown.\n2. Group the edge cases into buckets: timing (debounce so you don't call the API on every key), correctness (AbortController so an old slow response can't overwrite a newer fast one), and UX states (loading, empty, error).\n3. Add keyboard support next: track an \"active index\" number, move it with Arrow keys, select with Enter, close with Escape — this is just state plus a key handler, not magic.\n4. Mention caching briefly: store past query results in a ref (like a Map) so repeated searches don't refetch.\n5. Close with accessibility: aria-autocomplete, role=\"listbox\"/\"option\", and aria-activedescendant tell screen readers which item is highlighted.",
"dryRun": {
"input": "User types 'ap', pauses, then presses ArrowDown and Enter",
"frames": [
"User types 'a'. query='a'. debouncedQuery hasn't updated yet (still empty from before).",
"User types 'p' quickly after. query='ap'. The debounce timer resets.",
"300ms pass with no new typing. debouncedQuery becomes 'ap'. Effect runs: checks cache (miss), starts an AbortController fetch for 'ap', sets loading=true.",
"Fetch resolves with suggestions like ['apple', 'app', 'apply']. Cache stores them under key 'ap'. suggestions state updates, loading=false, activeIndex resets to -1.",
"User presses ArrowDown. activeIndex becomes 0 ('apple' is now highlighted).",
"User presses Enter. Since activeIndex >= 0, selectSuggestion(suggestions[0]) runs, picking 'apple'."
],
"result": "The input is filled with 'apple' and the dropdown closes, after exactly one API call for 'ap'."
},
"pitfalls": [
"Calling the API on every keystroke instead of debouncing — wastes requests and can feel laggy.",
"Not using AbortController — a slow response to an earlier query can overwrite fresher results (race condition).",
"Forgetting e.preventDefault() on ArrowUp/ArrowDown — the whole page scrolls instead of just moving the highlighted suggestion.",
"Not resetting activeIndex when new suggestions arrive — the highlight can point to the wrong item or an out-of-range index."
],
"patternTakeaway": "If a feature involves typing plus an async API call plus a dropdown of results, always think debounce + AbortController + loading/empty/error states + keyboard navigation, all together.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch3-q7",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "CRITICAL — Netflix, Booking",
"question": "How to implement Infinite Scroll? Why is Intersection Observer better than scroll listener?",
"explanation": "Intersection Observer is the modern and preferred way to detect when the user has scrolled near the bottom of a page.\nWhy it's better than listening to the scroll event:\n- Performance: it runs asynchronously in the browser, not on every single scroll pixel.\n- No need to manually throttle or debounce it — the browser handles the timing.\n- The browser calculates element positions for you — you don't need getBoundingClientRect(), which is slow because it forces the browser to recalculate the layout (called a 'reflow').\n- The code ends up cleaner overall.\nHow infinite scroll works: put an invisible 'loader' element at the bottom of the list. Observe it. When it becomes visible on screen, load the next page of data.\nFor very long lists (1000+ items), also consider virtualization (windowing) — a technique where only the items currently visible on screen are actually rendered in the DOM. Libraries like react-window or TanStack Virtual do this.",
"code": "function InfiniteList({ fetchPage }) {\n  const [items, setItems] = useState([]);\n  const [page, setPage] = useState(1);\n  const [hasMore, setHasMore] = useState(true);\n  const [loading, setLoading] = useState(false);\n  const loaderRef = useRef(null);\n  \n  // Load page\n  useEffect(() => {\n    if (!hasMore) return;\n    setLoading(true);\n    fetchPage(page)\n      .then(({ data, hasMore: more }) => {\n        setItems(prev => [...prev, ...data]);\n        setHasMore(more);\n      })\n      .finally(() => setLoading(false));\n  }, [page]);\n  \n  // Intersection Observer\n  useEffect(() => {\n    if (!loaderRef.current || !hasMore || loading) return;\n    \n    const observer = new IntersectionObserver(\n      ([entry]) => {\n        if (entry.isIntersecting) {\n          setPage(p => p + 1);\n        }\n      },\n      { threshold: 0.1, rootMargin: '100px' } // load before reaching bottom\n    );\n    \n    observer.observe(loaderRef.current);\n    return () => observer.disconnect();\n  }, [hasMore, loading]);\n  \n  return (\n    <div>\n      {items.map(item => <Item key={item.id} {...item} />)}\n      {hasMore && (\n        <div ref={loaderRef}>{loading ? 'Loading...' : 'Load more'}</div>\n      )}\n    </div>\n  );\n}",
"howTo": "1. Frame the question first: how do you know when the user scrolled near the bottom? Old way was a scroll event listener; new way is Intersection Observer.\n2. Explain WHY Intersection Observer wins: it runs off the main thread asynchronously, so you don't need to throttle/debounce it or manually measure element positions with getBoundingClientRect (which forces slow layout reflows).\n3. Describe the build: put an invisible \"loader\" div at the bottom of the list, observe it, and when it becomes visible, increase the page number and fetch more data.\n4. Mention rootMargin as a nice trick: setting it to something like 100px starts loading slightly before the loader is actually on screen, so scrolling feels smoother.\n5. If the list is huge (1000+ items), bring up virtualization (react-window / TanStack Virtual) as the next-level answer: only render the rows currently visible.",
"dryRun": {
"input": "A list with page 1 already loaded, user scrolls down",
"frames": [
"Component mounts. Effect 1 fetches page 1, adds items to the list, hasMore=true.",
"Effect 2 creates an IntersectionObserver watching the loader div at the bottom of the list, with rootMargin: '100px' (starts checking 100px before it's actually visible).",
"User scrolls down. The loader div comes within 100px of the viewport. The observer's callback fires with isIntersecting=true.",
"setPage(p => p + 1) runs. page becomes 2.",
"Effect 1 re-runs because page changed: fetchPage(2) is called, new items are appended to the existing list with setItems(prev => [...prev, ...data]).",
"If the response says hasMore=false, the loader div and its observer are removed — no more pages will load."
],
"result": "New items keep appending as the user scrolls, without any manual scroll-event math."
},
"pitfalls": [
"Forgetting observer.disconnect() in cleanup — leaves an observer watching a DOM node that no longer matters, causing leaks.",
"Not guarding against hasMore/loading before observing — can trigger duplicate fetches for the same page while one is still in flight.",
"Using scroll listeners with getBoundingClientRect on every scroll tick instead of Intersection Observer — hurts performance with unnecessary reflows.",
"Rendering all 1000+ items in the DOM without virtualization — the page gets slow even though data loading itself is fine."
],
"patternTakeaway": "If you need to know when an element becomes visible on screen (infinite scroll, lazy-loading images, animations on scroll), always think IntersectionObserver instead of a scroll event listener.",
"pattern": "DOM & Events"
},
{
"id": "iv-ch3-q8",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "COMMON — performance",
"question": "Explain the difference between useMemo and useCallback. When to NOT use them?",
"explanation": "useCallback gives you back a function that keeps the same reference across renders (as long as its dependencies don't change). This matters when you pass a callback to a child component wrapped in React.memo — without it, the child would think it got a 'new' function every time and re-render anyway.\nFun fact: useCallback(fn, deps) is really just useMemo(() => fn, deps) under the hood.\nuseMemo caches the RESULT of a calculation, so it doesn't need to be redone on every render — useful for expensive computations, or to keep an object/array reference stable.\nWhen NOT to use them:\n- If the component would re-render anyway regardless (for example, its child isn't wrapped in React.memo).\n- If the computation is simple — checking whether the dependencies changed also costs time, and for something cheap, that check can cost MORE than just redoing the calculation.\n- Don't add these 'just in case' — always measure first with a profiler.\nNote: in React 19+, the React Compiler can add this optimization automatically, so manual useMemo/useCallback matters less over time.",
"code": "// NOT needed - simple children\nconst Btn = ({ onClick, label }) => <button onClick={onClick}>{label}</button>;\n// useCallback here won't help — Btn isn't memoized\n \n// NEEDED - with React.memo\nconst Btn = React.memo(({ onClick, label }) => \n  <button onClick={onClick}>{label}</button>\n);\n \nfunction Parent() {\n  const handleClick = useCallback(() => {\n    console.log('clicked');\n  }, []); // stable\n  return <Btn onClick={handleClick} label=\"Click\" />;\n}\n \n// useMemo - expensive computation\nconst sortedUsers = useMemo(() => {\n  console.log('sorting...'); // runs only when users changes\n  return [...users].sort((a, b) => a.name.localeCompare(b.name));\n}, [users]);\n \n// DON'T use for trivial things:\nconst doubled = useMemo(() => count * 2, [count]);\n// useMemo overhead > savings!\n \n// Tip: useMemo also stabilizes object/array references\nconst options = useMemo(() => ({\n  threshold: 0.5,\n  rootMargin: '10px'\n}), []);\n// Without useMemo, options is a new object every render\n// -> any component that depends on it re-renders",
"howTo": "1. Give the one-line difference first: useMemo caches a VALUE (like a computed result), useCallback caches a FUNCTION reference. Under the hood useCallback(fn, deps) is just useMemo(() => fn, deps).\n2. Explain when they actually help: only when something downstream cares about reference equality, like a child wrapped in React.memo, or a dependency array of another hook.\n3. Explain when they do nothing or hurt: if the child isn't memoized, or the computation is cheap, you're paying for the comparison without getting any benefit.\n4. Give the practical test to say out loud: \"would this component re-render anyway? Is the computation actually expensive? Did I measure it?\" If no to any, skip the memo.\n5. Bonus point: mention the React Compiler (React 19+) which can auto-add this optimization, so manual useMemo/useCallback is becoming less necessary.",
"dryRun": {
"input": "Parent re-renders because unrelated state changes; child Btn is wrapped in React.memo and receives onClick",
"frames": [
"Without useCallback: Parent re-renders, and a brand-new handleClick function is created every time (a different reference).",
"Btn is React.memo, so it compares the old onClick reference to the new one — they're different — Btn re-renders even though nothing it needs actually changed.",
"Now wrap handleClick in useCallback(() => {...}, []): Parent re-renders again, but handleClick keeps the exact same reference as before.",
"Btn's React.memo comparison sees onClick is the same reference as last time, and label hasn't changed either.",
"Btn skips re-rendering entirely, since none of its props changed."
],
"result": "With useCallback + React.memo together, Btn only re-renders when its actual props change, not on every Parent render."
},
"pitfalls": [
"Using useCallback on a function passed to a non-memoized child — it does nothing, since the child re-renders regardless of the prop reference.",
"Using useMemo for a trivial calculation like count * 2 — the overhead of tracking dependencies can be more expensive than just recalculating it.",
"Forgetting to include a value the memoized function or calculation actually uses in the dependency array — causes stale closures.",
"Assuming memoization always improves performance without profiling first — sometimes it makes things slower or just adds complexity."
],
"patternTakeaway": "If you see a function or object passed as a prop to a React.memo child (or into another hook's dependency array), always think useCallback/useMemo to keep the reference stable — otherwise skip it.",
"pattern": "React Rendering & Performance"
},
{
"id": "iv-ch3-q9",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "COMMON — Senior level",
"question": "How to prevent unnecessary re-renders? List the tools.",
"explanation": "Here is a list of tools to stop React from re-rendering components that don't need to update:\n1. React.memo — skips re-rendering a component if its props are the same as last time (a shallow comparison).\n2. useMemo / useCallback — keep object/array/function props from becoming a 'new' reference on every render, so React.memo actually works.\n3. Where you put state matters — keep state as close as possible to the component that actually uses it. A local piece of state is better than one lifted high up in a parent that everything re-renders from.\n4. Split your Context — if one Context holds both fast-changing and slow-changing values, split it into two. Components that only need the slow-changing part won't re-render when the fast part changes.\n5. Libraries like Zustand or Jotai — let components subscribe to just the small piece of state they need, instead of the whole store.\n6. The key prop — a stable key stops React from destroying and rebuilding a component unnecessarily.\n7. The 'children' pattern — pass JSX as children instead of passing raw data down. Since the children were already created once by an outer, unaffected part of the tree, they don't get re-created just because a nearby state changes.\nRule of thumb: ALWAYS check with React DevTools Profiler first, before you start optimizing. Don't guess.",
"code": "// 1. Context split\nconst UserDataContext = createContext(null);\nconst UserActionsContext = createContext(null);\n// Components reading only actions don't re-render when data changes\n \n// 2. Zustand - atomic subscribe\nconst useStore = create(set => ({\n  count: 0,\n  user: null,\n  increment: () => set(s => ({ count: s.count + 1 })),\n}));\n \nfunction Counter() {\n  // Only re-renders when count changes - not user!\n  const count = useStore(s => s.count);\n  return <div>{count}</div>;\n}\n \n// 3. Children pattern (powerful!)\n// BAD: causes re-render of Children on every count update\nfunction Parent() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <button onClick={() => setCount(c => c + 1)}>{count}</button>\n      <ExpensiveChildren />\n    </div>\n  );\n}\n \n// GOOD: Children passed from outer scope - no re-render\nfunction Wrapper({ children }) {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <button onClick={() => setCount(c => c + 1)}>{count}</button>\n      {children} {/* doesn't change */}\n    </div>\n  );\n}\n \nfunction App() {\n  return (\n    <Wrapper>\n      <ExpensiveChildren /> {/* passed once */}\n    </Wrapper>\n  );\n}",
"howTo": "1. Treat this as a list-the-tools question — organize your answer from \"cheap and easy\" to \"bigger structural changes.\"\n2. Start with React.memo (skip re-render if props didn't shallow-change) and useMemo/useCallback (keep props from changing every render in the first place).\n3. Move to state placement: state that only one small part of the UI needs should live there, not lifted up to a parent that re-renders everything.\n4. Mention context splitting: if one context holds both fast-changing and slow-changing values, split it so components only subscribe to what they actually use — same idea behind Zustand/Jotai's selective subscriptions.\n5. Bring up the \"children as props\" trick: passing JSX down as children means the parent's own re-renders don't force that JSX to re-render, since it was created once by the outer scope.\n6. End with the golden rule: always confirm with React DevTools Profiler before optimizing — don't guess.",
"dryRun": {
"input": "Parent has a counter (state) and renders an ExpensiveChildren component directly inside it",
"frames": [
"BAD version: Parent holds count state, and renders <ExpensiveChildren /> directly in its own JSX.",
"User clicks the button, setCount runs, Parent re-renders.",
"Because ExpensiveChildren is created fresh inside Parent's render function, it re-renders too, even though it doesn't use count at all.",
"GOOD version: Wrapper holds count state and just renders {children}. App renders <Wrapper><ExpensiveChildren /></Wrapper>, so ExpensiveChildren is created once by App, not by Wrapper.",
"User clicks the button, setCount runs inside Wrapper, Wrapper re-renders.",
"Since children is just a reference to the same JSX App already created, React sees it hasn't changed, and ExpensiveChildren is skipped."
],
"result": "Moving state into a Wrapper and passing the expensive part as children avoids re-rendering it on every click."
},
"pitfalls": [
"Wrapping everything in React.memo without checking if props actually change — adds comparison overhead for no benefit.",
"Splitting Context but still putting both fast and slow values in one Provider's value object — a new object reference on every render defeats the split.",
"Optimizing based on guesses instead of using React DevTools Profiler to confirm what's actually re-rendering and why.",
"Forgetting that React.memo does a SHALLOW comparison — an inline object or array prop still looks 'new' every time unless memoized."
],
"patternTakeaway": "If parts of the UI re-render more than they should, always think about where state lives, whether props keep the same reference, and whether children can be passed instead of recreated — and confirm all of it with the Profiler.",
"pattern": "React Rendering & Performance"
},
{
"id": "iv-ch3-q10",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "COMMON — modern React",
"question": "What is React Fiber? How is it different from the old reconciler?",
"explanation": "React Fiber is React's internal engine for figuring out what changed and updating the screen, introduced in React 16 to replace the old engine (called the 'Stack Reconciler').\nThe problem with the old engine: it worked synchronously, meaning once React started updating, it couldn't stop until it was fully done. A big update could freeze the whole page for a moment.\nWhat Fiber does differently: it splits the work into small pieces called 'units of work'. Because the work is broken into pieces, React can pause it, continue it later, throw it away, or work on something more urgent first.\nWhat this makes possible: Concurrent features, Suspense, Time Slicing (spreading work across multiple frames), Transitions (marking updates as 'not urgent'), and Automatic Batching.\nFiber's process has two phases:\n- Render phase: builds the new virtual tree. This can be paused and resumed.\n- Commit phase: actually applies the changes to the real DOM. This always runs in one go, without pausing, so the user never sees a half-finished update.",
"code": "// Fiber enables prioritization\nimport { startTransition, useDeferredValue } from 'react';\n \nfunction handleSearch(value) {\n  setInputValue(value); // urgent - immediate\n  \n  startTransition(() => {\n    setSearchResults(filterData(value)); // non-urgent\n  });\n}\n \n// useDeferredValue\nfunction Results({ query }) {\n  const deferredQuery = useDeferredValue(query);\n  // deferredQuery updates after urgent updates finish\n  return <ExpensiveList query={deferredQuery} />;\n}\n \n// useTransition - shows pending state\nfunction TabList() {\n  const [tab, setTab] = useState('home');\n  const [isPending, startTransition] = useTransition();\n  \n  function selectTab(newTab) {\n    startTransition(() => setTab(newTab));\n  }\n  \n  return (\n    <>\n      {isPending && <Spinner />}\n      <Content tab={tab} />\n    </>\n  );\n}",
"howTo": "1. Give context first: Fiber is React's internal engine for reconciliation, introduced in v16 to replace the old \"Stack Reconciler.\"\n2. State the core problem it solves: the old reconciler worked synchronously and couldn't be paused, so a big update could freeze the page. Fiber breaks work into small units it can pause, resume, or throw away.\n3. Say what this unlocks in plain words: React can now do urgent updates (typing) first and less urgent updates (search results) later, instead of doing everything in one blocking pass.\n4. Name the two phases if pushed further: the render phase (interruptible, builds the new tree) and the commit phase (must run all at once, applies changes to the real DOM).\n5. If asked for code, connect it to startTransition / useTransition / useDeferredValue — these are the APIs that let developers actually use Fiber's prioritization.",
"dryRun": {
"input": "User types in a search box (urgent) while a large search-results list also needs updating (non-urgent), using startTransition",
"frames": [
"User types a letter. setInputValue(value) runs immediately — this is marked urgent, so React updates the input box right away.",
"startTransition(() => setSearchResults(filterData(value))) runs — this update is marked as non-urgent (a 'transition').",
"React starts the render phase for the search results update, but because it's low priority, React can pause this work if something more urgent comes in.",
"User types another letter before the results update finishes. React pauses/discards the in-progress low-priority render phase and handles the new urgent input update first.",
"Once no more urgent input comes in, React resumes and finishes the render phase for the search results.",
"Commit phase runs: the finished results update is applied to the real DOM all at once."
],
"result": "The input box stays instantly responsive while the results list updates slightly after, without ever freezing the typing experience."
},
"pitfalls": [
"Thinking Fiber changed WHAT React renders — it only changed HOW the update work is scheduled and processed internally.",
"Forgetting the commit phase is NOT interruptible — only the render/build phase can pause; the actual DOM update always finishes in one go.",
"Using startTransition for something that should feel instant (like the input's own displayed value) — that should stay a normal, urgent update.",
"Assuming useTransition/useDeferredValue are needed everywhere — they only help with specific slow, non-urgent updates, not everything."
],
"patternTakeaway": "If asked why big React updates don't freeze the page or how React prioritizes urgent vs non-urgent updates, always think Fiber's interruptible unit-of-work model, and mention startTransition/useDeferredValue as the developer-facing APIs.",
"pattern": "React Rendering & Performance"
},
{
"id": "iv-ch3-q11",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "COMMON — useReducer",
"question": "When to use useReducer instead of useState?",
"explanation": "useReducer is a better choice than useState when:\n- Your state has complicated logic with several related pieces (sub-values) that update together.\n- The next state depends on the previous state in a complicated way.\n- Multiple components need to share the same update logic.\n- You want state changes to be predictable and easy to trace.\nA 'reducer' is just a pure function with this shape: (state, action) => newState. You give it the current state and a description of what happened (the action), and it gives you back the new state.\nBenefits:\n- You can test the reducer function completely by itself, without rendering any component.\n- All your update logic lives in one place instead of being scattered across many setState calls.\n- It's a familiar pattern if you've used Redux before.",
"code": "// Without reducer - getting complex\nconst [name, setName] = useState('');\nconst [email, setEmail] = useState('');\nconst [age, setAge] = useState(0);\nconst [errors, setErrors] = useState({});\nconst [submitting, setSubmitting] = useState(false);\nconst [touched, setTouched] = useState({});\n// many setState calls scattered around...\n \n// With reducer - cleaner\nconst initialState = {\n  values: { name: '', email: '', age: 0 },\n  errors: {},\n  submitting: false,\n  touched: {},\n};\n \nfunction reducer(state, action) {\n  switch (action.type) {\n    case 'change':\n      return {\n        ...state,\n        values: { ...state.values, [action.field]: action.value },\n        touched: { ...state.touched, [action.field]: true },\n      };\n    case 'submit_start':\n      return { ...state, submitting: true };\n    case 'submit_success':\n      return initialState;\n    case 'submit_error':\n      return { ...state, submitting: false, errors: action.errors };\n    case 'validate':\n      return { ...state, errors: validateForm(state.values) };\n    default:\n      return state;\n  }\n}\n \nfunction Form() {\n  const [state, dispatch] = useReducer(reducer, initialState);\n  \n  const handleChange = (field) => (e) =>\n    dispatch({ type: 'change', field, value: e.target.value });\n  \n  const handleSubmit = async (e) => {\n    e.preventDefault();\n    dispatch({ type: 'submit_start' });\n    try {\n      await api.submit(state.values);\n      dispatch({ type: 'submit_success' });\n    } catch (err) {\n      dispatch({ type: 'submit_error', errors: err.fields });\n    }\n  };\n  \n  return <form onSubmit={handleSubmit}>...</form>;\n}\n \n// Lazy initial state\nfunction init(initialCount) {\n  return { count: initialCount };\n}\nconst [state, dispatch] = useReducer(reducer, 0, init);\n// init runs once with the third argument",
"howTo": "1. Ask yourself: is my state simple (one or two independent values) or tangled (many fields that update together, or updates that depend on complex previous state)? Tangled means useReducer.\n2. Explain the reducer idea in one sentence: it's a single pure function (state, action) => newState, so all your update logic lives in one place instead of scattered across many setState calls.\n3. Give the practical signal an interviewer wants to hear: forms with many fields, undo/redo, or multiple components needing the same update logic are classic useReducer use cases.\n4. Mention testability as a bonus: because the reducer is just a function, you can test it directly with sample actions, no rendering needed.\n5. If asked to code it, start with the shape of the state object, then write the switch statement action by action, then wire up dispatch calls in the component last.",
"dryRun": {
"input": "A form with a reducer handling a text field change, then a submit",
"frames": [
"Initial state: { values: {name: '', email: '', age: 0}, errors: {}, submitting: false, touched: {} }.",
"User types in the name field. dispatch({type: 'change', field: 'name', value: 'Roee'}) runs.",
"Reducer's 'change' case runs: it returns a new state with values.name updated to 'Roee' and touched.name set to true — everything else copied unchanged with spread.",
"User submits the form. dispatch({type: 'submit_start'}) runs — reducer sets submitting: true.",
"The API call succeeds. dispatch({type: 'submit_success'}) runs — reducer resets state back to initialState.",
"If the API call had failed instead, dispatch({type: 'submit_error', errors}) would set submitting: false and fill in errors."
],
"result": "All state transitions happen through one predictable function, and the component only needs to call dispatch, never manage each field's setState directly."
},
"pitfalls": [
"Mutating state directly inside the reducer (state.values.name = value) instead of returning a new object with spread — breaks React's change detection.",
"Forgetting a default case in the switch statement — dispatching an unknown action type can silently do nothing or throw.",
"Using useReducer for genuinely simple state (like one boolean toggle) — adds unnecessary boilerplate over plain useState.",
"Not using the lazy initializer (third argument to useReducer) when the initial state needs an expensive computation — otherwise it runs on every render just to be thrown away."
],
"patternTakeaway": "If a component has several related pieces of state that update together in complex ways (forms, multi-step flows, undo/redo), always think useReducer with a pure (state, action) => newState function instead of many useState calls.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch3-q12",
"guide": "Interview Guide",
"topic": "React Deep Dive",
"topicNum": 3,
"level": "Medium",
"badge": "COMMON — Senior level",
"question": "Controlled vs Uncontrolled components. When to use which?",
"explanation": "Controlled component: the form's data lives in React state. You give the input a value and an onChange handler, so React fully controls what's shown.\nUncontrolled component: the form's data lives in the DOM itself, not in React state. You use defaultValue (an initial value only) and a ref to read the current value when you need it (like on submit).\nUse Controlled when:\n- You need to validate the input as the user types.\n- You want to control formatting (like adding commas to a number).\n- You need to enable/disable the submit button based on what's typed.\n- Several inputs depend on each other's values.\nUse Uncontrolled when:\n- The form is simple and doesn't need live validation.\n- You're integrating with a non-React library that manages its own DOM.\n- It's a file input — file inputs are ALWAYS uncontrolled, the browser must own that value for security reasons.\n- Performance really matters and you want to avoid a re-render on every keystroke.\nNote: libraries like React Hook Form use uncontrolled inputs internally (for speed) but still give you validation on top — the best of both approaches.",
"code": "// Controlled\nfunction ControlledForm() {\n  const [name, setName] = useState('');\n  \n  return (\n    <input\n      value={name}\n      onChange={(e) => setName(e.target.value)}\n    />\n  );\n}\n \n// Uncontrolled\nfunction UncontrolledForm() {\n  const inputRef = useRef(null);\n  \n  const handleSubmit = (e) => {\n    e.preventDefault();\n    console.log('Name:', inputRef.current.value);\n  };\n  \n  return (\n    <form onSubmit={handleSubmit}>\n      <input defaultValue=\"initial\" ref={inputRef} />\n      <button>Submit</button>\n    </form>\n  );\n}\n \n// File input - always uncontrolled\nfunction FileUpload() {\n  const fileRef = useRef(null);\n  \n  const handleUpload = () => {\n    const file = fileRef.current.files[0];\n    // upload file\n  };\n  \n  return (\n    <>\n      <input type=\"file\" ref={fileRef} />\n      <button onClick={handleUpload}>Upload</button>\n    </>\n  );\n}\n \n// React Hook Form - best of both worlds\n// Uses uncontrolled internally for performance,\n// but provides validation and submission handling\nimport { useForm } from 'react-hook-form';\n \nfunction Form() {\n  const { register, handleSubmit, formState: { errors } } = useForm();\n  \n  const onSubmit = (data) => console.log(data);\n  \n  return (\n    <form onSubmit={handleSubmit(onSubmit)}>\n      <input {...register('name', { required: true })} />\n      {errors.name && <span>Required</span>}\n      <button>Submit</button>\n    </form>\n  );\n}",
"howTo": "1. Give the one-line difference: controlled means React state is the source of truth (value + onChange); uncontrolled means the DOM itself holds the value (defaultValue + ref).\n2. Use a simple test to decide which to recommend: do you need to validate, format, or react to every keystroke? If yes, controlled. If it's a simple one-time read on submit, uncontrolled is fine and faster.\n3. Remember the special case: file inputs are always uncontrolled — the browser must own that value for security reasons.\n4. Mention performance: controlled inputs re-render on every keystroke; for very large forms this can matter, which is why libraries like React Hook Form use uncontrolled inputs internally but still expose a validation API.\n5. If asked to code both, show the controlled version first (value/onChange) since it's more common, then the uncontrolled version (ref + defaultValue) as contrast.",
"dryRun": {
"input": "Compare typing 'Roee' into a controlled input vs an uncontrolled input",
"frames": [
"Controlled: user types 'R'. onChange fires, setName('R') runs, component re-renders, and the input's displayed value comes from the name state (now 'R').",
"Controlled: user types 'o'. Same cycle again — onChange, setName('Ro'), re-render. This happens on every single keystroke.",
"Uncontrolled: user types 'R', 'o', 'e', 'e' into the input. The DOM manages this internally. No React re-render happens for any of these keystrokes.",
"Uncontrolled: user clicks Submit. handleSubmit reads inputRef.current.value, which is 'Roee' — read directly from the DOM at that moment."
],
"result": "Controlled re-renders on every keystroke and always knows the current value; uncontrolled avoids those re-renders and only reads the value when asked (like on submit)."
},
"pitfalls": [
"Mixing controlled and uncontrolled on the same input (giving it both value and defaultValue, or switching value between undefined and a string) — React warns about a component changing from uncontrolled to controlled.",
"Forgetting file inputs can never be controlled with a value prop — always use a ref for them.",
"Using controlled inputs for a very large form and wondering why typing feels sluggish — that's expected, since every keystroke triggers a re-render.",
"Reading inputRef.current.value before the ref is attached (e.g., during the very first render) — it will be null."
],
"patternTakeaway": "If you need to validate, format, or react to input on every keystroke, always think controlled (value + onChange); if you just need the final value once (like on submit) or it's a file input, think uncontrolled (ref + defaultValue).",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch4-q1",
"guide": "Interview Guide",
"topic": "Bug Finding & Fixing",
"topicNum": 4,
"level": "Medium",
"badge": "Bug Finding Questions",
"question": "What is the bug? How to fix?",
"explanation": "The bug: handleClick calls setCount(count + 1) three times in a row. But 'count' is the same number all three times — it never changes between these calls, because it was captured once when the component last rendered. React batches these updates, so all three calls really say 'set count to (old count) + 1'. The result: count only goes up by 1, not 3. Fix: use the function form setCount(prev => prev + 1). This way, each call gets the newest pending value instead of the old one.",
"code": "// BUG\nfunction handleClick() {\n  setCount(count + 1);\n  setCount(count + 1);\n  setCount(count + 1);\n  // count goes up by 1 only!\n}\n \n// FIX\nfunction handleClick() {\n  setCount(prev => prev + 1);\n  setCount(prev => prev + 1);\n  setCount(prev => prev + 1);\n  // count goes up by 3\n}",
"howTo": "1. First read what the code is trying to do: call setCount three times in a row and expect the count to jump by 3.\n2. Narrow it down by asking: what value does `count` hold inside this function? It's the same snapshot from this render for all three calls — that's the clue.\n3. Say the bug out loud: setCount(count + 1) called three times uses the same stale `count` each time, so React just applies \"set it to count+1\" three times, not \"add 1\" three times.\n4. State the fix: use the functional form setCount(prev => prev + 1), which always receives the latest pending state, so the three calls stack correctly.\n5. Remember the rule for interviews: whenever a new state value depends on the previous one, prefer the functional updater over reading the variable directly.",
"dryRun": {
"input": "count starts at 0. User clicks the button once, which calls handleClick.",
"frames": [
"handleClick runs. count is 0 in this render — that value is 'locked in' for the whole function call.",
"setCount(count + 1) runs → this means setCount(0 + 1) → setCount(1).",
"setCount(count + 1) runs again → count is STILL 0 in this closure → setCount(0 + 1) → setCount(1) again.",
"setCount(count + 1) runs a third time → same thing → setCount(1) again.",
"React applies these updates. The last one wins: count becomes 1, not 3."
],
"result": "Buggy output: count = 1. Expected output: count = 3."
},
"pitfalls": [
"The same bug can hide in a loop, e.g. for (let i=0;i<3;i++) setCount(count+1) — still uses the same stale count each time.",
"Reading count right after calling setCount (on the very next line) still shows the old value, because state updates are not immediate.",
"Mixing setCount(count+1) with setCount(prev=>prev+1) in the same handler can still give confusing results — be consistent.",
"The same 'stale value' problem can happen with useReducer if you read a variable from outside instead of relying on the dispatched action."
],
"patternTakeaway": "If you see the same state variable read more than once inside one event handler, and each read should reflect the latest value, always switch to the functional updater form setX(prev => ...).",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch4-q2",
"guide": "Interview Guide",
"topic": "Bug Finding & Fixing",
"topicNum": 4,
"level": "Medium",
"badge": null,
"question": "What are the bugs in this useEffect?",
"explanation": "There are two bugs here. First: fetchData uses userId inside the effect, but userId is missing from the dependency array. ESLint's hooks rule would normally warn about this — the effect might not re-run correctly when userId changes. Second, and trickier: this is a race condition. If the user changes userId quickly, two requests can be in flight at once. If the FIRST (older) request happens to finish AFTER the second (newer) one, its old data overwrites the new, correct data — the user ends up seeing data for the wrong person. Fix: use an AbortController to cancel old requests, or use a simple 'cancelled' flag so a late response gets ignored once a newer one has already arrived.",
"code": "// BUG\nuseEffect(() => {\n  fetchData(userId).then(setData);\n}, [userId]);\n \n// FIX\nuseEffect(() => {\n  const controller = new AbortController();\n  \n  fetch('/api/user/' + userId, { signal: controller.signal })\n    .then(r => r.json())\n    .then(setData)\n    .catch(err => {\n      if (err.name !== 'AbortError') setError(err);\n    });\n  \n  return () => controller.abort();\n}, [userId]);\n \n// Alternative - flag (less efficient but simple)\nuseEffect(() => {\n  let cancelled = false;\n  fetchData(userId).then(data => {\n    if (!cancelled) setData(data);\n  });\n  return () => { cancelled = true; };\n}, [userId]);",
"howTo": "1. Read the effect and ask two questions: does it use any outside variable? does it fetch something that takes time? Both point to the two bugs here.\n2. First bug: userId is used inside the effect but isn't in the dependency array, so the effect won't re-run when userId changes — ESLint's exhaustive-deps rule would flag this.\n3. Second bug (subtler): even if userId is in the deps array, a fast user could change userId before an old fetch finishes, and that old response could land AFTER the new one and overwrite it with stale data.\n4. Fix step 1: add userId to the dependency array so the effect re-runs correctly.\n5. Fix step 2: use an AbortController (or a cancelled flag) in the cleanup function to cancel/ignore outdated requests, so only the latest response updates state.",
"dryRun": {
"input": "userId goes from 1 to 2 quickly. Fetching user 1 takes 3 seconds. Fetching user 2 takes 1 second.",
"frames": [
"userId=1. Effect runs. fetchData(1) starts. It will take 3 seconds to finish.",
"User quickly changes userId to 2. Effect re-runs. fetchData(2) starts. It will take 1 second to finish.",
"1 second passes. fetchData(2) finishes first. setData(user2Data) runs. Screen correctly shows user 2.",
"3 seconds pass. fetchData(1) finally finishes (it was slow). Nothing stopped it, so setData(user1Data) runs anyway.",
"Screen now shows user 1's data, even though userId is 2. The wrong user is displayed."
],
"result": "Buggy output: screen shows stale user-1 data after the race. Expected: only the response matching the current userId should ever update the screen."
},
"pitfalls": [
"Even after adding userId to the dependency array, the race condition (old response overwriting new one) is still there unless you cancel or ignore stale responses.",
"Forgetting to check err.name !== 'AbortError' means a request you cancelled on purpose will still show a scary error to the user.",
"The cleanup function must actually run — forgetting to return it from useEffect leaves the bug in place.",
"If fetchData is defined inside the component without useCallback, it may also need to be listed as a dependency, which can cause extra effect runs."
],
"patternTakeaway": "If an effect starts an async request and a fast-changing value (like userId) can trigger it again before the previous request finishes, always suspect a race condition and add cancellation or a cancelled flag.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch4-q3",
"guide": "Interview Guide",
"topic": "Bug Finding & Fixing",
"topicNum": 4,
"level": "Medium",
"badge": null,
"question": "What is wrong with this custom hook?",
"explanation": "Two bugs here. Bug 1: useState(window.innerWidth) tries to read window.innerWidth the moment the component is created. On a server (server-side rendering, SSR), there is no window object at all, so this crashes the app. Bug 2: the resize listener is added inside useEffect, but there is no cleanup function to remove it. Every time this hook is used and the component mounts again, a new listener is added and the old ones are never removed — this is a memory leak. Fix: start width with a safe default like 0, only read window.innerWidth inside useEffect (which only runs in the browser, never on the server), and return a cleanup function that removes the listener.",
"code": "// BUG\nfunction useWindowWidth() {\n  const [width, setWidth] = useState(window.innerWidth); // SSR crash!\n  useEffect(() => {\n    window.addEventListener('resize', () => setWidth(window.innerWidth));\n  }, []); // missing cleanup\n  return width;\n}\n \n// FIX\nfunction useWindowWidth() {\n  const [width, setWidth] = useState(0); // SSR-safe\n  \n  useEffect(() => {\n    setWidth(window.innerWidth); // only in browser\n    const handler = () => setWidth(window.innerWidth);\n    window.addEventListener('resize', handler);\n    return () => window.removeEventListener('resize', handler);\n  }, []);\n  \n  return width;\n}",
"howTo": "1. Look at what runs immediately when the component is defined, versus what runs only in the browser — that split is where SSR bugs hide.\n2. First bug: useState(window.innerWidth) runs during the initial render, and on the server there is no `window` object, so this crashes in SSR.\n3. Second bug: the resize listener is added in useEffect but there's no cleanup, so every time this hook mounts/unmounts, listeners pile up — a memory leak.\n4. Fix the first bug by giving useState a safe default (like 0) and only reading window.innerWidth inside useEffect, which only runs in the browser.\n5. Fix the second bug by naming the handler function and returning window.removeEventListener(...) from the effect.",
"dryRun": {
"input": "The app is rendered on a server first (SSR). Later, in the browser, the component mounts and unmounts twice.",
"frames": [
"Server renders the component. useState(window.innerWidth) runs immediately. On the server 'window' does not exist, so the app crashes with an error.",
"(Skipping ahead to the browser, to see the second bug.) The component mounts. useEffect adds a 'resize' listener. No cleanup function is returned.",
"The component unmounts (user navigates away). React has no cleanup to run, so the listener stays attached, listening forever.",
"The component mounts again (user comes back). Another 'resize' listener gets added. Now two listeners are doing the same job.",
"Every time the window is resized, setWidth is called twice (or more) — wasted work, and over time, a real memory leak."
],
"result": "Buggy output: crash on the server, and listeners quietly pile up in the browser. Expected: a safe render on the server and exactly one listener at a time."
},
"pitfalls": [
"Any browser-only API (window, document, localStorage, navigator) read outside useEffect or an event handler can crash SSR the same way.",
"Even with a cleanup function, using two separate inline arrow functions instead of one named handler can break removeEventListener too.",
"Forgetting to call setWidth(window.innerWidth) once inside useEffect means width stays at the default value until the first resize happens.",
"A leaking custom hook used in many components multiplies the leak — one bad hook used in 50 components means 50 leaks."
],
"patternTakeaway": "If you see a browser-only global (window, document, localStorage) read outside useEffect, or an addEventListener with no matching removeEventListener in cleanup, always suspect an SSR crash or a memory leak.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch4-q4",
"guide": "Interview Guide",
"topic": "Bug Finding & Fixing",
"topicNum": 4,
"level": "Medium",
"badge": null,
"question": "What is the bug? Component not updating.",
"explanation": "The bug: the code changes the todo object directly with todo.done = !todo.done, then calls setTodos(todos) using the exact same array. React decides whether state changed by comparing references (is this the same object in memory as before?), not by checking every value inside. Since todos is still literally the same array as before, React thinks nothing changed and skips re-rendering. Golden rule: never change React state directly. Always build a new object or array and give that new one to the setter function.",
"code": "// BUG\nfunction TodoList() {\n  const [todos, setTodos] = useState([\n    { id: 1, text: 'Buy milk', done: false }\n  ]);\n  \n  const toggleTodo = (id) => {\n    const todo = todos.find(t => t.id === id);\n    todo.done = !todo.done; // mutating!\n    setTodos(todos); // same reference - no re-render!\n  };\n}\n \n// FIX 1: create new array\nconst toggleTodo = (id) => {\n  setTodos(todos.map(t => \n    t.id === id ? { ...t, done: !t.done } : t\n  ));\n};\n \n// FIX 2: with Immer (if logic is complex)\nimport { produce } from 'immer';\n \nconst toggleTodo = (id) => {\n  setTodos(produce(todos, draft => {\n    const todo = draft.find(t => t.id === id);\n    todo.done = !todo.done; // looks mutating but is immutable\n  }));\n};\n \n// FIX 3: functional update\nconst toggleTodo = (id) => {\n  setTodos(prev => prev.map(t => \n    t.id === id ? { ...t, done: !t.done } : t\n  ));\n};\n \n// More mutation bug examples:\n// BAD:  todos.push(newTodo);\n// GOOD: setTodos([...todos, newTodo]);\n \n// BAD:  todos.sort((a,b) => a.id - b.id);\n// GOOD: setTodos([...todos].sort((a,b) => a.id - b.id));\n \n// BAD:  obj.name = 'New';\n// GOOD: setObj({...obj, name: 'New'});",
"howTo": "1. First question to ask: did the UI just not update even though the code clearly \"changed\" the data? That's the signature of a mutation bug.\n2. Look for direct property/array mutation — anywhere you see obj.field = x or array.push(...) followed by calling setState with that SAME variable, that's the red flag.\n3. Explain why it fails: React compares state by reference (Object.is), not by deep value. If you mutate the old object and pass the same reference back to setState, React thinks nothing changed and skips re-render.\n4. State the fix in one sentence: always build a brand-new object or array (with spread, .map, or a library like Immer) instead of editing the existing one in place.\n5. Give the golden rule to close: treat React state as read-only — copy, then change the copy, then setState the copy.",
"dryRun": {
"input": "todos = [{id:1, text:'Buy milk', done:false}]. User clicks 'toggle' on todo id 1.",
"frames": [
"toggleTodo(1) runs. todo = todos.find(t => t.id === 1) — this is a reference to the real object inside the array, not a copy.",
"todo.done = !todo.done — this changes the object directly in memory. todos[0].done is now already true.",
"setTodos(todos) is called — but 'todos' is literally the same array reference as before this function ran.",
"React compares the new todos to the old todos by reference (Object.is). Since it's the same reference, React sees no change.",
"React skips re-rendering. The checkbox on screen still looks unchecked, even though the data behind it already changed."
],
"result": "Buggy output: internal data says done: true, but the screen still shows done: false. Expected: the screen updates immediately to reflect the change."
},
"pitfalls": [
"The same bug happens with arrays: todos.push(newTodo) then setTodos(todos) also silently fails to re-render.",
"Sorting in place, like todos.sort(...), mutates the array too — always sort a copy: [...todos].sort(...).",
"Nested objects need a new copy at every level you change, not just the top level — e.g. {...user, address: {...user.address, city: 'X'}}.",
"Sometimes this bug 'accidentally works' because some OTHER state change causes a re-render right after — this can hide the bug until that other change is removed."
],
"patternTakeaway": "If you see a variable changed in place (obj.field = x, array.push(...), array.sort(...)) right before being passed back into a setState call, always suspect a mutation bug — build a new copy instead.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch4-q5",
"guide": "Interview Guide",
"topic": "Bug Finding & Fixing",
"topicNum": 4,
"level": "Medium",
"badge": null,
"question": "What is the bug? Effect runs in infinite loop.",
"explanation": "The bug: options is a brand-new object every time the component renders — { id: user.id, type: 'profile' } creates a new object each time, even when the values inside look the same. useEffect compares dependencies by reference, not by value. Since options is a new object every render, useEffect thinks it changed and runs again. Inside, it calls setData, which triggers another render. That render creates yet another new options object. The effect runs again. This repeats forever — an infinite loop. Fix: wrap the object creation in useMemo so it only builds a new object when user.id actually changes, or depend directly on the primitive value user.id instead of the whole object.",
"code": "// BUG - infinite loop!\nfunction Component({ user }) {\n  const [data, setData] = useState(null);\n  \n  const options = { id: user.id, type: 'profile' };\n  // options is a new object every render!\n  \n  useEffect(() => {\n    fetchData(options).then(setData);\n  }, [options]); // always different reference!\n  \n  return <div>{data?.name}</div>;\n}\n \n// FIX 1: useMemo\nconst options = useMemo(\n  () => ({ id: user.id, type: 'profile' }),\n  [user.id]\n);\nuseEffect(() => {\n  fetchData(options).then(setData);\n}, [options]);\n \n// FIX 2: depend on specific properties\nuseEffect(() => {\n  fetchData({ id: user.id, type: 'profile' }).then(setData);\n}, [user.id]);\n \n// FIX 3: extract outside component (if static)\nconst defaultOptions = { type: 'profile' };\n \nfunction Component({ user }) {\n  useEffect(() => {\n    fetchData({ ...defaultOptions, id: user.id }).then(setData);\n  }, [user.id]);\n}\n \n// Common patterns of the same bug:\n// BAD: useEffect(() => {}, [{ key: value }]);  // object literal\n// BAD: useEffect(() => {}, [() => {}]);        // function literal\n// BAD: useEffect(() => {}, [[1, 2, 3]]);       // array literal",
"howTo": "1. Spot the symptom first: an effect keeps firing over and over. That almost always means something in its dependency array is never actually equal between renders.\n2. Look inside the render body (not inside the effect) for an object, array, or function created fresh every time — here it's `const options = {...}` sitting outside useEffect.\n3. Explain the loop out loud: new render creates a new options object -> effect sees a different reference -> effect runs -> calls setState -> triggers another render -> new options object again -> forever.\n4. Fix option 1: wrap the object creation in useMemo so it only changes when its own inputs (like user.id) change.\n5. Fix option 2 (often simpler): don't depend on the whole object at all — depend on the primitive values you actually need, like [user.id].",
"dryRun": {
"input": "user.id = 5. The component renders for the first time.",
"frames": [
"Render #1: options = { id: 5, type: 'profile' } — call this Object A. useEffect sees Object A as new, so it runs: fetchData(A) then setData(result).",
"setData triggers Render #2. options = { id: 5, type: 'profile' } again — but this is Object B, a different object in memory, even though the values look the same.",
"useEffect compares Object A (old) to Object B (new) by reference. They are different objects, so React thinks the dependency changed.",
"useEffect runs again: fetchData(B) then setData(result), which triggers Render #3, which creates Object C...",
"This keeps repeating — render, new object, effect runs, setData, render again — forever."
],
"result": "Buggy output: infinite render loop, the app freezes or spams the network with requests. Expected: the effect should only run once, when user.id actually changes."
},
"pitfalls": [
"Same trap with array literals in deps: useEffect(() => {}, [[1,2,3]]) — a new array every render.",
"Same trap with inline function literals: useEffect(() => {}, [() => {}]) — a new function every render.",
"useMemo itself needs the right dependency array ([user.id]), not an empty array, or the memoized object will go stale and never update.",
"An object prop passed down from a parent that also recreates it every render causes the same infinite loop, even if the child component looks fine on its own."
],
"patternTakeaway": "If you see an object, array, or function created directly inside the render body and then placed in a useEffect/useMemo/useCallback dependency array, always suspect a new-reference-every-render bug.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch4-q6",
"guide": "Interview Guide",
"topic": "Bug Finding & Fixing",
"topicNum": 4,
"level": "Medium",
"badge": null,
"question": "What is the bug? Memory leak in event listener.",
"explanation": "Two separate bugs here, both about event listeners. Bug 1: the effect adds a click listener every time it runs (whenever count changes), but there is no cleanup function to remove the old listener first. So every time count changes, another listener gets added on top of the old ones, which are never removed. A single click now fires many listeners at once, each using its own old, stale value of count. Bug 2: even when a cleanup function exists, it must remove the exact same function reference that was added. Here, () => doSomething() is written twice as two separate inline arrow functions. They look identical, but in memory they are two different functions — calling removeEventListener with the second one does not remove the first one. Fix: save the handler in a named variable and use that same variable for both addEventListener and removeEventListener.",
"code": "// BUG 1 - missing cleanup\nuseEffect(() => {\n  document.addEventListener('click', () => {\n    console.log(count); // stale closure!\n  });\n}, [count]);\n// On every count change, a new listener is added,\n// the old ones are NOT removed -> leak + multiple firings\n \n// FIX\nuseEffect(() => {\n  const handler = () => console.log(count);\n  document.addEventListener('click', handler);\n  return () => document.removeEventListener('click', handler);\n}, [count]);\n \n// BUG 2 - cleanup removes a different reference!\nuseEffect(() => {\n  document.addEventListener('click', () => doSomething());\n  return () => {\n    document.removeEventListener('click', () => doSomething());\n    // Different reference! Doesn't remove anything!\n  };\n}, []);\n \n// FIX\nuseEffect(() => {\n  const handler = () => doSomething();\n  document.addEventListener('click', handler);\n  return () => document.removeEventListener('click', handler);\n}, []);",
"howTo": "1. Ask first: is a NEW function being created and passed to addEventListener on every run of the effect? If yes, that's usually the root problem.\n2. Bug 1 to check: is there a cleanup function at all? If the effect adds a listener but never removes it, each re-run of the effect (triggered by a dependency like count changing) stacks another listener on top of the old ones.\n3. Bug 2 to check, if cleanup exists: does removeEventListener get the EXACT SAME function reference that was passed to addEventListener? An inline arrow function like () => doSomething() creates a new function each time, so \"removing\" it doesn't remove anything.\n4. Fix both by extracting the handler into a named variable (const handler = () => {...}) once per effect run, then use that same variable for both addEventListener and removeEventListener in the cleanup.\n5. Remember the underlying rule: every addEventListener inside an effect needs a matching removeEventListener in cleanup, using the identical function reference.",
"dryRun": {
"input": "Component renders 3 times as count changes: 0, then 1, then 2. Then the user clicks.",
"frames": [
"Render with count=0: useEffect runs, adds a click listener that will log count (0). No cleanup happens.",
"count changes to 1: effect runs again (count is a dependency), adds another click listener that will log count (1). The first listener from count=0 is still attached.",
"count changes to 2: effect runs again, adds a third click listener logging count (2). All 3 listeners are still attached — none were ever removed.",
"User clicks anywhere on the document. All 3 listeners fire: they log 0, then 1, then 2.",
"Only one listener (the current one, logging 2) was expected to fire — instead 3 fire, and 2 of them log stale, wrong values."
],
"result": "Buggy output: one click triggers 3 console logs (0, 1, 2), and this list grows every time count changes. Expected: exactly one log, showing the current count."
},
"pitfalls": [
"Removing a listener with a brand-new inline arrow function (even one that does the exact same thing) never actually removes anything — always check the handler is the same reference.",
"Using an empty dependency array ([]) when you actually need [count] creates a stale closure that always logs the very first count value forever.",
"The same reference issue applies to .bind(this) called twice — it creates two different function objects each time.",
"Cleanup functions must remove listeners from the same target (document vs. a specific DOM node) that they were added to."
],
"patternTakeaway": "If you see addEventListener inside an effect, always check that there is a cleanup calling removeEventListener, and that both calls use the exact same named function reference, not two separate inline functions.",
"pattern": "DOM & Events"
},
{
"id": "iv-ch4-q7",
"guide": "Interview Guide",
"topic": "Bug Finding & Fixing",
"topicNum": 4,
"level": "Medium",
"badge": null,
"question": "What is the bug? Timer in component.",
"explanation": "The bug: setInterval starts a timer that keeps calling setSeconds every second, forever. But there is no cleanup function returned from useEffect, so the interval is never stopped. When the component unmounts (for example, the user navigates to another page), the interval keeps running in the background. It keeps trying to call setSeconds on a component that no longer exists. This causes a React warning and wastes memory and CPU — a memory leak. Fix: save the id that setInterval returns, and return a cleanup function () => clearInterval(id) from the effect, so the timer stops exactly when the component unmounts.",
"code": "// BUG\nfunction Timer() {\n  const [seconds, setSeconds] = useState(0);\n  \n  useEffect(() => {\n    setInterval(() => {\n      setSeconds(s => s + 1);\n    }, 1000);\n    // missing cleanup!\n  }, []);\n  \n  return <div>{seconds}s</div>;\n}\n \n// FIX\nuseEffect(() => {\n  const id = setInterval(() => {\n    setSeconds(s => s + 1);\n  }, 1000);\n  return () => clearInterval(id);\n}, []);\n \n// Bonus - useInterval custom hook (Dan Abramov)\nfunction useInterval(callback, delay) {\n  const savedCallback = useRef(callback);\n  \n  // Update ref on every render\n  useEffect(() => {\n    savedCallback.current = callback;\n  });\n  \n  useEffect(() => {\n    if (delay === null) return; // pause\n    const id = setInterval(() => savedCallback.current(), delay);\n    return () => clearInterval(id);\n  }, [delay]);\n}\n \n// Usage:\nuseInterval(() => {\n  setSeconds(s => s + 1);\n}, 1000);\n \nuseInterval(callback, isPaused ? null : 1000); // pause",
"howTo": "1. Recognize the pattern: any time you see setInterval or setTimeout started inside useEffect, immediately check if there's a return statement that clears it.\n2. Here there's no cleanup, so ask: what happens when this component unmounts? The interval keeps running and keeps calling setSeconds on a component that's no longer there.\n3. State the consequence out loud: this causes a React warning about updating state on an unmounted component, and it's a real memory leak since the timer never stops.\n4. Fix it by saving the id returned by setInterval and returning () => clearInterval(id) from the effect.\n5. Bonus point for seniority: mention the useInterval custom hook pattern (a ref holding the latest callback) which lets you change the callback without restarting the timer, and lets you pause by passing null as the delay.",
"dryRun": {
"input": "Timer component mounts, runs for a few seconds, then the user navigates away (component unmounts).",
"frames": [
"Component mounts. useEffect runs. setInterval starts, ticking every 1000ms and calling setSeconds each time. No id is saved, no cleanup is returned.",
"1 second passes: setSeconds(s => s+1) runs. seconds = 1. Screen updates.",
"2 seconds pass: seconds = 2. Screen updates. So far everything looks fine.",
"User navigates away — the Timer component unmounts and disappears from the screen. But the setInterval callback is still scheduled — nothing told it to stop.",
"1 more second passes: the interval fires again and calls setSeconds on a component that is already gone. React logs a warning, and the timer keeps running invisibly, wasting memory."
],
"result": "Buggy output: the timer keeps ticking forever in the background after the page changes, even though nothing shows it. Expected: the timer should stop the moment the component unmounts."
},
"pitfalls": [
"The exact same bug happens with setTimeout — always clearTimeout in cleanup if the timeout might still be pending when the component unmounts.",
"If the interval's callback reads a stale value from the closure (like an old prop), consider the useRef-based useInterval pattern instead of a plain setInterval in useEffect.",
"Leaving a changing delay value out of the dependency array means the interval keeps its old speed forever, even after the delay prop changes.",
"If the effect re-runs without cleanup, setInterval can be called more than once, creating multiple overlapping timers ticking at the same time."
],
"patternTakeaway": "If you see setInterval or setTimeout started inside useEffect, always check for a clearInterval/clearTimeout cleanup using the same id, or suspect a memory leak after unmount.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch4-q8",
"guide": "Interview Guide",
"topic": "Bug Finding & Fixing",
"topicNum": 4,
"level": "Medium",
"badge": null,
"question": "What is the bug in this deep clone?",
"explanation": "This deepClone function has several bugs, one for each type of value it fails to handle correctly. 1. In JavaScript, typeof null is actually 'object' — this is a well-known quirk. So when obj is null, the check typeof obj !== 'object' is false, and null slips through as if it were a normal object, which breaks the next line. 2. Arrays are objects too, but the code always creates a plain {} for the clone. So an array like [1,2,3] gets cloned into something like {0:1, 1:2, 2:3} — it stops being an array. 3. Special objects like Date, RegExp, Map, and Set are not simple key-value objects. Cloning them field by field does not recreate their real behavior — a cloned Date can turn into an empty {}. 4. The for...in loop walks over every property an object can reach, including ones inherited from its prototype, not just its own properties — this can copy properties you never meant to copy. 5. If an object contains a reference to itself (a circular reference, like obj.self = obj), the function keeps calling itself trying to clone the same object again and again, and eventually crashes. Fix: check for null explicitly, check Array.isArray for arrays, handle Date/RegExp as special cases, use Object.keys (own properties only), and use a WeakMap to remember objects already cloned so circular references don't cause infinite recursion.",
"code": "// BUG\nfunction deepClone(obj) {\n  if (typeof obj !== 'object') return obj; // null passes!\n  const clone = {}; // Array becomes {}!\n  for (let key in obj) { // iterates inherited!\n    clone[key] = deepClone(obj[key]);\n  }\n  return clone;\n}\n \n// FIX\nfunction deepClone(obj, hash = new WeakMap()) {\n  if (obj === null || typeof obj !== 'object') return obj;\n  if (hash.has(obj)) return hash.get(obj); // circular!\n  if (obj instanceof Date) return new Date(obj);\n  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);\n  if (Array.isArray(obj)) {\n    const arr = [];\n    hash.set(obj, arr);\n    obj.forEach((v, i) => { arr[i] = deepClone(v, hash); });\n    return arr;\n  }\n  const cloned = {};\n  hash.set(obj, cloned);\n  for (const key of Object.keys(obj)) { // own properties only\n    cloned[key] = deepClone(obj[key], hash);\n  }\n  return cloned;\n}",
"howTo": "1. Go through the function input type by input type and ask \"does this line handle it correctly?\" — that's how you surface each bug one at a time.\n2. Check null first: typeof null is \"object\" in JavaScript, so the check `typeof obj !== 'object'` lets null slip through and crash later when you do `for...in` on it.\n3. Check arrays: the clone starts as `{}`, so even if you pass an array, you get back a plain object — array-ness is lost.\n4. Check special objects: Date, RegExp, Map, Set aren't plain objects, so cloning them field-by-field breaks their behavior — they need their own copy logic.\n5. Check for...in specifically: it walks inherited properties too, not just the object's own — use Object.keys or for...of Object.entries instead.\n6. Check for cycles: if obj contains a reference back to itself, plain recursion loops forever — the fix is a WeakMap that remembers already-cloned objects.",
"dryRun": {
"input": "deepClone(null) is called, then separately deepClone([1, 2, 3]) is called.",
"frames": [
"deepClone(null): typeof null is 'object' (a JavaScript quirk), so typeof obj !== 'object' is FALSE — the function does not return early.",
"The code creates clone = {} and tries to run for (let key in null). This throws a runtime error, because you cannot iterate over null this way.",
"Now try deepClone([1,2,3]) separately: typeof [1,2,3] is also 'object', so again the check does not return early — this part alone is fine.",
"clone = {} is created — a plain object, not an array.",
"for...in copies indexes 0, 1, 2 as keys onto this plain object. The result looks like {0:1, 1:2, 2:3} — Array.isArray(result) is now false, and array methods like .map() no longer work on it."
],
"result": "Buggy output: deepClone(null) crashes; deepClone([1,2,3]) silently returns {0:1,1:2,2:3} instead of [1,2,3]. Expected: null back for null, and a real array [1,2,3] back for the array."
},
"pitfalls": [
"Even after fixing null and arrays, forgetting Date/RegExp/Map/Set means those still clone incorrectly into plain objects.",
"Using for...in instead of Object.keys/Object.entries can accidentally copy inherited properties from the prototype chain.",
"Without a WeakMap (or similar) to track already-visited objects, a circular reference (obj.self = obj) causes infinite recursion and a stack overflow crash.",
"Functions, symbols, and undefined values are also tricky to clone — decide on purpose whether to skip, reference, or ignore them."
],
"patternTakeaway": "If you see typeof obj === 'object' used as the only check, or a generic {} used to hold a clone or copy of unknown input, always test it against null, arrays, and special built-in types (Date, RegExp, Map, Set) before trusting it.",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch4-q9",
"guide": "Interview Guide",
"topic": "Bug Finding & Fixing",
"topicNum": 4,
"level": "Medium",
"badge": null,
"question": "What is wrong with this list rendering?",
"explanation": "This list has several separate problems. 1. key={i} uses the item's position in the array (its index) as the React key, instead of something stable like the item's own id. If items are added, removed, or reordered, React can get confused about which DOM element belongs to which item — this causes visual bugs, like the wrong row appearing checked. 2. Inside onClick, item.done = !item.done changes the object directly (a mutation), then setItems(items) is called with the same array reference — just like the earlier todo bug, React won't detect this as a change. 3. The onClick handler is an inline arrow function created fresh on every render. This alone is not a bug, but it means any child component wrapped in React.memo can never skip re-rendering, because it always receives a 'new' function as a prop. 4. There is no aria-label or clear description on the button, so a screen reader user has no way to know what the button actually does. Fix: use item.id as the key (something stable and unique to the item, not its position). Move the toggle logic up to the parent, using an immutable .map() update. Pass a stable onToggle function down (wrapped in useCallback if needed). Add an aria-label describing exactly what the button does.",
"code": "// BUG\nfunction TodoList({ items }) {\n  return (\n    <ul>\n      {items.map((item, i) => (\n        <li key={i}>\n          <span>{item.text}</span>\n          <button onClick={() => {\n            item.done = !item.done; // mutation!\n            setItems(items); // same reference\n          }}>\n            Toggle\n          </button>\n        </li>\n      ))}\n    </ul>\n  );\n}\n \n// FIX\nfunction TodoList({ items, onToggle }) {\n  return (\n    <ul>\n      {items.map((item) => (\n        <li key={item.id}> {/* stable key */}\n          <span>{item.text}</span>\n          <button \n            onClick={() => onToggle(item.id)}\n            aria-label={'Toggle ' + item.text}\n          >\n            {item.done ? 'Mark incomplete' : 'Mark complete'}\n          </button>\n        </li>\n      ))}\n    </ul>\n  );\n}\n \n// Parent\nfunction App() {\n  const [items, setItems] = useState([...]);\n  \n  const handleToggle = useCallback((id) => {\n    setItems(prev => prev.map(item => \n      item.id === id ? { ...item, done: !item.done } : item\n    ));\n  }, []);\n  \n  return <TodoList items={items} onToggle={handleToggle} />;\n}",
"howTo": "1. Scan the JSX top to bottom and check each part against a mental checklist: keys, inline functions, mutations, accessibility — that's exactly what's wrong here, one issue per line.\n2. Key issue: key={i} (the array index) means if an item is removed or reordered, React matches the wrong old item to the wrong new position — look for `.map((item, i) =>` plus `key={i}` as the giveaway.\n3. Mutation issue: inside onClick, `item.done = !item.done` changes the object directly, then setItems(items) passes back the same reference, so React won't notice the change.\n4. Performance/pattern issue: the onClick is an inline arrow function defined at render time, which is a new function every render — fine in isolation, but it blocks any React.memo child from skipping re-renders.\n5. Fix in order: switch key to item.id, move the toggle logic up to the parent as an immutable map() update, pass an onToggle callback down instead of mutating inline, and add an aria-label so screen readers know what the button does.",
"dryRun": {
"input": "items = [{id:1,text:'A',done:false}, {id:2,text:'B',done:false}]. The user deletes item 'A' (id:1), leaving only item 'B'.",
"frames": [
"Before delete: React renders <li key=0> for item A (text 'A') and <li key=1> for item B (text 'B').",
"Item A is deleted. The array is now just [{id:2,text:'B',done:false}].",
"React re-renders. The remaining item 'B' is now at index 0, so it gets key={0}.",
"React compares the old key=0 (which used to be item A's slot) with the new key=0 (now item B). Since the key is the same number, React assumes it is still the SAME element, and just updates its text and props in place instead of removing A's element and creating a fresh one for B.",
"If item A's row had local state, focus, or a mid-toggle animation, that can now incorrectly stick to item B's row, since React believes it is the same DOM node."
],
"result": "Buggy output: after deleting an item, the wrong row can show stale state or an animation left over from the deleted item. Expected: each item's row should follow that specific item wherever it moves, using item.id as the key."
},
"pitfalls": [
"Even after fixing the key to item.id, forgetting to also fix the mutation (item.done = ...) means toggling still won't trigger a re-render.",
"Adding useCallback to onToggle without a stable dependency array can still create a new function every render, defeating React.memo anyway.",
"Using item.text as a key instead of item.id can break too, if two items ever end up with the same text.",
"The aria-label text should describe the action and the item ('Mark Buy milk complete'), not just say 'Toggle', so it is actually useful for screen reader users."
],
"patternTakeaway": "If you see .map((item, i) => ...) paired with key={i}, always suspect list bugs when items can be added, removed, or reordered — use a stable, unique id as the key instead.",
"pattern": "React Rendering & Performance"
},
{
"id": "iv-ch5-q1",
"guide": "Interview Guide",
"topic": "System Design & Thinking",
"topicNum": 5,
"level": "Hard",
"badge": "System Design Questions",
"question": "How would you design a Component Library for a large company?",
"explanation": "A component library is a shared set of UI pieces (buttons, inputs, and so on) that many teams reuse. Here is how to design one step by step.\n1. Design tokens: Store colors, spacing, and font sizes as variables (CSS custom properties). This way every component shares the same look.\n2. Atomic design: Build small pieces first (atoms, like a button). Combine them into bigger pieces (molecules, then organisms, then full pages).\n3. API design: Keep component props simple. Use a flexible pattern, like a polymorphic 'as' prop, so one component can work in many situations.\n4. Accessibility: Add keyboard support and ARIA labels from the start, not later.\n5. Testing: Use visual regression tests (tools like Chromatic) plus unit tests, to catch breaking changes.\n6. Documentation: Use Storybook to show live examples of each component.\n7. Versioning: Follow semantic versioning (semver), keep a changelog, and write migration guides when you make breaking changes.\n8. Bundle size: Make the library tree-shakable, so apps only include the parts they actually use.\n9. Theming: Support light and dark themes, and let teams customize the look.\n10. i18n: Support right-to-left languages and let teams change labels.",
"code": "// Polymorphic component - max flexibility\ntype ButtonProps<T extends ElementType = 'button'> = {\n  as?: T;\n  variant?: 'primary' | 'secondary' | 'danger';\n  size?: 'sm' | 'md' | 'lg';\n} & ComponentPropsWithoutRef<T>;\n \nfunction Button<T extends ElementType = 'button'>({\n  as, variant = 'primary', size = 'md', ...props\n}: ButtonProps<T>) {\n  const Component = as || 'button';\n  return <Component\n    className={cn(styles.btn, styles[variant], styles[size])}\n    {...props}\n  />;\n}\n \n// Usage:\n<Button>Click</Button>\n<Button as=\"a\" href=\"/home\">Home</Button>\n<Button as={Link} to=\"/profile\">Profile</Button>\n \n// Compound Components - high flexibility\n<Tabs defaultValue=\"profile\">\n  <Tabs.List>\n    <Tabs.Trigger value=\"profile\">Profile</Tabs.Trigger>\n    <Tabs.Trigger value=\"settings\">Settings</Tabs.Trigger>\n  </Tabs.List>\n  <Tabs.Content value=\"profile\">Profile content</Tabs.Content>\n  <Tabs.Content value=\"settings\">Settings content</Tabs.Content>\n</Tabs>",
"howTo": "Ask first: how many teams will use this, and do we already have design tokens from Figma or a brand guide?\nStart from the foundation: design tokens (color, spacing, type) as variables — everything else is built on top of these.\nTalk about structure next: small atoms combine into molecules, then into bigger organisms. This shows you think in layers.\nMention API design: keep props simple, and use a polymorphic \"as\" prop or compound components so one component covers many cases.\nDo not skip accessibility and testing — ARIA support and visual regression tests are what separate a senior answer from a junior one.\nClose with docs and versioning: Storybook for live examples, semver so teams are not broken when you ship updates.",
"dryRun": {
"input": "A new DatePicker component needs to be added to the library",
"frames": [
"Check existing design tokens - reuse color and spacing variables instead of hardcoding new values",
"Build it from smaller atoms already in the library (Input, Button, Popover)",
"Design the props API to stay simple - support 'value' and 'onChange', add composition if needed",
"Add keyboard navigation (arrow keys move between days) and ARIA roles for screen readers",
"Write a Storybook story and bump the version following semver"
],
"result": "The DatePicker ships as a reusable, accessible, documented component other teams can adopt safely."
},
"pitfalls": [
"Forgetting accessibility (keyboard nav, ARIA) until the end instead of building it in from day one",
"Not asking about existing design tokens or brand guidelines before starting",
"Skipping versioning and changelogs, so updates silently break consumer apps",
"No visual regression testing, so styling bugs slip through unnoticed"
],
"patternTakeaway": "If you see a question about building a shared UI library, always think: tokens first, small reusable pieces, accessibility from day one, then docs and versioning.",
"pattern": "System Design"
},
{
"id": "iv-ch5-q2",
"guide": "Interview Guide",
"topic": "System Design & Thinking",
"topicNum": 5,
"level": "Hard",
"badge": null,
"question": "The application is slow. How would you diagnose and fix it?",
"explanation": "Do not guess. Always measure first.\n1. Measure: Use the Chrome DevTools Performance tab, React Profiler, Lighthouse, and Web Vitals to see real numbers.\n2. Find the bottleneck: Is JavaScript blocking the main thread? Is the page re-rendering too often? Is the bundle too big? Are images loading too slowly?\nThen fix by area:\n- JavaScript: Split code into smaller chunks (React.lazy), remove unused code (tree shaking), delay non-critical scripts.\n- Rendering: Use memo and useCallback, and structure state so fewer components re-render.\n- Network: Lazy-load content, compress images (WebP, AVIF), use the right image sizes.\n- Caching: Use a Service Worker, HTTP caching, and React Query to avoid repeat requests.\n- Feels-fast tricks: Skeleton loaders, optimistic updates, and streaming server rendering make the app feel fast even before data fully arrives.\n- Critical CSS: Put the CSS needed for the first view directly in the page head.\nTargets to aim for (Web Vitals):\n- LCP (Largest Contentful Paint) under 2.5 seconds\n- INP (Interaction to Next Paint) under 200 milliseconds\n- CLS (Cumulative Layout Shift) under 0.1\nGolden rule: never optimize before you measure.",
"code": "",
"howTo": "Say this first: never guess, always measure. Open Chrome DevTools Performance tab and check the Web Vitals (LCP, INP, CLS).\nUse the numbers to find the real bottleneck: is the main thread blocked by JS, is the page re-rendering too much, or is the network slow?\nGroup your fixes by area as you talk: JS (code splitting, lazy loading), rendering (memo, useCallback), network (image compression, caching).\nAdd a point about perceived speed too — skeleton loaders and optimistic UI make the app feel fast even before real data arrives.\nThe trap: jumping straight to \"add memo everywhere\" without measuring first. Always open with \"measure first\" so the interviewer hears your process.",
"dryRun": {
"input": "Users report the product page feels sluggish when scrolling",
"frames": [
"Open Chrome DevTools Performance tab and record while scrolling",
"See long JS tasks blocking the main thread, caused by a re-render on every scroll event",
"Check React Profiler to confirm an expensive component re-renders unnecessarily",
"Fix it: wrap the component in memo and throttle the scroll handler",
"Re-measure with Lighthouse to confirm the numbers actually improved"
],
"result": "Scrolling feels smooth again, and Web Vitals confirm the fix worked instead of just guessing."
},
"pitfalls": [
"Jumping straight to fixes like 'add memo everywhere' without measuring first",
"Only checking one metric (like load time) and ignoring interaction responsiveness",
"Forgetting perceived performance (skeletons, optimistic UI) which matters as much as real speed",
"Not re-measuring after the fix to confirm it actually helped"
],
"patternTakeaway": "If you see 'the app is slow, fix it', always think: measure first with real tools, find the actual bottleneck, then apply the fix that matches that specific cause.",
"pattern": "System Design"
},
{
"id": "iv-ch5-q3",
"guide": "Interview Guide",
"topic": "System Design & Thinking",
"topicNum": 5,
"level": "Hard",
"badge": null,
"question": "When is Context API enough? When do you need Redux/Zustand?",
"explanation": "Different state tools fit different situations. Here is how to choose.\nContext API - use it when:\n- The state rarely changes (theme, logged-in user, language).\n- Only a few components need it.\n- You do not need devtools or middleware.\nZustand or Jotai - use them when:\n- The state changes often.\n- You want components to re-render only when the exact piece of data they use changes.\n- You want something easy to test, with no Provider wrapper needed.\n- You want a small library (about 1kb).\nRedux Toolkit - use it when:\n- You have a large team and a complex codebase.\n- You need devtools with time-travel debugging.\n- You have complex async logic (Saga, Thunk, RTK Query).\n- You need very predictable, traceable state changes.\nReact Query or SWR - use these for server state (data that comes from an API), not for regular app state:\n- They handle caching, refetching, and invalidation automatically.\n- They give you loading and error states for free.\n- If most of your state actually comes from the server, this is cheaper than Redux.\nSimple rule: start with local state. Move to Context if needed. Move to Zustand if that is not enough. Only reach for Redux if you truly need it. Always start simple.",
"code": "// Context split - prevents re-renders\nconst UserDataContext = createContext(null);     // data\nconst UserActionsContext = createContext(null);  // callbacks\n// Components reading actions don't re-render when data changes\n \n// Zustand - atomic subscribe\nimport { create } from 'zustand';\n \nconst useStore = create((set) => ({\n  count: 0,\n  user: null,\n  increment: () => set(s => ({ count: s.count + 1 })),\n  setUser: (user) => set({ user }),\n}));\n \nfunction Counter() {\n  const count = useStore(s => s.count); // only count\n  const increment = useStore(s => s.increment);\n  return <button onClick={increment}>{count}</button>;\n}\n \n// React Query - server state\nfunction Posts() {\n  const { data, isLoading, error } = useQuery({\n    queryKey: ['posts'],\n    queryFn: fetchPosts,\n    staleTime: 5 * 60 * 1000, // 5 minutes\n  });\n}",
"howTo": "Ask first: how often does this piece of state change, and how many components actually need it?\nPicture a simple ladder: local state, then Context, then Zustand, then Redux. Always start at the bottom and only move up when you hit a real limit.\nExplain why Context is limited: everything under its Provider re-renders on any change, so it is fine for rarely-changing things like theme, but bad for fast-changing state.\nPoint out that data from a server, like a list of posts, is not really app state — it is cache — so React Query or SWR fits better than Redux there.\nSenior move: mention splitting Context into a data Context and an actions Context, so components that only call actions do not re-render on data changes.",
"dryRun": {
"input": "A dashboard has: the logged-in user (rarely changes), a live stock ticker (changes every second), and a list of orders fetched from an API",
"frames": [
"Logged-in user rarely changes and has few consumers - use Context",
"Live stock ticker changes constantly and many components read pieces of it - use Zustand so only the price display re-renders, not the whole page",
"List of orders is server data, not app state - use React Query for caching and refetching",
"No single global store was needed - each type of state got the tool that actually fits it"
],
"result": "The dashboard stays fast because each state type uses the lightest tool that fits its update pattern."
},
"pitfalls": [
"Reaching for Redux by default instead of starting with local state or Context",
"Treating server data (API responses) as app state instead of using React Query or SWR",
"Not realizing Context re-renders everything under its Provider on every change",
"Forgetting to mention splitting data Context from actions Context to avoid unnecessary re-renders"
],
"patternTakeaway": "If you see a question about choosing state management, always think: local state, then Context, then Zustand, then Redux - and treat server data separately with React Query.",
"pattern": "System Design"
},
{
"id": "iv-ch5-q4",
"guide": "Interview Guide",
"topic": "System Design & Thinking",
"topicNum": 5,
"level": "Hard",
"badge": null,
"question": "CSR vs SSR vs SSG vs ISR — when to use each?",
"explanation": "These are four ways to render a page, and each fits a different need.\nCSR (Client-Side Rendering):\n- The server sends an almost-empty HTML page, then JavaScript fills it in inside the browser.\n- Use for: admin dashboards behind a login, where search engines do not matter.\n- Good: cheap and simple. Bad: slow first paint, bad for SEO.\nSSR (Server-Side Rendering):\n- The server builds the full HTML for every single request.\n- Use for: pages that need SEO and show dynamic content, like e-commerce product pages.\n- Good: fast first paint, good for SEO. Bad: more load on the server, slower time-to-first-byte.\nSSG (Static Site Generation):\n- The HTML is built once, ahead of time, at build time.\n- Use for: blogs, documentation, landing pages.\n- Good: fastest possible, cheap to serve from a CDN. Bad: build time grows as content grows, and content is not dynamic.\nISR (Incremental Static Regeneration):\n- Like SSG, but pages automatically refresh themselves after a set time.\n- Use for: product pages that change once in a while.\n- Good: combines the speed of static pages with content that stays reasonably fresh.\nStreaming SSR (React 18+):\n- The server sends HTML in pieces as it becomes ready, instead of all at once.\n- Suspense boundaries let the fast parts of a page show immediately while slow parts load in later.",
"code": "// Next.js App Router\n \n// SSG (default)\nasync function ProductPage({ params }) {\n  const product = await getProduct(params.id);\n  return <Product data={product} />;\n}\n \n// ISR\nexport const revalidate = 3600; // revalidate every hour\n \n// Dynamic SSR\nexport const dynamic = 'force-dynamic';\n \n// CSR (Client Component)\n'use client';\nfunction Dashboard() {\n  const { data } = useQuery(...);\n  return <div>{data}</div>;\n}\n \n// Streaming SSR\nasync function Page() {\n  return (\n    <>\n      <Header /> {/* renders immediately */}\n      <Suspense fallback={<Skeleton />}>\n        <SlowComponent /> {/* streams when ready */}\n      </Suspense>\n    </>\n  );\n}",
"howTo": "Ask first: does this page need to rank in search engines, and how often does its content actually change? Those two answers decide almost everything.\nLine up the options from render-it-in-the-browser to render-it-once-ahead-of-time: CSR (empty page, JS fills it in), SSR (server builds full HTML per request), SSG (HTML built once at build time), ISR (SSG that quietly refreshes itself later).\nAttach a real example to each as you go: CSR for a logged-in dashboard, SSR for a page with live prices, SSG for a blog, ISR for product pages that change occasionally.\nMention streaming SSR with Suspense as the modern layer on top — send the fast shell immediately, stream in the slow parts.\nSenior detail: frame the whole choice as \"who pays the rendering cost, and when\" — at build time, at request time, or in the user's browser.",
"dryRun": {
"input": "Building an e-commerce site: homepage, blog, product page, admin dashboard",
"frames": [
"Homepage needs SEO but content changes daily - choose SSR",
"Blog posts rarely change once published - choose SSG",
"Product page needs SEO and changes occasionally (price, stock) - choose ISR with revalidation every hour",
"Admin dashboard is behind a login with no SEO need - choose CSR",
"For slow parts of the product page (like reviews), wrap them in Suspense for streaming"
],
"result": "Each page type uses the rendering strategy that matches how often it changes and whether it needs to be found in search."
},
"pitfalls": [
"Not asking whether a page needs SEO before picking a rendering strategy",
"Choosing SSR everywhere out of habit, adding unnecessary server load",
"Forgetting ISR exists as a middle ground between SSG and SSR",
"Not mentioning streaming or Suspense as the modern way to speed up SSR"
],
"patternTakeaway": "If you see a question about how to render a page, always think: does it need SEO, and how often does the content change - those two answers point straight to CSR, SSR, SSG, or ISR.",
"pattern": "System Design"
},
{
"id": "iv-ch5-q5",
"guide": "Interview Guide",
"topic": "System Design & Thinking",
"topicNum": 5,
"level": "Hard",
"badge": null,
"question": "Design an autocomplete component for millions of users.",
"explanation": "This is a classic system design question. Cover both the frontend and the backend.\nFrontend:\n- Debounce the input (wait 300-500ms after the user stops typing) so you do not send a request on every keystroke.\n- Cache recent results (an LRU cache or a Map works) so repeated searches do not hit the network again.\n- Use an AbortController to cancel old requests, so a slow old response cannot overwrite a newer one.\n- Support keyboard navigation (arrow keys, enter) and accessibility.\n- Virtualize the results list if there are many results.\nAPI design:\n- A simple endpoint like GET /search?q=...&limit=10.\n- Return only the minimal data needed (id, label, and where to highlight the match).\n- Use compression (gzip or brotli) and HTTP/2 to make requests fast.\nBackend (high level):\n- Use a fast lookup structure like a trie, or a real search engine like Elasticsearch or Algolia.\n- Add a CDN edge cache for very popular queries.\n- Optionally personalize results using the user's search history.\nPerformance extras:\n- Prefetch results when the user focuses the input, before they even type.\n- Predictively load results for the most common queries.\n- If the API fails, fall back to showing cached or local results instead of nothing.\nAnalytics:\n- Track which suggestions get clicked, to measure and improve ranking quality.\n- Run A/B tests on the ranking algorithm.",
"code": "",
"howTo": "Clarify scope first: how many searches per second, and is this the same for everyone or personalized to a user's history?\nSplit your answer into two clear halves — what happens in the browser, and what happens on the server — interviewers want to see that separation.\nOn the frontend, mention debouncing so you are not firing a request per keystroke, and an AbortController so an old slow reply can't overwrite a newer one.\nOn the backend, mention a fast lookup structure (like a trie, or a tool like Elasticsearch) plus a CDN cache for the most common queries.\nAdd resilience: if the API is slow or down, fall back to a local cache instead of showing nothing.\nSenior candidates also mention analytics — tracking clicks per query proves the ranking is good, not just that it is fast.",
"dryRun": {
"input": "user types 'ap' quickly then 'apple'",
"frames": [
"User types 'a' - a debounce timer starts (300ms), no request is sent yet",
"User keeps typing 'ap' before the timer finishes, so the timer resets",
"User pauses after typing 'apple' - the debounce timer completes and a request fires",
"An earlier still-pending request for 'ap' gets cancelled via AbortController, so its late response cannot overwrite the 'apple' results",
"Results for 'apple' render and get cached for next time"
],
"result": "Only one relevant request reaches the server, and the user always sees results matching what they actually typed."
},
"pitfalls": [
"Forgetting to cancel stale in-flight requests, which causes race conditions and wrong results on screen",
"Not debouncing, causing a request on every single keystroke and wasting server resources",
"Ignoring accessibility, like keyboard navigation and screen reader announcements of result count",
"Not asking about scale (requests per second) or personalization before designing the backend"
],
"patternTakeaway": "If you see a question about designing a search box, always think: debounce the input, cancel stale requests, cache results, and fall back gracefully if the API fails.",
"pattern": "System Design"
},
{
"id": "iv-ch5-q6",
"guide": "Interview Guide",
"topic": "System Design & Thinking",
"topicNum": 5,
"level": "Hard",
"badge": null,
"question": "Design an infinite scroll feed like Instagram/Twitter.",
"explanation": "This looks simple but has many hidden details.\n1. Pagination: Use cursor-based pagination, not offset-based. A cursor (like a timestamp or the ID of the last item you saw) avoids showing duplicate or missing items when new content gets added while you scroll.\n2. Performance:\n- Virtualize the list (with a tool like react-window). This is required for long lists, since rendering thousands of items would freeze the page.\n- Lazy-load images and show placeholders while they load.\n- Use Intersection Observer to detect when the user nears the bottom.\n- Prefetch the next page before the user actually reaches the end.\n3. State management:\n- Use React Query or SWR to manage pagination.\n- Use optimistic updates for actions like likes and comments: update the screen immediately, confirm with the server after.\n- Have a clear cache invalidation plan.\n4. UX:\n- Support pull-to-refresh.\n- Show skeleton placeholders while loading.\n- Use error boundaries so one failed request does not break the whole feed.\n- Keep the scroll position when the user navigates away and comes back.\n5. Data:\n- Do not load everything at once. Load only metadata and image previews first.\n- Load comments only after the user clicks to see them.\n6. Real-time updates:\n- Do not insert new posts directly at the top (it would jump the user's scroll position). Show a 'X new posts' button instead.\n- Use WebSocket or polling to detect new posts.",
"code": "// React Query infinite scroll\nfunction Feed() {\n  const {\n    data, fetchNextPage, hasNextPage, isFetchingNextPage\n  } = useInfiniteQuery({\n    queryKey: ['posts'],\n    queryFn: ({ pageParam }) => fetchPosts({ cursor: pageParam }),\n    getNextPageParam: (lastPage) => lastPage.nextCursor,\n    initialPageParam: null,\n  });\n  \n  const posts = data?.pages.flatMap(p => p.items) ?? [];\n  \n  // Virtualization\n  const virtualizer = useVirtualizer({\n    count: hasNextPage ? posts.length + 1 : posts.length,\n    estimateSize: () => 400,\n    overscan: 5,\n  });\n  \n  // Auto-fetch when reaching the end\n  useEffect(() => {\n    const lastItem = virtualizer.getVirtualItems().at(-1);\n    if (\n      lastItem && \n      lastItem.index >= posts.length - 1 && \n      hasNextPage && \n      !isFetchingNextPage\n    ) {\n      fetchNextPage();\n    }\n  }, [virtualizer.getVirtualItems()]);\n  \n  return (/* render virtualized list */);\n}",
"howTo": "Clarify first: can new posts get added above what the user is looking at while they scroll? That detail decides your pagination strategy.\nSay cursor-based pagination, not offset-based, and explain why: offset breaks (skips or repeats items) if content is added or removed mid-scroll.\nBring up virtualization (like react-window) right away — rendering thousands of DOM nodes will freeze the tab, so only visible rows should exist in the DOM.\nTalk about UX details: skeleton placeholders while loading, and keeping the scroll position when the user navigates back to the feed.\nMention real-time updates should not silently jump content in at the top — show a \"X new posts\" button instead, so the user's scroll position never gets yanked.\nSenior detail: prefetch the next page before the user reaches the bottom, so there is no visible loading gap.",
"dryRun": {
"input": "user is scrolling through a feed and 3 new posts get published while they are mid-scroll",
"frames": [
"User scrolls down using cursor-based pagination, where each request asks for posts older than the last seen item's ID",
"Intersection Observer detects the user is near the bottom and prefetches the next page early",
"Meanwhile, a WebSocket message announces that 3 new posts exist above the current view",
"Instead of inserting them directly, which would shift the scroll position, a '3 new posts' button appears at the top",
"Only off-screen items outside the virtualized window are removed from the DOM, keeping scrolling smooth"
],
"result": "The user keeps scrolling smoothly with no jump, and can tap the button whenever they want to see the new posts."
},
"pitfalls": [
"Using offset-based pagination, which causes duplicate or skipped items when content changes mid-scroll",
"Rendering every item in the DOM instead of virtualizing, freezing the page on long feeds",
"Inserting new real-time posts directly at the top, yanking the user's scroll position",
"Forgetting to keep scroll position when the user navigates back to the feed"
],
"patternTakeaway": "If you see a question about designing an infinite scrolling feed, always think: cursor-based pagination, virtualize the list, and never silently insert new items above what the user is viewing.",
"pattern": "System Design"
},
{
"id": "iv-ch5-q7",
"guide": "Interview Guide",
"topic": "System Design & Thinking",
"topicNum": 5,
"level": "Hard",
"badge": null,
"question": "Design a notification system with offline support.",
"explanation": "Think about these requirements:\n1. Real-time delivery: choose between WebSocket, Server-Sent Events (SSE), or polling.\n2. Offline storage: use IndexedDB to store notifications so they are available even without a connection.\n3. Service Worker: handles background sync and push notifications, even when the app is closed.\n4. Optimistic UI: when the user marks a notification as read, update the screen immediately, then sync with the server in the background.\n5. Conflict resolution: use timestamps (or vector clocks for more complex cases) to decide which update wins if two changes happen at once.\n6. Pagination: virtualize long notification lists.\n7. Accessibility: use aria-live regions so screen readers announce new notifications.\n8. Permissions: ask for notification permission at a meaningful moment, not right when the page loads.\nRecommended setup:\n- WebSocket for receiving notifications in real time.\n- IndexedDB as the local offline cache.\n- Service Worker to handle push notifications.\n- Optimistic UI for user actions like marking as read.",
"code": "// Architecture sketch:\n \n// 1. Connection Layer\nclass NotificationConnection {\n  constructor() {\n    this.ws = null;\n    this.reconnectAttempts = 0;\n  }\n  \n  connect() {\n    this.ws = new WebSocket(WS_URL);\n    this.ws.onmessage = this.handleMessage;\n    this.ws.onclose = this.handleReconnect;\n  }\n  \n  handleReconnect = () => {\n    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);\n    setTimeout(() => this.connect(), delay);\n    this.reconnectAttempts++;\n  };\n}\n \n// 2. Storage Layer (IndexedDB via Dexie)\nclass NotificationStore extends Dexie {\n  constructor() {\n    super('NotificationsDB');\n    this.version(1).stores({\n      notifications: '++id, userId, timestamp, read'\n    });\n  }\n}\n \n// 3. UI - optimistic updates\nfunction NotificationItem({ notification }) {\n  const [isRead, setIsRead] = useState(notification.read);\n  \n  const markAsRead = async () => {\n    setIsRead(true); // optimistic\n    try {\n      await api.markAsRead(notification.id);\n    } catch (err) {\n      setIsRead(false); // rollback\n      toast.error('Failed to mark as read');\n    }\n  };\n}\n \n// 4. Service Worker - push notifications\nself.addEventListener('push', (event) => {\n  const data = event.data.json();\n  event.waitUntil(\n    self.registration.showNotification(data.title, {\n      body: data.message,\n      icon: '/icon.png',\n      badge: '/badge.png',\n      data: { url: data.url }\n    })\n  );\n});",
"howTo": "Clarify first: does this truly need instant delivery, or is a short delay from polling good enough?\nSplit the design into layers as you talk: a connection layer (WebSocket) for live delivery, a storage layer (IndexedDB) for offline data, and a Service Worker for push notifications when the app is closed.\nExplain optimistic UI: when the user marks something as read, update the screen right away, sync to the server after, and roll back only if that sync fails.\nMention reconnect logic: if the WebSocket connection drops, retry with a growing delay (exponential backoff) instead of hammering the server.\nSenior detail most people forget: accessibility (aria-live regions so screen readers announce new notifications) and only asking for notification permission at a meaningful moment, not on page load.",
"dryRun": {
"input": "user marks a notification as read while their phone loses internet connection",
"frames": [
"User taps 'mark as read' - the UI updates instantly as an optimistic update",
"The app tries to sync this change to the server, but the request fails because the device is offline",
"The change is queued and saved in IndexedDB",
"When the connection returns, the Service Worker's background sync sends the queued update to the server",
"If the server rejects it, for example due to a conflict with a newer state, the UI rolls back and shows an error toast"
],
"result": "The user sees instant feedback, and the read status still ends up correctly synced once connectivity returns."
},
"pitfalls": [
"Forgetting to handle the offline case at all, assuming the network is always available",
"Not planning a rollback for optimistic updates when the server sync fails",
"Skipping accessibility, like aria-live regions for screen reader users",
"Asking for notification permission immediately on page load instead of at a relevant moment",
"Missing reconnect and backoff logic when the WebSocket connection drops"
],
"patternTakeaway": "If you see a question about a real-time system with offline support, always think: optimistic UI with rollback, local storage (IndexedDB) for offline data, and a Service Worker for background sync.",
"pattern": "System Design"
},
{
"id": "iv-ch5-q8",
"guide": "Interview Guide",
"topic": "System Design & Thinking",
"topicNum": 5,
"level": "Hard",
"badge": null,
"question": "How would you build an Image Carousel that handles 1000+ images?",
"explanation": "A naive approach that renders all 1000 images at once will not work. It uses too much memory and freezes the page. Key ideas:\n1. Lazy loading: only load images that are near the visible area.\n2. Virtualization: do not even render slides that are far off-screen.\n3. Preloading: load the next and previous images ahead of time, so moving between slides feels instant.\n4. Memory management: unload images that are far from the current view, so memory does not keep growing.\n5. Responsive images: use srcset so the browser picks the right size for the screen.\n6. Format optimization: use WebP or AVIF, with fallback formats for older browsers.\n7. Accessibility: support keyboard navigation, ARIA labels, and screen reader announcements.\n8. Touch gestures: support swiping on mobile.\n9. Smooth transitions: use CSS transforms, since they are accelerated by the GPU.\n10. Loading states: show a skeleton or a blurred placeholder while an image loads.",
"code": "function ImageCarousel({ images }) {\n  const [currentIndex, setCurrentIndex] = useState(0);\n  const [loadedIndices, setLoadedIndices] = useState(new Set([0, 1]));\n  \n  // Preload current + neighbors\n  useEffect(() => {\n    const newIndices = new Set();\n    for (let i = -2; i <= 2; i++) {\n      const idx = (currentIndex + i + images.length) % images.length;\n      newIndices.add(idx);\n    }\n    setLoadedIndices(newIndices);\n  }, [currentIndex, images.length]);\n  \n  const goNext = () => setCurrentIndex(i => (i + 1) % images.length);\n  const goPrev = () => setCurrentIndex(i => (i - 1 + images.length) % images.length);\n  \n  // Keyboard navigation\n  useEffect(() => {\n    const handler = (e) => {\n      if (e.key === 'ArrowRight') goNext();\n      if (e.key === 'ArrowLeft') goPrev();\n    };\n    document.addEventListener('keydown', handler);\n    return () => document.removeEventListener('keydown', handler);\n  }, []);\n  \n  return (\n    <div role=\"region\" aria-label=\"Image carousel\" aria-roledescription=\"carousel\">\n      <div\n        className=\"carousel-track\"\n        style={{ transform: 'translateX(-' + (currentIndex * 100) + '%)' }}\n      >\n        {images.map((img, i) => (\n          <div key={i} className=\"slide\" aria-hidden={i !== currentIndex}>\n            {loadedIndices.has(i) ? (\n              <img\n                src={img.src}\n                srcSet={img.srcSet}\n                alt={img.alt}\n                loading={i === 0 ? 'eager' : 'lazy'}\n              />\n            ) : (\n              <div className=\"placeholder\" />\n            )}\n          </div>\n        ))}\n      </div>\n      <button onClick={goPrev} aria-label=\"Previous image\">←</button>\n      <button onClick={goNext} aria-label=\"Next image\">→</button>\n      <div role=\"status\" aria-live=\"polite\">\n        Image {currentIndex + 1} of {images.length}\n      </div>\n    </div>\n  );\n}",
"howTo": "Open by ruling out the naive approach: rendering all 1000 images at once will blow up memory and freeze the page.\nCombine two techniques: virtualization (do not even create DOM nodes for far-away slides) and lazy loading (only fetch images near the current one).\nAdd preloading — load the next and previous image ahead of time so moving between slides feels instant, not just loading what is on screen right now.\nBring up responsive images (srcset) and modern formats (WebP/AVIF) to shrink how much data gets downloaded.\nDo not forget accessibility: keyboard arrows to move between slides, and aria-live text announcing \"image X of Y\" for screen readers.\nSenior detail: mention releasing images from memory once they are far from the current view, so memory does not keep growing as the user browses hundreds of them.",
"dryRun": {
"input": "carousel with 1000 images, user is currently viewing image 500 and clicks next",
"frames": [
"Only images 498 to 502 are kept loaded in memory; the rest are unloaded or not yet loaded",
"User clicks next - the carousel moves to image 501, which was already preloaded, so the transition is instant",
"Image 503 gets preloaded now, ready for the next click",
"Image 497, now too far away, gets released from memory",
"A screen reader announces 'Image 501 of 1000' through an aria-live region"
],
"result": "Navigating through the carousel stays smooth and fast even with 1000 images, and memory usage stays roughly constant instead of growing."
},
"pitfalls": [
"Rendering or loading all images upfront instead of virtualizing and lazy loading",
"Forgetting to release images from memory once they are far from the current view",
"Missing accessibility, like keyboard navigation and aria-live announcements of position",
"Not using responsive images (srcset) or modern formats, wasting bandwidth"
],
"patternTakeaway": "If you see a question about a carousel or gallery with a huge number of items, always think: only keep a small window of items loaded, preload neighbors, and release memory for items that are far away.",
"pattern": "System Design"
},
{
"id": "iv-ch6-q1",
"guide": "Interview Guide",
"topic": "Comprehension & Output Prediction",
"topicNum": 6,
"level": "Medium",
"badge": "Deep Understanding Questions",
"question": "What gets logged? Explain step by step.",
"explanation": "The order matters here. First, all the normal (synchronous) code runs, line by line. Next, the microtask queue runs -- this holds Promise .then() callbacks. Last, the macrotask queue runs -- this holds setTimeout callbacks. So even though setTimeout has a 0ms delay, it still prints after every Promise callback. For the async/await version: code inside a function before the first 'await' runs immediately, like a normal function call. Everything after 'await' behaves like it is inside a .then() -- it waits until all the current synchronous code finishes first.",
"code": "console.log('Start');\nsetTimeout(() => console.log('Timeout'), 0);\nPromise.resolve()\n  .then(() => console.log('Promise 1'))\n  .then(() => console.log('Promise 2'));\nconsole.log('End');\n \n// Output: Start, End, Promise 1, Promise 2, Timeout\n \n// Follow-up: async/await\nasync function foo() {\n  console.log('foo start');\n  await Promise.resolve();\n  console.log('foo end');\n}\n \nconsole.log('script start');\nfoo();\nconsole.log('script end');\n \n// Output:\n// script start\n// foo start\n// script end\n// foo end (microtask after await)",
"howTo": "Rule to apply first: all plain synchronous code finishes running before anything else happens — read those console.log lines in order first.\nSecond rule: microtasks (Promise .then callbacks) always run before macrotasks (setTimeout), no matter which one appears earlier in the code.\nTrace it in order: 'Start' and 'End' print first because they are sync, then both .then callbacks print (microtasks), then 'Timeout' prints last.\nFor the async/await version, remember code before the first \"await\" runs immediately, like a normal function call — that is why 'foo start' prints before 'script end'.\nThe trap: everything after an \"await\" behaves like a .then() callback, so it always waits for the current synchronous code to finish, even with no real delay.",
"dryRun": {
"input": "console.log('Start'); setTimeout(()=>log('Timeout'),0); Promise.resolve().then(()=>log('Promise 1')).then(()=>log('Promise 2')); console.log('End');",
"frames": [
"console.log('Start') runs right away -- prints Start.",
"setTimeout(...) is registered -- its callback goes into the macrotask queue, to run later.",
"Promise.resolve().then(...) -- the first .then callback is queued as a microtask.",
"console.log('End') runs -- prints End (this is the last synchronous line).",
"Call stack is now empty -- microtask queue runs: first .then logs 'Promise 1', which queues the second .then as a new microtask; it runs next and logs 'Promise 2'.",
"Microtask queue is empty -- event loop moves to the macrotask queue: setTimeout's callback runs, logging 'Timeout'."
],
"result": "Start, End, Promise 1, Promise 2, Timeout"
},
"pitfalls": [
"People think setTimeout(fn, 0) runs immediately or before the Promise code since it has no delay -- but macrotasks always wait for the microtask queue to fully empty first.",
"Easy to forget the second .then() only gets queued once the first one has actually finished running, not at the very start.",
"In the async/await version, people expect 'foo end' to print before 'script end' -- but await always defers to the microtask queue, even with nothing truly asynchronous happening."
],
"patternTakeaway": "If you see setTimeout and Promise .then() mixed together in a 'what gets logged' question, always think: all synchronous code runs first, then the whole microtask queue drains, then macrotasks run in order.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch6-q2",
"guide": "Interview Guide",
"topic": "Comprehension & Output Prediction",
"topicNum": 6,
"level": "Medium",
"badge": null,
"question": "What gets logged? Complex Promise chain.",
"explanation": "Read the plain console.log lines first -- they run immediately, in the order they appear. setTimeout always waits until the call stack is empty AND every microtask has finished, so it prints last even with a 0ms delay. Each .then() in a chain only gets queued once the .then() before it has actually run -- the chain unfolds one step at a time, but all of it still finishes before setTimeout fires. When a .then() callback throws an error, it behaves exactly like a rejected Promise: the chain skips ahead to the nearest .catch(), skipping any .then() calls in between. .catch() then returns a resolved Promise, so the chain keeps going normally afterward. An async function that throws is the same as returning a rejected Promise -- you catch it the same way. .finally() never receives or changes the value -- it just runs a side effect, then passes the original value or error through unchanged.",
"code": "console.log('1');\nsetTimeout(() => console.log('3'), 0);\nPromise.resolve()\n  .then(() => console.log('4'))\n  .then(() => console.log('5'));\nconsole.log('2');\n \n// Output: 1, 2, 4, 5, 3\n \n// Harder: throw inside .then\nPromise.resolve()\n  .then(() => {\n    throw new Error('oops');\n  })\n  .then(() => console.log('not reached'))\n  .catch(err => console.log('caught:', err.message))\n  .then(() => console.log('after catch'));\n \n// Output:\n// caught: oops\n// after catch\n \n// .catch returns resolved Promise -> next .then runs\n \n// async function that throws\nasync function fail() {\n  throw new Error('fail');\n}\n \nfail()\n  .then(() => console.log('then'))\n  .catch(err => console.log('catch:', err.message));\n// Output: catch: fail\n \n// async function = function that returns a Promise.\n// throw inside = Promise.reject\n \n// finally\nPromise.reject('err')\n  .finally(() => console.log('cleanup'))\n  .catch(err => console.log('caught:', err));\n// Output: cleanup, caught: err\n \n// finally doesn't receive a value and doesn't change the chain.",
"howTo": "Same first rule: read every plain line without a .then or setTimeout first — those run immediately, in order.\nRemember setTimeout(fn, 0) still has to wait for the whole call stack AND every queued microtask to finish first — that is why it prints last even with a 0ms delay.\nTrace the .then chain like a line at a counter: the first .then's callback gets queued, and only once it runs does the next .then get queued — but both still finish before setTimeout.\nFor error handling, treat a thrown error inside .then exactly like a rejected promise — the chain jumps straight to the nearest .catch, skipping any .then in between entirely.\nThe trap: .finally() never receives or changes the value flowing through the chain — it only runs a side effect and passes the original value or error straight through.",
"dryRun": {
"input": "console.log('1'); setTimeout(()=>log('3'),0); Promise.resolve().then(()=>log('4')).then(()=>log('5')); console.log('2');",
"frames": [
"console.log('1') runs -- prints 1.",
"setTimeout registers its callback into the macrotask queue.",
"Promise.resolve().then(...) queues the first .then callback as a microtask.",
"console.log('2') runs -- prints 2 (the last synchronous line).",
"Call stack is empty -- microtasks run: first .then logs '4', then queues the second .then; it runs next and logs '5'.",
"Microtask queue is empty -- macrotask runs: setTimeout's callback logs '3'."
],
"result": "1, 2, 4, 5, 3"
},
"pitfalls": [
"Assuming '3' logs before '4' and '5' because setTimeout appears second in the code -- code order doesn't decide timing, task type does.",
"Forgetting that a throw inside .then() jumps straight to the nearest .catch(), skipping every .then() in between instead of crashing the whole chain.",
"Expecting .finally() to change or block the resolved/rejected value -- it only runs a side effect and passes the original result straight through."
],
"patternTakeaway": "If you see a chain of .then() calls plus a .catch() or .finally() mixed with setTimeout, always think: trace each .then() as its own microtask step, let errors jump to the nearest .catch(), and only run setTimeout after the whole chain has drained.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch6-q3",
"guide": "Interview Guide",
"topic": "Comprehension & Output Prediction",
"topicNum": 6,
"level": "Medium",
"badge": null,
"question": "Implement a function that returns unique sorted values from an array of arrays.",
"explanation": "This question tests three built-in tools used together: flatten the nested arrays, remove duplicates, then sort. Three ways to do it: 1) Use .flat() to combine all inner arrays into one, spread it into a Set to drop duplicates, then .sort() it. 2) Use .flatMap() to flatten and map in one step, then do the same Set-plus-sort. 3) Use .reduce() to build up a Set by hand, then convert it to a sorted array. All three give the same final result, just written differently.",
"code": "const arrays = [[3, 1, 2], [2, 4, 1], [5, 3]];\n \n// 1. Modern (ES2019)\nconst unique = [...new Set(arrays.flat())].sort((a, b) => a - b);\n// [1, 2, 3, 4, 5]\n \n// 2. flatMap\nconst u2 = [...new Set(arrays.flatMap(x => x))].sort((a, b) => a - b);\n \n// 3. reduce\nconst u3 = [...arrays.reduce((acc, arr) => {\n  arr.forEach(v => acc.add(v));\n  return acc;\n}, new Set())].sort((a, b) => a - b);\n \n// Bonus - sorted by frequency:\nconst countMap = new Map();\narrays.flat().forEach(v => {\n  countMap.set(v, (countMap.get(v) || 0) + 1);\n});\nconst byFrequency = [...countMap.entries()]\n  .sort((a, b) => b[1] - a[1])\n  .map(([v]) => v);",
"howTo": "Spot the three keywords in the question: \"arrays of arrays\" means flatten, \"unique\" means Set, \"sorted\" means sort — each one maps to a built-in method.\nWork from the inside out: flatten first with .flat(), so you are left with one single array to work with.\nRemove duplicates by spreading that array into a Set, since a Set can only hold each value once, then spread it back out into an array.\nSort last, but pass a compare function like (a, b) => a - b, because .sort() compares values as text by default and would put 10 before 2.\nIf asked for a twist like sorting by frequency, reach for a Map to count how many times each value appears, then sort its entries by that count.",
"dryRun": {
"input": "arrays = [[3,1,2],[2,4,1],[5,3]]; [...new Set(arrays.flat())].sort((a,b)=>a-b)",
"frames": [
"arrays.flat() combines every inner array into one: [3,1,2,2,4,1,5,3]",
"new Set([3,1,2,2,4,1,5,3]) keeps only the first occurrence of each value: {3,1,2,4,5}",
"Spreading the Set into an array gives: [3,1,2,4,5]",
"sort((a,b) => a-b) compares numbers, not text, and reorders low to high: [1,2,3,4,5]"
],
"result": "[1, 2, 3, 4, 5]"
},
"pitfalls": [
"Calling .sort() without a compare function sorts as text by default, so 10 would come before 2 -- always pass (a,b) => a-b for numbers.",
"Forgetting to flatten before building the Set -- a Set of arrays would treat each inner array as its own unique object, not remove duplicate numbers.",
"Assuming a Set keeps values sorted automatically -- a Set only removes duplicates, it never sorts; .sort() is still needed at the end."
],
"patternTakeaway": "If you see 'unique' and 'sorted' together for arrays, always think: flatten first with .flat(), dedupe with a Set, then sort last with an explicit numeric compare function.",
"pattern": "Arrays & Hashing"
},
{
"id": "iv-ch6-q4",
"guide": "Interview Guide",
"topic": "Comprehension & Output Prediction",
"topicNum": 6,
"level": "Medium",
"badge": null,
"question": "TypeScript: Generics, Conditional Types, Mapped Types, Infer.",
"explanation": "This question is really about your TypeScript vocabulary -- can you explain what each feature does in plain words? Generics (T extends X) are like a placeholder type with a rule attached -- the type must match some shape. Conditional types (T extends U ? X : Y) work like an if/else, but for types instead of values -- this is how a type like Awaited<T> can unwrap what's inside a Promise. Mapped types ({ [K in keyof T] }) work like a for-loop over an object's keys -- this is how built-in types like Partial or Readonly get built. infer lets you 'grab' a piece of a type in the middle of a check -- for example, pulling out a function's return type without knowing the function ahead of time. Important: infer only works inside the extends clause of a conditional type -- it can't be used on its own.",
"code": "// Generic Constraints\nfunction getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {\n  return obj[key];\n}\nconst user = { name: 'Roee', age: 30 };\ngetProperty(user, 'name'); // string\ngetProperty(user, 'invalid'); // TS error\n \n// Conditional Types\ntype NonNullable<T> = T extends null | undefined ? never : T;\ntype Awaited<T> = T extends Promise<infer U> ? U : T;\n \n// Infer - extract return type\ntype ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;\nfunction foo() { return 42; }\ntype FooReturn = ReturnType<typeof foo>; // number\n \n// Mapped Types\ntype Optional<T> = { [K in keyof T]?: T[K] };\ntype ReadOnly<T> = { readonly [K in keyof T]: T[K] };\ntype Nullable<T> = { [K in keyof T]: T[K] | null };\n \n// DeepPartial\ntype DeepPartial<T> = {\n  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];\n};\n \n// Built-in utility types\ntype Pick<T, K extends keyof T> = { [P in K]: T[P] };\ntype Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;\ntype Record<K extends keyof any, T> = { [P in K]: T };\ntype Required<T> = { [P in keyof T]-?: T[P] };\n \n// Template Literal Types (TS 4.1+)\ntype Greeting = `Hello, ${string}`;\ntype CSSValue = `${number}px` | `${number}rem`;\n \n// Generate event handlers from event names\ntype Events = 'click' | 'hover' | 'focus';\ntype EventHandlers<E extends string> = {\n  [K in E as `on${Capitalize<K>}`]: () => void;\n};\ntype Handlers = EventHandlers<Events>;\n// { onClick: () => void, onHover: () => void, onFocus: () => void }\n \n// Discriminated Unions\ntype Shape =\n  | { kind: 'circle'; radius: number }\n  | { kind: 'square'; side: number }\n  | { kind: 'triangle'; base: number; height: number };\n \nfunction area(shape: Shape): number {\n  switch (shape.kind) {\n    case 'circle': return Math.PI * shape.radius ** 2;\n    case 'square': return shape.side ** 2;\n    case 'triangle': return shape.base * shape.height / 2;\n  }\n}",
"howTo": "Treat this as a \"walk me through your TypeScript vocabulary\" question — the interviewer wants confident explanations more than a perfect essay.\nStart with generics: \"T extends X\" is just a placeholder type that must match some shape, like a fill-in-the-blank with rules attached.\nThen conditional types: \"T extends U ? X : Y\" is an if/else that runs on types instead of values — it is how something like Awaited<T> unwraps a Promise.\nThen mapped types: \"{ [K in keyof T] }\" is a for-loop over an object's keys, used to build things like Partial or Readonly versions of a type.\nThen infer: it lets you \"capture\" a piece of a type in the middle of a check, like pulling out a function's return type without knowing the function ahead of time.\nThe trap: infer only makes sense inside a conditional type's extends clause — it does not work as a standalone keyword.",
"dryRun": {
"input": "type ReturnType<T> = T extends (...args:any[]) => infer R ? R : never; function foo(){return 42;} type FooReturn = ReturnType<typeof foo>;",
"frames": [
"typeof foo gives the function's type: () => number",
"TypeScript checks: does () => number match the pattern (...args:any[]) => infer R ? Yes, it matches.",
"Because it matches, TypeScript captures whatever sits in the return position into R.",
"R is inferred as number, so the conditional type resolves to R (not the never fallback)."
],
"result": "FooReturn is resolved to the type `number`"
},
"pitfalls": [
"Trying to use infer outside a conditional type's extends clause -- it only works in that exact position.",
"Confusing generic constraints (T extends X, checked once) with conditional types (T extends U ? X : Y, an if/else that produces a different type).",
"Forgetting mapped types loop over keys, so { [K in keyof T]: T[K] | null } means 'for every key K in T, make its type nullable' -- not one single change."
],
"patternTakeaway": "If you see extends, infer, or [K in keyof T] in a type definition, always think: extends alone means constraint, extends ? : means conditional logic, infer captures a piece of a matched type, and [K in keyof T] means loop over the object's keys.",
"pattern": "TypeScript & Types"
},
{
"id": "iv-ch6-q5",
"guide": "Interview Guide",
"topic": "Comprehension & Output Prediction",
"topicNum": 6,
"level": "Medium",
"badge": null,
"question": "What does this output? Hoisting + closures.",
"explanation": "Two separate rules here. First, var: its declaration is hoisted (moved) to the top of the function, but its value is not -- reading it before the assignment line gives undefined, not an error. Second, let and const: they are also hoisted, but stay in a 'temporal dead zone' until their declaration line runs -- touching them before that throws a ReferenceError. Function declarations (function foo(){}) are hoisted completely, body included, so you can call them before they appear in the code. Function expressions (var bar = function(){}) only hoist the variable name, not the function itself, so calling them early fails. The classic trap: a for loop using var creates only ONE shared variable across every loop turn. By the time any callback function actually runs later, the loop has already finished, so every callback sees the same final value. Switching to let fixes this, because let creates a brand new variable for each loop turn, so each callback closes over its own separate copy.",
"code": "// 1. var hoisting\nconsole.log(x); // undefined\nvar x = 5;\nconsole.log(x); // 5\n \n// 2. let TDZ\nconsole.log(y); // ReferenceError\nlet y = 5;\n \n// 3. function declaration vs expression\nfoo(); // 'foo' - hoisted with body\nfunction foo() { return 'foo'; }\n \nbar(); // TypeError: bar is not a function\nvar bar = function() { return 'bar'; };\n \nbaz(); // ReferenceError\nlet baz = function() { return 'baz'; };\n \n// 4. Hard one - hoisting inside function\nfunction test() {\n  console.log(a); // undefined (hoisted)\n  var a = 1;\n  console.log(a); // 1\n  \n  // function declaration overrides!\n  function inner() { return 'first'; }\n  console.log(inner()); // 'second' (last function wins)\n  function inner() { return 'second'; }\n}\n \n// 5. Classic closure question\nfunction makeFns() {\n  const fns = [];\n  for (var i = 0; i < 3; i++) {\n    fns.push(function() { return i; });\n  }\n  return fns;\n}\nconst [f1, f2, f3] = makeFns();\nf1(); // 3 (all of them!)\nf2(); // 3\nf3(); // 3\n \n// FIX:\nfunction makeFns() {\n  const fns = [];\n  for (let i = 0; i < 3; i++) {  // let instead of var\n    fns.push(function() { return i; });\n  }\n  return fns;\n}\n// f1()=0, f2()=1, f3()=2",
"howTo": "Rule to apply first: var is hoisted and starts as undefined, but let/const are hoisted into a \"temporal dead zone\" where touching them early throws an error.\nTrace line by line: console.log(x) before \"var x = 5\" prints undefined (only the declaration moved up, not the value); console.log(y) before \"let y = 5\" throws a ReferenceError.\nFor function declaration vs expression: a full \"function foo(){}\" is hoisted with its whole body, so calling it early works — but \"var bar = function(){}\" only hoists the \"var bar\" part, so calling it early fails.\nFor the classic loop-closure trap: with \"var i\", all three functions share the exact same variable, so by the time they run later, the loop already finished and i is 3 for all of them.\nThe fix and why it works: \"let i\" creates a brand new i for every loop turn, so each function closes over its own separate copy instead of sharing one.",
"dryRun": {
"input": "function makeFns(){ const fns=[]; for(var i=0;i<3;i++){ fns.push(()=>i); } return fns; } const [f1,f2,f3]=makeFns();",
"frames": [
"var i is created once, shared across the whole function -- not recreated per loop turn.",
"The loop runs three times, pushing three functions that all reference the SAME variable i.",
"After the loop finishes, i is 3 (the condition i<3 failed and the loop stopped).",
"f1(), f2(), f3() are called AFTER the loop is done -- each one looks up the current value of the shared i, which is now 3."
],
"result": "f1() = 3, f2() = 3, f3() = 3 (all identical, because they share one variable)"
},
"pitfalls": [
"Expecting f1()=0, f2()=1, f3()=2 -- that only happens with let, not var, since var never creates a new variable per iteration.",
"Confusing hoisting (declaration moved up) with initialization (value assigned) -- var x is hoisted as undefined, not skipped entirely.",
"Assuming let is not hoisted at all -- it is hoisted, but sits in the temporal dead zone and throws if accessed before its line."
],
"patternTakeaway": "If you see a for loop with var creating functions or closures, always think: all of them share the one same variable, so they all see its final value after the loop ends -- use let to give each iteration its own copy.",
"pattern": "Closures & Scope"
},
{
"id": "iv-ch6-q6",
"guide": "Interview Guide",
"topic": "Comprehension & Output Prediction",
"topicNum": 6,
"level": "Medium",
"badge": null,
"question": "What is a Generator function? Show usage in infinite iteration.",
"explanation": "A generator is a function that can pause itself in the middle with 'yield', then continue later exactly where it stopped -- instead of running start to finish in one go. Calling a generator function does not run any code right away -- it just gives back an iterator object. Each time you call .next() on that iterator, the code runs until it hits the next 'yield', then pauses again. This is useful for infinite sequences (like counting forever) because you only compute one value at a time, whenever it's asked for -- nothing is calculated ahead of time. Generators can also receive values: whatever you pass into .next(value) becomes the result of the 'yield' expression that was paused. This same mechanism is what powers 'for...of' loops on custom objects, through Symbol.iterator.",
"code": "// 1. Basic\nfunction* counter() {\n  let i = 0;\n  while (true) {\n    yield i++;\n  }\n}\n \nconst c = counter();\nc.next(); // { value: 0, done: false }\nc.next(); // { value: 1, done: false }\n \n// 2. Infinite Fibonacci\nfunction* fib() {\n  let [a, b] = [0, 1];\n  while (true) {\n    yield a;\n    [a, b] = [b, a + b];\n  }\n}\n \nconst f = fib();\nfor (let i = 0; i < 10; i++) {\n  console.log(f.next().value);\n}\n// 0, 1, 1, 2, 3, 5, 8, 13, 21, 34\n \n// 3. Range generator\nfunction* range(start, end, step = 1) {\n  for (let i = start; i < end; i += step) {\n    yield i;\n  }\n}\n \n[...range(0, 10)]; // [0,1,2,3,4,5,6,7,8,9]\n[...range(0, 10, 2)]; // [0,2,4,6,8]\n \n// 4. Custom iterable\nclass LinkedList {\n  constructor() { this.head = null; }\n  add(value) { /* ... */ }\n  \n  *[Symbol.iterator]() {\n    let node = this.head;\n    while (node) {\n      yield node.value;\n      node = node.next;\n    }\n  }\n}\n \nconst list = new LinkedList();\n// list.add(...) etc\nfor (const value of list) { console.log(value); }\n \n// 5. Two-way communication\nfunction* dialog() {\n  const name = yield 'What is your name?';\n  const age = yield 'Hi ' + name + ', age?';\n  return name + ' is ' + age;\n}\nconst d = dialog();\nd.next();        // { value: 'What is your name?' }\nd.next('Roee');  // { value: 'Hi Roee, age?' }\nd.next(30);      // { value: 'Roee is 30', done: true }",
"howTo": "Definition to say first: a generator is a function that can pause itself with \"yield\" and pick back up later exactly where it stopped, instead of running start to finish in one go.\nExplain what calling it actually does: calling a generator function does not run any code yet — it just returns an iterator. Each .next() call runs the code up to the next yield.\nUse the infinite counter or Fibonacci example to show why this matters: you can describe an endless sequence but only compute one value at a time, on demand.\nMention it also works both ways: you can pass a value into .next() to feed data back into the generator, not just pull values out.\nConnect it to something familiar: this is the mechanism behind \"for...of\" on custom objects (via Symbol.iterator), and how async flows were handled before async/await existed.",
"dryRun": {
"input": "function* fib(){ let [a,b]=[0,1]; while(true){ yield a; [a,b]=[b,a+b]; } } const f = fib();",
"frames": [
"fib() is called -- no code runs yet, it just returns an iterator with a=0, b=1 waiting at the start.",
"f.next() -- runs until 'yield a': returns a=0 and pauses. On resume, [a,b] updates to [1,1].",
"f.next() -- resumes after the pause, loops back to 'yield a': returns a=1 and pauses. On resume, [a,b] updates to [1,2].",
"f.next() -- resumes, loops back to 'yield a': returns a=1 again and pauses. On resume, [a,b] updates to [2,3].",
"f.next() -- resumes, loops back to 'yield a': returns a=2 and pauses."
],
"result": "Calling f.next().value repeatedly gives: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34 ..."
},
"pitfalls": [
"Thinking calling fib() runs the while(true) loop immediately -- it doesn't; nothing executes until .next() is called.",
"Forgetting the code after 'yield' only runs on the NEXT .next() call, not right after the yield line.",
"Assuming an infinite while(true) loop would freeze the program -- it's safe here because yield pauses execution each time, one value at a time."
],
"patternTakeaway": "If you see function* and yield used for something 'infinite' or 'lazy', always think: nothing runs until .next() is called, and each call only advances the code up to the next yield.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch6-q7",
"guide": "Interview Guide",
"topic": "Comprehension & Output Prediction",
"topicNum": 6,
"level": "Medium",
"badge": null,
"question": "What is WeakMap and WeakSet? Why do we need them?",
"explanation": "WeakMap and WeakSet are like Map and Set, but they hold their object keys 'weakly'. That means if nothing else in your code still points to that object, JavaScript's garbage collector is free to delete it -- the WeakMap won't keep it alive forever. A regular Map would keep every key alive permanently, which can cause memory leaks. This makes WeakMap useful for: attaching extra data to an object (like a cache) that should disappear automatically once the object itself is gone, and storing private data for a class, keyed by the instance itself. The trade-offs: only objects can be used as keys (not strings or numbers), you cannot loop over a WeakMap or check its size, and there is no clear() method. If you need to iterate or check size, use a regular Map instead and accept the memory-leak risk.",
"code": "// WeakMap - private data pattern\nconst privateData = new WeakMap();\n \nclass User {\n  constructor(name, password) {\n    this.name = name;\n    privateData.set(this, { password }); // private!\n  }\n  \n  authenticate(pwd) {\n    return privateData.get(this).password === pwd;\n  }\n}\n \nconst u = new User('Roee', '1234');\nu.password; // undefined - not accessible!\nu.authenticate('1234'); // true\n \n// When u is deleted -> the map entry is auto-cleaned\n \n// WeakMap - auto-releasing cache\nconst cache = new WeakMap();\n \nfunction processUser(user) {\n  if (cache.has(user)) return cache.get(user);\n  \n  const result = expensiveComputation(user);\n  cache.set(user, result);\n  return result;\n}\n// When user is removed from system, its cache entry is freed\n \n// WeakSet - tracking objects\nconst visited = new WeakSet();\n \nfunction visit(node) {\n  if (visited.has(node)) return;\n  visited.add(node);\n  // process\n}\n \n// Won't work with primitives:\nconst wm = new WeakMap();\nwm.set('key', 'value'); // TypeError!\nwm.set({}, 'value');    // OK\n \n// Need iteration -> use regular Map\n// Need auto GC -> WeakMap",
"howTo": "Start with the core idea: a WeakMap holds its keys \"weakly\" — if nothing else in the code still points to that object, the garbage collector can delete it. A regular Map would keep it alive forever.\nExplain why that matters: it is perfect for attaching extra data to an object, like a cache or private fields, without causing a memory leak when that object is later thrown away.\nGive the private-data example: store an object's secret info in a WeakMap keyed by \"this\", so outside code can never read it directly off the instance.\nBalance it with the trade-offs: you cannot loop over a WeakMap, check its size, or use primitive values as keys — only objects are allowed as keys.\nThe trap: forgetting that rule — calling wm.set('key', value) with a plain string throws an error, because the key must be an object.",
"dryRun": {
"input": "const privateData = new WeakMap(); class User{ constructor(name,password){ this.name=name; privateData.set(this,{password}); } authenticate(pwd){ return privateData.get(this).password === pwd; } } const u = new User('Roee','1234');",
"frames": [
"new User('Roee','1234') runs the constructor -- this.name is set publicly, but the password is stored separately in privateData, keyed by 'this' (the instance).",
"u.password -- looking directly on the object finds nothing, since password was never set as a property on 'this': returns undefined.",
"u.authenticate('1234') -- looks up privateData.get(this), retrieves { password: '1234' }, compares to '1234': returns true.",
"If u is later set to null with no other references, the garbage collector can free it -- and its entry in privateData disappears automatically too."
],
"result": "u.password is undefined, u.authenticate('1234') is true, memory auto-cleans when u is discarded"
},
"pitfalls": [
"Trying to use a string or number as a WeakMap key -- only objects are allowed as keys, so wm.set('key', value) throws a TypeError.",
"Expecting to loop over a WeakMap or check its .size -- neither exists, by design, since entries can disappear at any time via garbage collection.",
"Assuming a regular Map would work identically here -- a Map would keep every User object alive forever, causing a memory leak."
],
"patternTakeaway": "If you see 'private data' or 'auto-cleanup tied to an object's lifetime,' always think: WeakMap/WeakSet, keyed by the object itself, so garbage collection can clean up automatically.",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch6-q8",
"guide": "Interview Guide",
"topic": "Comprehension & Output Prediction",
"topicNum": 6,
"level": "Medium",
"badge": null,
"question": "What is Symbol? Show 3 practical uses.",
"explanation": "A Symbol is a unique, primitive value. Every time you call Symbol(), you get a brand new value -- even two Symbols created with the exact same description are never equal to each other. Three practical uses: 1) Unique property keys -- adding a Symbol as an object key guarantees it will never accidentally clash with another property that happens to have the same name. 2) Well-known Symbols, like Symbol.iterator -- this is the special key JavaScript looks for to make an object work with 'for...of' loops or the spread operator (...). 3) Symbol.toPrimitive -- lets you control what your object turns into when it's used as a number, a string, or inside a template literal. There's also Symbol.for(), which pulls from one shared global registry -- calling it twice with the same string always returns the SAME Symbol, unlike plain Symbol() which is always unique.",
"code": "// 1. Unique property keys\nconst id = Symbol('id');\nconst user = {\n  name: 'Roee',\n  [id]: 12345 // won't collide with regular 'id'\n};\nuser[id]; // 12345\nuser.id; // undefined\n \n// 2. Symbol.iterator - making custom iterables\nclass Range {\n  constructor(start, end) {\n    this.start = start;\n    this.end = end;\n  }\n  \n  [Symbol.iterator]() {\n    let current = this.start;\n    const end = this.end;\n    return {\n      next() {\n        return current < end\n          ? { value: current++, done: false }\n          : { value: undefined, done: true };\n      }\n    };\n  }\n}\n \nconst r = new Range(1, 5);\n[...r]; // [1, 2, 3, 4]\nfor (const n of r) console.log(n);\n \n// 3. Symbol.toPrimitive - custom conversion\nclass Temperature {\n  constructor(celsius) { this.celsius = celsius; }\n  \n  [Symbol.toPrimitive](hint) {\n    if (hint === 'number') return this.celsius;\n    if (hint === 'string') return this.celsius + 'C';\n    return 'Temp: ' + this.celsius;\n  }\n}\n \nconst t = new Temperature(25);\n+t;        // 25 (number)\n`${t}`;    // \"25C\" (string)\nt + '';    // \"Temp: 25\" (default)\n \n// 4. Symbol.for - global registry\nconst s1 = Symbol.for('app.id');\nconst s2 = Symbol.for('app.id');\ns1 === s2; // true (same Symbol from registry)\n \n// vs regular:\nconst a = Symbol('id');\nconst b = Symbol('id');\na === b; // false (always unique)",
"howTo": "Start with the definition: Symbol() creates a brand-new, guaranteed-unique value — even two Symbols with the identical description are never equal to each other.\nFirst use case: unique object keys — adding a Symbol as a property key means it can never accidentally clash with another property that has the same name.\nSecond use case: well-known Symbols like Symbol.iterator — this is the hook JavaScript looks for to make an object work with \"for...of\" or the spread operator.\nThird use case: Symbol.toPrimitive — lets you control what an object turns into when it's used as a number, a string, or inside a template literal.\nThe trap: Symbol('id') !== Symbol('id') even with the same description — if you need the same Symbol reusable across your code, use Symbol.for(), which pulls from one shared global registry.",
"dryRun": {
"input": "const s1 = Symbol.for('app.id'); const s2 = Symbol.for('app.id'); const a = Symbol('id'); const b = Symbol('id');",
"frames": [
"Symbol.for('app.id') checks the global registry for that key -- not found, so it creates a new Symbol and stores it under 'app.id'.",
"Symbol.for('app.id') is called again with the same key -- this time it's found in the registry, so the SAME Symbol is returned.",
"Symbol('id') creates a brand new, one-off Symbol not tied to any registry -- call it 'a'.",
"Symbol('id') is called again -- even with the identical description 'id', a completely new, different Symbol is created -- call it 'b'."
],
"result": "s1 === s2 is true (same Symbol from registry), a === b is false (always unique)"
},
"pitfalls": [
"Assuming two Symbol('id') calls with the same description text produce equal values -- the description is just a debugging label, it doesn't affect uniqueness.",
"Confusing Symbol() (always unique) with Symbol.for() (shared, reusable from a global registry) -- they behave oppositely.",
"Forgetting a Symbol used as an object key is skipped by normal loops like for...in or Object.keys() -- you need Object.getOwnPropertySymbols() to see it."
],
"patternTakeaway": "If you see Symbol() vs Symbol.for() compared with ===, always think: plain Symbol() is always unique even with the same description, while Symbol.for() reuses the same value from a shared global registry.",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch7-q1",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "COMMON — GreatFrontEnd, asked at Stripe",
"question": "Implement classnames() — a utility to conditionally join CSS class names.",
"explanation": "classnames is a very popular helper function in frontend code. Almost every React app uses it.\nIt joins CSS class names into one string.\nIt must support:\n- Strings: classnames(\"a\", \"b\") gives \"a b\"\n- Objects: classnames({ a: true, b: false }) gives \"a\" (only keys with true values)\n- Arrays: classnames([\"a\", \"b\"]) gives \"a b\"\n- Mixed: classnames(\"a\", { b: true }, [\"c\"]) gives \"a b c\"\n- Falsy values: skip null, undefined, false, 0, and empty string\n- Nested arrays: flatten them all the way down",
"code": "function classnames(...args) {\n  const classes = [];\n  \n  for (const arg of args) {\n    if (!arg) continue; // skip falsy\n    \n    const argType = typeof arg;\n    \n    if (argType === 'string' || argType === 'number') {\n      classes.push(arg);\n    } else if (Array.isArray(arg)) {\n      // Recursively process arrays\n      const inner = classnames(...arg);\n      if (inner) classes.push(inner);\n    } else if (argType === 'object') {\n      for (const key in arg) {\n        if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {\n          classes.push(key);\n        }\n      }\n    }\n  }\n  \n  return classes.join(' ');\n}\n \n// Tests:\nclassnames('foo', 'bar');           // 'foo bar'\nclassnames('foo', { bar: true });   // 'foo bar'\nclassnames({ 'foo-bar': true });    // 'foo-bar'\nclassnames({ 'foo-bar': false });   // ''\nclassnames(null, false, 'bar', undefined, 0, 1, { baz: null }, '');\n// 'bar 1'\nclassnames('a', ['b', { c: true, d: false }]);\n// 'a b c'\nclassnames('a', ['b', ['c', ['d']]]);\n// 'a b c d'\n \n// Bonus: dedup version (classnames II)\nfunction classnamesDedup(...args) {\n  const classes = new Set();\n  \n  function process(item) {\n    if (!item) return;\n    if (typeof item === 'string' || typeof item === 'number') {\n      String(item).split(/\\s+/).forEach(c => c && classes.add(c));\n    } else if (Array.isArray(item)) {\n      item.forEach(process);\n    } else if (typeof item === 'function') {\n      process(item());\n    } else if (typeof item === 'object') {\n      for (const key in item) {\n        if (item[key]) classes.add(key);\n      }\n    }\n  }\n  \n  args.forEach(process);\n  return [...classes].join(' ');\n}",
"howTo": "1. Notice you need to accept many kinds of args (strings, objects, arrays) — that's the clue to use rest params and check typeof on each one.\n2. Skip falsy args right away (null, undefined, false, 0, ''). That clears out a lot of edge cases for free.\n3. If the arg is a string or number, just add it to your class list.\n4. If it's an array, call your own function again on its contents — that's how nested arrays get flattened.\n5. If it's a plain object, walk its keys and keep only the ones whose value is truthy.\n6. Join everything with a space at the end. If asked for a dedup version, swap the array for a Set.",
"dryRun": {
"input": "classnames('a', ['b', { c: true, d: false }])",
"frames": [
"arg = 'a' (string) -> push 'a'. classes so far: ['a']",
"arg = ['b', {c:true, d:false}] (array) -> recursively call classnames('b', {c:true, d:false})",
"inside that call: 'b' is a string -> push 'b'; the object has c truthy -> push 'c', d falsy -> skip. Returns 'b c'",
"back in the outer call: inner result 'b c' is truthy -> push it as one item. classes: ['a', 'b c']",
"join everything with a space"
],
"result": "'a b c'"
},
"pitfalls": [
"Forgetting to skip falsy values like 0, '', null, undefined, false.",
"Not flattening nested arrays recursively (arrays inside arrays).",
"Looping object keys with `for...in` without checking hasOwnProperty, which can pick up inherited keys.",
"Treating the number 0 as a valid class name — it must be skipped like other falsy values."
],
"patternTakeaway": "If you see a function that must accept strings, objects, and arrays mixed together, always think: loop the args, check typeof on each one, and recurse for arrays.",
"pattern": "Objects & Prototypes"
},
{
"id": "iv-ch7-q2",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "COMMON — JSON polyfill",
"question": "Implement JSON.stringify() from scratch.",
"explanation": "JSON.stringify turns a JavaScript value into a JSON text string.\nIt must handle:\n- Simple values: strings (with special characters escaped), numbers, booleans, and null\n- Arrays: convert each item one by one\n- Objects: convert each value one by one\n- undefined, functions, and Symbols: these disappear inside objects, but become null inside arrays\n- toJSON() method: call it first if the value has one\nWatch out: if the value has a circular reference (an object pointing back to itself), the real JSON.stringify throws an error.",
"code": "function jsonStringify(value) {\n  // null\n  if (value === null) return 'null';\n  \n  // Numbers (including special cases)\n  if (typeof value === 'number') {\n    if (!isFinite(value)) return 'null'; // Infinity, NaN -> null\n    return String(value);\n  }\n  \n  // Boolean\n  if (typeof value === 'boolean') return String(value);\n  \n  // String - need to escape special chars\n  if (typeof value === 'string') {\n    return '\"' + value\n      .replace(/\\\\/g, '\\\\\\\\')\n      .replace(/\"/g, '\\\\\"')\n      .replace(/\\n/g, '\\\\n')\n      .replace(/\\r/g, '\\\\r')\n      .replace(/\\t/g, '\\\\t')\n      + '\"';\n  }\n  \n  // Functions, undefined, Symbol -> undefined (skipped)\n  if (typeof value === 'function' || \n      typeof value === 'undefined' || \n      typeof value === 'symbol') {\n    return undefined;\n  }\n  \n  // Date -> ISO string (via toJSON)\n  if (value instanceof Date) {\n    return '\"' + value.toISOString() + '\"';\n  }\n  \n  // Arrays\n  if (Array.isArray(value)) {\n    const items = value.map(item => {\n      const result = jsonStringify(item);\n      return result === undefined ? 'null' : result;\n    });\n    return '[' + items.join(',') + ']';\n  }\n  \n  // Objects\n  if (typeof value === 'object') {\n    // toJSON method (Date uses this)\n    if (typeof value.toJSON === 'function') {\n      return jsonStringify(value.toJSON());\n    }\n    \n    const pairs = [];\n    for (const key in value) {\n      if (Object.prototype.hasOwnProperty.call(value, key)) {\n        const stringified = jsonStringify(value[key]);\n        if (stringified !== undefined) {\n          pairs.push('\"' + key + '\":' + stringified);\n        }\n      }\n    }\n    return '{' + pairs.join(',') + '}';\n  }\n}\n \n// Tests:\njsonStringify({ a: 1, b: 'hello', c: null });\n// '{\"a\":1,\"b\":\"hello\",\"c\":null}'\n \njsonStringify([1, 'two', true, null]);\n// '[1,\"two\",true,null]'\n \njsonStringify({ a: undefined, b: function(){}, c: 1 });\n// '{\"c\":1}' (undefined and function skipped in objects)\n \njsonStringify([undefined, 1]);\n// '[null,1]' (undefined becomes null in arrays)",
"howTo": "1. Think of it as one function that decides what to do based on the value's type, calling itself for nested values.\n2. Handle easy primitives first: null becomes \"null\", finite numbers and booleans just become their string form, NaN/Infinity become \"null\".\n3. Strings need escaping — quotes, backslashes, newlines — then wrap the result in quotes.\n4. Say the tricky rule out loud: functions, undefined, and symbols disappear from objects, but turn into null inside arrays.\n5. For objects, check for a toJSON method first (that's how Date works), otherwise loop over own keys and skip any key whose value stringifies to undefined.\n6. For arrays, map every item through the same function and turn any undefined result into \"null\" before joining with commas.",
"dryRun": {
"input": "jsonStringify({ a: undefined, b: function(){}, c: 1 })",
"frames": [
"value is a plain object -> loop over its keys: a, b, c",
"key 'a': jsonStringify(undefined) returns undefined -> skip this key entirely",
"key 'b': jsonStringify(a function) returns undefined -> skip this key too",
"key 'c': jsonStringify(1) returns '1' -> add the pair \"c\":1",
"join the remaining pairs and wrap in curly braces"
],
"result": "'{\"c\":1}'"
},
"pitfalls": [
"Forgetting NaN and Infinity must become the string \"null\", not throw an error.",
"Mixing up the rule: undefined disappears inside objects, but becomes null inside arrays.",
"Not escaping special characters in strings (quotes, backslashes, newlines) before wrapping in quotes.",
"Forgetting to check for a toJSON() method first (this is how Date objects convert to strings)."
],
"patternTakeaway": "If you see 'convert a JS value to a string recursively' and it asks for JSON stringify, always think: handle each type separately, then recurse for arrays and objects.",
"pattern": "Recursion & Backtracking"
},
{
"id": "iv-ch7-q3",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "COMMON — Promise variants",
"question": "Implement Promise.race, Promise.any, Promise.allSettled.",
"explanation": "These three methods complete the set of Promise combinators, alongside Promise.all.\nPromise.race: finishes as soon as the FIRST promise finishes — whether it succeeds or fails.\nPromise.any: succeeds as soon as the FIRST promise succeeds. It only fails if ALL of them fail.\nPromise.allSettled: waits for every promise to finish. It never fails. It gives back an array of results, each one either {status: 'fulfilled', value} or {status: 'rejected', reason}.\nSimple rule to remember:\n- Need all to succeed? Use Promise.all\n- Need the first one to finish, success or fail? Use Promise.race\n- Need just one success? Use Promise.any\n- Need every result, even the failed ones? Use Promise.allSettled",
"code": "// Promise.race - first to settle wins\nfunction race(promises) {\n  return new Promise((resolve, reject) => {\n    promises.forEach(p => {\n      Promise.resolve(p).then(resolve, reject);\n    });\n  });\n}\n \n// Use case: timeout pattern\nconst timeout = (ms) => new Promise((_, reject) => \n  setTimeout(() => reject(new Error('Timeout')), ms)\n);\n \nawait Promise.race([\n  fetch('/api/data'),\n  timeout(5000) // reject after 5s\n]);\n \n// Promise.any - first success wins\nfunction any(promises) {\n  return new Promise((resolve, reject) => {\n    const errors = [];\n    let rejectedCount = 0;\n    \n    if (promises.length === 0) {\n      reject(new AggregateError([], 'All promises rejected'));\n      return;\n    }\n    \n    promises.forEach((p, i) => {\n      Promise.resolve(p)\n        .then(resolve)\n        .catch(err => {\n          errors[i] = err;\n          rejectedCount++;\n          if (rejectedCount === promises.length) {\n            reject(new AggregateError(errors, 'All promises rejected'));\n          }\n        });\n    });\n  });\n}\n \n// Use case: try multiple CDN mirrors\nawait Promise.any([\n  fetch('https://cdn1.example.com/data'),\n  fetch('https://cdn2.example.com/data'),\n  fetch('https://cdn3.example.com/data'),\n]);\n// Returns first one that succeeds\n \n// Promise.allSettled - wait for all, never rejects\nfunction allSettled(promises) {\n  return Promise.all(\n    promises.map(p =>\n      Promise.resolve(p)\n        .then(value => ({ status: 'fulfilled', value }))\n        .catch(reason => ({ status: 'rejected', reason }))\n    )\n  );\n}\n \n// Use case: batch API calls where partial failures are OK\nconst results = await Promise.allSettled([\n  fetchUser(1),\n  fetchUser(2),\n  fetchUser(3),\n]);\n \nresults.forEach((result, i) => {\n  if (result.status === 'fulfilled') {\n    console.log('User ' + i + ':', result.value);\n  } else {\n    console.error('Failed user ' + i + ':', result.reason);\n  }\n});",
"howTo": "1. Say the rule of thumb first: all must succeed -> Promise.all, first to settle either way -> race, first success only -> any, want every result no matter what -> allSettled.\n2. For race, attach the same resolve and reject to every promise — whichever settles first wins automatically, no extra bookkeeping needed.\n3. For any, flip the logic: resolve on the first success, but only reject once ALL of them have failed, so keep a counter of failures.\n4. For allSettled, never reject — wrap each promise in a then/catch that always resolves with a {status, value or reason} object, then Promise.all those wrapped promises.\n5. Give a real use case for each: race for a timeout pattern, any for trying multiple CDN mirrors, allSettled for batch calls where partial failure is fine.",
"dryRun": {
"input": "any([p1 (rejects 'err1'), p2 (rejects 'err2'), p3 (resolves 'ok')])",
"frames": [
"p1 settles first and rejects with 'err1'. rejectedCount = 1, not all 3 have failed yet, so nothing happens outwardly.",
"p2 settles and rejects with 'err2'. rejectedCount = 2, still not all 3.",
"p3 settles and resolves with 'ok' -> resolve('ok') is called right away, this wins immediately regardless of the failures.",
"the outer promise is now resolved with 'ok', p1 and p2's failures are simply ignored."
],
"result": "resolves to 'ok'"
},
"pitfalls": [
"Promise.any only rejects when ALL promises fail — it then throws an AggregateError, not a normal Error.",
"Promise.race settles on whichever promise finishes first, even if it's a failure — don't assume it always means success.",
"Promise.allSettled never rejects — you must check each result's status field yourself.",
"Calling Promise.any with an empty array should reject immediately with an AggregateError."
],
"patternTakeaway": "If you see 'wait for multiple promises' and need to pick the right combinator, always think: all-must-succeed = all, first-to-finish = race, first-success = any, every-result-regardless = allSettled.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch7-q4",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "COMMON — DOM polyfill",
"question": "Implement getElementsByTagName() and getElementsByClassName() polyfills.",
"explanation": "These DOM polyfills test a few things:\n- Walking through a tree of elements (depth-first or breadth-first search)\n- Understanding Node, Element, and classList\n- Doing it efficiently: walk the tree once and collect all matches\nNote: the real getElementsByClassName returns a LIVE list that updates automatically when the DOM changes. Most polyfills just return a plain array instead — that is usually fine for an interview.",
"code": "// getElementsByTagName\nfunction getElementsByTagName(root, tagName) {\n  const result = [];\n  const upperTag = tagName.toUpperCase();\n  \n  function traverse(node) {\n    if (!node) return;\n    \n    // Match tag (case-insensitive in HTML)\n    if (node.nodeType === 1 && // ELEMENT_NODE\n        (upperTag === '*' || node.tagName === upperTag)) {\n      result.push(node);\n    }\n    \n    // Recurse into children\n    for (const child of node.children || []) {\n      traverse(child);\n    }\n  }\n  \n  traverse(root);\n  return result;\n}\n \n// getElementsByClassName\nfunction getElementsByClassName(root, classNames) {\n  const classes = classNames.trim().split(/\\s+/);\n  const result = [];\n  \n  function traverse(node) {\n    if (!node) return;\n    \n    if (node.nodeType === 1) { // ELEMENT_NODE\n      // Element must have ALL the requested classes\n      const elementClasses = node.classList\n        ? Array.from(node.classList)\n        : (node.className || '').split(/\\s+/);\n      \n      const hasAll = classes.every(c => elementClasses.includes(c));\n      if (hasAll) result.push(node);\n    }\n    \n    for (const child of node.children || []) {\n      traverse(child);\n    }\n  }\n  \n  traverse(root);\n  return result;\n}\n \n// Iterative version (avoids stack overflow on deep trees)\nfunction getElementsByTagNameIterative(root, tagName) {\n  const result = [];\n  const upperTag = tagName.toUpperCase();\n  const stack = [root];\n  \n  while (stack.length > 0) {\n    const node = stack.pop();\n    if (!node) continue;\n    \n    if (node.nodeType === 1 && \n        (upperTag === '*' || node.tagName === upperTag)) {\n      result.push(node);\n    }\n    \n    // Push children in reverse to maintain DOM order\n    if (node.children) {\n      for (let i = node.children.length - 1; i >= 0; i--) {\n        stack.push(node.children[i]);\n      }\n    }\n  }\n  \n  return result;\n}\n \n// Bonus: getElementsByStyle\nfunction getElementsByStyle(root, property, value) {\n  const result = [];\n  \n  function traverse(node) {\n    if (node.nodeType === 1) {\n      const computed = window.getComputedStyle(node);\n      if (computed[property] === value) {\n        result.push(node);\n      }\n    }\n    for (const child of node.children || []) {\n      traverse(child);\n    }\n  }\n  \n  traverse(root);\n  return result;\n}",
"howTo": "1. Recognize this is a tree-traversal problem — visit every node once and check a condition.\n2. Choose recursion (simpler to write) or an explicit stack (safer for very deep trees) and say you know the tradeoff.\n3. Write one traverse function: check the current node against the condition (tag matches, or has all requested classes), push it if it matches, then recurse into node.children.\n4. For class name matching, split the search string into individual classes and require the element to have every one of them.\n5. Mention the gotcha: the real browser API returns a live HTMLCollection that auto-updates, but a plain array is normally fine for an interview.",
"dryRun": {
"input": "tree: root -> [span.a, p.b]; call getElementsByClassName(root, 'a')",
"frames": [
"traverse(root): root is an element but has no class 'a', so it's not added. Recurse into its children.",
"traverse(span.a): its classList is ['a']. It has every requested class ('a'), so push it into result.",
"traverse(p.b): its classList is ['b']. It does NOT have 'a', so skip it.",
"no more children to visit, return the collected result."
],
"result": "[span.a]"
},
"pitfalls": [
"The real browser API returns a live HTMLCollection that updates automatically — a plain array polyfill does not, but that is usually acceptable in interviews.",
"An element must have ALL requested class names (space separated), not just one of them.",
"Forgetting to check nodeType === 1 lets text nodes and comment nodes slip into the results.",
"Recursion can overflow the call stack on very deep trees — an iterative stack-based version avoids that."
],
"patternTakeaway": "If you see 'find all elements matching X somewhere in a tree' and it asks for a DOM query polyfill, always think: recursive (or stack-based) tree walk, checking a condition at each node.",
"pattern": "DOM & Events"
},
{
"id": "iv-ch7-q5",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "CRITICAL — every interview",
"question": "What are Higher-Order Functions? Show 3 examples.",
"explanation": "A Higher-Order Function (HOF) does at least one of these two things:\n1. Takes one or more functions as arguments\n2. Returns a function as its result\nWhy this matters:\n- It is the foundation of functional programming\n- It lets you combine, reuse, and simplify code\n- Built-in JS examples: map, filter, reduce, forEach\nFun fact: React components are technically HOFs too — they take props as input and return UI as output.",
"code": "// 1. Functions that TAKE functions\nconst numbers = [1, 2, 3, 4, 5];\n \nnumbers.map(n => n * 2);     // [2, 4, 6, 8, 10]\nnumbers.filter(n => n > 2);  // [3, 4, 5]\nnumbers.reduce((a, b) => a + b, 0); // 15\n \n// 2. Functions that RETURN functions\nfunction multiplier(factor) {\n  return function(num) {\n    return num * factor;\n  };\n}\n \nconst double = multiplier(2);\nconst triple = multiplier(3);\ndouble(5);  // 10\ntriple(5);  // 15\n \n// 3. Both - decorator pattern\nfunction withLogging(fn) {\n  return function(...args) {\n    console.log('Calling with:', args);\n    const result = fn.apply(this, args);\n    console.log('Result:', result);\n    return result;\n  };\n}\n \nconst loggedAdd = withLogging((a, b) => a + b);\nloggedAdd(2, 3);\n// Calling with: [2, 3]\n// Result: 5\n \n// 4. Real-world: HOC in React (legacy pattern)\nfunction withAuth(Component) {\n  return function AuthenticatedComponent(props) {\n    const user = useUser();\n    if (!user) return <LoginPrompt />;\n    return <Component {...props} user={user} />;\n  };\n}\n \nconst ProtectedDashboard = withAuth(Dashboard);\n \n// 5. Real-world: middleware pattern (Redux)\nconst logger = store => next => action => {\n  console.log('dispatching', action);\n  const result = next(action);\n  console.log('next state', store.getState());\n  return result;\n};\n \n// 6. Once - run a function only once\nfunction once(fn) {\n  let called = false;\n  let result;\n  return function(...args) {\n    if (!called) {\n      called = true;\n      result = fn.apply(this, args);\n    }\n    return result;\n  };\n}\n \nconst init = once(() => console.log('Initializing...'));\ninit(); // 'Initializing...'\ninit(); // (nothing)",
"howTo": "1. Start with the definition: a function that takes another function as an argument, or returns a function, or both.\n2. Give one example of each: map/filter/reduce take a function; a multiplier(factor) function that returns a new function is one that returns a function.\n3. Show a function that does both, like a withLogging wrapper that takes a function and returns a new function around it.\n4. Connect it to React: HOCs like withAuth(Component) return a new component, and Redux-style middleware chains the same idea through several layers.\n5. If asked to code one, pick something simple like \"once\" — a function that only lets the wrapped function run one time — to show you can build the pattern from scratch.",
"dryRun": {
"input": "const init = once(() => console.log('Initializing...')); init(); init();",
"frames": [
"once(fn) is called -> it sets called = false internally, and returns a new wrapper function. init now points to that wrapper.",
"init() is called the 1st time: called is false, so set called = true, run fn(), which logs 'Initializing...', and store the result.",
"init() is called the 2nd time: called is now true, so fn() is NOT run again — the wrapper just returns the stored result silently."
],
"result": "logs 'Initializing...' exactly once, even though init() was called twice"
},
"pitfalls": [
"Forgetting that 'takes a function OR returns a function' both count — you don't need both to qualify as a HOF.",
"Not mentioning map/filter/reduce as the most common built-in HOF examples.",
"Forgetting to use fn.apply(this, args) when wrapping a function, which can lose the correct 'this' value.",
"Confusing a Higher-Order Function with plain recursion — they are two different ideas."
],
"patternTakeaway": "If you see 'a function that takes or returns another function', always think: Higher-Order Function, the base idea behind map/filter/reduce and React HOCs.",
"pattern": "Functions & this"
},
{
"id": "iv-ch7-q6",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "CRITICAL — React 18+",
"question": "Explain Suspense and Error Boundaries. When to use them?",
"explanation": "Suspense: shows a loading state in a simple, declarative way. It is a boundary that shows fallback UI while its children are still \"suspending\" (loading).\nCommon uses:\n- Lazy-loaded components (React.lazy)\n- Fetching data with React Query or Relay\n- Streaming server-rendering with Next.js\nError Boundaries: components that catch errors happening inside their child components, and show fallback UI instead of crashing the whole app.\nLimits to remember:\n- Must be written as a class component (or use the react-error-boundary library)\n- They do NOT catch errors in event handlers, async code, or server-side rendering\n- They only catch errors during render, lifecycle methods, and constructors",
"code": "// Suspense with React.lazy\nimport { Suspense, lazy } from 'react';\n \nconst HeavyComponent = lazy(() => import('./HeavyComponent'));\n \nfunction App() {\n  return (\n    <Suspense fallback={<Spinner />}>\n      <HeavyComponent />\n    </Suspense>\n  );\n}\n \n// Multiple Suspense boundaries - independent loading\nfunction Dashboard() {\n  return (\n    <>\n      <Suspense fallback={<HeaderSkeleton />}>\n        <Header />\n      </Suspense>\n      <Suspense fallback={<FeedSkeleton />}>\n        <Feed />\n      </Suspense>\n      <Suspense fallback={<SidebarSkeleton />}>\n        <Sidebar />\n      </Suspense>\n    </>\n  );\n}\n \n// Error Boundary (class component)\nclass ErrorBoundary extends React.Component {\n  state = { hasError: false, error: null };\n  \n  static getDerivedStateFromError(error) {\n    return { hasError: true, error };\n  }\n  \n  componentDidCatch(error, errorInfo) {\n    console.error('Error caught:', error, errorInfo);\n    // Send to error tracking (Sentry, LogRocket, etc.)\n    logErrorToService(error, errorInfo);\n  }\n  \n  render() {\n    if (this.state.hasError) {\n      return (\n        <div role=\"alert\">\n          <h2>Something went wrong.</h2>\n          <button onClick={() => this.setState({ hasError: false })}>\n            Try again\n          </button>\n        </div>\n      );\n    }\n    return this.props.children;\n  }\n}\n \n// Combined - both boundaries\nfunction App() {\n  return (\n    <ErrorBoundary>\n      <Suspense fallback={<Spinner />}>\n        <DataFetchingComponent />\n      </Suspense>\n    </ErrorBoundary>\n  );\n}\n \n// Modern: react-error-boundary library\nimport { ErrorBoundary } from 'react-error-boundary';\n \nfunction App() {\n  return (\n    <ErrorBoundary\n      FallbackComponent={ErrorFallback}\n      onReset={() => window.location.reload()}\n      onError={(error) => logToService(error)}\n    >\n      <Component />\n    </ErrorBoundary>\n  );\n}\n \nfunction ErrorFallback({ error, resetErrorBoundary }) {\n  return (\n    <div role=\"alert\">\n      <p>Something went wrong:</p>\n      <pre>{error.message}</pre>\n      <button onClick={resetErrorBoundary}>Try again</button>\n    </div>\n  );\n}",
"howTo": "1. Give the one-line definitions: Suspense shows a fallback while children are still loading, Error Boundaries catch render-time errors so the app doesn't crash.\n2. Give a tiny example: wrap a React.lazy component in Suspense with a spinner fallback, and wrap a form in an ErrorBoundary class using getDerivedStateFromError.\n3. Mention the gotcha for each: Suspense fallback works for lazy loading and data fetching, but Error Boundaries only catch errors in render or lifecycle — never in event handlers or async code.\n4. Say they're usually combined: ErrorBoundary on the outside, Suspense inside it, so you get a loading state and a crash safety net together.\n5. Mention the modern shortcut: the react-error-boundary library skips writing a class component yourself.",
"dryRun": {
"input": "<ErrorBoundary><Suspense fallback={<Spinner/>}><HeavyComponent/></Suspense></ErrorBoundary>",
"frames": [
"React starts rendering HeavyComponent, but it's still being lazy-loaded (the import() hasn't resolved yet) -> the component 'suspends'.",
"Suspense catches that suspend signal and shows the fallback <Spinner /> instead of crashing.",
"Once the lazy import finishes loading, React retries rendering HeavyComponent — this time it succeeds, and Spinner is swapped out for the real component.",
"If HeavyComponent instead throws a real error during render, Suspense cannot catch that — the error bubbles up past it to ErrorBoundary.",
"ErrorBoundary's getDerivedStateFromError sets hasError = true, and render() shows the fallback error UI instead."
],
"result": "user sees a spinner while loading, the real component once ready, or an error message if it crashes"
},
"pitfalls": [
"Error Boundaries must be class components (or use react-error-boundary) — you cannot write one as a plain function with try/catch.",
"Error Boundaries do NOT catch errors in event handlers or async code, only render/lifecycle/constructor errors.",
"Suspense fallback only handles loading, not errors — you still need an Error Boundary wrapped around it.",
"Using only one giant Suspense boundary means everything shows the same fallback together, instead of loading independently."
],
"patternTakeaway": "If you see 'loading state', always think Suspense; if you see 'don't let one error crash the whole app', always think Error Boundary — combine both for full coverage.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch7-q7",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "CRITICAL — Next.js, modern React",
"question": "What is the difference between Server Components and Client Components?",
"explanation": "React Server Components (RSC) run ONLY on the server:\n- They can access the database, file system, and APIs directly\n- No JavaScript for them is sent to the browser — smaller bundle size\n- They cannot use useState, useEffect, or event handlers\n- They are the default in the Next.js App Router\nClient Components (marked with \"use client\"):\n- They run in the browser\n- They support useState, useEffect, and event handlers\n- They are required for anything interactive\n- They get hydrated after the first render\nKey rule: keep Client Components small, and place them near the \"leaves\" (bottom) of the component tree. You can still pass Server Components AS CHILDREN into a Client Component when you need to.",
"code": "// app/users/page.tsx — Server Component (default)\nasync function UsersPage() {\n  // Direct DB access - no API needed!\n  const users = await db.users.findAll();\n  \n  return (\n    <div>\n      <h1>Users</h1>\n      <UserList users={users} />\n    </div>\n  );\n}\n \n// components/UserList.tsx — Client (interactive)\n'use client';\nimport { useState } from 'react';\n \nfunction UserList({ users }) {\n  const [filter, setFilter] = useState('');\n  \n  return (\n    <>\n      <input value={filter} onChange={e => setFilter(e.target.value)} />\n      {users\n        .filter(u => u.name.toLowerCase().includes(filter.toLowerCase()))\n        .map(u => <li key={u.id}>{u.name}</li>)\n      }\n    </>\n  );\n}\n \n// What Server Components CAN'T do:\n// - useState, useEffect, useReducer\n// - Event handlers (onClick, etc.)\n// - Browser APIs (window, document, localStorage)\n// - Custom hooks that use any of the above\n \n// What Server Components CAN do:\n// - async/await directly\n// - Read files, query database\n// - Use server-only secrets\n// - Pass Server Components as children to Client Components!\n \n// IMPORTANT pattern: Server -> Client -> Server\n// 'use client' marks the boundary, but children can be Server Components\n \n// Server Component\nasync function Page() {\n  const data = await getData();\n  return (\n    <ClientWrapper> {/* Client Component */}\n      <ServerChild data={data} /> {/* Still server-rendered! */}\n    </ClientWrapper>\n  );\n}\n \n// 'use client' (this file)\nfunction ClientWrapper({ children }) {\n  const [open, setOpen] = useState(false);\n  return (\n    <div>\n      <button onClick={() => setOpen(!open)}>Toggle</button>\n      {open && children} {/* server-rendered children */}\n    </div>\n  );\n}",
"howTo": "1. Give the one-line definitions: Server Components run only on the server and ship no JS to the browser; Client Components run in the browser and support interactivity.\n2. Say what each can't do: Server Components can't use useState, useEffect, or event handlers; Client Components lose the \"no JS shipped\" benefit.\n3. Give a real-world example: a page that fetches data straight from a database (Server Component) rendering a small interactive filter box (Client Component) inside it.\n4. Mention the rule interviewers like: keep 'use client' components small and near the leaves of the tree, not at the top.\n5. Bring up the gotcha most people miss: you can still pass a Server Component as a child into a Client Component, so that child stays server-rendered.",
"dryRun": {
"input": "Server Page() renders <ClientWrapper><ServerChild data={data} /></ClientWrapper>",
"frames": [
"On the server: Page() runs, calling await getData() directly against the database — no API call needed.",
"On the server: it renders ClientWrapper ('use client') and passes ServerChild as its children — ServerChild is already turned into HTML on the server.",
"In the browser: ClientWrapper hydrates and becomes interactive (it has its own useState for `open`).",
"User clicks the toggle button -> setOpen(true) runs -> {open && children} now shows — but children (ServerChild) was already rendered as HTML, so no extra server round trip is needed."
],
"result": "an interactive toggle button wrapping content that stays server-rendered"
},
"pitfalls": [
"Server Components cannot use useState, useEffect, or event handlers — the #1 mistake people make in interviews.",
"'use client' marks a boundary, but children passed INTO a client component can still be Server Components.",
"Forgetting that Client Components should stay small and live near the leaves of the tree, not wrap everything.",
"Server Components are the DEFAULT in the Next.js App Router — you opt IN to 'use client', you don't opt out of it."
],
"patternTakeaway": "If you see 'needs interactivity or browser APIs', always think Client Component; if you see 'needs direct DB/file access with no JS shipped', always think Server Component.",
"pattern": "React Rendering & Performance"
},
{
"id": "iv-ch7-q8",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "COMMON — Accessibility",
"question": "What are the most important Accessibility (a11y) practices in React?",
"explanation": "Accessibility (a11y) is very important at senior level. Focus on these areas:\n1. Semantic HTML: use <button>, <nav>, <main>, <article> instead of plain <div>\n2. ARIA attributes: use them only when semantic HTML is not enough\n3. Keyboard navigation: make sure Tab, Enter, Escape, and arrow keys all work\n4. Focus management: trap focus inside modals, and give it back after the modal closes\n5. Screen readers: use aria-label, aria-live, and aria-describedby\n6. Color contrast: aim for WCAG AA, which means a 4.5:1 contrast ratio for text\n7. Form labels: every input needs a connected <label>\n8. Skip links: add a \"Skip to main content\" link for keyboard users\n9. Reduced motion: respect the user's prefers-reduced-motion setting\n10. Testing: use tools like axe DevTools, and test with a real screen reader",
"code": "// 1. Semantic HTML over divs\n// BAD\n<div onClick={handleClick}>Click me</div>\n \n// GOOD\n<button onClick={handleClick}>Click me</button>\n// Built-in: keyboard support, focus, screen reader announcement\n \n// 2. Form labels\n// BAD\n<input type=\"text\" placeholder=\"Name\" />\n \n// GOOD\n<label htmlFor=\"name\">Name</label>\n<input id=\"name\" type=\"text\" />\n \n// Or wrap:\n<label>\n  Name\n  <input type=\"text\" />\n</label>\n \n// 3. Modal accessibility\nfunction Modal({ isOpen, onClose, title, children }) {\n  return (\n    <div\n      role=\"dialog\"\n      aria-modal=\"true\"\n      aria-labelledby=\"modal-title\"\n      onClick={onClose}\n    >\n      <div onClick={e => e.stopPropagation()}>\n        <h2 id=\"modal-title\">{title}</h2>\n        <button onClick={onClose} aria-label=\"Close dialog\">×</button>\n        {children}\n      </div>\n    </div>\n  );\n}\n \n// 4. Live regions for dynamic content\nfunction Toast({ message }) {\n  return (\n    <div role=\"status\" aria-live=\"polite\">\n      {message}\n    </div>\n  );\n}\n// \"polite\" - waits for screen reader to finish current\n// \"assertive\" - interrupts (use for urgent alerts)\n \n// 5. Loading states\n<button aria-busy={isLoading} disabled={isLoading}>\n  {isLoading ? 'Loading...' : 'Submit'}\n</button>\n \n// 6. Skip link\n<a href=\"#main\" className=\"skip-link\">\n  Skip to main content\n</a>\n<main id=\"main\">{/* content */}</main>\n \n// 7. Reduced motion\nconst prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');\nconst animationDuration = prefersReducedMotion ? 0 : 300;\n \n// 8. Focus trap in modal (use focus-trap-react)\nimport FocusTrap from 'focus-trap-react';\n \n<FocusTrap>\n  <div role=\"dialog\">{children}</div>\n</FocusTrap>\n \n// 9. Custom checkbox with proper ARIA\nfunction Checkbox({ checked, onChange, label }) {\n  return (\n    <label>\n      <input\n        type=\"checkbox\"\n        checked={checked}\n        onChange={onChange}\n        aria-checked={checked}\n      />\n      {label}\n    </label>\n  );\n}\n \n// 10. Visible focus indicators\n// CSS - never remove focus outline without replacement!\n// BAD: button:focus { outline: none; }\n// GOOD: \n// button:focus-visible {\n//   outline: 2px solid blue;\n//   outline-offset: 2px;\n// }",
"howTo": "1. Don't try to list all the rules from memory — pick the ones that come up most: semantic HTML, labels, keyboard support, focus management, ARIA live regions.\n2. Give one bad-vs-good example out loud, like a clickable div versus a real button — the button gets keyboard and screen-reader support for free.\n3. Mention forms specifically: every input needs a connected label, not just a placeholder.\n4. Bring up modals as the trickiest real example: they need role=\"dialog\", focus trapped inside while open, and focus returned to the trigger after closing.\n5. End with a practical check: mention testing with axe DevTools or a screen reader, and that removing a focus outline without replacing it is a common bug.",
"dryRun": {
"input": "<div onClick={handleClick}>Click me</div> vs <button onClick={handleClick}>Click me</button>",
"frames": [
"A user is navigating the page using only the Tab key.",
"With the div version: Tab skips right over it — plain divs are not focusable by default, so the keyboard user can never reach it.",
"With the button version: Tab lands on it, and the browser shows a focus outline automatically.",
"The user presses Enter or Space while the button is focused -> onClick fires automatically, this is built-in browser behavior.",
"A screen reader announces 'Click me, button' for the button, but only reads plain text for the div — no role or interactivity is announced."
],
"result": "the button is usable by keyboard and screen reader for free, the div is not"
},
"pitfalls": [
"A placeholder is not a label — always pair every input with a real <label>.",
"Removing the focus outline (outline: none) without giving a replacement breaks keyboard navigation.",
"aria-live=\"assertive\" interrupts the user right away — use \"polite\" for normal, non-urgent updates.",
"Modals need focus trapped inside while open, and focus restored to the trigger element after they close."
],
"patternTakeaway": "If you see 'make this clickable element accessible', always think: use semantic HTML first, and add ARIA only when semantic HTML isn't enough.",
"pattern": "DOM & Events"
},
{
"id": "iv-ch7-q9",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "COMMON — DOM concepts",
"question": "Explain Event Bubbling vs Event Capturing. When to use each?",
"explanation": "When an event happens, it moves through 3 phases:\n1. Capturing phase: travels top to bottom (from window down to the target)\n2. Target phase: reaches the actual element that was clicked\n3. Bubbling phase: travels bottom to top (from target back up to window). This is the DEFAULT.\nDifference:\n- Bubbling (default): your handler runs as the event travels UP\n- Capturing: your handler runs as the event travels DOWN\nUse capturing when:\n- You need to catch the event BEFORE a child element handles it\n- You are building a global handler, like for analytics or security\nstopPropagation(): stops the event from moving further, in either direction\nstopImmediatePropagation(): also stops any OTHER handlers attached to the SAME element\npreventDefault(): cancels the browser's default action, like a form submitting or a link navigating",
"code": "// Default bubbling\nparent.addEventListener('click', () => console.log('Parent'));\nchild.addEventListener('click', () => console.log('Child'));\n \n// Click on child -> 'Child', then 'Parent'\n \n// Capturing - 3rd argument = true\nparent.addEventListener('click', () => console.log('Parent (capture)'), true);\nchild.addEventListener('click', () => console.log('Child'));\n \n// Click on child -> 'Parent (capture)', then 'Child'\n \n// Modern syntax with options object\nelement.addEventListener('click', handler, {\n  capture: true,\n  once: true,    // remove after first fire\n  passive: true, // promise not to call preventDefault (for scroll perf)\n});\n \n// stopPropagation\nchild.addEventListener('click', (e) => {\n  e.stopPropagation();\n  console.log('Child only');\n});\nparent.addEventListener('click', () => console.log('Parent'));\n// Click on child: 'Child only' (parent never logs)\n \n// preventDefault\nform.addEventListener('submit', (e) => {\n  e.preventDefault(); // prevent page reload\n  // handle submit with AJAX\n});\n \nlink.addEventListener('click', (e) => {\n  if (someCondition) {\n    e.preventDefault(); // don't follow the link\n  }\n});\n \n// Real-world: event delegation uses bubbling\ndocument.body.addEventListener('click', (e) => {\n  if (e.target.matches('.delete-btn')) {\n    handleDelete(e.target.dataset.id);\n  }\n});\n \n// mouseenter vs mouseover (commonly confused!)\n// mouseover: bubbles, fires when entering target OR children\n// mouseenter: doesn't bubble, fires only when entering the element itself\n \nparent.addEventListener('mouseover', () => console.log('mouseover'));\n// Fires on parent AND on every child entry\n \nparent.addEventListener('mouseenter', () => console.log('mouseenter'));\n// Fires only on parent entry",
"howTo": "1. Picture the event traveling in three phases: down from window to target (capturing), the target itself, then back up (bubbling) — bubbling is the default.\n2. Say when you'd want capturing instead: when you need to intercept an event before a child gets to handle it, like a global click logger.\n3. Separate the stopping methods: stopPropagation halts further bubbling/capturing, stopImmediatePropagation also blocks other handlers on the same element, preventDefault only cancels the browser's default action.\n4. Connect it to a real pattern: event delegation relies on bubbling — one listener on a parent checks e.target to know which child was clicked.\n5. Mention the common trap: mouseover bubbles and re-fires as you move across child elements, while mouseenter doesn't bubble and only fires once.",
"dryRun": {
"input": "parent listens with capture=true; child listens normally (bubble); user clicks child",
"frames": [
"Capturing phase begins at window and travels down toward the target: parent's capturing listener fires first -> logs 'Parent (capture)'.",
"The event reaches the target phase: the click is now directly at the child element.",
"Bubbling phase begins: child's own listener fires (bubble phase, the default) -> logs 'Child'.",
"If parent also had a normal bubble-phase listener, it would fire next as the event travels back up past it."
],
"result": "console shows 'Parent (capture)' then 'Child'"
},
"pitfalls": [
"Forgetting the 3rd argument (or {capture:true}) to addEventListener means it defaults to bubbling, not capturing.",
"stopPropagation() only stops the event from moving further — stopImmediatePropagation() also blocks other listeners on that SAME element.",
"preventDefault() only cancels the browser's default action — it does NOT stop the event from propagating.",
"mouseover bubbles and re-fires every time the mouse crosses into a child element, while mouseenter does not bubble and fires only once."
],
"patternTakeaway": "If you see 'one listener needs to catch clicks on many children', always think: event bubbling and delegation — listen on the parent and check e.target.",
"pattern": "DOM & Events"
},
{
"id": "iv-ch7-q10",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "COMMON — HTML loading",
"question": "Explain <script>, <script async>, and <script defer>.",
"explanation": "These attributes control how and when scripts load, compared to how the HTML page is being parsed.\n<script>: pauses HTML parsing completely. Downloads the script, then runs it immediately. This is bad for performance.\n<script async>: downloads in the background while parsing continues, but runs as soon as it's ready — parsing pauses briefly for that moment. The order between multiple async scripts is NOT guaranteed.\n<script defer>: downloads in the background too, but waits to run until AFTER all HTML parsing is done, and runs in the same order the scripts appear in the page. Use this for scripts that need the full page structure (DOM).\nGood to know: module scripts (<script type=\"module\">) behave like defer by default.",
"code": "<!-- Blocking - bad! -->\n<script src=\"main.js\"></script>\n \n<!-- Async - independent script, order not guaranteed -->\n<script async src=\"analytics.js\"></script>\n \n<!-- Defer - waits for HTML, runs in order -->\n<script defer src=\"app.js\"></script>\n<script defer src=\"utils.js\"></script>\n<!-- app.js runs before utils.js, both after HTML parsed -->\n \n<!-- Module - deferred by default -->\n<script type=\"module\" src=\"app.mjs\"></script>\n \n<!--\nTimeline visualization:\n \nDefault: HTML pause - download - execute - HTML resume\nAsync:   HTML continues, download in parallel, execute when ready (interrupts HTML)\nDefer:   HTML continues, download in parallel, execute after HTML parsing complete\n-->\n \n<!-- Best practices: -->\n<head>\n  <!-- Critical CSS inline -->\n  <style>/* critical above-the-fold */</style>\n  \n  <!-- Defer for non-critical scripts -->\n  <script defer src=\"app.js\"></script>\n  \n  <!-- Async for fire-and-forget -->\n  <script async src=\"analytics.js\"></script>\n  \n  <!-- Preload important resources -->\n  <link rel=\"preload\" href=\"font.woff2\" as=\"font\" crossorigin>\n  <link rel=\"preload\" href=\"hero.jpg\" as=\"image\">\n  \n  <!-- Preconnect to important origins -->\n  <link rel=\"preconnect\" href=\"https://api.example.com\">\n  \n  <!-- DNS prefetch for less critical origins -->\n  <link rel=\"dns-prefetch\" href=\"https://cdn.example.com\">\n</head>",
"howTo": "1. Picture the HTML parser as one thread — a plain script tag pauses that thread to download and run immediately.\n2. async downloads in parallel but still interrupts parsing to run as soon as it's ready — order between multiple async scripts isn't guaranteed.\n3. defer also downloads in parallel, but waits to run until HTML parsing is done, and multiple defer scripts run in the order they appear.\n4. Use that to decide: independent scripts like analytics use async, anything order-dependent or DOM-touching uses defer.\n5. Mention the shortcut: script type=\"module\" is deferred by default, so you often don't need the attribute yourself.",
"dryRun": {
"input": "<script src=\"main.js\">, <script async src=\"analytics.js\">, <script defer src=\"app.js\">",
"frames": [
"Parser reaches the plain <script src=\"main.js\">: parsing STOPS, the browser downloads main.js, runs it, THEN parsing resumes.",
"Parser reaches <script async src=\"analytics.js\">: the browser starts downloading it in the background, but parsing CONTINUES right away.",
"As soon as analytics.js finishes downloading (could be any time), parsing pauses briefly to run it immediately — its order versus other scripts is not guaranteed.",
"Parser reaches <script defer src=\"app.js\">: it also downloads in the background, parsing continues, but app.js does NOT run yet.",
"HTML parsing finishes completely -> all deferred scripts now run, in the exact order they appeared in the HTML."
],
"result": "main.js blocks the page, analytics.js runs whenever it's ready, app.js runs last after the full page is parsed"
},
"pitfalls": [
"A plain <script> blocks HTML parsing — placing it in <head> without defer/async hurts page load performance.",
"async scripts can run in ANY order relative to each other — never rely on their order.",
"defer scripts always run in document order, but only after parsing finishes, never before.",
"<script type=\"module\"> is already deferred by default — adding the defer attribute on top doesn't change anything extra."
],
"patternTakeaway": "If you see 'script needs the DOM' or 'script order matters', always think defer; if you see 'independent script, order doesn't matter', always think async.",
"pattern": "Browser & Storage"
},
{
"id": "iv-ch7-q11",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "COMMON — Algorithms",
"question": "Common algorithm questions: palindrome, anagram, two sum.",
"explanation": "These classic computer-science questions come up in frontend interviews too. Patterns worth knowing:\n- Two pointers: good for checking palindromes\n- Hash map: gives fast O(n) lookups, useful for two sum and anagram checks\n- Sort and compare: another way to check anagrams\n- Sliding window: useful for substring problems",
"code": "// 1. Palindrome - is the string a palindrome?\nfunction isPalindrome(str) {\n  // Normalize: lowercase, remove non-alphanumeric\n  const normalized = str.toLowerCase().replace(/[^a-z0-9]/g, '');\n  \n  // Two pointers approach\n  let left = 0;\n  let right = normalized.length - 1;\n  \n  while (left < right) {\n    if (normalized[left] !== normalized[right]) return false;\n    left++;\n    right--;\n  }\n  \n  return true;\n}\n \nisPalindrome('racecar'); // true\nisPalindrome('A man a plan a canal Panama'); // true\nisPalindrome('hello'); // false\n \n// One-liner (less efficient - creates new string)\nconst isPalindromeShort = (s) => {\n  const n = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return n === [...n].reverse().join('');\n};\n \n// 2. Anagram - are two strings anagrams?\nfunction isAnagram(s1, s2) {\n  if (s1.length !== s2.length) return false;\n  \n  // Approach 1: sort and compare\n  const sort = s => [...s.toLowerCase()].sort().join('');\n  return sort(s1) === sort(s2);\n}\n \n// More efficient - hash map (O(n) instead of O(n log n))\nfunction isAnagramFast(s1, s2) {\n  if (s1.length !== s2.length) return false;\n  \n  const counts = {};\n  for (const char of s1.toLowerCase()) {\n    counts[char] = (counts[char] || 0) + 1;\n  }\n  for (const char of s2.toLowerCase()) {\n    if (!counts[char]) return false;\n    counts[char]--;\n  }\n  return true;\n}\n \nisAnagram('listen', 'silent'); // true\nisAnagram('hello', 'world');   // false\n \n// 3. Two Sum - find two numbers that add up to target\nfunction twoSum(nums, target) {\n  const seen = new Map();\n  \n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    \n    if (seen.has(complement)) {\n      return [seen.get(complement), i];\n    }\n    \n    seen.set(nums[i], i);\n  }\n  \n  return null;\n}\n \ntwoSum([2, 7, 11, 15], 9); // [0, 1]  (2 + 7 = 9)\ntwoSum([3, 2, 4], 6);      // [1, 2]  (2 + 4 = 6)\n \n// 4. Bonus: Longest substring without repeating characters\n// (Sliding window pattern)\nfunction longestUniqueSubstring(s) {\n  const seen = new Map();\n  let maxLen = 0;\n  let start = 0;\n  \n  for (let i = 0; i < s.length; i++) {\n    if (seen.has(s[i]) && seen.get(s[i]) >= start) {\n      start = seen.get(s[i]) + 1;\n    }\n    seen.set(s[i], i);\n    maxLen = Math.max(maxLen, i - start + 1);\n  }\n  \n  return maxLen;\n}\n \nlongestUniqueSubstring('abcabcbb'); // 3 ('abc')\nlongestUniqueSubstring('bbbbb');    // 1 ('b')\nlongestUniqueSubstring('pwwkew');   // 3 ('wke')",
"howTo": "1. For palindrome, think two pointers: normalize the string (lowercase, strip non-alphanumeric), then compare from both ends moving inward.\n2. For anagram, count characters: build a frequency map from the first string, then walk the second subtracting counts — if anything goes missing or negative, they don't match.\n3. For two sum, ask for each number: what other number would complete the target? Look it up in a map you're building as you go, storing the current number only after checking.\n4. Notice the shared pattern: whenever you need fast lookups instead of comparing every pair, reach for a hash map.\n5. If asked for a bonus, mention sliding window (longest substring without repeats) uses the same expand-right, shrink-left-on-duplicate idea.",
"dryRun": {
"input": "twoSum(nums = [3, 2, 4], target = 6)",
"frames": [
"i=0, nums[0]=3. complement = 6-3 = 3. seen map is empty, complement not found. Store seen: {3:0}.",
"i=1, nums[1]=2. complement = 6-2 = 4. seen has {3:0}, not 4. Store seen: {3:0, 2:1}.",
"i=2, nums[2]=4. complement = 6-4 = 2. seen HAS 2, at index 1 -> match found!",
"return [1, 2] — the indices of the two numbers that sum to 6."
],
"result": "[1, 2]"
},
"pitfalls": [
"Two Sum: store the current number in the map AFTER checking for its complement, or a number could match itself.",
"Anagram: comparing character counts is O(n) and faster than sorting both strings, which is O(n log n).",
"Palindrome: remember to normalize the string first (lowercase, strip spaces and punctuation) before comparing.",
"Two Sum usually returns indices, not the actual values — double-check what the interviewer wants returned."
],
"patternTakeaway": "If you see 'find pairs or complements fast', always think hash map for O(n) lookups instead of nested loops.",
"pattern": "Arrays & Hashing"
},
{
"id": "iv-ch7-q12",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "COMMON — DOM events",
"question": "mouseenter vs mouseover, focus vs focusin — what is the difference?",
"explanation": "These pairs of events look almost the same, but they behave differently because of bubbling.\nmouseover:\n- Bubbles up through the DOM\n- Fires when the mouse enters the target OR any of its child elements\n- Can fire many times as the mouse moves between child elements\nmouseenter:\n- Does NOT bubble\n- Fires only once, when the mouse enters the element itself\n- Cleaner choice for detecting hover\nfocus and blur: do NOT bubble\nfocusin and focusout: DO bubble\nUse the bubbling versions (mouseover, focusin) when you need event delegation on a parent element. Use the non-bubbling versions (mouseenter, focus) for simple, single-element handlers.",
"code": "// Setup: <div id=\"parent\"><span>hover me</span></div>\nconst parent = document.getElementById('parent');\n \n// mouseover - bubbles\nparent.addEventListener('mouseover', () => console.log('mouseover'));\n// Hover on parent: 'mouseover'\n// Move to span (still in parent): 'mouseover' AGAIN!\n// Move back to parent: 'mouseover' AGAIN!\n \n// mouseenter - doesn't bubble\nparent.addEventListener('mouseenter', () => console.log('mouseenter'));\n// Hover on parent: 'mouseenter' (once)\n// Move to span: nothing (still inside parent)\n// Leave parent: nothing\n// Re-enter parent: 'mouseenter'\n \n// Practical: tooltip on hover\n// USE mouseenter/mouseleave - cleaner\nelement.addEventListener('mouseenter', showTooltip);\nelement.addEventListener('mouseleave', hideTooltip);\n \n// React equivalents\n<div onMouseEnter={show} onMouseLeave={hide}>\n  <span>Children don't trigger</span>\n</div>\n \n<div onMouseOver={show} onMouseOut={hide}>\n  <span>Children DO trigger - watch for flickering!</span>\n</div>\n \n// focus vs focusin\ninput.addEventListener('focus', () => {});    // doesn't bubble\nform.addEventListener('focusin', () => {});   // bubbles\n \n// Use focusin for event delegation:\nform.addEventListener('focusin', (e) => {\n  // Triggered when ANY input in the form gets focus\n  console.log(e.target.name + ' focused');\n});\n \n// React: onFocus and onBlur DO bubble (React's synthetic events)\n// This is a React-only behavior, different from native DOM!\n<form onFocus={(e) => console.log(e.target.name)}>\n  <input name=\"email\" />\n  <input name=\"password\" />\n</form>\n// onFocus fires for both inputs (delegation works in React)",
"howTo": "1. Notice these are two pairs with the same underlying rule: one version bubbles, the other doesn't.\n2. mouseover bubbles and re-triggers every time the mouse crosses into a child element — that's why it can flicker on nested elements.\n3. mouseenter only fires on the element you attached it to, once on entry, and not again until you leave and come back.\n4. Same idea with focus (doesn't bubble) vs focusin (bubbles) — use focusin when one listener on a form should catch focus on any of its inputs.\n5. Mention the React-specific gotcha: React's synthetic onFocus/onBlur DO bubble, unlike native focus/blur — that's different from plain DOM behavior.",
"dryRun": {
"input": "<div id=\"parent\"><span>hover me</span></div>, listeners for both mouseover and mouseenter on parent",
"frames": [
"Mouse enters the parent div (not yet over the span) -> both mouseover AND mouseenter fire once.",
"Mouse moves onto the child <span> (still physically inside parent) -> mouseover fires AGAIN because it bubbles up from the span, but mouseenter stays silent.",
"Mouse moves back from span to parent (still inside parent) -> mouseover fires YET AGAIN, mouseenter still does nothing.",
"Mouse leaves the parent entirely -> neither one fires again (that would need mouseout/mouseleave instead)."
],
"result": "mouseover fires 3 times total, mouseenter fires only once"
},
"pitfalls": [
"mouseover can cause a 'flickering' bug on nested elements because it refires every time the mouse crosses a child boundary.",
"focus and blur do NOT bubble, but focusin and focusout DO — easy to reach for the wrong one when you need delegation.",
"React's synthetic onFocus/onBlur DO bubble, unlike native DOM focus/blur — a common surprise moving from vanilla JS to React.",
"Use mouseenter/mouseleave for simple hover effects like tooltips to avoid unnecessary re-triggers."
],
"patternTakeaway": "If you see 'hover effect that should not re-trigger on child elements', always think mouseenter/mouseleave, not mouseover/mouseout.",
"pattern": "DOM & Events"
},
{
"id": "iv-ch7-q13",
"guide": "Interview Guide",
"topic": "Bonus Critical Topics",
"topicNum": 7,
"level": "Medium",
"badge": "COMMON — useful utility",
"question": "Implement an Observable pattern (similar to RxJS basics).",
"explanation": "An Observable is a producer of values that other code can subscribe to.\nHow it differs from a Promise:\n- A Promise gives you a single value, and starts running right away (eager)\n- An Observable can give you many values over time, and only starts running once someone subscribes (lazy)\nThis pattern is the foundation of RxJS, but it's a useful idea to know even if you never use that library.",
"code": "class Observable {\n  constructor(subscriber) {\n    this._subscriber = subscriber;\n  }\n  \n  subscribe(observer) {\n    // Normalize observer (can be function or object)\n    const safeObserver = typeof observer === 'function'\n      ? { next: observer }\n      : observer;\n    \n    let closed = false;\n    \n    const subscription = {\n      unsubscribe() {\n        closed = true;\n        if (this._cleanup) this._cleanup();\n      }\n    };\n    \n    const cleanup = this._subscriber({\n      next: (value) => {\n        if (!closed && safeObserver.next) safeObserver.next(value);\n      },\n      error: (err) => {\n        if (!closed) {\n          closed = true;\n          safeObserver.error?.(err);\n        }\n      },\n      complete: () => {\n        if (!closed) {\n          closed = true;\n          safeObserver.complete?.();\n        }\n      }\n    });\n    \n    subscription._cleanup = cleanup;\n    return subscription;\n  }\n  \n  // Operators\n  map(fn) {\n    return new Observable(observer => {\n      return this.subscribe({\n        next: (value) => observer.next(fn(value)),\n        error: (err) => observer.error(err),\n        complete: () => observer.complete(),\n      });\n    });\n  }\n  \n  filter(predicate) {\n    return new Observable(observer => {\n      return this.subscribe({\n        next: (value) => {\n          if (predicate(value)) observer.next(value);\n        },\n        error: (err) => observer.error(err),\n        complete: () => observer.complete(),\n      });\n    });\n  }\n}\n \n// Usage:\nconst clicks$ = new Observable(observer => {\n  const handler = (e) => observer.next(e);\n  document.addEventListener('click', handler);\n  return () => document.removeEventListener('click', handler);\n});\n \nconst subscription = clicks$\n  .map(e => ({ x: e.clientX, y: e.clientY }))\n  .filter(pos => pos.x > 100)\n  .subscribe(pos => console.log('Click at:', pos));\n \n// Later:\nsubscription.unsubscribe(); // cleanup\n \n// Interval observable\nconst interval$ = new Observable(observer => {\n  let count = 0;\n  const id = setInterval(() => observer.next(count++), 1000);\n  return () => clearInterval(id);\n});\n \nconst sub = interval$\n  .filter(n => n % 2 === 0)\n  .map(n => 'Even: ' + n)\n  .subscribe(console.log);",
"howTo": "1. Start with the core difference from a Promise: a Promise gives one value eagerly, an Observable can push many values over time and only starts when someone subscribes.\n2. Picture the shape: a class storing a subscriber function, and a subscribe() method that runs it, passing next/error/complete callbacks.\n3. Add operators like map and filter as methods that return a NEW Observable wrapping the original subscribe logic — same chaining idea as array methods.\n4. Remember the cleanup story: subscribe returns an unsubscribe function, like removing an event listener — that's what makes it lazy and cancellable, unlike a Promise.\n5. Give a real example: wrapping DOM click events in an Observable so you can map/filter them like an array, then unsubscribe when done.",
"dryRun": {
"input": "clicks$.map(e => ({x: e.clientX, y: e.clientY})).filter(pos => pos.x > 100).subscribe(pos => console.log(pos))",
"frames": [
"subscribe() runs the ORIGINAL Observable's setup function — it attaches a real 'click' listener to the document. Nothing is emitted yet (lazy, no value until a real click happens).",
"User clicks at (50, 200) -> the original observer.next(event) is called -> map's wrapped next transforms it into {x:50, y:200} -> passes it to filter's next.",
"filter checks: is pos.x > 100? 50 > 100 is false -> this value is dropped, it never reaches the final subscriber.",
"User clicks at (150, 80) -> map transforms it to {x:150, y:80} -> filter checks 150 > 100 -> true -> passes through -> the final subscribe callback logs it.",
"Later, subscription.unsubscribe() is called -> the cleanup function runs, removing the original 'click' event listener."
],
"result": "only clicks with x > 100 get logged, and cleanup stops listening after unsubscribe"
},
"pitfalls": [
"Unlike a Promise, an Observable does NOTHING until subscribe() is called — it is lazy, not eager.",
"Forgetting to return a cleanup function from the subscriber means unsubscribe() won't actually remove listeners, causing a memory leak.",
"Operators like map and filter must return a NEW Observable, not change the original one.",
"An Observable can emit many values over time, not just one — don't treat it like a single-value Promise."
],
"patternTakeaway": "If you see 'multiple values over time with subscribe/unsubscribe and lazy execution', always think Observable pattern, the foundation of RxJS.",
"pattern": "Design Patterns"
},
{
"id": "iv-ch8-q1",
"guide": "Interview Guide",
"topic": "Algorithm Coding Questions",
"topicNum": 8,
"level": "Hard",
"badge": "CRITICAL — Asked at Paytm, Flipkart, Big Tech",
"question": "Implement an LRU Cache with O(1) get and put.",
"explanation": "LRU means \"Least Recently Used.\" When the cache is full and you add a new item, remove the item that nobody has touched for the longest time.\nThe goal: both get and put must run in O(1) time (very fast, no matter how big the cache is).\nThe trick: combine a HashMap with a Doubly Linked List.\n- HashMap gives you instant lookup by key.\n- Doubly Linked List lets you move an item to the front, or remove an item from the back, instantly.\nEasier way in JavaScript: just use a Map. A Map remembers the order you inserted things. When you use a key (get or put), delete it and add it again — this pushes it to the end, meaning \"just used.\" The item at the very front of the Map is always the least recently used one.",
"code": "// SIMPLE: using Map (insertion order preserved)\nclass LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n  \n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    \n    // Move to end (most recently used)\n    const value = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, value);\n    return value;\n  }\n  \n  put(key, value) {\n    if (this.cache.has(key)) {\n      this.cache.delete(key);\n    } else if (this.cache.size >= this.capacity) {\n      // Remove least recently used (first key in iteration order)\n      const firstKey = this.cache.keys().next().value;\n      this.cache.delete(firstKey);\n    }\n    this.cache.set(key, value);\n  }\n}\n \n// Usage:\nconst lru = new LRUCache(2);\nlru.put(1, 'A');\nlru.put(2, 'B');\nlru.get(1);      // 'A' - 1 becomes most recent\nlru.put(3, 'C'); // evicts 2 (least recently used)\nlru.get(2);      // -1 (not found)\nlru.get(3);      // 'C'\nlru.get(1);      // 'A'\n \n// ADVANCED: HashMap + Doubly Linked List (the \"real\" answer)\nclass Node {\n  constructor(key, value) {\n    this.key = key;\n    this.value = value;\n    this.prev = null;\n    this.next = null;\n  }\n}\n \nclass LRUCacheAdvanced {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.map = new Map();\n    \n    // Dummy head and tail to simplify edge cases\n    this.head = new Node(0, 0);\n    this.tail = new Node(0, 0);\n    this.head.next = this.tail;\n    this.tail.prev = this.head;\n  }\n  \n  _addToFront(node) {\n    node.next = this.head.next;\n    node.prev = this.head;\n    this.head.next.prev = node;\n    this.head.next = node;\n  }\n  \n  _removeNode(node) {\n    node.prev.next = node.next;\n    node.next.prev = node.prev;\n  }\n  \n  get(key) {\n    if (!this.map.has(key)) return -1;\n    \n    const node = this.map.get(key);\n    this._removeNode(node);\n    this._addToFront(node);\n    return node.value;\n  }\n  \n  put(key, value) {\n    if (this.map.has(key)) {\n      const node = this.map.get(key);\n      node.value = value;\n      this._removeNode(node);\n      this._addToFront(node);\n      return;\n    }\n    \n    if (this.map.size >= this.capacity) {\n      // Remove from tail (least recently used)\n      const lru = this.tail.prev;\n      this._removeNode(lru);\n      this.map.delete(lru.key);\n    }\n    \n    const newNode = new Node(key, value);\n    this._addToFront(newNode);\n    this.map.set(key, newNode);\n  }\n}",
"howTo": "1. Notice the two requirements: get and put must both be O(1), and you must always know which item was used least recently.\n2. That combo is the clue for HashMap plus a doubly linked list — the map gives fast lookup, the list gives fast reordering.\n3. Simpler trick: JavaScript's Map already remembers insertion order, so one Map can replace the whole linked list.\n4. On get: if the key exists, delete it and re-insert it, so it moves to the end (marks it as most recent).\n5. On put: if the cache is full and the key is new, remove the first key in the Map's iteration order — that is the least recently used one — then add the new key.\n6. Common mistake: only reordering on put and forgetting to reorder on get, which breaks the 'recently used' tracking.",
"dryRun": {
"input": "LRUCache(capacity=2); put(1,'A'); put(2,'B'); get(1); put(3,'C')",
"frames": [
"put(1,'A'): cache is empty, size < capacity. cache = {1:'A'}",
"put(2,'B'): size(1) < capacity(2). cache = {1:'A', 2:'B'}",
"get(1): key 1 exists. Delete 1, re-add it to the end. cache = {2:'B', 1:'A'}. Return 'A'.",
"put(3,'C'): key 3 is new, cache.size(2) >= capacity(2). Remove first key in order (2, the least recently used). cache = {1:'A'}. Then add 3. cache = {1:'A', 3:'C'}",
"get(2): key 2 was evicted. Return -1."
],
"result": "cache ends as {1:'A', 3:'C'}; get(2) returns -1"
},
"pitfalls": [
"Forgetting to move a key to the end on get(), not just on put() — this breaks the 'recently used' order.",
"Capacity of 0 or 1 — with capacity 1, every new put() evicts the only existing item.",
"Updating a key that already exists in put() — you must move it to the end too, not just overwrite the value.",
"Using cache.keys().next().value to find the oldest key only works because Map preserves insertion order — a plain object does not guarantee this."
],
"patternTakeaway": "If you see a fast get/put cache that needs to evict the least-recently-used item, always think: Map (it keeps insertion order) plus delete-and-reinsert on every access.",
"pattern": "Design Patterns"
},
{
"id": "iv-ch8-q2",
"guide": "Interview Guide",
"topic": "Algorithm Coding Questions",
"topicNum": 8,
"level": "Hard",
"badge": "COMMON — Two Sum classic",
"question": "Two Sum: find two numbers in an array that sum to target.",
"explanation": "This is the classic Two Sum problem. The fast way to solve it: use a HashMap.\nGo through the array one number at a time. For each number, work out what value you would need to reach the target (target minus the current number). Check if you already saw that value.\n- If yes, you found your pair — return both indexes.\n- If no, save the current number and its index, so a later number can find it.\nThis takes O(n) time and O(n) space — just one pass through the array.\nThe slow way (nested loops, checking every pair) takes O(n^2) time. Avoid it if you can.",
"code": "function twoSum(nums, target) {\n  const seen = new Map();\n  \n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    \n    if (seen.has(complement)) {\n      return [seen.get(complement), i];\n    }\n    \n    seen.set(nums[i], i);\n  }\n  \n  return null;\n}\n \ntwoSum([2, 7, 11, 15], 9); // [0, 1]  (2+7=9)\ntwoSum([3, 2, 4], 6);      // [1, 2]  (2+4=6)\n \n// Variation: Three Sum\nfunction threeSum(nums) {\n  const result = [];\n  nums.sort((a, b) => a - b);\n  \n  for (let i = 0; i < nums.length - 2; i++) {\n    if (i > 0 && nums[i] === nums[i - 1]) continue; // skip duplicates\n    \n    let left = i + 1;\n    let right = nums.length - 1;\n    \n    while (left < right) {\n      const sum = nums[i] + nums[left] + nums[right];\n      \n      if (sum === 0) {\n        result.push([nums[i], nums[left], nums[right]]);\n        while (nums[left] === nums[left + 1]) left++;\n        while (nums[right] === nums[right - 1]) right--;\n        left++;\n        right--;\n      } else if (sum < 0) {\n        left++;\n      } else {\n        right--;\n      }\n    }\n  }\n  \n  return result;\n}\n \nthreeSum([-1, 0, 1, 2, -1, -4]);\n// [[-1, -1, 2], [-1, 0, 1]]",
"howTo": "1. The question wants two numbers that add up to a target — that pattern is a strong signal for a hash map instead of checking every pair.\n2. Walk through the array once. For each number, work out the partner value you would need: target minus the current number.\n3. Ask your map if you have already seen that partner. If yes, return its stored index and the current index.\n4. If not, save the current number with its index, so a later number can find it.\n5. Always check before you store, so a number never pairs with itself.\n6. If asked for three numbers instead of two, sort the array first, fix one number, then slide two pointers inward across the rest.",
"dryRun": {
"input": "nums = [2,7,11,15], target = 9",
"frames": [
"i=0, num=2. Need 9-2=7. seen is empty. Not found. Store seen[2]=0.",
"i=1, num=7. Need 9-7=2. seen has 2 at index 0 — match!",
"Return [0, 1]."
],
"result": "return [0, 1] (nums[0]+nums[1] = 2+7 = 9)"
},
"pitfalls": [
"Checking for the complement AFTER storing the current number — this can wrongly match a number with itself.",
"Array with duplicate values, e.g. [3,3] with target 6 — must store index, not just the value, and check before overwriting.",
"No valid pair exists — decide what to return (null, empty array, or throw) and be consistent.",
"Negative numbers or zero in the array — the math (target - num) still works fine, but easy to doubt when tracing by hand."
],
"patternTakeaway": "If you need to find a pair (or complement) in one pass through an array, always think: HashMap storing value-to-index, check before you store.",
"pattern": "Arrays & Hashing"
},
{
"id": "iv-ch8-q3",
"guide": "Interview Guide",
"topic": "Algorithm Coding Questions",
"topicNum": 8,
"level": "Hard",
"badge": "COMMON — Sliding Window pattern",
"question": "Find longest substring without repeating characters.",
"explanation": "This problem uses the Sliding Window pattern, which is very useful for string and array problems with a \"window\" of elements.\nThe idea:\n- Grow the window by moving a right pointer forward.\n- If you hit a character you already have in the current window, shrink the window by moving the left pointer forward, past the old copy of that character.\n- Keep track of the biggest window size you have seen.\nThis runs in O(n) time. Space is small — at most one entry per unique character.",
"code": "function lengthOfLongestSubstring(s) {\n  const seen = new Map();\n  let maxLen = 0;\n  let left = 0;\n  \n  for (let right = 0; right < s.length; right++) {\n    const char = s[right];\n    \n    // If we've seen this char IN our current window, shrink\n    if (seen.has(char) && seen.get(char) >= left) {\n      left = seen.get(char) + 1;\n    }\n    \n    seen.set(char, right);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  \n  return maxLen;\n}\n \nlengthOfLongestSubstring('abcabcbb'); // 3 ('abc')\nlengthOfLongestSubstring('bbbbb');    // 1 ('b')\nlengthOfLongestSubstring('pwwkew');   // 3 ('wke')\n \n// Variation: longest substring with at most K distinct chars\nfunction longestWithKDistinct(s, k) {\n  const count = new Map();\n  let maxLen = 0;\n  let left = 0;\n  \n  for (let right = 0; right < s.length; right++) {\n    count.set(s[right], (count.get(s[right]) || 0) + 1);\n    \n    while (count.size > k) {\n      count.set(s[left], count.get(s[left]) - 1);\n      if (count.get(s[left]) === 0) count.delete(s[left]);\n      left++;\n    }\n    \n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  \n  return maxLen;\n}\n \nlongestWithKDistinct('eceba', 2); // 3 ('ece')",
"howTo": "1. The question asks for a substring with a condition (no repeats) — 'longest/shortest substring that matches a rule' is the classic signal for sliding window.\n2. Keep a window with a left and right edge. Move right forward one character at a time, growing the window.\n3. Track the last position you saw each character. If that character shows up again inside the current window, you have found a repeat.\n4. When that happens, jump left to just past the previous occurrence — jump directly there, do not shrink one step at a time.\n5. After each step, compare the window size (right minus left plus one) to your best answer so far.\n6. Common mistake: treating an old occurrence as a repeat even though it falls before the current left edge — check it is still inside the window first.",
"dryRun": {
"input": "s = \"abcabcbb\"",
"frames": [
"right=0, char='a'. Not in window. seen={a:0}. window='a', maxLen=1.",
"right=1, char='b'. Not in window. seen={a:0,b:1}. window='ab', maxLen=2.",
"right=2, char='c'. Not in window. seen={a:0,b:1,c:2}. window='abc', maxLen=3.",
"right=3, char='a'. Seen at index 0, which is >= left(0). Shrink: left = 0+1 = 1. seen[a]=3. window='bca', maxLen stays 3.",
"right=4, char='b'. Seen at index 1, which is >= left(1). Shrink: left = 1+1 = 2. seen[b]=4. window='cab', maxLen stays 3.",
"Continue similarly through the rest of the string; maxLen never exceeds 3."
],
"result": "return 3 (the substring \"abc\")"
},
"pitfalls": [
"Treating an old occurrence of a character as a duplicate even though it's now outside the window (before left) — always check seen.get(char) >= left.",
"Empty string input — should return 0, make sure the loop handles length 0 correctly.",
"String with all identical characters, e.g. 'bbbbb' — the window should stay size 1 the whole time.",
"Jumping left by only 1 step instead of jumping directly past the duplicate's last position — this is slower but not wrong; jumping directly is the efficient version."
],
"patternTakeaway": "If you need the longest or shortest substring/subarray that satisfies some rule, always think: sliding window with left/right pointers and a map tracking what's inside the window.",
"pattern": "Sliding Window"
},
{
"id": "iv-ch8-q4",
"guide": "Interview Guide",
"topic": "Algorithm Coding Questions",
"topicNum": 8,
"level": "Hard",
"badge": "COMMON — Tree traversal",
"question": "Implement DFS and BFS for a tree/graph.",
"explanation": "DFS and BFS are two basic ways to visit every node in a tree or graph. Interviewers ask this in many disguises — file explorers, comment threads, org charts.\nDFS (Depth-First Search):\n- Goes as deep as possible down one path before backing up.\n- Uses a stack, or recursion (which uses the call stack for you).\n- Good for: finding any path, or \"find the first match, even if it's deep.\"\nBFS (Breadth-First Search):\n- Visits level by level, closest nodes first.\n- Uses a queue.\n- Good for: shortest path, or \"process things level by level.\"",
"code": "// Tree node structure\nconst tree = {\n  value: 1,\n  children: [\n    { value: 2, children: [\n      { value: 4, children: [] },\n      { value: 5, children: [] }\n    ]},\n    { value: 3, children: [\n      { value: 6, children: [] }\n    ]}\n  ]\n};\n \n// DFS - recursive\nfunction dfsRecursive(node, visit) {\n  if (!node) return;\n  visit(node.value);\n  for (const child of node.children) {\n    dfsRecursive(child, visit);\n  }\n}\n \ndfsRecursive(tree, console.log); // 1, 2, 4, 5, 3, 6\n \n// DFS - iterative (using stack)\nfunction dfsIterative(root, visit) {\n  if (!root) return;\n  const stack = [root];\n  \n  while (stack.length > 0) {\n    const node = stack.pop();\n    visit(node.value);\n    \n    // Push children in reverse to maintain DFS order\n    for (let i = node.children.length - 1; i >= 0; i--) {\n      stack.push(node.children[i]);\n    }\n  }\n}\n \n// BFS (using queue)\nfunction bfs(root, visit) {\n  if (!root) return;\n  const queue = [root];\n  \n  while (queue.length > 0) {\n    const node = queue.shift(); // O(n)! For real use, deque\n    visit(node.value);\n    \n    for (const child of node.children) {\n      queue.push(child);\n    }\n  }\n}\n \nbfs(tree, console.log); // 1, 2, 3, 4, 5, 6\n \n// Real-world: search in file system\nfunction findFile(root, fileName) {\n  if (root.name === fileName) return root;\n  \n  if (root.type === 'folder') {\n    for (const child of root.children) {\n      const found = findFile(child, fileName);\n      if (found) return found;\n    }\n  }\n  \n  return null;\n}\n \n// Real-world: BFS for shortest path in grid\nfunction shortestPath(grid, start, end) {\n  const queue = [[start, 0]]; // [position, distance]\n  const visited = new Set([`${start[0]},${start[1]}`]);\n  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];\n  \n  while (queue.length > 0) {\n    const [[x, y], dist] = queue.shift();\n    \n    if (x === end[0] && y === end[1]) return dist;\n    \n    for (const [dx, dy] of dirs) {\n      const nx = x + dx;\n      const ny = y + dy;\n      const key = `${nx},${ny}`;\n      \n      if (\n        nx >= 0 && nx < grid.length &&\n        ny >= 0 && ny < grid[0].length &&\n        grid[nx][ny] !== 1 && // not blocked\n        !visited.has(key)\n      ) {\n        visited.add(key);\n        queue.push([[nx, ny], dist + 1]);\n      }\n    }\n  }\n  \n  return -1;\n}",
"howTo": "1. First decide what the question really needs: go deep down one path (DFS) or spread out level by level (BFS).\n2. If you need shortest path, level order, or 'nearest something', pick BFS with a queue. If you need to explore fully or just visit every node, pick DFS with a stack or recursion.\n3. DFS is naturally recursive: visit the node, then call yourself on each child in turn.\n4. BFS uses an array as a queue: add children to the back, take nodes from the front, so one full level finishes before the next starts.\n5. On a graph (not a tree), always track visited nodes or you will loop forever — trees do not need this since they have no cycles.\n6. Trace it by hand on a tiny 4-node example and write down the visit order, to confirm you picked the right one.",
"dryRun": {
"input": "tree: 1 has children [2,3]; 2 has children [4,5]; 3 has child [6]",
"frames": [
"DFS (stack): stack=[1]. Pop 1, visit 1. Push children reversed: stack=[3,2].",
"Pop 2, visit 2. Push its children reversed: stack=[3,5,4].",
"Pop 4, visit 4 (no children). stack=[3,5]. Pop 5, visit 5 (no children). stack=[3]. Pop 3, visit 3, push 6: stack=[6]. Pop 6, visit 6.",
"DFS visit order: 1, 2, 4, 5, 3, 6.",
"BFS (queue): queue=[1]. Shift 1, visit 1, push children: queue=[2,3].",
"Shift 2, visit 2, push its children: queue=[3,4,5]. Shift 3, visit 3, push its child: queue=[4,5,6]. Shift 4,5,6 in order, visiting each."
],
"result": "BFS visit order: 1, 2, 3, 4, 5, 6"
},
"pitfalls": [
"Graphs (not trees) can have cycles — you MUST track visited nodes, or you loop forever. Trees don't need this since they have no cycles.",
"Empty tree / null root — should return immediately without visiting anything.",
"Using Array.shift() for the BFS queue is O(n) per call in JavaScript — fine for interviews, but mention a real deque would be faster for large inputs.",
"Forgetting to push DFS's children in reverse order when using an explicit stack, if you want the same left-to-right visit order as recursion."
],
"patternTakeaway": "If you need shortest path or level-by-level order, always think BFS with a queue; if you need to explore fully or go deep on one branch first, always think DFS with a stack or recursion.",
"pattern": "Trees & Graphs"
},
{
"id": "iv-ch8-q5",
"guide": "Interview Guide",
"topic": "Algorithm Coding Questions",
"topicNum": 8,
"level": "Hard",
"badge": "COMMON — Dynamic Programming basics",
"question": "Climbing Stairs / Fibonacci with memoization.",
"explanation": "This is a classic first Dynamic Programming (DP) problem. It tests several ideas at once:\n- Recursion vs. loops (iteration).\n- Memoization (top-down DP: remember answers you already computed).\n- Tabulation (bottom-up DP: build up the answer from the smallest case).\n- Reducing the space you use.\nThe problem: you have n stairs. Each step you take is either 1 or 2 stairs. How many different ways are there to reach the top?\nThis turns out to be exactly the Fibonacci sequence: ways(n) = ways(n-1) + ways(n-2). This makes sense because your last step onto the top was either a 1-stair step (from n-1) or a 2-stair step (from n-2).",
"code": "// 1. Naive recursion - O(2^n) TIMES OUT\nfunction climbStairs(n) {\n  if (n <= 2) return n;\n  return climbStairs(n - 1) + climbStairs(n - 2);\n}\n \n// 2. Memoization - O(n) time, O(n) space\nfunction climbStairsMemo(n, memo = {}) {\n  if (n <= 2) return n;\n  if (memo[n]) return memo[n];\n  \n  memo[n] = climbStairsMemo(n - 1, memo) + climbStairsMemo(n - 2, memo);\n  return memo[n];\n}\n \n// 3. Tabulation - O(n) time, O(n) space\nfunction climbStairsTab(n) {\n  if (n <= 2) return n;\n  \n  const dp = new Array(n + 1);\n  dp[1] = 1;\n  dp[2] = 2;\n  \n  for (let i = 3; i <= n; i++) {\n    dp[i] = dp[i - 1] + dp[i - 2];\n  }\n  \n  return dp[n];\n}\n \n// 4. Space-optimized - O(n) time, O(1) space (BEST!)\nfunction climbStairsOptimal(n) {\n  if (n <= 2) return n;\n  \n  let prev2 = 1;\n  let prev1 = 2;\n  \n  for (let i = 3; i <= n; i++) {\n    const current = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = current;\n  }\n  \n  return prev1;\n}\n \n// Generic Fibonacci\nfunction fib(n) {\n  if (n <= 1) return n;\n  let [a, b] = [0, 1];\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}",
"howTo": "1. Spot the pattern: 'ways to reach n, moving 1 or 2 at a time' means each answer is built from the previous two answers — that is Fibonacci in disguise.\n2. Start by saying the recursive idea out loud: ways(n) equals ways(n-1) plus ways(n-2). This shows you understand the structure first.\n3. Point out that plain recursion recomputes the same values over and over — that is your reason to add memoization, storing answers you already worked out.\n4. Then flip it into a bottom-up loop: build up from the smallest cases instead of recursing down, which avoids the call stack entirely.\n5. Notice you only ever need the last two values, not a whole array, so replace the array with two variables for O(1) space.\n6. Common mistake: getting the base cases (n=1 and n=2) wrong — check them by hand before trusting the loop.",
"dryRun": {
"input": "climbStairs(5), using the space-optimized version",
"frames": [
"n=5. Start: prev2=1 (ways(1)), prev1=2 (ways(2)).",
"i=3: current = prev1+prev2 = 2+1 = 3. prev2=2, prev1=3. (ways(3)=3)",
"i=4: current = prev1+prev2 = 3+2 = 5. prev2=3, prev1=5. (ways(4)=5)",
"i=5: current = prev1+prev2 = 5+3 = 8. prev2=5, prev1=8. (ways(5)=8)",
"Loop ends (i > n). Return prev1."
],
"result": "return 8 (there are 8 ways to climb 5 stairs)"
},
"pitfalls": [
"Wrong base cases — ways(1) should be 1, ways(2) should be 2. Getting these wrong throws off every later value.",
"n=0 — decide what this should return (usually 1, meaning 'one way: do nothing') and check your base case handles it.",
"Plain recursion without memoization recomputes the same subproblems many times — this is O(2^n) and will time out for larger n.",
"Off-by-one errors in the loop's start/end bounds when converting from recursion to a loop."
],
"patternTakeaway": "If you see 'count the number of ways to reach n' where each step depends on a small number of previous steps, always think: DP where dp[i] is built from dp[i-1] and dp[i-2] (or similar), then optimize down to O(1) space if only the last few values are needed.",
"pattern": "Dynamic Programming"
},
{
"id": "iv-ch8-q6",
"guide": "Interview Guide",
"topic": "Algorithm Coding Questions",
"topicNum": 8,
"level": "Hard",
"badge": "COMMON — Stack pattern",
"question": "Validate balanced brackets / parentheses.",
"explanation": "This is a classic Stack problem. Go through the string character by character:\n- If you see an opening bracket, push it onto the stack.\n- If you see a closing bracket, pop the top of the stack and check that it's the matching opening bracket.\n- At the end, the stack must be empty. If anything is left, some bracket never got closed.\nUsing a Map (or object) for the bracket pairs is cleaner than writing lots of if-else statements.",
"code": "function isValid(s) {\n  const stack = [];\n  const pairs = {\n    ')': '(',\n    ']': '[',\n    '}': '{'\n  };\n  \n  for (const char of s) {\n    if (char === '(' || char === '[' || char === '{') {\n      stack.push(char);\n    } else if (char in pairs) {\n      const top = stack.pop();\n      if (top !== pairs[char]) return false;\n    }\n  }\n  \n  return stack.length === 0;\n}\n \nisValid('()');       // true\nisValid('()[]{}');   // true\nisValid('(]');       // false\nisValid('([)]');     // false\nisValid('{[]}');     // true\n \n// Variation: minimum brackets to add\nfunction minAddToMakeValid(s) {\n  let openNeeded = 0;\n  let closeNeeded = 0;\n  \n  for (const char of s) {\n    if (char === '(') {\n      closeNeeded++;\n    } else if (char === ')') {\n      if (closeNeeded > 0) closeNeeded--;\n      else openNeeded++;\n    }\n  }\n  \n  return openNeeded + closeNeeded;\n}\n \nminAddToMakeValid('())');     // 1 (need 1 open)\nminAddToMakeValid('(((');     // 3 (need 3 close)\nminAddToMakeValid('()))((');  // 4",
"howTo": "1. The clue is 'matching pairs that must close in the right order' — anytime nesting and order matter, think stack.\n2. Walk through the string one character at a time. On an opening bracket, push it — you are saying 'I still owe a matching close for this'.\n3. On a closing bracket, pop the top of the stack and check it is the matching type. If it does not match, or the stack is empty, the string is invalid immediately.\n4. Use a lookup like closing-to-opening pairs instead of a chain of if-statements — it reads cleaner and is less error-prone.\n5. At the end, the stack must be empty. Anything left means some opening bracket never got closed.\n6. Common mistake: popping from an empty stack without checking first — treat that case as invalid, do not let it crash.",
"dryRun": {
"input": "s = \"([)]\"",
"frames": [
"char='(': opening bracket, push. stack=['(']",
"char='[': opening bracket, push. stack=['(', '[']",
"char=')': closing bracket. Pop top of stack: '['. Expected match for ')' is '(', but got '['. Mismatch!",
"Return false immediately."
],
"result": "return false (brackets are not properly nested)"
},
"pitfalls": [
"Popping from an empty stack when you see a closing bracket with nothing open — must check the stack isn't empty before popping, or treat it as invalid.",
"String with only closing brackets, e.g. ')))' — should return false right away.",
"String with only opening brackets, e.g. '(((' — stack won't be empty at the end, so check that final condition.",
"Empty string input — should return true (there's nothing unmatched)."
],
"patternTakeaway": "If you see a problem about matching pairs that must close in the correct nested order, always think: Stack, push on open, pop-and-check on close.",
"pattern": "Stack & Queue"
},
{
"id": "iv-ch8-q7",
"guide": "Interview Guide",
"topic": "Algorithm Coding Questions",
"topicNum": 8,
"level": "Hard",
"badge": "COMMON — Find duplicates",
"question": "Find duplicates in an array. Multiple approaches.",
"explanation": "There are several ways to find duplicates in an array, each with different trade-offs:\n1. Use a Set — O(n) time, O(n) extra space.\n2. Sort the array, then scan neighbors — O(n log n) time, but only O(1) extra space.\n3. Use a hash map to count how many times each value appears — O(n) time, O(n) space.\n4. If you know the numbers are exactly 1 to n, use a math formula (sum) — O(n) time, O(1) space, no extra structure needed.\nPick the approach based on what matters most: speed, memory, or whether you're allowed to modify the input.",
"code": "// 1. Boolean - any duplicates?\nfunction hasDuplicates(arr) {\n  return new Set(arr).size !== arr.length;\n}\n \n// 2. Find all duplicates\nfunction findDuplicates(arr) {\n  const seen = new Set();\n  const duplicates = new Set();\n  \n  for (const item of arr) {\n    if (seen.has(item)) {\n      duplicates.add(item);\n    } else {\n      seen.add(item);\n    }\n  }\n  \n  return [...duplicates];\n}\n \nfindDuplicates([1, 2, 3, 2, 4, 3, 5]); // [2, 3]\n \n// 3. Count occurrences\nfunction countOccurrences(arr) {\n  return arr.reduce((counts, item) => {\n    counts.set(item, (counts.get(item) || 0) + 1);\n    return counts;\n  }, new Map());\n}\n \n// 4. Find first duplicate\nfunction firstDuplicate(arr) {\n  const seen = new Set();\n  for (const item of arr) {\n    if (seen.has(item)) return item;\n    seen.add(item);\n  }\n  return null;\n}\n \n// 5. Remove duplicates (keep order)\nfunction removeDuplicates(arr) {\n  return [...new Set(arr)];\n}\n \n// 6. Find missing number (1 to n)\nfunction findMissing(arr, n) {\n  const expected = (n * (n + 1)) / 2;\n  const actual = arr.reduce((a, b) => a + b, 0);\n  return expected - actual;\n}\n \nfindMissing([1, 2, 4, 5], 5); // 3",
"howTo": "1. First decide what matters most: speed, memory, or whether you are allowed to change the input array.\n2. For a quick yes/no on duplicates, compare the array length to the size of a Set built from it.\n3. To find which values repeat, walk through once with two sets: 'seen so far' and 'confirmed duplicate'. Add to the duplicate set only when a value is already in the seen set.\n4. If memory is tight, sort the array first, then just compare each item to its neighbor — no extra structure needed.\n5. Special case: if the numbers are exactly 1 to n, you can find a missing number by comparing the expected sum (n times n+1 over 2) to the actual sum, with no hash structure at all.\n6. Common mistake: forgetting to add the current value to 'seen' before moving on — the order of check-then-store matters.",
"dryRun": {
"input": "findDuplicates([1, 2, 3, 2, 4, 3, 5])",
"frames": [
"item=1: not in seen. seen={1}. duplicates={}.",
"item=2: not in seen. seen={1,2}. duplicates={}.",
"item=3: not in seen. seen={1,2,3}. duplicates={}.",
"item=2: already in seen! duplicates={2}.",
"item=4: not in seen. seen={1,2,3,4}. duplicates={2}.",
"item=3: already in seen! duplicates={2,3}. item=5: not in seen, no change to duplicates."
],
"result": "return [2, 3]"
},
"pitfalls": [
"Forgetting to add the current value to 'seen' before checking the next one — order of check-then-store matters.",
"Empty array — should return an empty result with no errors.",
"Array where everything is duplicated, e.g. [1,1,1,1] — should only report 1 once in the duplicates list, not four times.",
"The 'find missing number' math trick only works when you know the exact expected range (like 1 to n) — it breaks silently if that assumption is wrong."
],
"patternTakeaway": "If you need to detect or collect repeated values in an array, always think: Set or HashMap for O(n) time, and consider sorting first if you need to save space.",
"pattern": "Arrays & Hashing"
},
{
"id": "iv-ch8-q8",
"guide": "Interview Guide",
"topic": "Algorithm Coding Questions",
"topicNum": 8,
"level": "Hard",
"badge": "COMMON — String compression",
"question": "Implement string compression: \"aaabbcc\" becomes \"3a2b2c\".",
"explanation": "This problem tests:\n- Walking through a string character by character.\n- Counting how many times the same character repeats in a row.\n- Building the result efficiently (use an array and join it at the end, instead of gluing strings together in a loop, which is slow).\nA common follow-up: only return the compressed version if it's actually shorter than the original string.",
"code": "function compress(str) {\n  if (!str) return '';\n  \n  const result = [];\n  let count = 1;\n  \n  for (let i = 1; i <= str.length; i++) {\n    if (i < str.length && str[i] === str[i - 1]) {\n      count++;\n    } else {\n      result.push(count + str[i - 1]);\n      count = 1;\n    }\n  }\n  \n  return result.join('');\n}\n \ncompress('aaabbcc');    // '3a2b2c'\ncompress('abcd');       // '1a1b1c1d'\ncompress('aabcccccaaa'); // '2a1b5c3a'\n \n// Variation: only compress if shorter\nfunction compressIfShorter(str) {\n  const compressed = compress(str);\n  return compressed.length < str.length ? compressed : str;\n}\n \n// Run-length decoding\nfunction decompress(str) {\n  const result = [];\n  let i = 0;\n  \n  while (i < str.length) {\n    let numStr = '';\n    while (i < str.length && /\\d/.test(str[i])) {\n      numStr += str[i++];\n    }\n    \n    if (i < str.length) {\n      result.push(str[i].repeat(parseInt(numStr || '1', 10)));\n      i++;\n    }\n  }\n  \n  return result.join('');\n}\n \ndecompress('3a2b2c'); // 'aaabbcc'",
"howTo": "1. The task is 'count how many times each character repeats in a row' — that means walking the string once while tracking a running count.\n2. Keep a counter starting at 1. Compare each character to the one before it: same character means bump the counter, different character means write down the count plus the previous character.\n3. Build the output using an array and join it at the end, instead of gluing strings together in a loop — this is the efficient answer interviewers expect.\n4. Watch the loop boundary carefully: you need to go one step past the last character so the final run also gets written out.\n5. If asked for the 'only compress if shorter' variation, just compare the compressed result's length to the original and return whichever is smaller.\n6. Common mistake: forgetting to reset the counter back to 1 right after writing out a completed run.",
"dryRun": {
"input": "compress(\"aaabbcc\")",
"frames": [
"i=1: str[1]='a' equals str[0]='a'. count=2.",
"i=2: str[2]='a' equals str[1]='a'. count=3.",
"i=3: str[3]='b' differs from str[2]='a'. Write '3a'. Reset count=1.",
"i=4: str[4]='b' equals str[3]='b'. count=2.",
"i=5: str[5]='c' differs from str[4]='b'. Write '2b'. Reset count=1.",
"i=6: str[6]='c' equals str[5]='c'. count=2. i=7 (past end): write '2c'."
],
"result": "return \"3a2b2c\""
},
"pitfalls": [
"Loop must go one step PAST the last character (i <= str.length) so the final run of characters gets written out — easy to miss.",
"Empty string input — should return '' right away.",
"String with no repeated characters, e.g. 'abcd' — result becomes '1a1b1c1d', which is longer than the original (this is where the 'only compress if shorter' variation matters).",
"Forgetting to reset the counter back to 1 immediately after writing out a completed run."
],
"patternTakeaway": "If you need to count consecutive repeated characters in a string, always think: single pass with a running counter, compare each character to the previous one, and write out the run when it breaks.",
"pattern": "Strings"
},
{
"id": "iv-ch8-q9",
"guide": "Interview Guide",
"topic": "Algorithm Coding Questions",
"topicNum": 8,
"level": "Hard",
"badge": "COMMON — Linked List basics",
"question": "Reverse a linked list. Detect a cycle.",
"explanation": "Linked list problems test how well you can move pointers around.\nReversing a list: use three pointers — prev, current, and next. At each step, save current's next node, point current back at prev, then move both prev and current forward by one.\nDetecting a cycle: use Floyd's algorithm, also called the \"slow and fast pointer\" trick.\n- Move slow one step at a time, and fast two steps at a time.\n- If they ever land on the exact same node, there's a cycle.\n- If fast reaches the end (null), there's no cycle.",
"code": "class ListNode {\n  constructor(value, next = null) {\n    this.value = value;\n    this.next = next;\n  }\n}\n \n// Reverse a linked list - iterative\nfunction reverseList(head) {\n  let prev = null;\n  let current = head;\n  \n  while (current !== null) {\n    const next = current.next; // save next\n    current.next = prev;       // reverse pointer\n    prev = current;            // move prev forward\n    current = next;            // move current forward\n  }\n  \n  return prev; // new head\n}\n \n// Reverse - recursive\nfunction reverseListRecursive(head) {\n  if (!head || !head.next) return head;\n  \n  const newHead = reverseListRecursive(head.next);\n  head.next.next = head;\n  head.next = null;\n  \n  return newHead;\n}\n \n// Detect cycle - Floyd's algorithm (slow + fast)\nfunction hasCycle(head) {\n  if (!head) return false;\n  \n  let slow = head;\n  let fast = head;\n  \n  while (fast !== null && fast.next !== null) {\n    slow = slow.next;\n    fast = fast.next.next;\n    \n    if (slow === fast) return true;\n  }\n  \n  return false;\n}\n \n// Find cycle start\nfunction findCycleStart(head) {\n  let slow = head;\n  let fast = head;\n  \n  // Find meeting point\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) break;\n  }\n  \n  if (!fast || !fast.next) return null;\n  \n  // Find cycle start\n  slow = head;\n  while (slow !== fast) {\n    slow = slow.next;\n    fast = fast.next;\n  }\n  \n  return slow;\n}\n \n// Merge two sorted linked lists\nfunction mergeTwoLists(l1, l2) {\n  const dummy = new ListNode(0);\n  let current = dummy;\n  \n  while (l1 && l2) {\n    if (l1.value <= l2.value) {\n      current.next = l1;\n      l1 = l1.next;\n    } else {\n      current.next = l2;\n      l2 = l2.next;\n    }\n    current = current.next;\n  }\n  \n  current.next = l1 || l2;\n  return dummy.next;\n}",
"howTo": "1. For reversing: you cannot just flip 'next' pointers one at a time without saving where you are going first, or you lose the rest of the list.\n2. Keep three pointers: prev (starts null), current (starts at head), and a temporary next. Each loop: save current.next, point current.next back at prev, then move prev and current forward one step.\n3. When current becomes null, prev is sitting on the new head — return prev.\n4. For cycle detection, the clue is 'does the list loop back on itself' — that is Floyd's slow and fast pointer trick.\n5. Move slow one step and fast two steps each round. If they ever land on the same node, there is a cycle. If fast reaches null first, there is no cycle.\n6. Common mistake on reverse: overwriting current.next before you have saved its old value — always save first.",
"dryRun": {
"input": "reverseList: 1 -> 2 -> 3 -> null",
"frames": [
"prev=null, current=1. Save next=2. current.next=prev (1.next=null). prev=1, current=2.",
"Save next=3. current.next=prev (2.next=1). prev=2, current=3.",
"Save next=null. current.next=prev (3.next=2). prev=3, current=null.",
"Loop ends because current is null. Return prev.",
"Cycle check (separate example) on 1->2->3->back to 2: slow and fast both start at 1. Step: slow=2, fast=3. Step: slow=3, fast=2 (fast wrapped via the cycle). Step: slow=2, fast=2 — they match, cycle detected!"
],
"result": "reversed list: 3 -> 2 -> 1 -> null; cycle example returns true"
},
"pitfalls": [
"Overwriting current.next before saving its old value — you lose the rest of the list if you do this out of order.",
"Empty list (head is null) — reverseList should just return null, hasCycle should return false.",
"Single-node list — reverse should return that same single node unchanged; cycle check must not crash on a list with no 'next.next'.",
"A cycle that starts right at the head — the slow/fast trick still works, but it's easy to doubt when tracing by hand, so verify with a small example."
],
"patternTakeaway": "If you need to reverse links or detect a loop in a linked list, always think: three pointers (prev/current/next) for reversal, and slow/fast pointers (Floyd's algorithm) for cycle detection.",
"pattern": "Linked List"
},
{
"id": "iv-ch9-q1",
"guide": "Interview Guide",
"topic": "UI Component Building",
"topicNum": 9,
"level": "Hard",
"badge": "CRITICAL — GreatFrontEnd, Atlassian, every interview",
"question": "Build a complete Tabs component with keyboard navigation.",
"explanation": "This is a classic component question. It checks a few things: how you split the component into pieces (Tabs, TabList, Tab, TabPanel), whether the active tab is controlled from outside or managed inside, keyboard support (arrow keys, Home, End), and accessibility (role=\"tablist\", aria-selected, aria-controls).\nThere are two common ways to build it: compound components (more flexible, used here) or a simple data-driven list of tabs (easier to write).\nKeyboard rules from the ARIA spec: Arrow Right/Left moves between tabs. Home jumps to the first tab, End jumps to the last tab. The Tab key moves focus into the panel content.",
"code": "import { useState, useRef, createContext, useContext } from 'react';\n \n// 1. COMPOUND COMPONENTS approach\nconst TabsContext = createContext();\n \nfunction Tabs({ defaultValue, children }) {\n  const [activeTab, setActiveTab] = useState(defaultValue);\n  return (\n    <TabsContext.Provider value={{ activeTab, setActiveTab }}>\n      <div className=\"tabs\">{children}</div>\n    </TabsContext.Provider>\n  );\n}\n \nfunction TabList({ children }) {\n  const tabRefs = useRef([]);\n  \n  const handleKeyDown = (e, index) => {\n    const tabs = tabRefs.current;\n    let nextIndex;\n    \n    if (e.key === 'ArrowRight') {\n      nextIndex = (index + 1) % tabs.length;\n    } else if (e.key === 'ArrowLeft') {\n      nextIndex = (index - 1 + tabs.length) % tabs.length;\n    } else if (e.key === 'Home') {\n      nextIndex = 0;\n    } else if (e.key === 'End') {\n      nextIndex = tabs.length - 1;\n    } else {\n      return;\n    }\n    \n    e.preventDefault();\n    tabs[nextIndex]?.focus();\n    tabs[nextIndex]?.click();\n  };\n  \n  return (\n    <div role=\"tablist\">\n      {React.Children.map(children, (child, i) =>\n        React.cloneElement(child, {\n          ref: (el) => { tabRefs.current[i] = el; },\n          onKeyDown: (e) => handleKeyDown(e, i),\n        })\n      )}\n    </div>\n  );\n}\n \nconst Tab = React.forwardRef(({ value, children, onKeyDown }, ref) => {\n  const { activeTab, setActiveTab } = useContext(TabsContext);\n  const isActive = activeTab === value;\n  \n  return (\n    <button\n      ref={ref}\n      role=\"tab\"\n      aria-selected={isActive}\n      aria-controls={`panel-${value}`}\n      id={`tab-${value}`}\n      tabIndex={isActive ? 0 : -1}\n      onClick={() => setActiveTab(value)}\n      onKeyDown={onKeyDown}\n      className={isActive ? 'tab active' : 'tab'}\n    >\n      {children}\n    </button>\n  );\n});\n \nfunction TabPanel({ value, children }) {\n  const { activeTab } = useContext(TabsContext);\n  if (activeTab !== value) return null;\n  \n  return (\n    <div\n      role=\"tabpanel\"\n      id={`panel-${value}`}\n      aria-labelledby={`tab-${value}`}\n      tabIndex={0}\n    >\n      {children}\n    </div>\n  );\n}\n \nTabs.List = TabList;\nTabs.Tab = Tab;\nTabs.Panel = TabPanel;\n \n// USAGE:\n<Tabs defaultValue=\"profile\">\n  <Tabs.List>\n    <Tabs.Tab value=\"profile\">Profile</Tabs.Tab>\n    <Tabs.Tab value=\"settings\">Settings</Tabs.Tab>\n    <Tabs.Tab value=\"billing\">Billing</Tabs.Tab>\n  </Tabs.List>\n  <Tabs.Panel value=\"profile\">Profile content</Tabs.Panel>\n  <Tabs.Panel value=\"settings\">Settings content</Tabs.Panel>\n  <Tabs.Panel value=\"billing\">Billing content</Tabs.Panel>\n</Tabs>",
"howTo": "1. Figure out state first: you only need one piece of state — which tab value is currently active.\n2. Sketch the tree: a Tabs wrapper providing context, a TabList holding the tab buttons, and TabPanel components that only render when their value matches the active one.\n3. Add interaction logic: clicking a tab sets it active; on the tab list, ArrowRight/Left move focus to the next/previous tab, Home/End jump to first/last.\n4. Wire up accessibility: role=\"tablist\" on the container, role=\"tab\" with aria-selected on each button, aria-controls linking tab to panel, and tabIndex so only the active tab sits in the normal Tab order.\n5. Remember the edge case: when arrow keys move focus to a new tab, also activate it — don't just move focus without changing the visible content.",
"dryRun": {
"input": "3 tabs: Profile (active), Settings, Billing. User is focused on the Profile tab and presses ArrowRight twice.",
"frames": [
"Focus is on Profile (index 0). activeTab = 'profile'.",
"User presses ArrowRight -> nextIndex = (0+1)%3 = 1. Code focuses and clicks the Settings tab.",
"The click sets activeTab = 'settings'; the Settings panel renders and the Profile panel unmounts.",
"User presses ArrowRight again -> nextIndex = (1+1)%3 = 2. Focus and click move to Billing.",
"activeTab = 'billing'; the Billing panel now shows."
],
"result": "Focus and the active tab both end on Billing, with aria-selected=true only on the Billing tab."
},
"pitfalls": [
"Moving focus with arrow keys but forgetting to also activate the tab (roving tabindex needs tabIndex=-1 on inactive tabs).",
"Not wrapping the index with modulo, so ArrowRight on the last tab breaks instead of looping back to the first.",
"Forgetting the aria-controls/aria-labelledby links between tab and panel, which breaks screen reader navigation.",
"Rendering all panels at once instead of only the active one — wastes DOM and can mess up tab order."
],
"patternTakeaway": "If you see a component with multiple switchable views and it asks for keyboard support, always think: one piece of active-index state, plus a roving tabindex pattern where only the active item is tab-focusable and arrow keys move focus and selection together.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch9-q2",
"guide": "Interview Guide",
"topic": "UI Component Building",
"topicNum": 9,
"level": "Hard",
"badge": "CRITICAL — GreatFrontEnd, common",
"question": "Build an Accordion component (single + multi-expand modes).",
"explanation": "This question checks: how you track which items are open, how you split the component into pieces, how you animate the open/close height, and accessibility (aria-expanded, aria-controls).\nThere are two modes: single mode, where opening one item closes all the others, and multi mode, where any number of items can stay open at the same time.\nKeyboard: Enter or Space toggles an item open or closed. Arrow Up/Down moves focus between item headers.",
"code": "import { useState } from 'react';\n \nfunction Accordion({ items, allowMultiple = false }) {\n  const [openIds, setOpenIds] = useState(new Set());\n  \n  const toggle = (id) => {\n    setOpenIds(prev => {\n      const newSet = new Set(allowMultiple ? prev : []);\n      if (prev.has(id)) {\n        newSet.delete(id);\n      } else {\n        newSet.add(id);\n      }\n      return newSet;\n    });\n  };\n  \n  return (\n    <div className=\"accordion\">\n      {items.map(item => (\n        <AccordionItem\n          key={item.id}\n          item={item}\n          isOpen={openIds.has(item.id)}\n          onToggle={() => toggle(item.id)}\n        />\n      ))}\n    </div>\n  );\n}\n \nfunction AccordionItem({ item, isOpen, onToggle }) {\n  const headerId = `header-${item.id}`;\n  const panelId = `panel-${item.id}`;\n  \n  return (\n    <div className=\"accordion-item\">\n      <h3>\n        <button\n          id={headerId}\n          aria-expanded={isOpen}\n          aria-controls={panelId}\n          onClick={onToggle}\n          className=\"accordion-header\"\n        >\n          {item.title}\n          <span className=\"icon\" aria-hidden=\"true\">\n            {isOpen ? '−' : '+'}\n          </span>\n        </button>\n      </h3>\n      <div\n        id={panelId}\n        role=\"region\"\n        aria-labelledby={headerId}\n        hidden={!isOpen}\n        className=\"accordion-panel\"\n      >\n        {item.content}\n      </div>\n    </div>\n  );\n}\n \n// USAGE:\nconst items = [\n  { id: '1', title: 'Section 1', content: 'Content 1' },\n  { id: '2', title: 'Section 2', content: 'Content 2' },\n];\n \n<Accordion items={items} allowMultiple={true} />\n \n// CSS for animation\n/*\n.accordion-panel {\n  max-height: 0;\n  overflow: hidden;\n  transition: max-height 0.3s ease-out;\n}\n.accordion-panel:not([hidden]) {\n  max-height: 500px;\n}\n*/",
"howTo": "1. State first: track which item id(s) are open — a single value for single-expand mode, or a Set of ids for multi-expand mode.\n2. Structure: an Accordion maps over items and renders an AccordionItem for each, passing down whether it's open and a toggle function.\n3. Interaction logic: toggling either adds/removes the id from the open Set (multi mode) or replaces the whole Set with just that one id (single mode) — one boolean prop controls the difference.\n4. Accessibility: the header is a real button with aria-expanded and aria-controls pointing at the panel, and the panel has aria-labelledby pointing back at the header.\n5. Don't forget: use the hidden attribute (or CSS) for closed panels, and if animating height, remember max-height transitions need a real value, not \"auto\".",
"dryRun": {
"input": "3 items, multi mode (allowMultiple=true). User clicks the header of item 2, then clicks the header of item 1.",
"frames": [
"openIds is an empty Set. All panels are closed.",
"Click item 2's header -> toggle('2'): '2' is not in the set, so a new Set copies the previous one (multi mode) and adds '2'. openIds = {2}.",
"Item 2's panel renders open (hidden=false); items 1 and 3 stay hidden.",
"Click item 1's header -> toggle('1'): '1' is not in the set, so it gets added too. openIds = {1, 2}.",
"Both item 1 and item 2 panels are now open at the same time."
],
"result": "openIds = {1, 2}; items 1 and 2 are expanded, item 3 stays collapsed."
},
"pitfalls": [
"In single mode, forgetting to clear other open items when opening a new one — the code must build a fresh Set instead of reusing prev.",
"Animating with height: auto instead of max-height, which does not transition smoothly with CSS.",
"Missing aria-expanded on the header button, so screen readers can't tell open from closed.",
"Content that changes size needs a max-height big enough for the tallest possible panel, or long content gets clipped."
],
"patternTakeaway": "If you see a list of collapsible sections and it asks for single vs multi expand, always think: state is either one active id (single mode) or a Set of ids (multi mode), and one boolean flag decides which behavior the toggle function uses.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch9-q3",
"guide": "Interview Guide",
"topic": "UI Component Building",
"topicNum": 9,
"level": "Hard",
"badge": "CRITICAL — Atlassian, GreatFrontEnd",
"question": "Build a File Explorer with tree structure (folders + files).",
"explanation": "This is a popular question at companies like Atlassian. You need to handle: drawing the tree recursively, opening and closing folders, folders nested at any depth, and telling folders apart from files.\nExtra features you might be asked for: adding or deleting files and folders, drag and drop, search or filter, and showing file size or date.",
"code": "import { useState } from 'react';\n \nconst data = {\n  type: 'folder',\n  name: 'root',\n  children: [\n    {\n      type: 'folder',\n      name: 'src',\n      children: [\n        { type: 'file', name: 'index.js' },\n        { type: 'file', name: 'App.js' },\n        {\n          type: 'folder',\n          name: 'components',\n          children: [\n            { type: 'file', name: 'Button.jsx' },\n            { type: 'file', name: 'Input.jsx' },\n          ],\n        },\n      ],\n    },\n    { type: 'file', name: 'package.json' },\n    { type: 'file', name: 'README.md' },\n  ],\n};\n \nfunction FileExplorer({ data }) {\n  return (\n    <ul role=\"tree\" className=\"file-explorer\">\n      <TreeNode node={data} level={0} />\n    </ul>\n  );\n}\n \nfunction TreeNode({ node, level }) {\n  const [isOpen, setIsOpen] = useState(level === 0); // root open\n  const isFolder = node.type === 'folder';\n  \n  const toggle = () => {\n    if (isFolder) setIsOpen(!isOpen);\n  };\n  \n  return (\n    <li role=\"treeitem\" aria-expanded={isFolder ? isOpen : undefined}>\n      <div\n        className=\"tree-row\"\n        style={{ paddingLeft: `${level * 20}px` }}\n        onClick={toggle}\n        onKeyDown={(e) => {\n          if (e.key === 'Enter' || e.key === ' ') {\n            e.preventDefault();\n            toggle();\n          }\n        }}\n        tabIndex={0}\n      >\n        <span className=\"icon\">\n          {isFolder ? (isOpen ? '📂' : '📁') : '📄'}\n        </span>\n        <span className=\"name\">{node.name}</span>\n      </div>\n      \n      {isFolder && isOpen && node.children && (\n        <ul role=\"group\">\n          {node.children\n            .sort((a, b) => {\n              // Folders first, then files (alphabetically)\n              if (a.type !== b.type) {\n                return a.type === 'folder' ? -1 : 1;\n              }\n              return a.name.localeCompare(b.name);\n            })\n            .map((child, i) => (\n              <TreeNode key={i} node={child} level={level + 1} />\n            ))\n          }\n        </ul>\n      )}\n    </li>\n  );\n}\n \n// Bonus: Add/delete operations\nfunction useFileSystem(initialData) {\n  const [data, setData] = useState(initialData);\n  \n  const addNode = (parentPath, newNode) => {\n    setData(prev => {\n      // Deep clone (or use Immer)\n      const cloned = JSON.parse(JSON.stringify(prev));\n      const parent = findByPath(cloned, parentPath);\n      if (parent && parent.type === 'folder') {\n        parent.children = parent.children || [];\n        parent.children.push(newNode);\n      }\n      return cloned;\n    });\n  };\n  \n  const removeNode = (path) => {\n    setData(prev => {\n      const cloned = JSON.parse(JSON.stringify(prev));\n      const parentPath = path.slice(0, -1);\n      const indexToRemove = path[path.length - 1];\n      const parent = findByPath(cloned, parentPath);\n      if (parent && parent.children) {\n        parent.children.splice(indexToRemove, 1);\n      }\n      return cloned;\n    });\n  };\n  \n  return { data, addNode, removeNode };\n}\n \nfunction findByPath(node, path) {\n  let current = node;\n  for (const index of path) {\n    current = current.children?.[index];\n    if (!current) return null;\n  }\n  return current;\n}",
"howTo": "1. State first: each folder needs its own open/closed boolean — simplest is local state inside each tree node, not one big shared state object.\n2. Structure: think recursively — one TreeNode component that renders itself, and if it's an open folder, renders a list of child TreeNodes one level deeper.\n3. Interaction logic: clicking a folder row toggles its own open state; pass the current depth down so you can indent each level visually.\n4. Distinguish folder vs file early with a type check, and sort children so folders show before files.\n5. Accessibility and edge cases: use role=\"tree\", role=\"treeitem\", and role=\"group\" for nested lists, support Enter/Space to toggle, and remember recursion needs a stopping condition — no children array means stop.",
"dryRun": {
"input": "Tree: root > src > components > [Button.jsx, Input.jsx]. User clicks the 'src' folder, then clicks the 'components' folder.",
"frames": [
"Root renders open by default (level 0). Its children src, package.json, and README.md are visible.",
"src starts closed, since only level 0 opens by default.",
"User clicks the src row -> toggle() flips its own isOpen to true. Its children (index.js, App.js, components) render one level deeper, with extra indent.",
"User clicks the components row -> toggle() flips its own isOpen to true. Button.jsx and Input.jsx render at the next level.",
"Each TreeNode only tracks its own open state — opening src did not affect components' state, and vice versa."
],
"result": "The tree shows root > src (open) > components (open) > Button.jsx, Input.jsx, each level indented further."
},
"pitfalls": [
"Using one shared 'openFolders' object at the top instead of local state per node — works too, but per-node local state with recursion is simpler to reason about.",
"Forgetting the recursion base case: a node with no children array should just stop, not crash trying to map over undefined.",
"Not checking folder vs file before deciding whether a click should toggle anything — clicking a file should do nothing.",
"Skipping keyboard support (Enter/Space to toggle) for tree rows, which breaks accessibility."
],
"patternTakeaway": "If you see nested data of unknown depth, like folders inside folders, and it asks for a UI, always think: one recursive component that renders itself for each child, with its own local open/closed state.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch9-q4",
"guide": "Interview Guide",
"topic": "UI Component Building",
"topicNum": 9,
"level": "Hard",
"badge": "COMMON — Star Rating",
"question": "Build a Star Rating component (interactive + read-only).",
"explanation": "A common component question. It checks: showing a preview rating on hover, setting the rating on click, half-star support (a harder version), a read-only display mode, and accessibility using the radiogroup pattern.\nKeyboard: Arrow Left/Right changes the rating by one star. Number keys can jump straight to a chosen value.",
"code": "import { useState } from 'react';\n \nfunction StarRating({\n  value,\n  onChange,\n  max = 5,\n  readOnly = false,\n  size = 'md',\n}) {\n  const [hoverValue, setHoverValue] = useState(0);\n  \n  const displayValue = hoverValue || value;\n  \n  return (\n    <div\n      role={readOnly ? 'img' : 'radiogroup'}\n      aria-label={readOnly ? `Rating: ${value} out of ${max}` : 'Rate'}\n      className={`star-rating size-${size}`}\n      onMouseLeave={() => !readOnly && setHoverValue(0)}\n    >\n      {Array.from({ length: max }, (_, i) => i + 1).map(num => (\n        <button\n          key={num}\n          type=\"button\"\n          role={readOnly ? undefined : 'radio'}\n          aria-checked={!readOnly && value === num}\n          aria-label={`${num} star${num === 1 ? '' : 's'}`}\n          tabIndex={readOnly ? -1 : (value === num || (value === 0 && num === 1) ? 0 : -1)}\n          disabled={readOnly}\n          className={num <= displayValue ? 'star filled' : 'star empty'}\n          onMouseEnter={() => !readOnly && setHoverValue(num)}\n          onClick={() => !readOnly && onChange(num)}\n          onKeyDown={(e) => {\n            if (readOnly) return;\n            if (e.key === 'ArrowRight' && num < max) {\n              onChange(num + 1);\n            } else if (e.key === 'ArrowLeft' && num > 1) {\n              onChange(num - 1);\n            }\n          }}\n        >\n          {num <= displayValue ? '★' : '☆'}\n        </button>\n      ))}\n    </div>\n  );\n}\n \n// USAGE:\nfunction Demo() {\n  const [rating, setRating] = useState(0);\n  \n  return (\n    <>\n      <StarRating value={rating} onChange={setRating} />\n      <p>Your rating: {rating}/5</p>\n      \n      <StarRating value={4.5} readOnly />\n    </>\n  );\n}\n \n// Bonus: half-star support\nfunction HalfStarRating({ value, onChange, max = 5 }) {\n  return (\n    <div className=\"star-rating\">\n      {Array.from({ length: max }, (_, i) => {\n        const starValue = i + 1;\n        const isFull = starValue <= value;\n        const isHalf = starValue - 0.5 === value;\n        \n        return (\n          <span key={i} className=\"star-half-container\">\n            <button\n              className=\"half-star left\"\n              onClick={() => onChange(starValue - 0.5)}\n              aria-label={`${starValue - 0.5} stars`}\n            >\n              {isFull || isHalf ? '★' : '☆'}\n            </button>\n            <button\n              className=\"half-star right\"\n              onClick={() => onChange(starValue)}\n              aria-label={`${starValue} stars`}\n            >\n              {isFull ? '★' : '☆'}\n            </button>\n          </span>\n        );\n      })}\n    </div>\n  );\n}",
"howTo": "1. State first: the current selected value (controlled by a parent) plus a separate hover value for the live preview as the mouse moves.\n2. Structure: one row of star buttons; each star's filled look depends on whichever is bigger — the hover value if present, otherwise the real value.\n3. Interaction logic: hovering a star sets the preview, leaving the whole group clears it, clicking a star commits that number as the real value.\n4. Accessibility: treat it like a radio group — role=\"radiogroup\" on the wrapper, role=\"radio\" and aria-checked on each star, and arrow keys to bump the rating up or down by one.\n5. Remember read-only mode: swap to role=\"img\" with a descriptive aria-label, disable the buttons, and skip all hover/click logic.",
"dryRun": {
"input": "value=2 (2 stars selected). User hovers over the 4th star, then moves the mouse away without clicking.",
"frames": [
"Before hover: hoverValue=0, so displayValue = hoverValue || value = 2. Stars 1-2 show filled.",
"Mouse enters star 4 -> setHoverValue(4). displayValue = 4 || 2 = 4. Stars 1-4 show filled, but this is only a preview.",
"value is still 2 underneath — nothing has been committed yet.",
"Mouse leaves the whole group -> onMouseLeave sets hoverValue back to 0.",
"displayValue = 0 || 2 = 2 again. Only stars 1-2 show filled, back to the real saved value."
],
"result": "The rating stays at 2; the 4-star preview was only visual and disappeared once the mouse left."
},
"pitfalls": [
"Forgetting to reset hoverValue on mouseLeave of the whole group (not each star), which makes the preview 'stick'.",
"Read-only mode still responding to hover or click if the readOnly checks are missing from the event handlers.",
"Using role=\"radio\" without aria-checked, or forgetting tabIndex so only one star sits in the natural tab order.",
"Half-star math: mixing up which half of the star was clicked (left half means X.5, right half means X)."
],
"patternTakeaway": "If you see a component with a preview-on-hover, commit-on-click feel, always think: two values — the committed value and a separate hover value — and display whichever hover value is present, falling back to the committed one when hover is empty.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch9-q5",
"guide": "Interview Guide",
"topic": "UI Component Building",
"topicNum": 9,
"level": "Hard",
"badge": "COMMON — Todo List with persistence",
"question": "Build a Todo List with localStorage and filtering.",
"explanation": "This is a basic but important state management question. You need to handle: adding a new todo, marking it done, deleting it, editing it (usually by double-click), filtering by all/active/completed, saving data in localStorage so it survives a page refresh, bulk actions like mark all done or clear completed, and a counter showing how many items are left.\nUsing useReducer is cleaner here than many separate setState calls, because every possible way the state can change lives in one place.",
"code": "import { useState, useEffect, useReducer } from 'react';\n \n// Reducer for cleaner state\nfunction todoReducer(state, action) {\n  switch (action.type) {\n    case 'ADD':\n      return [...state, {\n        id: Date.now(),\n        text: action.text,\n        done: false,\n      }];\n    case 'TOGGLE':\n      return state.map(t =>\n        t.id === action.id ? { ...t, done: !t.done } : t\n      );\n    case 'DELETE':\n      return state.filter(t => t.id !== action.id);\n    case 'EDIT':\n      return state.map(t =>\n        t.id === action.id ? { ...t, text: action.text } : t\n      );\n    case 'TOGGLE_ALL':\n      const allDone = state.every(t => t.done);\n      return state.map(t => ({ ...t, done: !allDone }));\n    case 'CLEAR_COMPLETED':\n      return state.filter(t => !t.done);\n    case 'SET_ALL':\n      return action.todos;\n    default:\n      return state;\n  }\n}\n \nfunction TodoApp() {\n  const [todos, dispatch] = useReducer(todoReducer, []);\n  const [filter, setFilter] = useState('all');\n  const [input, setInput] = useState('');\n  \n  // Load from localStorage\n  useEffect(() => {\n    const saved = localStorage.getItem('todos');\n    if (saved) {\n      try {\n        dispatch({ type: 'SET_ALL', todos: JSON.parse(saved) });\n      } catch {}\n    }\n  }, []);\n  \n  // Save to localStorage\n  useEffect(() => {\n    localStorage.setItem('todos', JSON.stringify(todos));\n  }, [todos]);\n  \n  const filtered = todos.filter(t => {\n    if (filter === 'active') return !t.done;\n    if (filter === 'completed') return t.done;\n    return true;\n  });\n  \n  const remaining = todos.filter(t => !t.done).length;\n  \n  const handleSubmit = (e) => {\n    e.preventDefault();\n    if (!input.trim()) return;\n    dispatch({ type: 'ADD', text: input.trim() });\n    setInput('');\n  };\n  \n  return (\n    <div className=\"todo-app\">\n      <h1>Todos</h1>\n      \n      <form onSubmit={handleSubmit}>\n        <input\n          autoFocus\n          value={input}\n          onChange={(e) => setInput(e.target.value)}\n          placeholder=\"What needs to be done?\"\n          aria-label=\"New todo\"\n        />\n      </form>\n      \n      {todos.length > 0 && (\n        <button onClick={() => dispatch({ type: 'TOGGLE_ALL' })}>\n          Toggle all\n        </button>\n      )}\n      \n      <ul>\n        {filtered.map(todo => (\n          <TodoItem key={todo.id} todo={todo} dispatch={dispatch} />\n        ))}\n      </ul>\n      \n      {todos.length > 0 && (\n        <footer>\n          <span>{remaining} item{remaining !== 1 ? 's' : ''} left</span>\n          \n          <div className=\"filters\">\n            {['all', 'active', 'completed'].map(f => (\n              <button\n                key={f}\n                onClick={() => setFilter(f)}\n                className={filter === f ? 'active' : ''}\n              >\n                {f}\n              </button>\n            ))}\n          </div>\n          \n          {todos.some(t => t.done) && (\n            <button onClick={() => dispatch({ type: 'CLEAR_COMPLETED' })}>\n              Clear completed\n            </button>\n          )}\n        </footer>\n      )}\n    </div>\n  );\n}\n \nfunction TodoItem({ todo, dispatch }) {\n  const [editing, setEditing] = useState(false);\n  const [editText, setEditText] = useState(todo.text);\n  \n  const save = () => {\n    if (editText.trim()) {\n      dispatch({ type: 'EDIT', id: todo.id, text: editText.trim() });\n    } else {\n      dispatch({ type: 'DELETE', id: todo.id });\n    }\n    setEditing(false);\n  };\n  \n  if (editing) {\n    return (\n      <li>\n        <input\n          autoFocus\n          value={editText}\n          onChange={(e) => setEditText(e.target.value)}\n          onBlur={save}\n          onKeyDown={(e) => {\n            if (e.key === 'Enter') save();\n            if (e.key === 'Escape') setEditing(false);\n          }}\n        />\n      </li>\n    );\n  }\n  \n  return (\n    <li>\n      <input\n        type=\"checkbox\"\n        checked={todo.done}\n        onChange={() => dispatch({ type: 'TOGGLE', id: todo.id })}\n      />\n      <span\n        onDoubleClick={() => setEditing(true)}\n        className={todo.done ? 'done' : ''}\n      >\n        {todo.text}\n      </span>\n      <button\n        onClick={() => dispatch({ type: 'DELETE', id: todo.id })}\n        aria-label=\"Delete\"\n      >\n        ×\n      </button>\n    </li>\n  );\n}",
"howTo": "1. State first: the list of todos (id, text, done), the current filter (all/active/completed), and the text in the new-todo input.\n2. Structure: a form to add todos, a list that maps over the FILTERED todos (not the raw list), and a footer showing the remaining count and filter buttons.\n3. Interaction logic: use a reducer with actions like ADD, TOGGLE, DELETE, EDIT, CLEAR_COMPLETED — this keeps every way state can change in one place instead of scattered setState calls.\n4. Persistence: load saved todos from localStorage once on mount, and save back to localStorage every time the todos array changes.\n5. Remember the details: filtering happens at render time, not by mutating the stored list, and double-click on the text is the common trigger for inline edit mode.",
"dryRun": {
"input": "todos=[]. User types 'Buy milk' and submits, then marks it done, then sets the filter to 'active'.",
"frames": [
"dispatch({type:'ADD', text:'Buy milk'}) -> reducer appends {id, text:'Buy milk', done:false}. todos now has 1 item.",
"A useEffect watching [todos] fires and saves the updated todos to localStorage.",
"User clicks the checkbox -> dispatch({type:'TOGGLE', id}) -> reducer flips done to true for that item.",
"remaining = todos.filter(t => !t.done).length = 0.",
"User clicks the 'active' filter button -> setFilter('active'). filtered = todos.filter(t => !t.done) = [] because the only todo is now done."
],
"result": "The list shows 0 items under the 'active' filter, even though 1 todo still exists in storage."
},
"pitfalls": [
"Filtering by mutating the stored todos array instead of computing a filtered list at render time — this would lose the other items.",
"Forgetting the load-from-localStorage effect must have empty dependencies so it runs once, or it can overwrite saved data every render.",
"Not guarding JSON.parse with try/catch — corrupted localStorage data can crash the app on load.",
"Deleting an emptied edited todo instead of just canceling the edit, or the reverse, causing confusing behavior."
],
"patternTakeaway": "If you see a list with add, edit, delete, filter, and persist requirements all together, always think: useReducer for all state transitions in one place, plus one useEffect for loading from storage and another for saving to storage.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch9-q6",
"guide": "Interview Guide",
"topic": "UI Component Building",
"topicNum": 9,
"level": "Hard",
"badge": "COMMON — Carousel",
"question": "Build an Image Carousel with auto-play and pause on hover.",
"explanation": "This checks: managing a timer that auto-advances the slides, pausing that timer on hover or focus, keyboard navigation, lazy-loading images, accessibility (carousel role, aria-live announcements), and whether the carousel loops back to the start or stops at the end.\nuseCallback matters here because the auto-play effect depends on the goNext function. If goNext were recreated on every render, the timer would keep restarting instead of running smoothly.",
"code": "import { useState, useEffect, useCallback, useRef } from 'react';\n \nfunction Carousel({\n  images,\n  autoPlay = true,\n  interval = 3000,\n  loop = true,\n}) {\n  const [currentIndex, setCurrentIndex] = useState(0);\n  const [isPaused, setIsPaused] = useState(false);\n  const intervalRef = useRef(null);\n  \n  const goNext = useCallback(() => {\n    setCurrentIndex(prev => {\n      if (prev === images.length - 1) {\n        return loop ? 0 : prev;\n      }\n      return prev + 1;\n    });\n  }, [images.length, loop]);\n  \n  const goPrev = useCallback(() => {\n    setCurrentIndex(prev => {\n      if (prev === 0) {\n        return loop ? images.length - 1 : 0;\n      }\n      return prev - 1;\n    });\n  }, [images.length, loop]);\n  \n  const goTo = useCallback((index) => {\n    setCurrentIndex(index);\n  }, []);\n  \n  // Auto-play\n  useEffect(() => {\n    if (!autoPlay || isPaused) return;\n    \n    intervalRef.current = setInterval(goNext, interval);\n    return () => clearInterval(intervalRef.current);\n  }, [autoPlay, isPaused, interval, goNext]);\n  \n  // Keyboard\n  useEffect(() => {\n    const handler = (e) => {\n      if (e.key === 'ArrowRight') goNext();\n      if (e.key === 'ArrowLeft') goPrev();\n    };\n    document.addEventListener('keydown', handler);\n    return () => document.removeEventListener('keydown', handler);\n  }, [goNext, goPrev]);\n  \n  return (\n    <div\n      className=\"carousel\"\n      role=\"region\"\n      aria-label=\"Image carousel\"\n      aria-roledescription=\"carousel\"\n      onMouseEnter={() => setIsPaused(true)}\n      onMouseLeave={() => setIsPaused(false)}\n      onFocus={() => setIsPaused(true)}\n      onBlur={() => setIsPaused(false)}\n    >\n      <div className=\"carousel-viewport\">\n        <div\n          className=\"carousel-track\"\n          style={{\n            transform: `translateX(-${currentIndex * 100}%)`,\n            transition: 'transform 0.5s ease',\n          }}\n        >\n          {images.map((img, i) => (\n            <div\n              key={i}\n              className=\"carousel-slide\"\n              role=\"group\"\n              aria-roledescription=\"slide\"\n              aria-label={`${i + 1} of ${images.length}`}\n              aria-hidden={i !== currentIndex}\n            >\n              <img\n                src={img.src}\n                alt={img.alt}\n                loading={Math.abs(i - currentIndex) <= 1 ? 'eager' : 'lazy'}\n              />\n            </div>\n          ))}\n        </div>\n      </div>\n      \n      <button\n        onClick={goPrev}\n        aria-label=\"Previous slide\"\n        disabled={!loop && currentIndex === 0}\n      >\n        ←\n      </button>\n      <button\n        onClick={goNext}\n        aria-label=\"Next slide\"\n        disabled={!loop && currentIndex === images.length - 1}\n      >\n        →\n      </button>\n      \n      <div className=\"dots\" role=\"tablist\">\n        {images.map((_, i) => (\n          <button\n            key={i}\n            role=\"tab\"\n            aria-selected={i === currentIndex}\n            aria-label={`Go to slide ${i + 1}`}\n            onClick={() => goTo(i)}\n            className={i === currentIndex ? 'dot active' : 'dot'}\n          />\n        ))}\n      </div>\n      \n      <div className=\"sr-only\" role=\"status\" aria-live=\"polite\">\n        Slide {currentIndex + 1} of {images.length}\n      </div>\n    </div>\n  );\n}",
"howTo": "1. State first: the current slide index, and whether autoplay is currently paused for hover/focus.\n2. Structure: a track of slides shifted with a CSS transform based on the current index, plus prev/next buttons and dot indicators below it.\n3. Interaction logic: goNext/goPrev wrap around when loop is true; wrap them in useCallback since a useEffect uses them to set up the autoplay interval and needs stable functions to avoid restarting it every render.\n4. Add pause-on-hover-and-focus: track a paused flag from onMouseEnter/Leave and onFocus/Blur, and skip starting the interval whenever it's true.\n5. Accessibility and edge cases: give the carousel role=\"region\" with aria-roledescription=\"carousel\", mark non-visible slides aria-hidden, announce changes with an aria-live region, and lazy-load images more than one slide away from the current one.",
"dryRun": {
"input": "3 images, autoPlay=true, interval=3000ms, loop=true. Timeline: mount at t=0, auto-advance at t=3000ms, user hovers at t=3500ms.",
"frames": [
"t=0: currentIndex=0, isPaused=false. The effect starts setInterval(goNext, 3000).",
"t=3000ms: the interval fires, goNext runs -> currentIndex becomes 1 (0 was not the last slide, so prev+1).",
"t=3500ms: user moves the mouse onto the carousel -> onMouseEnter sets isPaused=true. The effect's cleanup clears the running interval since isPaused changed.",
"While paused, no interval is running, so currentIndex stays at 1 no matter how long the mouse stays there.",
"User moves the mouse away -> isPaused=false. A new setInterval(goNext, 3000) starts counting from that moment, not from the original 3000ms mark."
],
"result": "Slide 2 (index 1) stays showing until the user stops hovering, then auto-advance resumes with a fresh 3-second timer."
},
"pitfalls": [
"Not wrapping goNext/goPrev in useCallback causes the auto-play effect to tear down and restart the interval on every render, breaking the timing.",
"Forgetting to clearInterval in the effect cleanup causes multiple intervals to stack up and the carousel to speed up over time.",
"Not disabling the prev/next buttons at the ends when loop=false.",
"Missing aria-hidden on off-screen slides or an aria-live region, so screen reader users are never told the slide changed."
],
"patternTakeaway": "If you see 'auto-advances on a timer but pauses on hover or focus', always think: a boolean paused state that gates whether an effect sets up setInterval, plus useCallback on the advance functions so the effect's dependencies stay stable.",
"pattern": "React Hooks & Components"
},
{
"id": "iv-ch10-q1",
"guide": "Interview Guide",
"topic": "Machine Coding — Real Interview Questions",
"topicNum": 10,
"level": "Hard",
"badge": "CRITICAL — Rippling Frontend Interview",
"question": "Implement an Async Task Runner with Concurrency Control (mapAsyncLimit).",
"explanation": "You have many async tasks, for example 100 API calls, but you only want K of them running at the same time, not all at once.\nWhy this matters: APIs often have rate limits, browsers limit how many connections can be open at once, and running everything at once can use too much memory.\nThe approach: keep a pool of K workers running. Each time a worker finishes its task, it immediately picks up the next one from the list. This is a classic interview question asked at companies like Rippling and Atlassian.",
"code": "// mapAsyncLimit - process array with max concurrency\nasync function mapAsyncLimit(items, mapper, limit = 3) {\n  const results = [];\n  const executing = []; // currently running promises\n  \n  for (let i = 0; i < items.length; i++) {\n    // Start the task\n    const promise = Promise.resolve()\n      .then(() => mapper(items[i], i))\n      .then(result => {\n        results[i] = result;\n      });\n    \n    executing.push(promise);\n    \n    // When at limit, wait for at least one to finish\n    if (executing.length >= limit) {\n      await Promise.race(executing);\n      // Remove completed promises\n      for (let j = executing.length - 1; j >= 0; j--) {\n        // Promise.race doesn't tell us which finished\n        // We need to track separately for cleanup\n      }\n      // Better: track completion\n    }\n  }\n  \n  await Promise.all(executing);\n  return results;\n}\n \n// Cleaner implementation\nasync function mapAsyncLimitClean(items, mapper, limit = 3) {\n  const results = new Array(items.length);\n  let currentIndex = 0;\n  \n  // Worker function - processes items from the queue\n  async function worker() {\n    while (currentIndex < items.length) {\n      const myIndex = currentIndex++;\n      results[myIndex] = await mapper(items[myIndex], myIndex);\n    }\n  }\n  \n  // Start 'limit' workers\n  const workers = Array.from(\n    { length: Math.min(limit, items.length) },\n    () => worker()\n  );\n  \n  await Promise.all(workers);\n  return results;\n}\n \n// USAGE:\nconst urls = [\n  'https://api.example.com/1',\n  'https://api.example.com/2',\n  // ... 100 URLs\n];\n \nconst results = await mapAsyncLimitClean(\n  urls,\n  async (url) => {\n    const response = await fetch(url);\n    return response.json();\n  },\n  5 // max 5 concurrent requests\n);\n \n// Bonus: Promise pool pattern\nclass PromisePool {\n  constructor(concurrency) {\n    this.concurrency = concurrency;\n    this.queue = [];\n    this.activeCount = 0;\n  }\n  \n  async add(asyncFn) {\n    return new Promise((resolve, reject) => {\n      this.queue.push({ asyncFn, resolve, reject });\n      this._next();\n    });\n  }\n  \n  async _next() {\n    if (this.activeCount >= this.concurrency || this.queue.length === 0) {\n      return;\n    }\n    \n    this.activeCount++;\n    const { asyncFn, resolve, reject } = this.queue.shift();\n    \n    try {\n      const result = await asyncFn();\n      resolve(result);\n    } catch (err) {\n      reject(err);\n    } finally {\n      this.activeCount--;\n      this._next(); // start next task\n    }\n  }\n}\n \n// Usage\nconst pool = new PromisePool(3);\n \nconst results = await Promise.all(\n  urls.map(url => pool.add(() => fetch(url)))\n);",
"howTo": "1. The core constraint is: many async jobs exist, but only K can run at once — that is a concurrency limit problem, not a plain Promise.all.\n2. The state you need is a shared index (or queue) tracking which item to process next, so multiple 'workers' can pull from the same list without duplicating work.\n3. Start exactly K worker functions. Each worker loops: grab the next unprocessed index, await its result, store it, then grab the next one until nothing is left.\n4. Run all K workers together with Promise.all — they finish naturally once the shared queue is empty.\n5. Tricky edge case: fewer items than K workers — only start as many workers as Math.min(limit, items.length), or you spawn workers with nothing to do.\n6. Mentally test with 5 items and a limit of 2: two workers should start immediately, and whichever finishes first grabs the next item, so at most 2 run at any moment.",
"dryRun": {
"input": "5 items [A,B,C,D,E], limit=2. Task times: A=300ms, B=100ms, C=200ms, D=100ms, E=50ms.",
"frames": [
"Start 2 workers. Worker 1 grabs index 0 (A, 300ms). Worker 2 grabs index 1 (B, 100ms).",
"t=100ms: B finishes. Worker 2 immediately grabs index 2 (C, 200ms). A is still running.",
"t=300ms: A finishes. Worker 1 grabs index 3 (D, 100ms). C is also wrapping up around this time.",
"As soon as a worker is free it grabs index 4 (E, 50ms) — the last item.",
"Both workers keep pulling from the shared index until currentIndex reaches items.length (5), then their while loops exit and Promise.all(workers) resolves."
],
"result": "results = [resultA, resultB, resultC, resultD, resultE] in original order, even though B finished before A."
},
"pitfalls": [
"Using Promise.race in a naive way to detect 'a slot is free' without cleanly tracking which promise finished leads to messy bookkeeping.",
"Starting more workers than there are items — always guard with Math.min(limit, items.length).",
"Forgetting results must go into the original index position, not push order, since tasks finish out of order.",
"Not deciding what happens if one task throws — should the whole batch stop, or should just that item fail?"
],
"patternTakeaway": "If you need to limit how many async tasks run at once, always think: a shared index or queue, plus a fixed number of worker loops that each keep pulling the next item until nothing is left, run together with Promise.all.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch10-q2",
"guide": "Interview Guide",
"topic": "Machine Coding — Real Interview Questions",
"topicNum": 10,
"level": "Hard",
"badge": "CRITICAL — Rate Limiter classic",
"question": "Implement a Rate Limiter (max N requests per time window per user).",
"explanation": "Rate limiters are used in API gateways, to stop spam, and to prevent abuse.\nThere are three common approaches: sliding window with real timestamps (accurate, what we build below), token bucket (smoother, allows short bursts), and fixed window (simplest, but can let a burst of requests through right at the boundary between windows).\nThe key idea: store a list of timestamps for each user, and remove the ones that are now too old to count.",
"code": "// Sliding Window Rate Limiter\nclass RateLimiter {\n  constructor(limit, timeWindow) {\n    this.limit = limit;          // max requests\n    this.timeWindow = timeWindow; // in milliseconds\n    this.requests = new Map();    // userId -> [timestamps]\n  }\n  \n  allowRequest(userId) {\n    const now = Date.now();\n    \n    if (!this.requests.has(userId)) {\n      this.requests.set(userId, []);\n    }\n    \n    const timestamps = this.requests.get(userId);\n    \n    // Remove old timestamps outside the window\n    while (timestamps.length > 0 && now - timestamps[0] >= this.timeWindow) {\n      timestamps.shift();\n    }\n    \n    if (timestamps.length < this.limit) {\n      timestamps.push(now);\n      return true;\n    }\n    \n    return false;\n  }\n  \n  // Get time until user can make another request\n  timeUntilNextRequest(userId) {\n    const timestamps = this.requests.get(userId);\n    if (!timestamps || timestamps.length < this.limit) return 0;\n    \n    const oldestTimestamp = timestamps[0];\n    return Math.max(0, this.timeWindow - (Date.now() - oldestTimestamp));\n  }\n}\n \n// Usage:\nconst limiter = new RateLimiter(3, 10000); // 3 req per 10s\n \nlimiter.allowRequest('user1'); // true\nlimiter.allowRequest('user1'); // true\nlimiter.allowRequest('user1'); // true\nlimiter.allowRequest('user1'); // false (limit hit)\nlimiter.timeUntilNextRequest('user1'); // ~10000ms\n \n// Token Bucket - allows bursts\nclass TokenBucket {\n  constructor(capacity, refillRate) {\n    this.capacity = capacity;     // max tokens\n    this.tokens = capacity;       // current tokens\n    this.refillRate = refillRate; // tokens per second\n    this.lastRefill = Date.now();\n  }\n  \n  _refill() {\n    const now = Date.now();\n    const elapsed = (now - this.lastRefill) / 1000;\n    const tokensToAdd = elapsed * this.refillRate;\n    \n    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);\n    this.lastRefill = now;\n  }\n  \n  allowRequest(cost = 1) {\n    this._refill();\n    \n    if (this.tokens >= cost) {\n      this.tokens -= cost;\n      return true;\n    }\n    \n    return false;\n  }\n}\n \n// Allows 10 burst, then 5 per second\nconst bucket = new TokenBucket(10, 5);",
"howTo": "1. The core requirement is: allow at most N actions per user inside a rolling time window, so you need to remember when each user's recent requests happened, not just count them.\n2. The state you need is a map from user id to a list of timestamps (or, for the token version, a running token count per user).\n3. On every new request, first drop timestamps older than the window since they no longer count, then check if what remains is still under the limit.\n4. If under the limit, record the new timestamp and allow the request. Otherwise reject it.\n5. Tricky edge case: a fixed window resets at a clock boundary and can let a burst through right at the reset moment; tracking real timestamps (sliding window) avoids that but costs a bit more memory per user.\n6. Mentally test it: allow 3 requests per 10 seconds, fire 3 quickly (all allowed), fire a 4th right away (blocked), then wait past 10 seconds from the first one and try again (allowed, since the oldest timestamp aged out).",
"dryRun": {
"input": "limit=3, timeWindow=10000ms (3 requests per 10 seconds). User 'user1' calls allowRequest 4 times quickly, then waits 11 seconds and calls again.",
"frames": [
"Request 1 at t=0ms: timestamps=[], nothing to remove. length(0) < limit(3), so push 0. Allowed. timestamps=[0].",
"Request 2 at t=100ms: nothing expired yet. length(1) < 3, push 100. Allowed. timestamps=[0,100].",
"Request 3 at t=200ms: length(2) < 3, push 200. Allowed. timestamps=[0,100,200].",
"Request 4 at t=300ms: length(3) is not less than 3. Rejected, timestamps unchanged.",
"Request 5 at t=11000ms: the oldest timestamp (0) is now 11000ms old, which is >= 10000, so it gets removed, and so do 100 and 200. timestamps=[]. length(0) < 3, push 11000. Allowed."
],
"result": "Requests 1-3 are allowed, request 4 is blocked, and request 5 (after waiting past the window) is allowed again."
},
"pitfalls": [
"Forgetting to clean up old timestamps before checking the limit leads to false rejections that never go away.",
"Getting the boundary comparison wrong (>= vs >) at the exact edge of the window can be an off-by-one bug.",
"Memory grows if you never remove entries for users who stop making requests — needs periodic cleanup in production.",
"Fixed window approach can allow up to 2x the limit right at the boundary — know this trade-off if it comes up in discussion."
],
"patternTakeaway": "If you need to limit actions to N per time window per user, always think: a map from user to a list of recent timestamps, drop timestamps older than the window on every check, then compare the remaining count to the limit.",
"pattern": "System Design"
},
{
"id": "iv-ch10-q3",
"guide": "Interview Guide",
"topic": "Machine Coding — Real Interview Questions",
"topicNum": 10,
"level": "Hard",
"badge": "CRITICAL — Common system design",
"question": "Implement an in-memory Key-Value Store with TTL (Time To Live).",
"explanation": "This is similar to the basics of how Redis works. It checks: using a Map to store data, handling TTL (time to live) so keys expire, and understanding lazy versus active expiration.\nTwo strategies: lazy expiration only checks if a key is expired when someone reads it (simple code). Active expiration uses a timer to delete expired keys automatically, even if nobody ever reads them (better for memory). Real systems usually combine both.",
"code": "class KeyValueStore {\n  constructor() {\n    this.store = new Map();\n    this.expirations = new Map(); // key -> timeout id\n  }\n  \n  set(key, value, ttl) {\n    // Clear existing expiration if any\n    if (this.expirations.has(key)) {\n      clearTimeout(this.expirations.get(key));\n    }\n    \n    this.store.set(key, value);\n    \n    if (ttl) {\n      const timeoutId = setTimeout(() => {\n        this.store.delete(key);\n        this.expirations.delete(key);\n      }, ttl);\n      this.expirations.set(key, timeoutId);\n    }\n  }\n  \n  get(key) {\n    return this.store.has(key) ? this.store.get(key) : null;\n  }\n  \n  has(key) {\n    return this.store.has(key);\n  }\n  \n  delete(key) {\n    if (this.expirations.has(key)) {\n      clearTimeout(this.expirations.get(key));\n      this.expirations.delete(key);\n    }\n    return this.store.delete(key);\n  }\n  \n  count() {\n    return this.store.size;\n  }\n  \n  clear() {\n    for (const id of this.expirations.values()) {\n      clearTimeout(id);\n    }\n    this.store.clear();\n    this.expirations.clear();\n  }\n}\n \n// Usage:\nconst store = new KeyValueStore();\nstore.set('user1', 'Roee', 5000);  // expires in 5s\nstore.get('user1'); // 'Roee'\n \nsetTimeout(() => {\n  store.get('user1'); // null (expired)\n}, 6000);\n \n// Alternative: lazy expiration (simpler, but doesn't free memory)\nclass LazyKVStore {\n  constructor() {\n    this.store = new Map();\n  }\n  \n  set(key, value, ttl) {\n    const expiresAt = ttl ? Date.now() + ttl : Infinity;\n    this.store.set(key, { value, expiresAt });\n  }\n  \n  get(key) {\n    const entry = this.store.get(key);\n    if (!entry) return null;\n    \n    if (Date.now() > entry.expiresAt) {\n      this.store.delete(key); // cleanup on access\n      return null;\n    }\n    \n    return entry.value;\n  }\n}",
"howTo": "1. The core requirement is a normal key-value store where each entry can also expire on its own — a plain Map is not enough, you must track expiry too.\n2. Pick a strategy: lazy (only check expiry when someone reads the key) or active (schedule a timer per key that deletes it automatically).\n3. For active cleanup, keep a second map from key to its timer id, so you can cancel the old timer whenever the same key is overwritten before it expires.\n4. For lazy cleanup, store an expiry timestamp alongside the value, and on every get, compare it to the current time before returning anything.\n5. Tricky edge case: overwriting a key that already has a pending timer — clear the old timer first, or it may delete the new value too early.\n6. Mentally test it: set a key with a short TTL, read it right away (should work), then wait past the TTL and read again (should come back empty).",
"dryRun": {
"input": "store.set('user1', 'Roee', 5000) at t=0. Code reads store.get('user1') at t=1000ms and again at t=6000ms.",
"frames": [
"t=0: set('user1','Roee',5000) saves the value and schedules a setTimeout for 5000ms, saving its id in the expirations map.",
"t=1000ms: get('user1') -> store.has('user1') is true -> returns 'Roee'.",
"t=5000ms: the scheduled timeout fires -> deletes 'user1' from the store and removes its entry from expirations.",
"t=6000ms: get('user1') -> store.has('user1') is now false -> returns null."
],
"result": "'Roee' is returned at t=1000ms, and null is returned at t=6000ms after the key auto-expired."
},
"pitfalls": [
"Overwriting an existing key without clearing its old timer first — the old timer can delete the new value too early.",
"Lazy expiration never frees memory for keys nobody reads again — they sit in the Map forever until someone accesses them.",
"Forgetting to clear pending timers in clear() or delete() leaks timers that fire on keys that no longer exist.",
"Not handling ttl=0 or undefined correctly — it should usually mean 'never expires', not 'expire immediately'."
],
"patternTakeaway": "If you need values that expire after N milliseconds, always think: either store an expiry timestamp and check it on every read (lazy), or schedule a setTimeout per key and track its id so you can cancel it if the key gets overwritten (active).",
"pattern": "System Design"
},
{
"id": "iv-ch10-q4",
"guide": "Interview Guide",
"topic": "Machine Coding — Real Interview Questions",
"topicNum": 10,
"level": "Hard",
"badge": "COMMON — Klarna interview",
"question": "Implement a Credit Card Masker.",
"explanation": "This question was asked at Klarna: given a credit card number, hide all digits except the last 4.\nVariations you might get: different card types have different lengths (Visa has 16 digits, Amex has 15), formatting the result with a space every 4 characters, and validating the card number using the Luhn algorithm.",
"code": "// Basic masking\nfunction maskCard(cardNumber) {\n  // Remove non-digits\n  const cleaned = cardNumber.replace(/\\D/g, '');\n  \n  if (cleaned.length < 4) return cardNumber;\n  \n  const lastFour = cleaned.slice(-4);\n  const masked = '*'.repeat(cleaned.length - 4);\n  \n  return masked + lastFour;\n}\n \nmaskCard('1234 5678 9012 3456'); // '************3456'\nmaskCard('378282246310005');     // '***********0005'\n \n// With formatting (4-digit groups)\nfunction maskCardFormatted(cardNumber) {\n  const cleaned = cardNumber.replace(/\\D/g, '');\n  \n  if (cleaned.length < 4) return cardNumber;\n  \n  const lastFour = cleaned.slice(-4);\n  const maskedLength = cleaned.length - 4;\n  const masked = '*'.repeat(maskedLength);\n  const combined = masked + lastFour;\n  \n  // Format with spaces every 4 chars\n  return combined.match(/.{1,4}/g).join(' ');\n}\n \nmaskCardFormatted('1234567890123456'); // '**** **** **** 3456'\nmaskCardFormatted('378282246310005');   // '**** ***** **0005' (Amex)\n \n// Luhn algorithm for validation\nfunction isValidCard(cardNumber) {\n  const cleaned = cardNumber.replace(/\\D/g, '');\n  if (cleaned.length < 12) return false;\n  \n  let sum = 0;\n  let isEven = false;\n  \n  // Iterate from right to left\n  for (let i = cleaned.length - 1; i >= 0; i--) {\n    let digit = parseInt(cleaned[i], 10);\n    \n    if (isEven) {\n      digit *= 2;\n      if (digit > 9) digit -= 9;\n    }\n    \n    sum += digit;\n    isEven = !isEven;\n  }\n  \n  return sum % 10 === 0;\n}\n \nisValidCard('4532015112830366'); // true (valid Visa)\nisValidCard('1234567890123456'); // false\n \n// Detect card type\nfunction detectCardType(number) {\n  const cleaned = number.replace(/\\D/g, '');\n  \n  const patterns = {\n    visa: /^4/,\n    mastercard: /^5[1-5]/,\n    amex: /^3[47]/,\n    discover: /^6(?:011|5)/,\n    diners: /^3(?:0[0-5]|[68])/,\n    jcb: /^35/,\n  };\n  \n  for (const [type, pattern] of Object.entries(patterns)) {\n    if (pattern.test(cleaned)) return type;\n  }\n  \n  return 'unknown';\n}\n \ndetectCardType('4532015112830366');  // 'visa'\ndetectCardType('5425233430109903');  // 'mastercard'\ndetectCardType('378282246310005');   // 'amex'",
"howTo": "1. The core requirement sounds simple: keep the last 4 digits, hide the rest — start by stripping out anything that is not a digit (spaces, dashes).\n2. Split the cleaned digits into two parts: everything except the last 4, and the last 4 themselves.\n3. Replace the first part with the same number of asterisks, then glue the last 4 digits back onto the end.\n4. Tricky edge case: card numbers have different lengths across providers, so base your logic on the actual cleaned length, do not assume a fixed 16 digits.\n5. If asked to also format the result, do the masking first, then chop it into 4-character groups and join with spaces.\n6. If asked to validate the number too, that is a separate check: the Luhn algorithm — double every second digit from the right, subtract 9 if that goes over 9, sum everything, and confirm the total divides evenly by 10.",
"dryRun": {
"input": "maskCardFormatted('1234 5678 9012 3456') — format a 16-digit Visa card, masking all but the last 4 digits.",
"frames": [
"Strip non-digit characters: cleaned = '1234567890123456' (16 digits).",
"lastFour = '3456'. maskedLength = 16 - 4 = 12, so masked = '************' (12 stars).",
"combined = masked + lastFour = '************3456' (16 characters total).",
"Split combined into chunks of 4 from the left: ['****','****','****','3456'].",
"Join the chunks with spaces."
],
"result": "'**** **** **** 3456' — the original digits are gone, only the last 4 stay visible."
},
"pitfalls": [
"Not stripping spaces or dashes first — length math and regex checks break on formatted input like '1234-5678-...'.",
"Hardcoding 16 digits — Amex cards have 15 digits, so the masked length must come from the actual cleaned length.",
"Masking is not the same as validating — remember to run the Luhn algorithm separately if validation is also asked for.",
"Grouping into 4-character chunks does not always divide evenly when the total length isn't a multiple of 4, like a 15-digit Amex number — worth mentioning as a known quirk."
],
"patternTakeaway": "If you need to hide sensitive data but keep a recognizable tail, like card numbers, phone numbers, or emails, always think: strip formatting first, split into a 'hide this part' and a 'keep this part' based on the real cleaned length, then re-apply formatting at the end.",
"pattern": "Strings"
},
{
"id": "iv-ch10-q5",
"guide": "Interview Guide",
"topic": "Machine Coding — Real Interview Questions",
"topicNum": 10,
"level": "Hard",
"badge": "COMMON — Async retry",
"question": "Implement retry() with exponential backoff.",
"explanation": "This is a common pattern for making API calls more reliable. It checks: working with promises and async/await, exponential backoff where each wait doubles, jitter which adds randomness so many clients don't retry at the exact same moment, a maximum number of retries, and retrying only for certain kinds of errors.",
"code": "async function retry(fn, options = {}) {\n  const {\n    maxRetries = 3,\n    initialDelay = 1000,\n    maxDelay = 30000,\n    factor = 2, // exponential\n    jitter = true,\n    shouldRetry = () => true, // retry on any error\n  } = options;\n  \n  let lastError;\n  \n  for (let attempt = 0; attempt <= maxRetries; attempt++) {\n    try {\n      return await fn(attempt);\n    } catch (error) {\n      lastError = error;\n      \n      // Check if we should retry this error\n      if (!shouldRetry(error)) throw error;\n      \n      // Last attempt - throw the error\n      if (attempt === maxRetries) throw error;\n      \n      // Calculate delay with exponential backoff\n      let delay = Math.min(initialDelay * Math.pow(factor, attempt), maxDelay);\n      \n      // Add jitter (0-100% of delay)\n      if (jitter) {\n        delay = delay * (0.5 + Math.random() * 0.5);\n      }\n      \n      console.log(`Attempt ${attempt + 1} failed. Retrying in ${Math.round(delay)}ms`);\n      await new Promise(r => setTimeout(r, delay));\n    }\n  }\n  \n  throw lastError;\n}\n \n// Usage:\nconst data = await retry(\n  async () => {\n    const res = await fetch('/api/flaky-endpoint');\n    if (!res.ok) throw new Error('HTTP ' + res.status);\n    return res.json();\n  },\n  {\n    maxRetries: 5,\n    initialDelay: 500,\n    shouldRetry: (err) => {\n      // Retry only on network errors and 5xx\n      return err.message.includes('500') || \n             err.message.includes('503') || \n             err.name === 'TypeError'; // network error\n    },\n  }\n);\n \n// Bonus: with timeout\nasync function withTimeout(promise, ms) {\n  return Promise.race([\n    promise,\n    new Promise((_, reject) => \n      setTimeout(() => reject(new Error('Timeout')), ms)\n    ),\n  ]);\n}\n \nconst result = await withTimeout(\n  fetch('/api/slow'),\n  5000\n);\n \n// Combine retry + timeout\nconst data = await retry(\n  () => withTimeout(fetch('/api/data'), 3000),\n  { maxRetries: 3 }\n);",
"howTo": "1. The core requirement is: retry a failing async call a limited number of times, waiting longer between each attempt — that is exponential backoff.\n2. Wrap the call in a loop up to a max retry count. On each failure, check if this was the last allowed attempt — if so, throw the error instead of waiting again.\n3. Calculate the wait time by doubling it each attempt, capped at some maximum so it never grows unreasonably large.\n4. Tricky part: add jitter, a small random amount mixed into the delay, so many clients retrying after the same failure do not all hit the server at the exact same instant.\n5. You often only want to retry certain kinds of errors, like network failures or server errors, not something like a bad request — pass in a check function so the caller decides what is retryable.\n6. Mentally test it: make the function fail twice then succeed on the third try, and confirm the waits roughly double each time and the final result still comes through.",
"dryRun": {
"input": "retry(fn, {maxRetries:3, initialDelay:1000, factor:2}). fn fails on attempts 0 and 1, then succeeds on attempt 2.",
"frames": [
"attempt=0: call fn(0) -> throws an error. shouldRetry(error) is true and attempt(0) !== maxRetries(3), so the loop continues.",
"delay = min(1000 * 2^0, maxDelay) = 1000ms, plus jitter (a random amount mixed in). The code waits, then loops again.",
"attempt=1: call fn(1) -> throws again. delay = min(1000 * 2^1, maxDelay) = 2000ms, plus jitter. The code waits again.",
"attempt=2: call fn(2) -> succeeds this time. return await fn(attempt) returns the result immediately, no more waiting."
],
"result": "The function succeeds on the 3rd try (attempt index 2), after waiting roughly 1 second then roughly 2 seconds between attempts."
},
"pitfalls": [
"Not capping the delay with maxDelay — after many retries the wait time can grow absurdly long.",
"Skipping jitter — many clients retrying on the exact same fixed schedule can all hit the server at once (a thundering herd).",
"Retrying on every error type, including ones that will never succeed like a 400 Bad Request, wastes time and attempts.",
"Being inconsistent about whether maxRetries means 'total attempts' or 'retries after the first attempt'."
],
"patternTakeaway": "If you see 'retry a failing async call with growing wait times', always think: a loop with try/catch, a delay that doubles each attempt capped at a max, some random jitter mixed in, and a check function to decide which errors are even worth retrying.",
"pattern": "Async & Promises / Event Loop"
},
{
"id": "iv-ch10-q6",
"guide": "Interview Guide",
"topic": "Machine Coding — Real Interview Questions",
"topicNum": 10,
"level": "Hard",
"badge": "COMMON — Pub/Sub Pattern",
"question": "Implement a Pub/Sub (Publisher/Subscriber) class.",
"explanation": "Pub/Sub is a basic building block for event-driven systems. It's a bit different from a normal EventEmitter: Pub/Sub organizes messages into named channels called topics, and subscribers never need to know who published the message. This makes it useful for letting separate parts of an app talk to each other without being directly connected.\nA clean design returns a subscription object with an unsubscribe() method, instead of making the caller keep track of which handler to remove manually.",
"code": "class PubSub {\n  constructor() {\n    this.subscribers = new Map(); // topic -> Map(id -> callback)\n    this.nextId = 0;\n  }\n  \n  subscribe(topic, callback) {\n    if (!this.subscribers.has(topic)) {\n      this.subscribers.set(topic, new Map());\n    }\n    \n    const id = this.nextId++;\n    this.subscribers.get(topic).set(id, callback);\n    \n    // Return subscription object with unsubscribe\n    return {\n      unsubscribe: () => {\n        const subs = this.subscribers.get(topic);\n        if (subs) {\n          subs.delete(id);\n          if (subs.size === 0) {\n            this.subscribers.delete(topic);\n          }\n        }\n      },\n    };\n  }\n  \n  publish(topic, data) {\n    const subs = this.subscribers.get(topic);\n    if (!subs) return;\n    \n    // Copy values to avoid issues if subscriber unsubscribes during emission\n    [...subs.values()].forEach(callback => {\n      try {\n        callback(data);\n      } catch (err) {\n        console.error('PubSub callback error:', err);\n      }\n    });\n  }\n  \n  // Subscribe with wildcards (advanced)\n  subscribeAll(callback) {\n    return this.subscribe('*', callback);\n  }\n}\n \n// Usage:\nconst pubsub = new PubSub();\n \nconst sub1 = pubsub.subscribe('user.login', (user) => {\n  console.log('User logged in:', user);\n});\n \nconst sub2 = pubsub.subscribe('user.login', (user) => {\n  analytics.track('login', user);\n});\n \npubsub.publish('user.login', { id: 1, name: 'Roee' });\n// Both callbacks run\n \nsub1.unsubscribe();\npubsub.publish('user.login', { id: 2, name: 'Other' });\n// Only sub2 runs\n \n// React hook integration\nfunction usePubSub(topic, callback) {\n  useEffect(() => {\n    const subscription = pubsub.subscribe(topic, callback);\n    return () => subscription.unsubscribe();\n  }, [topic, callback]);\n}\n \n// Component\nfunction UserProfile() {\n  usePubSub('user.update', (user) => {\n    console.log('User updated:', user);\n  });\n  \n  return <div>...</div>;\n}",
"howTo": "1. The core requirement is letting different parts of the app talk by topic name without either side knowing about the other — that is the key difference from calling a function directly.\n2. The state you need is a map from topic name to a collection of subscriber callbacks for that topic.\n3. subscribe(topic, callback) adds the callback under that topic and hands back an object with an unsubscribe method, so the caller can clean up later without you tracking ids for them.\n4. publish(topic, data) looks up every callback registered under that topic and calls each one with the data; if nobody subscribed, do nothing.\n5. Tricky edge case: a subscriber might unsubscribe while publish is still looping through the list — copy the list of callbacks before looping so a mid-publish removal cannot break it.\n6. Mentally test it: subscribe two listeners to the same topic, publish once (both fire), unsubscribe one, publish again (only the other fires).",
"dryRun": {
"input": "Subscribe two listeners to topic 'user.login', publish once, unsubscribe one, publish again.",
"frames": [
"sub1 = pubsub.subscribe('user.login', cb1) -> subscribers for that topic become {0: cb1}. sub1's id is 0.",
"sub2 = pubsub.subscribe('user.login', cb2) -> subscribers for that topic become {0: cb1, 1: cb2}.",
"publish('user.login', {id:1,name:'Roee'}) loops over both callbacks and calls each one with the data. Both cb1 and cb2 run.",
"sub1.unsubscribe() deletes id 0 from the topic's map, leaving only {1: cb2}.",
"publish('user.login', {id:2,name:'Other'}) now loops over only cb2. Only cb2 runs."
],
"result": "The first publish triggers both callbacks; the second publish, after unsubscribing sub1, only triggers cb2."
},
"pitfalls": [
"Iterating the live subscribers list directly during publish is risky — if a callback unsubscribes itself mid-loop it can skip other subscribers. Copy the list into an array before looping.",
"Not cleaning up a topic entry entirely once its subscriber count hits zero leaves empty maps sitting around.",
"One callback throwing an error should not stop the other subscribers from being called — wrap each call in try/catch.",
"Forgetting to call unsubscribe() in a React useEffect cleanup lets the callback fire after the component has unmounted."
],
"patternTakeaway": "If you see components that need to talk without knowing about each other, always think: a map from topic name to a list of subscriber callbacks, subscribe adds to that list and returns an unsubscribe closure, and publish copies the list before calling each one.",
"pattern": "Design Patterns"
},
{
"id": "iv-ch10-q7",
"guide": "Interview Guide",
"topic": "Machine Coding — Real Interview Questions",
"topicNum": 10,
"level": "Hard",
"badge": "COMMON — Search highlight",
"question": "Implement Text Search Highlight - mark search terms in text.",
"explanation": "This is common on search results pages. It checks: manipulating strings, matching text without caring about uppercase or lowercase, supporting multiple search terms at once, and handling special characters in the search query, like a dot or plus sign, which mean something different inside a regex.\nThe approach: escape any special regex characters in the query, build a case-insensitive regex that matches every occurrence, and replace matches with a highlighted version. In React specifically, split the text into pieces and wrap only the matching pieces, instead of injecting raw HTML.",
"code": "// Simple - return string with marks\nfunction highlightText(text, query) {\n  if (!query) return text;\n  \n  // Escape special regex characters\n  const escaped = query.replace(/[.*+?^\\${}()|[\\]\\\\]/g, '\\\\$&');\n  const regex = new RegExp('(' + escaped + ')', 'gi');\n  \n  return text.replace(regex, '<mark>$1</mark>');\n}\n \nhighlightText('Hello World, hello universe', 'hello');\n// '<mark>Hello</mark> World, <mark>hello</mark> universe'\n \n// React-safe version (avoids dangerouslySetInnerHTML)\nfunction HighlightedText({ text, query }) {\n  if (!query) return <>{text}</>;\n  \n  const escaped = query.replace(/[.*+?^\\${}()|[\\]\\\\]/g, '\\\\$&');\n  const regex = new RegExp('(' + escaped + ')', 'gi');\n  const parts = text.split(regex);\n  \n  return (\n    <>\n      {parts.map((part, i) =>\n        regex.test(part) ? (\n          <mark key={i}>{part}</mark>\n        ) : (\n          <React.Fragment key={i}>{part}</React.Fragment>\n        )\n      )}\n    </>\n  );\n}\n \n// Multiple search terms\nfunction HighlightMultiple({ text, terms }) {\n  if (!terms || terms.length === 0) return <>{text}</>;\n  \n  const escaped = terms\n    .filter(Boolean)\n    .map(term => term.replace(/[.*+?^\\${}()|[\\]\\\\]/g, '\\\\$&'))\n    .join('|');\n  \n  if (!escaped) return <>{text}</>;\n  \n  const regex = new RegExp('(' + escaped + ')', 'gi');\n  const parts = text.split(regex);\n  \n  return (\n    <>\n      {parts.map((part, i) =>\n        regex.test(part) ? (\n          <mark key={i}>{part}</mark>\n        ) : (\n          <React.Fragment key={i}>{part}</React.Fragment>\n        )\n      )}\n    </>\n  );\n}\n \n// Usage in search:\nfunction SearchResult({ result, query }) {\n  return (\n    <div className=\"result\">\n      <h3><HighlightedText text={result.title} query={query} /></h3>\n      <p><HighlightedText text={result.description} query={query} /></p>\n    </div>\n  );\n}\n\n\nFinal Interview Tips\n• Think out loud — the interviewer wants to hear your thought process.\n• Ask clarifying questions — \"10 items or 10,000?\", \"Need SSR?\", \"Mobile or desktop?\"\n• Talk about Trade-offs — every solution has pros/cons. Show you see them.\n• Profile before optimizing — never say \"I'll add useMemo\" without a reason.\n• Think about Edge cases — empty array, null, network failure, race conditions.\n• Mention Accessibility — ARIA, keyboard nav, semantic HTML.\n• When you don't know: \"I don't know exactly, but I know that...\" and give direction.\n• Test cases — describe what you would test. Write assertions inline.\n• Scaling — if asked about 1M users, think caching, CDN, virtualization.\n• Communication > Code — better an OK solution with great explanation than perfect code in silence.\n• Practice typing on a real keyboard — many interviews are timed coding.\n• Implement polyfills from scratch at least 3 times before the interview.\nGood luck! Remember: every hour of preparation is an investment in yourself.",
"howTo": "1. The core requirement is finding every place a search term appears in a text and marking it, while ignoring uppercase versus lowercase.\n2. Build a regular expression from the search term, using a flag for case-insensitive matching and a flag to match every occurrence, not just the first.\n3. Tricky edge case: the search term itself might contain characters that have special meaning in a regex, like a dot or a plus sign — escape those characters first or the pattern will misbehave.\n4. In plain text you can replace matches with a wrapped version directly. In React, avoid injecting raw HTML — instead split the text on the pattern and wrap only the matching pieces in a highlight element.\n5. For multiple search terms, join them with an OR symbol between each escaped term, so everything highlights in a single pass.\n6. Mentally test it: search a lowercase term against text containing both a capitalized and lowercase version of it, and confirm both get marked.",
"dryRun": {
"input": "highlightText('Hello World, hello universe', 'hello')",
"frames": [
"query = 'hello'. It has no special regex characters, so escaped stays 'hello'.",
"regex = /(hello)/gi — case-insensitive, and global so it finds every match, not just the first.",
"Scanning left to right, it finds 'Hello' at the start (matches despite the capital H) and wraps it: '<mark>Hello</mark>'.",
"Continuing to scan, it finds 'hello' again later in 'hello universe' and wraps it too.",
"'World' and 'universe' don't match 'hello', so they stay unchanged."
],
"result": "'<mark>Hello</mark> World, <mark>hello</mark> universe' — both casings of the word got highlighted."
},
"pitfalls": [
"Not escaping special regex characters in the query (like . * + ?) can throw an error or match the wrong things.",
"Forgetting the 'g' flag means only the first match in the whole text gets highlighted instead of all of them.",
"Using dangerouslySetInnerHTML in React to inject the <mark> tags is unsafe if the text is user-generated — splitting and wrapping is safer.",
"An empty search query should return the plain text unchanged, not crash or highlight everything."
],
"patternTakeaway": "If you need to find and highlight every occurrence of user-typed text inside a larger string, always think: escape regex special characters first, build a global case-insensitive regex, then split (not just replace) so you can safely wrap matches as React elements.",
"pattern": "Strings"
},
{
"id": "algo-cat1-q1",
"guide": "Algorithms Guide",
"topic": "Arrays & Hashing",
"topicNum": 1,
"level": "Easy",
"badge": "[Easy]  LeetCode #1  Pattern: Hash Map | Asked at: Google, Amazon, Meta, Microsoft, Apple | Time: O(n)  Space: O(n)",
"question": "Two Sum",
"explanation": "The problem: You get a list of numbers (nums) and a target number. Find two numbers in the list that add up to the target. Return their positions (indices) in the list. There is always exactly one correct answer, and you cannot use the same number twice. Example: nums = [2,7,11,15], target = 9. The answer is [0,1], because nums[0] + nums[1] = 2 + 7 = 9.\n\nHow to solve it: The slow way checks every pair of numbers, which takes too long. The fast way uses a hash map. Walk through the list one time. For each number, ask: 'What other number do I need to reach the target?' That is target minus the current number. Check if you already saw that number before. If yes, you found your pair — return both indices. If no, save the current number and its index in the map, then keep going.",
"code": "function twoSum(nums, target) {\n  const seen = new Map();\n  \n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    \n    if (seen.has(complement)) {\n      return [seen.get(complement), i];\n    }\n    \n    seen.set(nums[i], i);\n  }\n  \n  return [];\n}\n \n// Tests\ntwoSum([2, 7, 11, 15], 9); // [0, 1]\ntwoSum([3, 2, 4], 6);      // [1, 2]\ntwoSum([3, 3], 6);         // [0, 1]",
"howTo": "1. The question wants two numbers that add up to a target — that's a strong signal to use a hash map instead of nested loops.\n2. As you walk through the array once, ask for each number: what other number would I need to reach the target? That's target minus the current number.\n3. Check if you've already seen that needed number. If yes, you found your pair.\n4. If not, save the current number and its position so later numbers can find it.\n5. Remember: check before you store, so a number never pairs with itself.",
"dryRun": {
"input": "nums = [2,7,11,15], target = 9",
"frames": [
"i=0, num=2. Need 9-2=7. Map is empty, 7 is not there. Save seen[2]=0. seen = {2:0}",
"i=1, num=7. Need 9-7=2. Check seen for 2 — found it at index 0!",
"Match found: index 0 (value 2) and index 1 (value 7). Return [0, 1]."
],
"result": "[0, 1]"
},
"pitfalls": [
"Check the map BEFORE you store the current number, or a number could pair with itself.",
"If the same value appears twice (like [3,3]), the map still works because you check before storing — index 0 is saved first, then index 1 finds it.",
"The problem says there is always exactly one solution, so you don't need to handle 'no answer found' cases.",
"Negative numbers and zero work fine with this method — no special handling needed."
],
"patternTakeaway": "If you need to find a pair of numbers that match a target quickly in one pass, always think: hash map storing what you've seen so far.",
"pattern": "Arrays & Hashing"
},
{
"id": "algo-cat1-q2",
"guide": "Algorithms Guide",
"topic": "Arrays & Hashing",
"topicNum": 1,
"level": "Easy",
"badge": "[Easy]  LeetCode #217  Pattern: Hash Set | Asked at: Amazon, Apple, Microsoft | Time: O(n)  Space: O(n)",
"question": "Contains Duplicate",
"explanation": "The problem: You get a list of numbers. Return true if any number appears two or more times. Return false if every number is different. Example: [1,2,3,1] gives true (1 appears twice). Example: [1,2,3,4] gives false (no repeats).\n\nHow to solve it: Use a Set. A set can only hold each value once. Walk through the numbers one by one. Before adding a number, check if it is already in the set. If it is, you found a duplicate — return true right away. If it is not, add it and keep going. If you finish the whole list with no match, return false. A shorter trick: put all numbers into a Set at once, then compare the Set's size to the array's length. If the Set is smaller, some numbers were duplicates and got merged.",
"code": "// Approach 1: One-liner\nfunction containsDuplicate(nums) {\n  return new Set(nums).size !== nums.length;\n}\n \n// Approach 2: Early return (more efficient)\nfunction containsDuplicate(nums) {\n  const seen = new Set();\n  for (const num of nums) {\n    if (seen.has(num)) return true;\n    seen.add(num);\n  }\n  return false;\n}\n \ncontainsDuplicate([1, 2, 3, 1]);    // true\ncontainsDuplicate([1, 2, 3, 4]);    // false",
"howTo": "1. The question only asks \"does any value repeat\" — you don't need positions or counts, so a hash set is enough, no map needed.\n2. Core idea: a set can only hold each value once. If you try to add a value that's already there, you just found your duplicate.\n3. Walk through the array. Before adding a number, check if it's already in the set.\n4. If it is, stop right away and return true.\n5. If you get through the whole array with no match, return false.\n6. Edge case: an empty or single-element array has no duplicates — make sure your code still returns false for those.",
"dryRun": {
"input": "nums = [1,2,3,1]",
"frames": [
"num=1. seen is empty. Not found. Add 1. seen = {1}",
"num=2. Not in seen. Add 2. seen = {1,2}",
"num=3. Not in seen. Add 3. seen = {1,2,3}",
"num=1. Already in seen! Stop and return true immediately."
],
"result": "true"
},
"pitfalls": [
"An empty array or a single-element array has no duplicates — your code should still return false, not crash.",
"Check membership BEFORE adding the number, otherwise every number will 'match itself'.",
"The one-liner (Set size vs array length) is short but builds the whole set first — the loop version can stop early and is faster when a duplicate appears near the start."
],
"patternTakeaway": "If you need to know whether any value repeats in a list, always think: hash set, and check membership before adding.",
"pattern": "Arrays & Hashing"
},
{
"id": "algo-cat1-q3",
"guide": "Algorithms Guide",
"topic": "Arrays & Hashing",
"topicNum": 1,
"level": "Easy",
"badge": "[Easy]  LeetCode #242  Pattern: Hash Map / Sorting | Asked at: Amazon, Bloomberg, Spotify | Time: O(n)  Space: O(1) — limited alphabet",
"question": "Valid Anagram",
"explanation": "The problem: You get two strings, s and t. Return true if t is an anagram of s, meaning t uses exactly the same letters as s, the same number of times, just in a different order. Example: s = 'anagram', t = 'nagaram' gives true. Example: s = 'rat', t = 'car' gives false.\n\nHow to solve it: First, a quick check — if the two strings have different lengths, they cannot be anagrams, so return false immediately. Then there are two ways to solve the rest. Way 1: sort the letters of both strings and compare — if the sorted versions are equal, they are anagrams. Way 2 (faster): count how many times each letter appears in s using a hash map. Then go through t and subtract one from the count for each letter you see. If a letter is missing from the map, or a count goes below zero, they are not anagrams. If you finish cleanly, they are anagrams.",
"code": "// Approach 1: Sort\nfunction isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  return [...s].sort().join('') === [...t].sort().join('');\n}\n \n// Approach 2: Hash Map (faster)\nfunction isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  \n  const counts = {};\n  for (const char of s) {\n    counts[char] = (counts[char] || 0) + 1;\n  }\n  \n  for (const char of t) {\n    if (!counts[char]) return false;\n    counts[char]--;\n  }\n  \n  return true;\n}\n \nisAnagram('anagram', 'nagaram'); // true\nisAnagram('rat', 'car');         // false",
"howTo": "1. Anagram means \"same letters, same counts, different order\" — that word \"counts\" is the clue to count letters with a hash map instead of comparing full strings.\n2. Quick first check: if the two strings have different lengths, they can't be anagrams — return false right away.\n3. Walk through the first string and count how many times each letter shows up.\n4. Walk through the second string and subtract one for each letter you see.\n5. If any letter isn't in your map, or its count goes below zero, they don't match — return false.\n6. If you get through both strings cleanly, they're anagrams.",
"dryRun": {
"input": "s = \"rat\", t = \"car\"",
"frames": [
"Lengths equal (3 and 3), so continue.",
"Count letters in s: r=1, a=1, t=1. counts = {r:1, a:1, t:1}",
"Go through t: 'c' — not in counts at all! Return false right away."
],
"result": "false"
},
"pitfalls": [
"Always compare lengths first — different lengths can never be anagrams, and this saves work.",
"Watch letter case — 'Rat' and 'tar' might be treated as different unless you lowercase both strings first (check what the problem expects).",
"An empty string compared with an empty string should count as anagrams (true).",
"Don't forget to handle a count going below zero, not just missing from the map — that also means 'not an anagram'."
],
"patternTakeaway": "If two strings need the 'same letters, same counts' check, always think: hash map of letter counts (or sort both and compare).",
"pattern": "Arrays & Hashing"
},
{
"id": "algo-cat1-q4",
"guide": "Algorithms Guide",
"topic": "Arrays & Hashing",
"topicNum": 1,
"level": "Medium",
"badge": "[Medium]  LeetCode #49  Pattern: Hash Map | Asked at: Amazon, Meta, Uber | Time: O(n * k log k)  Space: O(n * k)",
"question": "Group Anagrams",
"explanation": "The problem: You get a list of words. Group the words that are anagrams of each other into the same group. Example: ['eat','tea','tan','ate','nat','bat'] becomes [['bat'],['nat','tan'],['ate','eat','tea']] (groups can be in any order).\n\nHow to solve it: For each word, build a 'key' that is the same for every anagram of that word. The simplest key is the word's letters sorted alphabetically — 'eat', 'tea', and 'ate' all sort to 'aet'. Use a hash map where the key is this sorted string and the value is the list of original words that match it. Go through every word: compute its key, and add the word to the list for that key (creating a new list if the key is new). At the end, the map's values are your answer groups. A faster version counts each letter into a 26-length array instead of sorting, which avoids the extra sorting time for long words.",
"code": "function groupAnagrams(strs) {\n  const groups = new Map();\n  \n  for (const word of strs) {\n    // Create canonical key by sorting\n    const key = [...word].sort().join('');\n    \n    if (!groups.has(key)) {\n      groups.set(key, []);\n    }\n    groups.get(key).push(word);\n  }\n  \n  return [...groups.values()];\n}\n \ngroupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']);\n// [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]\n \n// Optimization: Use character count instead of sort - O(n*k) instead of O(n*k log k)\nfunction groupAnagramsOptimal(strs) {\n  const groups = new Map();\n  \n  for (const word of strs) {\n    const counts = new Array(26).fill(0);\n    for (const char of word) {\n      counts[char.charCodeAt(0) - 97]++;\n    }\n    const key = counts.join(',');\n    \n    if (!groups.has(key)) groups.set(key, []);\n    groups.get(key).push(word);\n  }\n  \n  return [...groups.values()];\n}",
"howTo": "1. You need to group many words by \"same letters\" — that's a hash map problem, where the key is something every anagram of a word shares.\n2. Core trick: sort the letters of a word (or count them) to build a signature. Every anagram of that word produces the exact same signature.\n3. Make an empty map. For each word, compute its signature.\n4. If the signature is new, start a fresh list for it in the map. Otherwise add the word to the existing list.\n5. At the end, the map's lists of words are your groups.\n6. Edge case: sorting letters is simple but a little slow for long words — counting letters into a fixed array is faster if performance matters.",
"dryRun": {
"input": "strs = [\"eat\",\"tea\",\"bat\"]",
"frames": [
"word='eat'. Sort letters -> 'aet'. Not in map, create list. groups = {aet: [eat]}",
"word='tea'. Sort letters -> 'aet'. Already in map! Add to that list. groups = {aet: [eat, tea]}",
"word='bat'. Sort letters -> 'abt'. Not in map, create new list. groups = {aet: [eat, tea], abt: [bat]}"
],
"result": "[[\"eat\",\"tea\"],[\"bat\"]]"
},
"pitfalls": [
"An empty list of words should return an empty list of groups.",
"A single-letter word or an empty string word still needs a valid key — sorting an empty string just gives an empty string key.",
"Sorting works but is O(k log k) per word; for very long words, counting letters into a fixed array is faster.",
"Order of groups and order of words inside a group usually does not matter — check the exact requirement if it does."
],
"patternTakeaway": "If you need to group items that share some transformed 'signature' (like sorted letters), always think: hash map keyed by that signature.",
"pattern": "Arrays & Hashing"
},
{
"id": "algo-cat1-q5",
"guide": "Algorithms Guide",
"topic": "Arrays & Hashing",
"topicNum": 1,
"level": "Medium",
"badge": "[Medium]  LeetCode #347  Pattern: Hash Map + Bucket Sort | Asked at: Meta, Amazon, Yelp, Pocket Gems | Time: O(n)  Space: O(n)",
"question": "Top K Frequent Elements",
"explanation": "The problem: You get a list of numbers (nums) and a number k. Return the k numbers that appear most often in the list. Example: nums = [1,1,1,2,2,3], k = 2 gives [1,2], because 1 appears 3 times and 2 appears 2 times — those are the top 2.\n\nHow to solve it: First, count how many times each number appears, using a hash map. Then, instead of fully sorting all the counts (which takes extra time), use bucket sort: make an array of empty buckets, where the index of a bucket is a frequency (how many times a number showed up), and the bucket holds all numbers with that frequency. So bucket[3] would hold every number that appeared exactly 3 times. Then walk the buckets starting from the highest frequency down to the lowest, and collect numbers until you have k of them. This whole approach only takes O(n) time, faster than sorting.",
"code": "function topKFrequent(nums, k) {\n  // 1. Count frequencies\n  const counts = new Map();\n  for (const num of nums) {\n    counts.set(num, (counts.get(num) || 0) + 1);\n  }\n  \n  // 2. Bucket sort - bucket[i] = elements with frequency i\n  const buckets = Array.from({ length: nums.length + 1 }, () => []);\n  for (const [num, freq] of counts) {\n    buckets[freq].push(num);\n  }\n  \n  // 3. Collect from highest frequency\n  const result = [];\n  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {\n    for (const num of buckets[i]) {\n      result.push(num);\n      if (result.length === k) return result;\n    }\n  }\n  \n  return result;\n}\n \ntopKFrequent([1, 1, 1, 2, 2, 3], 2); // [1, 2]\ntopKFrequent([1], 1);                 // [1]\n \n// Alternative: Sort by frequency (slower but simpler)\nfunction topKFrequentSort(nums, k) {\n  const counts = new Map();\n  for (const num of nums) {\n    counts.set(num, (counts.get(num) || 0) + 1);\n  }\n  \n  return [...counts.entries()]\n    .sort((a, b) => b[1] - a[1])\n    .slice(0, k)\n    .map(([num]) => num);\n}",
"howTo": "1. \"K most frequent\" tells you two things: you need counts (hash map) and then a fast way to grab only the top k, without fully sorting everything.\n2. First step: count how often each number shows up, using a map.\n3. Core trick: instead of sorting the counts, use bucket sort — make an array of empty buckets where the index is a frequency, and drop each number into the bucket matching how often it appeared.\n4. Walk the buckets from the highest frequency down, collecting numbers until you have k of them.\n5. Edge case: more than one number can land in the same bucket — take as many as you need from that bucket, don't assume one number per bucket.",
"dryRun": {
"input": "nums = [1,1,1,2,2,3], k = 2",
"frames": [
"Count frequencies: 1 appears 3 times, 2 appears 2 times, 3 appears 1 time. counts = {1:3, 2:2, 3:1}",
"Build buckets by frequency: bucket[1]=[3], bucket[2]=[2], bucket[3]=[1] (index = frequency)",
"Walk buckets from highest index down: bucket[3] has [1] -> take 1. result=[1]. Still need 1 more.",
"bucket[2] has [2] -> take 2. result=[1,2]. We have k=2 numbers, stop."
],
"result": "[1, 2]"
},
"pitfalls": [
"More than one number can land in the same bucket (same frequency) — take as many as you need from that bucket, don't assume one number per bucket.",
"The buckets array needs size (array length + 1), since a number could appear as many times as the whole array's length.",
"If k equals the number of distinct values, you'll end up including everything.",
"A single-element array with k=1 should simply return that one element."
],
"patternTakeaway": "If you need the top-k or bottom-k items by frequency in O(n) time, always think: count with a hash map, then bucket sort by frequency instead of a full sort.",
"pattern": "Arrays & Hashing"
},
{
"id": "algo-cat1-q6",
"guide": "Algorithms Guide",
"topic": "Arrays & Hashing",
"topicNum": 1,
"level": "Medium",
"badge": "[Medium]  LeetCode #238  Pattern: Prefix / Suffix Product | Asked at: Meta, Amazon, Apple, LinkedIn | Time: O(n)  Space: O(1) — output excluded",
"question": "Product of Array Except Self",
"explanation": "The problem: You get a list of numbers (nums). Build a new list where each position holds the product of all the OTHER numbers in the list (not including the number at that position itself). You are not allowed to use division, and it must run in O(n) time. Example: [1,2,3,4] gives [24,12,8,6]. Check: position 0's answer is 2*3*4=24 (skip the 1).\n\nHow to solve it: Do this in two simple passes over the array, without using division. Pass 1 (left to right): build an array where each position holds the product of all numbers to its LEFT. Pass 2 (right to left): keep a running product of all numbers seen so far on the RIGHT, and multiply it into each position as you move backward. Combine both passes into the same result array, so you don't need extra memory beyond the answer array itself.",
"code": "function productExceptSelf(nums) {\n  const n = nums.length;\n  const result = new Array(n);\n  \n  // Left pass: result[i] = product of elements LEFT of i\n  result[0] = 1;\n  for (let i = 1; i < n; i++) {\n    result[i] = result[i - 1] * nums[i - 1];\n  }\n  \n  // Right pass: multiply by product of elements RIGHT of i\n  let rightProduct = 1;\n  for (let i = n - 1; i >= 0; i--) {\n    result[i] *= rightProduct;\n    rightProduct *= nums[i];\n  }\n  \n  return result;\n}\n \nproductExceptSelf([1, 2, 3, 4]);    // [24, 12, 8, 6]\nproductExceptSelf([-1, 1, 0, -3, 3]); // [0, 0, 9, 0, 0]\n \n// Trace for [1,2,3,4]:\n// After left pass:  [1, 1, 2, 6]\n// After right pass: [24, 12, 8, 6]",
"howTo": "1. \"Product of everything except itself\" plus \"no division allowed\" is the clue that you need to build each answer from a left piece and a right piece, computed separately.\n2. Core trick: the answer for any position is (product of everything to its left) times (product of everything to its right). You get those two pieces from two simple sweeps.\n3. First pass, left to right: fill an array so each spot holds the product of everything before it.\n4. Second pass, right to left: keep a running product of everything seen so far on the right, and multiply it into each spot as you go.\n5. This lets you reuse one output array instead of building two extra ones.\n6. Edge case: watch for zeros — one zero in the array makes every position's answer zero, except the position of the zero itself, which gets the product of everything else.",
"dryRun": {
"input": "nums = [1,2,3,4]",
"frames": [
"Left pass: result[0]=1 (nothing to the left). result[1]=result[0]*nums[0]=1*1=1. result[2]=result[1]*nums[1]=1*2=2. result[3]=result[2]*nums[2]=2*3=6. result = [1,1,2,6]",
"Right pass starts: rightProduct=1. i=3: result[3]*=1 -> stays 6. Then rightProduct *= nums[3]=4 -> rightProduct=4.",
"i=2: result[2]*=4 -> 2*4=8. rightProduct *= nums[2]=3 -> rightProduct=12.",
"i=1: result[1]*=12 -> 1*12=12. rightProduct *= nums[1]=2 -> rightProduct=24. i=0: result[0]*=24 -> 1*24=24."
],
"result": "[24, 12, 8, 6]"
},
"pitfalls": [
"One zero in the array makes every position's answer zero, except the position where the zero itself is — that position gets the product of everything else.",
"Two or more zeros in the array means every position's answer becomes zero, including the zero positions themselves.",
"Remember: no division allowed, even though dividing the total product by each number seems like an easy shortcut — it breaks when there are zeros.",
"Make sure the left pass starts with result[0] = 1 (there is nothing to the left of the first element)."
],
"patternTakeaway": "If you need each position's answer to depend on everything except itself, and you can't use division, always think: prefix product pass then suffix product pass.",
"pattern": "Arrays & Hashing"
},
{
"id": "algo-cat1-q7",
"guide": "Algorithms Guide",
"topic": "Arrays & Hashing",
"topicNum": 1,
"level": "Medium",
"badge": "[Medium]  LeetCode #36  Pattern: Hash Set + 2D iteration | Asked at: Apple, Amazon, Uber | Time: O(1) — fixed 9x9  Space: O(1)",
"question": "Valid Sudoku",
"explanation": "The problem: Check if a 9x9 Sudoku board is valid so far (it does not need to be fully solved). The rules: each row must not have a repeated digit 1-9, each column must not have a repeated digit 1-9, and each of the nine 3x3 boxes must not have a repeated digit 1-9. Empty cells are shown as '.' and can be ignored.\n\nHow to solve it: Use three sets — one to track values seen in each row, one for each column, and one for each 3x3 box. Go through every cell in the grid exactly once. Skip empty cells. For each filled cell, figure out which 3x3 box it belongs to (there is a small formula for this using the row and column numbers). Then build a unique label for this cell's value in its row (like 'row2 has a 5'), its column, and its box. Check if any of those three labels was already seen — if so, the board is invalid, stop and return false. If not, mark all three as seen and move to the next cell. If you finish the whole grid without conflicts, the board is valid.",
"code": "function isValidSudoku(board) {\n  const rows = new Set();\n  const cols = new Set();\n  const boxes = new Set();\n  \n  for (let r = 0; r < 9; r++) {\n    for (let c = 0; c < 9; c++) {\n      const val = board[r][c];\n      if (val === '.') continue;\n      \n      const boxIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);\n      \n      const rowKey = `row${r}-${val}`;\n      const colKey = `col${c}-${val}`;\n      const boxKey = `box${boxIndex}-${val}`;\n      \n      if (rows.has(rowKey) || cols.has(colKey) || boxes.has(boxKey)) {\n        return false;\n      }\n      \n      rows.add(rowKey);\n      cols.add(colKey);\n      boxes.add(boxKey);\n    }\n  }\n  \n  return true;\n}",
"howTo": "1. You must check \"no repeats\" across three different groupings at once (rows, columns, 3x3 boxes) — checking for repeats within a group is a hash set job, one set per grouping.\n2. Core trick: do just ONE pass over every cell, and for each filled cell, build a labeled entry like \"row 2 has a 5\" and \"box 4 has a 5\", so all three checks happen together instead of three separate passes.\n3. Loop over every cell in the grid, skipping empty ones.\n4. For each filled cell, figure out which 3x3 box it belongs to using its row and column numbers.\n5. Check if this value was already marked for this row, column, or box. If so, the board is invalid.\n6. If not, mark it as seen for all three, and keep going until every cell is checked.",
"dryRun": {
"input": "Cell (0,0)=5, then Cell (0,1)=5 (same row)",
"frames": [
"Cell (0,0)=5. boxIndex = floor(0/3)*3+floor(0/3) = 0. Keys: row0-5, col0-5, box0-5. None seen yet — mark all three as seen.",
"Cell (0,1)=5. boxIndex = floor(0/3)*3+floor(1/3) = 0. Keys: row0-5, col1-5, box0-5.",
"Check row0-5 — it's already marked from the first cell! Conflict found, return false immediately."
],
"result": "false"
},
"pitfalls": [
"Skip '.' cells — they are empty and should never be compared or marked.",
"The box index formula is Math.floor(row/3)*3 + Math.floor(col/3) — get this wrong and boxes will be checked incorrectly.",
"A board only needs to be checked as 'currently valid', not fully solved or fully filled.",
"Do all three checks (row, column, box) in a single pass over the grid — no need for three separate loops."
],
"patternTakeaway": "If you need to detect duplicates across several overlapping groupings at once, always think: one hash set per grouping, checked together in a single pass.",
"pattern": "Arrays & Hashing"
},
{
"id": "algo-cat1-q8",
"guide": "Algorithms Guide",
"topic": "Arrays & Hashing",
"topicNum": 1,
"level": "Medium",
"badge": "[Medium]  LeetCode #128  Pattern: Hash Set | Asked at: Google, Meta, Amazon | Time: O(n)  Space: O(n)",
"question": "Longest Consecutive Sequence",
"explanation": "The problem: You get an unsorted list of numbers. Find the length of the longest run of consecutive numbers (numbers that go up by exactly 1 each step), even though they may not be in order or next to each other in the array. It must run in O(n) time, so sorting the whole array is too slow. Example: [100,4,200,1,3,2] gives 4, because 1,2,3,4 are consecutive and form a run of length 4.\n\nHow to solve it: Put all numbers into a hash set first, so checking 'does this number exist' is instant. The key trick: only START counting a sequence from a number that is truly the beginning of a run — meaning (number - 1) is NOT in the set. This way, you never count the same sequence more than once. For each such starting number, count forward: check if number+1 is in the set, then number+2, and so on, until the run stops. Keep track of the longest run you find. Because each number is only ever visited as a 'start' once, and as part of a forward count once, the whole thing stays O(n) even though there is a loop inside a loop.",
"code": "function longestConsecutive(nums) {\n  const numSet = new Set(nums);\n  let longest = 0;\n  \n  for (const num of numSet) {\n    // Only start counting if num is the START of a sequence\n    if (!numSet.has(num - 1)) {\n      let current = num;\n      let count = 1;\n      \n      while (numSet.has(current + 1)) {\n        current++;\n        count++;\n      }\n      \n      longest = Math.max(longest, count);\n    }\n  }\n  \n  return longest;\n}\n \nlongestConsecutive([100, 4, 200, 1, 3, 2]); // 4 ([1,2,3,4])\nlongestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1]); // 9\nlongestConsecutive([]); // 0\n \n// Why O(n)?\n// Even though there's a \"while\" inside \"for\",\n// each number is visited at most twice (once as start, once in sequence).",
"howTo": "1. \"Longest run of consecutive numbers\" plus a requirement of O(n) time on an unsorted array is the clue: you can't afford to sort, so put everything in a hash set instead for instant lookups.\n2. Core trick: only start counting a sequence from a number that is a true starting point, meaning (number - 1) is NOT in the set. This stops you from counting the same sequence more than once.\n3. Put all numbers into a set first.\n4. For each number, check if (number - 1) exists. If it does, skip it — some earlier number will handle that sequence.\n5. If it's a starting point, count forward (number+1, number+2, ...) as long as each next number is in the set, and keep the longest run found.\n6. Edge case: an empty array should give 0 — make sure your loop doesn't break on nothing to check.",
"dryRun": {
"input": "nums = [100,4,200,1,3,2]",
"frames": [
"Build set: {100,4,200,1,3,2}",
"num=100. Is 99 in set? No. It's a start. Count forward: 101? No. Run length = 1. longest = 1",
"num=4. Is 3 in set? Yes. Skip — not a start, some earlier number handles this run.",
"num=1. Is 0 in set? No. It's a start. Count forward: 2 yes, 3 yes, 4 yes, 5 no. Run length = 4. longest = 4",
"num=3 and num=2 are skipped the same way as 4 (their num-1 is in the set)."
],
"result": "4"
},
"pitfalls": [
"An empty array should return 0 — make sure the loop simply does nothing instead of erroring.",
"Duplicate numbers in the input don't break anything since a set naturally removes duplicates.",
"Don't forget the 'only start from a true start' check — without it, every number restarts a count and the algorithm becomes O(n^2).",
"Negative numbers work fine too, since the set just checks existence, not sign."
],
"patternTakeaway": "If you need the longest run of consecutive values in an unsorted array in O(n), always think: hash set for O(1) lookups, and only start counting from true sequence starts.",
"pattern": "Arrays & Hashing"
},
{
"id": "algo-cat1-q9",
"guide": "Algorithms Guide",
"topic": "Arrays & Hashing",
"topicNum": 1,
"level": "Medium",
"badge": "[Medium]  LeetCode #271  Pattern: Design / String | Asked at: Google, Microsoft, Bloomberg | Time: O(n)  Space: O(n)",
"question": "Encode and Decode Strings",
"explanation": "The problem: Design a way to combine a list of strings into one single string (encode), and then be able to split that single string back into the exact original list (decode). The tricky part: the strings can contain ANY characters, even characters you might normally use as a separator, like a comma or '#'. Example: ['hello','world'] encodes to '5#hello5#world', and decoding it gives back ['hello','world'].\n\nHow to solve it: Use length-prefix encoding. Before each string, write down how many characters it has, followed by a marker character like '#', and then the string itself. To encode: for each string, write its length, then '#', then the string, and glue all these pieces together into one long string. To decode: read digits until you hit the '#' marker — that number tells you exactly how many characters to read next. Read that many characters as one string, move your position forward past them, and repeat until you reach the end. Because you always know the exact length in advance, it does not matter if the string itself contains a '#' character — you never need to search for the next marker inside the string.",
"code": "function encode(strs) {\n  return strs.map(s => s.length + '#' + s).join('');\n}\n \nfunction decode(encoded) {\n  const result = [];\n  let i = 0;\n  \n  while (i < encoded.length) {\n    // Find the # delimiter\n    let j = i;\n    while (encoded[j] !== '#') j++;\n    \n    // Read length\n    const length = parseInt(encoded.slice(i, j), 10);\n    \n    // Read string\n    result.push(encoded.slice(j + 1, j + 1 + length));\n    \n    i = j + 1 + length;\n  }\n  \n  return result;\n}\n \nconst encoded = encode(['hello', 'world', 'foo#bar']);\n// \"5#hello5#world7#foo#bar\"\ndecode(encoded);\n// ['hello', 'world', 'foo#bar']",
"howTo": "1. The tricky part is that strings can contain any character, even the character you might want to use as a separator — that clue tells you a simple join won't work, you need to always know exactly where one string ends.\n2. Core trick: write the length of each string before it, followed by a marker, so you always know exactly how many characters to read next, no matter what's inside the string.\n3. To encode: for each string, write its length, then a marker like #, then the string itself, and glue all the pieces together.\n4. To decode: read digits until you hit the marker to get the length, then read exactly that many characters as the next string, then move forward and repeat.\n5. Edge case: a marker character showing up inside the actual string content is not a problem, because you always read a fixed number of characters right after the marker — you never search for the next marker inside the string itself.",
"dryRun": {
"input": "strs = [\"ab\", \"c#d\"]",
"frames": [
"Encode 'ab': length=2, write '2#ab'.",
"Encode 'c#d': length=3, write '3#c#d'. Full encoded string = '2#ab3#c#d'",
"Decode starts at i=0. Read digits until '#': finds '2'. Read next 2 chars after '#': 'ab'. Move i past them (i=4).",
"Decode continues at i=4. Read digits until '#': finds '3'. Read next 3 chars after '#': 'c#d' (the # inside is just part of the string, not treated as a marker)."
],
"result": "[\"ab\", \"c#d\"]"
},
"pitfalls": [
"Never split on the marker character directly ('#') — the string content might contain '#' itself, which would break a simple split-based approach.",
"Always read exactly 'length' characters after the marker during decoding, don't search for the next marker.",
"An empty string in the list should still encode correctly as '0#' (length zero, then nothing).",
"An empty list of strings should encode to an empty string and decode back to an empty list."
],
"patternTakeaway": "If you need to join and later split strings that may contain any character including your separator, always think: length-prefix encoding instead of a plain delimiter.",
"pattern": "Arrays & Hashing"
},
{
"id": "algo-cat2-q1",
"guide": "Algorithms Guide",
"topic": "Two Pointers",
"topicNum": 2,
"level": "Easy",
"badge": "[Easy]  LeetCode #125  Pattern: Two Pointers | Asked at: Meta, Microsoft, Apple | Time: O(n)  Space: O(1)",
"question": "Valid Palindrome",
"explanation": "Problem: You get a string. Check if it reads the same forwards and backwards. Only look at letters and numbers — skip spaces, punctuation, and other symbols. Uppercase and lowercase count as the same letter.\nExample: \"A man, a plan, a canal: Panama\" is a palindrome.\nExample: \"race a car\" is not.\n\nApproach: Use two pointers. One starts at the beginning, one starts at the end. Move them toward each other. Skip any character that is not a letter or number. Compare the two letters, ignoring uppercase and lowercase. If they ever differ, it is not a palindrome. If the pointers meet without any mismatch, it is a palindrome.",
"code": "function isPalindrome(s) {\n  let left = 0;\n  let right = s.length - 1;\n  \n  const isAlphanumeric = (c) => /[a-z0-9]/i.test(c);\n  \n  while (left < right) {\n    while (left < right && !isAlphanumeric(s[left])) left++;\n    while (left < right && !isAlphanumeric(s[right])) right--;\n    \n    if (s[left].toLowerCase() !== s[right].toLowerCase()) {\n      return false;\n    }\n    \n    left++;\n    right--;\n  }\n  \n  return true;\n}\n \nisPalindrome('A man, a plan, a canal: Panama'); // true\nisPalindrome('race a car');                      // false\nisPalindrome(' ');                                // true\n \n// Cleaner one-liner (less efficient - O(n) space)\nfunction isPalindromeShort(s) {\n  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return cleaned === cleaned.split('').reverse().join('');\n}",
"howTo": "1. \"Reads the same forwards and backwards\" naturally means comparing from both ends toward the middle — that's a classic two-pointer setup.\n2. Core trick: put one pointer at the start and one at the end, and move them toward each other while comparing characters.\n3. Before comparing, skip any character that isn't a letter or digit on either side, by moving that pointer inward.\n4. Compare the two current characters, ignoring uppercase and lowercase. If they don't match, it's not a palindrome.\n5. Keep moving both pointers inward until they meet or cross. If nothing ever mismatched, it is a palindrome.\n6. Edge case: strings made only of punctuation or spaces (or empty strings) should count as palindromes by default.",
"dryRun": {
"input": "s = \"race a car\"",
"frames": [
"left=0 'r', right=9 'r'. Both letters. Match. Move left→1, right→8.",
"left=1 'a', right=8 'a'. Both letters. Match. Move left→2, right→7.",
"left=2 'c', right=7 'c'. Both letters. Match. Move left→3, right→6.",
"left=3 'e', right=6 ' '. Right is not a letter or number, skip it: right→5.",
"left=3 'e', right=5 'a'. Both letters, but 'e' ≠ 'a'. Mismatch found."
],
"result": "return false"
},
"pitfalls": [
"A string with only punctuation or spaces (or an empty string) should return true, since there is nothing to compare.",
"Always lowercase both characters before comparing, or 'A' and 'a' will look like a mismatch.",
"The skip loops must also check left < right, or the pointers can run past each other on strings with no letters/numbers.",
"A single character string is always a palindrome."
],
"patternTakeaway": "If you need to check something by comparing from both ends toward the middle, like a palindrome, always think: two pointers starting at each end, moving inward while skipping and comparing.",
"pattern": "Two Pointers"
},
{
"id": "algo-cat2-q2",
"guide": "Algorithms Guide",
"topic": "Two Pointers",
"topicNum": 2,
"level": "Medium",
"badge": "[Medium]  LeetCode #167  Pattern: Two Pointers | Asked at: Amazon, Apple | Time: O(n)  Space: O(1)",
"question": "Two Sum II - Input Array Is Sorted",
"explanation": "Problem: You get a sorted array of numbers and a target number. Find two numbers in the array that add up to the target. Return their positions, counting from 1, not from 0. There is exactly one answer.\nExample: numbers = [2,7,11,15], target = 9 → answer [1,2].\n\nApproach: Because the array is already sorted, use two pointers. Put one pointer at the start and one at the end. Add the two numbers together. If the sum is too small, move the left pointer right to get a bigger number. If the sum is too big, move the right pointer left to get a smaller number. Stop when the sum equals the target. This uses O(1) extra space, which is better than a hash map.",
"code": "function twoSum(numbers, target) {\n  let left = 0;\n  let right = numbers.length - 1;\n  \n  while (left < right) {\n    const sum = numbers[left] + numbers[right];\n    \n    if (sum === target) {\n      return [left + 1, right + 1]; // 1-indexed\n    } else if (sum < target) {\n      left++;\n    } else {\n      right--;\n    }\n  }\n  \n  return [];\n}\n \ntwoSum([2, 7, 11, 15], 9); // [1, 2]\ntwoSum([2, 3, 4], 6);      // [1, 3]\ntwoSum([-1, 0], -1);       // [1, 2]",
"howTo": "1. The big clue here is \"the array is already sorted\" — a sorted array plus needing a pair that matches a target is a strong signal for two pointers instead of a hash map.\n2. Core trick: start one pointer at the smallest number (left) and one at the largest (right). Being sorted tells you exactly which way to move next.\n3. Add the two pointed-at numbers and compare to the target.\n4. If the sum is too small, you need a bigger number, so move the left pointer right.\n5. If the sum is too big, you need a smaller number, so move the right pointer left.\n6. Stop when the sum matches. Edge case: remember the answer must use 1-indexed positions, not 0-indexed.",
"dryRun": {
"input": "numbers = [2,7,11,15], target = 9",
"frames": [
"left=0(2), right=3(15). sum=17, too big, move right→2.",
"left=0(2), right=2(11). sum=13, too big, move right→1.",
"left=0(2), right=1(7). sum=9, equals target — match!"
],
"result": "return [1, 2] (1-indexed)"
},
"pitfalls": [
"Return 1-indexed positions, not 0-indexed — a common off-by-one mistake.",
"If no pair is found, return an empty array (though the problem guarantees one answer).",
"The loop must stop when left is no longer less than right, so you never use the same element twice.",
"This trick only works because the array is sorted — on an unsorted array, use a hash map instead."
],
"patternTakeaway": "If the array is sorted and you need a pair that meets a sum or target condition, always think: two pointers from both ends, moving based on whether the sum is too big or too small.",
"pattern": "Two Pointers"
},
{
"id": "algo-cat2-q3",
"guide": "Algorithms Guide",
"topic": "Two Pointers",
"topicNum": 2,
"level": "Medium",
"badge": "[Medium]  LeetCode #15  Pattern: Two Pointers + Sort | Asked at: Meta, Amazon, Microsoft, Adobe | Time: O(n^2)  Space: O(1) — output excluded",
"question": "3Sum",
"explanation": "Problem: You get an array of numbers. Find all groups of three numbers that add up to zero. Do not include the same group of three twice.\nExample: nums = [-1,0,1,2,-1,-4] → answer [[-1,-1,2],[-1,0,1]].\n\nApproach: First, sort the array. Then, for each number in the array (call it the \"first number\"), use two pointers on the rest of the array to find a pair that adds up to the opposite of the first number. This works because the array is sorted, so the same trick as Two Sum II applies. Skip over repeated numbers, for the first number and for the pair, so you never save the same group of three twice.",
"code": "function threeSum(nums) {\n  const result = [];\n  nums.sort((a, b) => a - b);\n  \n  for (let i = 0; i < nums.length - 2; i++) {\n    // Skip duplicate values for i\n    if (i > 0 && nums[i] === nums[i - 1]) continue;\n    \n    // If smallest is positive, sum is positive - stop\n    if (nums[i] > 0) break;\n    \n    let left = i + 1;\n    let right = nums.length - 1;\n    \n    while (left < right) {\n      const sum = nums[i] + nums[left] + nums[right];\n      \n      if (sum === 0) {\n        result.push([nums[i], nums[left], nums[right]]);\n        \n        // Skip duplicates\n        while (left < right && nums[left] === nums[left + 1]) left++;\n        while (left < right && nums[right] === nums[right - 1]) right--;\n        \n        left++;\n        right--;\n      } else if (sum < 0) {\n        left++;\n      } else {\n        right--;\n      }\n    }\n  }\n  \n  return result;\n}\n \nthreeSum([-1, 0, 1, 2, -1, -4]); // [[-1,-1,2], [-1,0,1]]\nthreeSum([0, 1, 1]);              // []\nthreeSum([0, 0, 0]);              // [[0,0,0]]",
"howTo": "1. You now need THREE numbers that sum to zero with no duplicate triplets — needing pairs plus avoiding duplicates is the clue to sort the array first, then reuse the two-pointer trick for the remaining pair.\n2. Core trick: fix one number at a time as the \"first number,\" then use two pointers on the rest of the sorted array to find a pair that cancels it out to zero.\n3. Sort the whole array first — this is what makes both duplicate-skipping and two-pointer movement possible.\n4. Loop through each index as the fixed first number, skipping it if it's the same value as the one before, to avoid duplicate triplets.\n5. On the remaining part of the array, move left and right pointers toward each other, just like Two Sum II, aiming for a pair that adds up to the negative of the fixed number.\n6. When you find a match, also skip past any duplicate values next to your left and right pointers before continuing, so the same triplet is never recorded twice.",
"dryRun": {
"input": "nums = [-1,0,1,2,-1,-4]",
"frames": [
"Sort nums: [-4,-1,-1,0,1,2].",
"i=0, fixed=-4. left=1,right=5: sum=-3, too small, move left. Keep moving left until it meets right — no triplet found for -4.",
"i=1, fixed=-1. left=2(-1), right=5(2): sum=0. Match! Save [-1,-1,2]. Move left→3, right→4.",
"left=3(0), right=4(1): sum=0. Match! Save [-1,0,1]. Pointers cross, inner loop ends.",
"i=2: nums[2]=-1 equals nums[1]=-1 — skip it to avoid a duplicate triplet."
],
"result": "return [[-1,-1,2], [-1,0,1]]"
},
"pitfalls": [
"You must sort the array first, or the two-pointer trick will not work.",
"Skip duplicate values for the fixed first number (compare to the previous one) to avoid repeated triplets.",
"After finding a match, also skip duplicate values on both the left and right pointers before continuing.",
"If the fixed number is positive, since the array is sorted, no triplet can sum to zero anymore — stop the loop early."
],
"patternTakeaway": "If you need a fixed number of elements, three or more, that sum to a target, always think: sort the array, fix one number at a time, then use two pointers for the rest.",
"pattern": "Two Pointers"
},
{
"id": "algo-cat2-q4",
"guide": "Algorithms Guide",
"topic": "Two Pointers",
"topicNum": 2,
"level": "Medium",
"badge": "[Medium]  LeetCode #11  Pattern: Two Pointers | Asked at: Meta, Amazon, Bloomberg | Time: O(n)  Space: O(1)",
"question": "Container With Most Water",
"explanation": "Problem: You get the heights of vertical lines. Pick two lines. Together with the ground (the x-axis), they form a container that can hold water. Find the largest amount of water any two lines can hold.\nExample: height = [1,8,6,2,5,4,8,3,7] → answer 49.\n\nApproach: Use two pointers, one at the start and one at the end. The water held equals the shorter of the two lines, multiplied by the distance between them. Always move the pointer at the shorter line inward. Why? The shorter line is what limits the water. Moving the taller line only makes the container narrower without helping.",
"code": "function maxArea(height) {\n  let left = 0;\n  let right = height.length - 1;\n  let maxArea = 0;\n  \n  while (left < right) {\n    const width = right - left;\n    const minHeight = Math.min(height[left], height[right]);\n    const area = width * minHeight;\n    \n    maxArea = Math.max(maxArea, area);\n    \n    // Move the shorter pointer\n    if (height[left] < height[right]) {\n      left++;\n    } else {\n      right--;\n    }\n  }\n  \n  return maxArea;\n}\n \nmaxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]); // 49\nmaxArea([1, 1]);                       // 1",
"howTo": "1. \"Two lines that hold the most water\" over an array of heights is a signal for two pointers starting from both ends, since the widest possible container uses the outermost lines.\n2. Core trick: the water held is limited by the SHORTER of the two lines, no matter how tall the other one is. Moving the taller line inward can only shrink the width without raising that limit — so always move the shorter one, it's the only side with a chance to improve things.\n3. Start pointers at the leftmost and rightmost lines. Compute the area using the shorter height times the distance between them.\n4. Keep track of the best area seen so far.\n5. Move whichever pointer is shorter, one step inward, and repeat.\n6. Edge case: if the two lines are the same height, moving either one is fine — just be consistent.",
"dryRun": {
"input": "height = [1,8,6,2,5,4,8,3,7]",
"frames": [
"left=0(h=1), right=8(h=7). width=8, area=min(1,7)*8=8. max=8. Left is shorter, move left→1.",
"left=1(h=8), right=8(h=7). width=7, area=min(8,7)*7=49. max=49. Right is shorter now, move right→7.",
"left=1(h=8), right=7(h=3). width=6, area=min(8,3)*6=18. max stays 49. Move right→6.",
"left=1(h=8), right=6(h=8). width=5, area=min(8,8)*5=40. max stays 49. Continue until left meets right — 49 stays the best."
],
"result": "return 49"
},
"pitfalls": [
"Always move the shorter side's pointer, never the taller one — moving the taller one can never improve the answer.",
"If both heights are equal, moving either pointer is fine.",
"With only 2 lines, the area is just the distance between them times the smaller height.",
"Do not confuse this with Trapping Rain Water — this problem only cares about the two boundary lines, not water above every bar in between."
],
"patternTakeaway": "If you need to maximize an area or volume bounded by two ends of an array, always think: two pointers from outside in, always moving the side that limits the result.",
"pattern": "Two Pointers"
},
{
"id": "algo-cat2-q5",
"guide": "Algorithms Guide",
"topic": "Two Pointers",
"topicNum": 2,
"level": "Hard",
"badge": "[Hard]  LeetCode #42  Pattern: Two Pointers | Asked at: Amazon, Google, Meta, Bloomberg | Time: O(n)  Space: O(1)",
"question": "Trapping Rain Water",
"explanation": "Problem: You get the heights of bars on a chart. After it rains, water gets trapped between the bars. Find the total amount of water trapped.\nExample: height = [0,1,0,2,1,0,1,3,2,1,2,1] → answer 6.\n\nApproach: The water above any bar equals the smaller of (the tallest bar to its left, the tallest bar to its right), minus that bar's own height. One way to solve it: build two arrays, one with the tallest bar so far from the left, one from the right, then combine them — this uses extra space. A better way: use two pointers from both ends, each tracking its own running maximum height. Always move the side with the smaller running maximum. You already know the other side is at least that tall, so it is safe to add water on that side.",
"code": "// Two pointer solution - O(1) space\nfunction trap(height) {\n  let left = 0;\n  let right = height.length - 1;\n  let leftMax = 0;\n  let rightMax = 0;\n  let water = 0;\n  \n  while (left < right) {\n    if (height[left] < height[right]) {\n      // Left is shorter - safe to compute left side\n      if (height[left] >= leftMax) {\n        leftMax = height[left];\n      } else {\n        water += leftMax - height[left];\n      }\n      left++;\n    } else {\n      // Right is shorter or equal - compute right side\n      if (height[right] >= rightMax) {\n        rightMax = height[right];\n      } else {\n        water += rightMax - height[right];\n      }\n      right--;\n    }\n  }\n  \n  return water;\n}\n \ntrap([0,1,0,2,1,0,1,3,2,1,2,1]); // 6\ntrap([4,2,0,3,2,5]);              // 9\n \n// Easier to understand: precomputed arrays\nfunction trapEasy(height) {\n  const n = height.length;\n  const leftMax = new Array(n);\n  const rightMax = new Array(n);\n  \n  leftMax[0] = height[0];\n  for (let i = 1; i < n; i++) {\n    leftMax[i] = Math.max(leftMax[i - 1], height[i]);\n  }\n  \n  rightMax[n - 1] = height[n - 1];\n  for (let i = n - 2; i >= 0; i--) {\n    rightMax[i] = Math.max(rightMax[i + 1], height[i]);\n  }\n  \n  let water = 0;\n  for (let i = 0; i < n; i++) {\n    water += Math.min(leftMax[i], rightMax[i]) - height[i];\n  }\n  return water;\n}",
"howTo": "1. Water above any bar depends on the shorter of (tallest wall to its left, tallest wall to its right) — that \"shorter side decides\" idea, plus wanting O(1) space, points to two pointers moving inward from both ends.\n2. Core trick: if the left wall is currently shorter than the right wall, you already know the right side has at least as tall a wall further out — so you can safely settle the left side's water using only the left's own running max, without knowing the exact right max yet.\n3. Keep two pointers and two running maximums, one for each side.\n4. Compare the current left and right heights, and always advance the pointer on the shorter side.\n5. Before moving that pointer, if its height is a new record for its side, just update the max — no water sits there. Otherwise, add (that side's max minus current height) to your water total.\n6. Edge case: a flat or strictly increasing/decreasing elevation map should trap zero water — trace through one to confirm.",
"dryRun": {
"input": "height = [4,2,0,3,2,5]",
"frames": [
"left=0(4), right=5(5), leftMax=0, rightMax=0. height[left]<height[right], so process left: 4≥leftMax(0), update leftMax=4. left→1.",
"left=1(2). Still height[left]<height[right]. 2<leftMax(4), so water += 4-2=2. water=2. left→2.",
"left=2(0). 0<leftMax(4), water += 4-0=4. water=6. left→3.",
"left=3(3). 3<leftMax(4), water += 4-3=1. water=7. left→4.",
"left=4(2). 2<leftMax(4), water += 4-2=2. water=9. left→5, pointers meet, stop."
],
"result": "return 9"
},
"pitfalls": [
"Water only accumulates on the side you know is safe, the side with the smaller running max — do not process the taller side too early.",
"A strictly increasing or strictly decreasing elevation map traps zero water.",
"Update the running max only when the current height is a new record; otherwise add the difference to water.",
"One bar, or two bars, can never trap any water — you need at least a small 'valley' shape."
],
"patternTakeaway": "If you need to compute how much space or water is bounded on both sides by the maximum seen so far, always think: two pointers with a running max on each side, always processing the side with the smaller max.",
"pattern": "Two Pointers"
},
{
"id": "algo-cat2-q6",
"guide": "Algorithms Guide",
"topic": "Two Pointers",
"topicNum": 2,
"level": "Easy",
"badge": "[Easy]  LeetCode #26  Pattern: Two Pointers (Slow/Fast) | Asked at: Microsoft, Bloomberg, Apple | Time: O(n)  Space: O(1)",
"question": "Remove Duplicates from Sorted Array",
"explanation": "Problem: You get a sorted array. Remove the duplicate values in-place so each value appears only once. Return the new length. The first part of the array, up to that length, must hold the unique values in the original order.\nExample: nums = [1,1,2] → new length is 2, array becomes [1,2,_].\n\nApproach: Use a slow pointer and a fast pointer. The slow pointer marks the last unique value written so far. The fast pointer scans ahead. Whenever the fast pointer finds a value different from the one at the slow pointer, move the slow pointer forward one step and copy that new value there.",
"code": "function removeDuplicates(nums) {\n  if (nums.length === 0) return 0;\n  \n  let slow = 0;\n  \n  for (let fast = 1; fast < nums.length; fast++) {\n    if (nums[fast] !== nums[slow]) {\n      slow++;\n      nums[slow] = nums[fast];\n    }\n  }\n  \n  return slow + 1;\n}\n \nconst arr = [1, 1, 2];\nremoveDuplicates(arr); // returns 2, arr becomes [1, 2, _]\n \nconst arr2 = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];\nremoveDuplicates(arr2); // returns 5, arr2 becomes [0, 1, 2, 3, 4, _, _, _, _, _]",
"howTo": "1. The array is sorted, so all copies of a duplicate value sit right next to each other — that's the clue you can solve this in one pass with two pointers instead of extra memory.\n2. Core trick: use one pointer (\"slow\") marking the last confirmed unique value's spot, and one pointer (\"fast\") scanning ahead looking for the next new value.\n3. Start slow at index 0, and move fast from index 1 onward.\n4. Whenever nums[fast] differs from nums[slow], it's a new unique value — move slow forward one step and copy nums[fast] into that spot.\n5. When fast reaches the end, slow+1 is the count of unique values, and the first slow+1 slots hold them in order.\n6. Edge case: an empty array should immediately return a length of 0, without running the pointers at all.",
"dryRun": {
"input": "nums = [0,0,1,1,1,2,2,3,3,4]",
"frames": [
"slow=0, fast=1. nums[1]=0 equals nums[0]=0 — duplicate, skip.",
"fast=2. nums[2]=1 differs from nums[slow=0]=0 — new value. slow→1, copy: nums[1]=1.",
"fast=3,4. nums[3]=1 and nums[4]=1 both equal nums[slow=1]=1 — duplicates, skip both.",
"fast=5. nums[5]=2 differs from nums[slow=1]=1 — new value. slow→2, copy: nums[2]=2.",
"Continue the same way for values 3 and 4 — each new value bumps slow and gets copied forward."
],
"result": "return slow+1 = 5, first 5 slots are [0,1,2,3,4]"
},
"pitfalls": [
"An empty array must return 0 immediately, without running the pointers.",
"An array with all identical elements should end with slow staying at 0, so length 1.",
"Values after index slow are leftover garbage — the problem only cares about the first slow+1 slots.",
"This only works because the array is sorted — an unsorted array needs a different approach, like a set."
],
"patternTakeaway": "If you must overwrite or compact a sorted array in-place, based on comparing to the last kept value, always think: slow pointer marks the write position, fast pointer scans ahead.",
"pattern": "Two Pointers"
},
{
"id": "algo-cat2-q7",
"guide": "Algorithms Guide",
"topic": "Two Pointers",
"topicNum": 2,
"level": "Easy",
"badge": "[Easy]  LeetCode #283  Pattern: Two Pointers | Asked at: Meta, Apple, Bloomberg | Time: O(n)  Space: O(1)",
"question": "Move Zeroes",
"explanation": "Problem: You get an array. Move all the zeros to the end of the array. Keep the order of the non-zero numbers the same. Do this in-place, without creating a new array.\nExample: [0,1,0,3,12] → [1,3,12,0,0].\n\nApproach: Use a slow pointer and a fast pointer. The slow pointer marks where the next non-zero value should go. The fast pointer scans through the array. Whenever the fast pointer finds a non-zero value, swap it with the value at the slow pointer, then move the slow pointer forward.",
"code": "function moveZeroes(nums) {\n  let slow = 0;\n  \n  for (let fast = 0; fast < nums.length; fast++) {\n    if (nums[fast] !== 0) {\n      [nums[slow], nums[fast]] = [nums[fast], nums[slow]];\n      slow++;\n    }\n  }\n}\n \nconst arr = [0, 1, 0, 3, 12];\nmoveZeroes(arr);\n// arr is now [1, 3, 12, 0, 0]",
"howTo": "1. \"Move all zeros to the end while keeping the order of everything else,\" done in-place, is the clue for two pointers: one to scan, one to mark where the next non-zero value should land.\n2. Core trick: think of \"slow\" as a boundary — everything before it is already a confirmed non-zero value, in the right order.\n3. Start slow at 0, and move fast across the whole array.\n4. Whenever nums[fast] is non-zero, swap it into position slow, then move slow forward by one.\n5. Because you swap instead of just overwrite, the zeros naturally drift toward the end as you go, with no separate cleanup pass needed.\n6. Edge case: an array of all zeros, or one with no zeros, should pass through unchanged — trace through one in your head to check your swap logic holds up.",
"dryRun": {
"input": "nums = [0,1,0,3,12]",
"frames": [
"slow=0, fast=0. nums[0]=0 is zero — skip, don't move slow.",
"fast=1. nums[1]=1 is non-zero. Swap nums[slow=0] and nums[fast=1]: array→[1,0,0,3,12]. slow→1.",
"fast=2. nums[2]=0 is zero — skip.",
"fast=3. nums[3]=3 is non-zero. Swap nums[slow=1] and nums[fast=3]: array→[1,3,0,0,12]. slow→2.",
"fast=4. nums[4]=12 is non-zero. Swap nums[slow=2] and nums[fast=4]: array→[1,3,12,0,0]. slow→3."
],
"result": "array becomes [1,3,12,0,0]"
},
"pitfalls": [
"Swap the values, don't just overwrite — overwriting would lose values you still need later.",
"An array with no zeros should end up unchanged.",
"An array of all zeros should also end up unchanged, since slow never advances.",
"The order of the non-zero elements must stay the same — the swap trick preserves this automatically."
],
"patternTakeaway": "If you need to move or group certain elements in-place while keeping the relative order of the rest, always think: slow pointer for the write position, fast pointer scanning and swapping in matches.",
"pattern": "Two Pointers"
},
{
"id": "algo-cat3-q1",
"guide": "Algorithms Guide",
"topic": "Sliding Window",
"topicNum": 3,
"level": "Easy",
"badge": "[Easy]  LeetCode #121  Pattern: Sliding Window / DP | Asked at: Amazon, Meta, Google, Apple | Time: O(n)  Space: O(1)",
"question": "Best Time to Buy and Sell Stock",
"explanation": "Problem: You get the price of a stock on each day. You may buy once and sell once, and you must buy before you sell. Find the maximum profit you can make. If no profit is possible, return 0.\nExample: prices = [7,1,5,3,6,4] → answer 5 (buy at 1, sell at 6).\n\nApproach: Go through the prices once, left to right. Keep track of the lowest price seen so far — that is your best day to have bought. For each day, check the profit if you sold today: today's price minus the lowest price so far. Keep the biggest profit you find. Also update the lowest price whenever today's price is even lower than before.",
"code": "function maxProfit(prices) {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  \n  for (const price of prices) {\n    if (price < minPrice) {\n      minPrice = price;\n    } else if (price - minPrice > maxProfit) {\n      maxProfit = price - minPrice;\n    }\n  }\n  \n  return maxProfit;\n}\n \nmaxProfit([7, 1, 5, 3, 6, 4]); // 5\nmaxProfit([7, 6, 4, 3, 1]);    // 0 (only decreasing)",
"howTo": "1. You need one buy day before one sell day to maximize profit — tracking the best day so far while scanning forward is really a one-pass sliding window idea, even though it looks like plain scanning.\n2. Core trick: as you walk through the prices once, keep the lowest price seen so far. That's your best possible \"buy\" day up to this point.\n3. For each new price, first check: would selling today, after buying at the lowest price so far, beat your current best profit? If yes, update your best profit.\n4. Then check: is today's price lower than the lowest seen so far? If yes, update your minimum, since today is now the best day to have bought.\n5. Do both checks in a single left-to-right pass, no nested loops needed.\n6. Edge case: prices that only go downward should give a profit of 0, not negative — start your best-profit tracker at 0 and never let it dip below that.",
"dryRun": {
"input": "prices = [7,1,5,3,6,4]",
"frames": [
"price=7. 7<minPrice(∞), so minPrice=7.",
"price=1. 1<minPrice(7), so minPrice=1.",
"price=5. Not lower than minPrice. Profit if sold now = 5-1=4 > maxProfit(0), so maxProfit=4.",
"price=3. Not lower than minPrice. Profit = 3-1=2, not better than 4 — no change.",
"price=6. Not lower than minPrice. Profit = 6-1=5 > 4, so maxProfit=5.",
"price=4. Profit = 4-1=3, not better — no change."
],
"result": "return 5"
},
"pitfalls": [
"Prices that only decrease should return 0, not a negative number.",
"Only one buy and one sell are allowed in this version — you cannot buy and sell multiple times.",
"You must buy before you sell — the minPrice tracker naturally enforces this since it only looks backward.",
"An empty array, or an array with a single price, should return 0."
],
"patternTakeaway": "If you need the best difference between an earlier and a later element, like buy low then sell high, always think: track the minimum seen so far while scanning once.",
"pattern": "Sliding Window"
},
{
"id": "algo-cat3-q2",
"guide": "Algorithms Guide",
"topic": "Sliding Window",
"topicNum": 3,
"level": "Medium",
"badge": "[Medium]  LeetCode #3  Pattern: Sliding Window | Asked at: Amazon, Meta, Google, Microsoft, Bloomberg | Time: O(n)  Space: O(min(n, alphabet))",
"question": "Longest Substring Without Repeating Characters",
"explanation": "Problem: Find the length of the longest part of a string where no character repeats.\nExample: \"abcabcbb\" → 3 (the substring \"abc\").\nExample: \"bbbbb\" → 1 (just \"b\").\n\nApproach: Use a sliding window with a Set, or a Map, to remember which characters are currently inside the window. Move the right edge of the window forward, adding new characters. If the new character is already inside the window, shrink the window from the left side, removing characters one by one, until the duplicate is gone. Keep track of the biggest window size you ever see. A Map version can be faster because it lets you jump the left pointer directly, instead of removing one character at a time.",
"code": "// Approach 1: Set (cleaner)\nfunction lengthOfLongestSubstring(s) {\n  const seen = new Set();\n  let left = 0;\n  let maxLen = 0;\n  \n  for (let right = 0; right < s.length; right++) {\n    while (seen.has(s[right])) {\n      seen.delete(s[left]);\n      left++;\n    }\n    seen.add(s[right]);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  \n  return maxLen;\n}\n \n// Approach 2: Map (more efficient - jump directly)\nfunction lengthOfLongestSubstring(s) {\n  const lastSeen = new Map();\n  let left = 0;\n  let maxLen = 0;\n  \n  for (let right = 0; right < s.length; right++) {\n    if (lastSeen.has(s[right]) && lastSeen.get(s[right]) >= left) {\n      left = lastSeen.get(s[right]) + 1;\n    }\n    lastSeen.set(s[right], right);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  \n  return maxLen;\n}\n \nlengthOfLongestSubstring('abcabcbb'); // 3\nlengthOfLongestSubstring('bbbbb');    // 1\nlengthOfLongestSubstring('pwwkew');   // 3",
"howTo": "1. \"Longest substring with all unique characters\" is a textbook clue for sliding window — you're hunting for the biggest chunk of the string that satisfies a condition (no repeats).\n2. Core trick: keep a window between a left and right pointer, plus a set of what's currently inside it. Grow the window by moving right; if you'd add a character that's already inside, shrink from the left until that duplicate is gone.\n3. Move right one step at a time, adding the new character to your window's tracking set.\n4. If that character is already in the window, keep moving left forward (removing characters from the set) until the duplicate is gone.\n5. After fixing the window, record its size (right - left + 1) if it's the best one so far.\n6. Edge case: a string of one repeated character, like \"bbbbb\", should keep shrinking the window down to size 1 — trace through it to make sure your left pointer doesn't get stuck.",
"dryRun": {
"input": "s = \"abcabcbb\"",
"frames": [
"right=0..2: add 'a','b','c' one by one, none repeat. Window is 'abc', maxLen=3.",
"right=3, char='a'. Already in the window! Shrink: remove s[left=0]='a', left→1. Now 'a' is gone, stop shrinking. Add 'a' back. Window='bca', maxLen stays 3.",
"right=4, char='b'. Already in the window. Shrink: remove s[left=1]='b', left→2. Add 'b'. Window='cab', maxLen stays 3.",
"right=5, char='c'. Already in the window. Shrink: remove s[left=2]='c', left→3. Add 'c'. Window='abc', maxLen stays 3.",
"right=6,7: char='b' repeats each time, the window keeps shrinking to remove it, so window size never exceeds 3 again."
],
"result": "return 3 (longest is \"abc\")"
},
"pitfalls": [
"An empty string should return 0.",
"A string with all the same character, like \"bbbbb\", should shrink the window down to size 1 repeatedly.",
"The shrink loop must keep removing from the left until the exact duplicate is gone, not just shrink once.",
"Update maxLen after fixing the window each time, not before."
],
"patternTakeaway": "If you need the longest or shortest substring or subarray that meets some condition, always think: sliding window that grows on the right and shrinks on the left when the condition breaks.",
"pattern": "Sliding Window"
},
{
"id": "algo-cat3-q3",
"guide": "Algorithms Guide",
"topic": "Sliding Window",
"topicNum": 3,
"level": "Medium",
"badge": "[Medium]  LeetCode #424  Pattern: Sliding Window | Asked at: Google, Amazon | Time: O(n)  Space: O(1)",
"question": "Longest Repeating Character Replacement",
"explanation": "Problem: You get a string s and a number k. You are allowed to change up to k characters to any other letter. Find the length of the longest part of the string that can become all the same letter after these changes.\nExample: s = \"ABAB\", k = 2 → 4 (change the 2 'A's to get \"BBBB\").\n\nApproach: Use a sliding window. Keep a count of how many times each letter appears inside the window. A window is valid if (window size minus the count of its most common letter) is less than or equal to k — that number tells you how many letters you would need to change. When the window becomes invalid, shrink it from the left. Keep track of the biggest valid window size.",
"code": "function characterReplacement(s, k) {\n  const counts = {};\n  let left = 0;\n  let maxCount = 0;\n  let maxLen = 0;\n  \n  for (let right = 0; right < s.length; right++) {\n    counts[s[right]] = (counts[s[right]] || 0) + 1;\n    maxCount = Math.max(maxCount, counts[s[right]]);\n    \n    // Window size - max char count = chars to replace\n    while ((right - left + 1) - maxCount > k) {\n      counts[s[left]]--;\n      left++;\n    }\n    \n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  \n  return maxLen;\n}\n \ncharacterReplacement('ABAB', 2);    // 4\ncharacterReplacement('AABABBA', 1); // 4",
"howTo": "1. \"Longest substring of the same letter, allowed up to k replacements\" is a sliding window problem where a window is \"valid\" as long as you don't need to replace more than k characters.\n2. Core trick: in any window, the replacements needed equal the window size minus the count of its most common letter. If that number is bigger than k, the window is invalid and must shrink.\n3. Expand the window one character to the right at a time, updating your letter counts and the highest single-letter count seen in the current window.\n4. Check if (window size - highest count) is greater than k. If so, shrink from the left, lowering that letter's count, until the window is valid again.\n5. After adjusting, compare the current window size to your best answer so far.\n6. Edge case: your \"highest count\" tracker can go slightly stale as you shrink the window — that's fine, it never makes a valid window look invalid, so you don't need to recompute it every single time.",
"dryRun": {
"input": "s = \"AABABBA\", k = 1",
"frames": [
"right=0..3: add A,A,B,A. counts={A:3,B:1}, maxCount=3. Window size 4, replacements needed = 4-3=1 ≤ k(1). Valid! maxLen=4.",
"right=4, char='B'. counts={A:3,B:2}, maxCount stays 3. Window size 5, needs 5-3=2 > k(1). Shrink: remove s[left=0]='A', left→1. Window size now 4, needs 1 ≤ 1. Valid again.",
"right=5, char='B'. Window grows to size 5 again, needs 2>1. Shrink: remove s[left=1]='A', left→2. Window size 4, needs 1≤1. Valid.",
"right=6, char='A'. Window grows to 5 again, needs 2>1. Shrink: remove s[left=2]='B', left→3. Window size 4, needs 1≤1. Valid. maxLen stays 4."
],
"result": "return 4"
},
"pitfalls": [
"maxCount is never decreased during shrinking — that's fine, it can only make a window look invalid a little later than it should, never invalid too early, so the final answer stays correct.",
"k=0 means no replacements are allowed — the answer is just the longest run of one repeated character.",
"Window size minus maxCount is the number of characters you'd need to replace — don't confuse it with something else.",
"A string shorter than or equal to k+1 characters is trivially valid as one whole window."
],
"patternTakeaway": "If you can change up to k elements and need the longest window that stays valid, always think: sliding window tracking the count of the most frequent element inside it.",
"pattern": "Sliding Window"
},
{
"id": "algo-cat3-q4",
"guide": "Algorithms Guide",
"topic": "Sliding Window",
"topicNum": 3,
"level": "Medium",
"badge": "[Medium]  LeetCode #567  Pattern: Sliding Window | Asked at: Microsoft, LinkedIn | Time: O(n)  Space: O(1)",
"question": "Permutation in String",
"explanation": "Problem: You get two strings, s1 and s2. Check if s2 contains any rearrangement, a permutation, of s1's letters sitting next to each other.\nExample: s1 = \"ab\", s2 = \"eidbaooo\" → true, because \"ba\" inside s2 uses the same letters as \"ab\".\n\nApproach: Use a sliding window with a fixed size, equal to the length of s1, moving across s2. Count the letters in s1. For each window in s2 of that same size, count its letters and compare to s1's counts. Instead of recounting the whole window every time, just add the new character coming in on the right and remove the old character leaving on the left.",
"code": "function checkInclusion(s1, s2) {\n  if (s1.length > s2.length) return false;\n  \n  const need = new Array(26).fill(0);\n  const have = new Array(26).fill(0);\n  \n  // Initial counts\n  for (let i = 0; i < s1.length; i++) {\n    need[s1.charCodeAt(i) - 97]++;\n    have[s2.charCodeAt(i) - 97]++;\n  }\n  \n  if (arraysEqual(need, have)) return true;\n  \n  // Slide window\n  for (let i = s1.length; i < s2.length; i++) {\n    have[s2.charCodeAt(i) - 97]++;             // add new\n    have[s2.charCodeAt(i - s1.length) - 97]--; // remove old\n    \n    if (arraysEqual(need, have)) return true;\n  }\n  \n  return false;\n}\n \nfunction arraysEqual(a, b) {\n  for (let i = 0; i < a.length; i++) {\n    if (a[i] !== b[i]) return false;\n  }\n  return true;\n}\n \ncheckInclusion('ab', 'eidbaooo');  // true\ncheckInclusion('ab', 'eidboaoo');  // false",
"howTo": "1. \"Does this string contain a permutation of a smaller pattern\" means you're checking a fixed-size chunk at every position — that fixed size (matching the pattern's length) is the clue for a fixed-size sliding window, not a growing or shrinking one.\n2. Core trick: a permutation just means \"same letters, same counts, any order\" — so instead of checking actual orderings, keep a running letter-count for the current window and compare it to the pattern's letter-count.\n3. Count the letters in the pattern once, and count the letters in the first window of the same size inside the bigger string.\n4. Compare the two counts — if they match, you found a permutation.\n5. Slide the window one step at a time: add the new character entering on the right, remove the one leaving on the left, then compare counts again.\n6. Edge case: if the pattern is longer than the string you're searching, it can never fit — return false immediately without starting the window.",
"dryRun": {
"input": "s1 = \"ab\", s2 = \"eidbaooo\"",
"frames": [
"Count s1='ab': need={a:1,b:1}. First window s2[0:2]='ei': have={e:1,i:1}. Not equal.",
"Slide: add s2[2]='d', remove s2[0]='e'. Window='id': have={i:1,d:1}. Not equal.",
"Slide: add s2[3]='b', remove s2[1]='i'. Window='db': have={d:1,b:1}. Not equal.",
"Slide: add s2[4]='a', remove s2[2]='d'. Window='ba': have={b:1,a:1}. Matches need!"
],
"result": "return true (found permutation \"ba\" at s2[3:5])"
},
"pitfalls": [
"If s1 is longer than s2, return false immediately — no window can fit.",
"Compare the full letter-count arrays or maps, not just check if some letters overlap.",
"Every slide, remember to both add the new right character and remove the old left character — forgetting one breaks the counts.",
"Check the very first window before starting the slide loop — don't skip it."
],
"patternTakeaway": "If you need to find whether a fixed-size pattern, same letters in any order, appears somewhere inside a longer string, always think: fixed-size sliding window comparing character counts.",
"pattern": "Sliding Window"
},
{
"id": "algo-cat3-q5",
"guide": "Algorithms Guide",
"topic": "Sliding Window",
"topicNum": 3,
"level": "Hard",
"badge": "[Hard]  LeetCode #76  Pattern: Sliding Window | Asked at: Meta, Amazon, LinkedIn, Goldman Sachs | Time: O(n)  Space: O(k)",
"question": "Minimum Window Substring",
"explanation": "Problem: You get two strings, s and t. Find the shortest part of s that contains every character of t, including repeated characters. If there is no such part, return an empty string.\nExample: s = \"ADOBECODEBANC\", t = \"ABC\" → answer \"BANC\".\n\nApproach: Use a sliding window with character counts. First, count how many of each character t needs. Grow the window on the right until it contains everything t needs. Then shrink the window from the left as much as possible while it still contains everything, updating your best (shortest) answer each time. Keep a \"matches\" counter so you can check in O(1) time whether the window is currently valid, instead of recomputing counts every time.",
"code": "function minWindow(s, t) {\n  if (t.length > s.length) return '';\n  \n  const need = new Map();\n  for (const char of t) {\n    need.set(char, (need.get(char) || 0) + 1);\n  }\n  \n  const have = new Map();\n  let matches = 0;\n  const required = need.size;\n  let left = 0;\n  let minLen = Infinity;\n  let minStart = 0;\n  \n  for (let right = 0; right < s.length; right++) {\n    const char = s[right];\n    have.set(char, (have.get(char) || 0) + 1);\n    \n    if (need.has(char) && have.get(char) === need.get(char)) {\n      matches++;\n    }\n    \n    // Shrink while valid\n    while (matches === required) {\n      if (right - left + 1 < minLen) {\n        minLen = right - left + 1;\n        minStart = left;\n      }\n      \n      const leftChar = s[left];\n      have.set(leftChar, have.get(leftChar) - 1);\n      if (need.has(leftChar) && have.get(leftChar) < need.get(leftChar)) {\n        matches--;\n      }\n      left++;\n    }\n  }\n  \n  return minLen === Infinity ? '' : s.substring(minStart, minStart + minLen);\n}\n \nminWindow('ADOBECODEBANC', 'ABC'); // \"BANC\"\nminWindow('a', 'a');                // \"a\"\nminWindow('a', 'aa');               // \"\"",
"howTo": "1. \"Smallest window that contains all characters of another string\" is a sliding window problem where you first grow the window until it's valid, then shrink it as much as possible while staying valid — that grow-then-shrink pattern is the key move.\n2. Core trick: keep a target count of what you need, plus a running count of what your window currently has, and track how many distinct required characters currently have \"enough\" copies, so you can check validity in O(1) time.\n3. Expand right one step at a time, updating your \"have\" counts, and bump your \"matches\" counter whenever a needed character reaches exactly the count it needs.\n4. When matches equals the number of distinct characters needed, the window is valid — record it if it's the smallest found so far, then try shrinking from the left to make it even smaller.\n5. While shrinking, if removing the leftmost character drops it below what's needed, matches goes down and you stop shrinking, then go back to expanding right.\n6. Edge case: if the pattern is longer than the source string, or the source never contains all needed characters, return an empty string rather than crashing or returning a partial window.",
"dryRun": {
"input": "s = \"ADOBECODEBANC\", t = \"ABC\"",
"frames": [
"Need: A=1,B=1,C=1 (3 distinct letters required). Expand right until all matched: by right=5 (window 'ADOBEC'), matches=3 — valid! Record minLen=6 (start=0).",
"Shrink from left: remove 'A' at left=0, matches drops to 2 (A now missing). Stop shrinking, go back to expanding.",
"Expand until right=10 ('A' again), matches=3 — valid again. Shrink from left=1: removing D, O, B, E in turn keeps window sizes 9,8,7,6 — none smaller than the 6 already found.",
"At left=5, removing 'C' finally breaks validity (matches→2). Stop shrinking, go back to expanding.",
"Expand to right=12 ('C'), matches=3 again — valid. Shrink: skip O,D (not needed) — window size drops to 5, then 4 at start=9 ('BANC') — new best! Removing 'B' next breaks validity, stop."
],
"result": "return \"BANC\" (minLen=4, start=9)"
},
"pitfalls": [
"Return an empty string \"\" if no valid window ever forms, not undefined or null.",
"\"matches\" counts distinct required characters that are fully satisfied, not the total character count — don't mix the two up.",
"When shrinking, only decrement matches if removing a needed character drops its count below what's required, not just below 1.",
"t can have duplicate characters, like \"AABC\" — the need map must count them, so a valid window needs enough of each."
],
"patternTakeaway": "If you need the smallest window containing all of some target set of characters, always think: sliding window that expands until valid, then shrinks as much as possible while staying valid.",
"pattern": "Sliding Window"
},
{
"id": "algo-cat3-q6",
"guide": "Algorithms Guide",
"topic": "Sliding Window",
"topicNum": 3,
"level": "Hard",
"badge": "[Hard]  LeetCode #239  Pattern: Sliding Window + Deque (Monotonic) | Asked at: Amazon, Google, Meta | Time: O(n)  Space: O(k)",
"question": "Sliding Window Maximum",
"explanation": "Problem: You get an array and a window size k. For every window of size k as it slides across the array, return the maximum value inside that window.\nExample: nums = [1,3,-1,-3,5,3,6,7], k = 3 → answer [3,3,5,5,6,7].\n\nApproach: Use a monotonic deque — a double-ended queue kept sorted from biggest to smallest. Store indices, not values. For each new number: first remove indices from the front that have fallen outside the current window. Then remove indices from the back whose values are smaller than the new number, since they can never be the maximum anymore. Add the new index to the back. The front of the deque is always the maximum of the current window. Each index is added and removed at most once, so this runs in O(n) time.",
"code": "function maxSlidingWindow(nums, k) {\n  const result = [];\n  const deque = []; // stores INDICES, monotonic decreasing values\n  \n  for (let i = 0; i < nums.length; i++) {\n    // 1. Remove indices outside window\n    while (deque.length > 0 && deque[0] < i - k + 1) {\n      deque.shift();\n    }\n    \n    // 2. Remove smaller values from back\n    while (deque.length > 0 && nums[deque[deque.length - 1]] < nums[i]) {\n      deque.pop();\n    }\n    \n    // 3. Add current\n    deque.push(i);\n    \n    // 4. Once we have full window, record max\n    if (i >= k - 1) {\n      result.push(nums[deque[0]]);\n    }\n  }\n  \n  return result;\n}\n \nmaxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3);\n// [3, 3, 5, 5, 6, 7]\n \nmaxSlidingWindow([1], 1); // [1]",
"howTo": "1. \"Return the max of every window of size k as it slides\" is sliding window, but plain counting won't get you the max fast enough — that's the clue for a monotonic deque, a double-ended queue kept sorted from biggest to smallest.\n2. Core trick: the deque only holds \"candidates that could still become the max.\" Any number smaller than a number to its right can never be the max of a window containing both, so you throw it away immediately.\n3. Store indices, not values, in the deque, from front to back, in decreasing order of their values.\n4. Before adding a new index, remove indices from the back of the deque whose value is smaller than the new value — they're now useless.\n5. Then remove from the front any index that has fallen outside the current window.\n6. Edge case: the front of the deque is always the current max, but only start recording answers once your window has grown to full size k.",
"dryRun": {
"input": "nums = [1,3,-1,-3,5,3,6,7], k = 3",
"frames": [
"i=0,1,2: build the first window [1,3,-1]. The deque keeps only useful candidates: 1 gets popped when 3 arrives (1<3, useless). Deque=[idx1(3), idx2(-1)]. Window full at i=2, front=3 → max=3.",
"i=3, num=-3: idx1 still inside the window, and -3 doesn't beat -1 at the back, so it's just appended. Deque=[1,2,3]. Front still idx1(3) → max=3.",
"i=4, num=5: idx1 falls outside the window (i-k+1=2), remove from the front. Then pop -3 and -1 from the back since 5 is bigger than both. Deque=[4]. Front=idx4(5) → max=5.",
"i=5, num=3: 3 doesn't beat 5, so just append. Deque=[4,5]. Front still idx4(5) → max=5.",
"i=6, num=6: pop idx5(3) and idx4(5) from the back since 6 is bigger than both. Deque=[6]. Front=idx6(6) → max=6.",
"i=7, num=7: pop idx6(6) from the back. Deque=[7]. Front=idx7(7) → max=7."
],
"result": "return [3,3,5,5,6,7]"
},
"pitfalls": [
"Store indices in the deque, not values — you need indices to check whether they've fallen outside the window.",
"Remove from the front only when the index is outside the window (index < i-k+1), and check this before adding the new index.",
"Remove from the back whenever the new value is bigger — even equal values can be popped, since an equal or bigger later value makes the earlier one useless.",
"Don't start recording results until the window has grown to full size k, meaning i >= k-1."
],
"patternTakeaway": "If you need the max or min of every sliding window efficiently, always think: monotonic deque that keeps only the indices which could still become the answer.",
"pattern": "Sliding Window"
},
{
"id": "algo-cat4-q1",
"guide": "Algorithms Guide",
"topic": "Stack",
"topicNum": 4,
"level": "Easy",
"badge": "[Easy]  LeetCode #20  Pattern: Stack | Asked at: Google, Amazon, Meta, Microsoft, Bloomberg | Time: O(n)  Space: O(n)",
"question": "Valid Parentheses",
"explanation": "You get a string that has only these characters: ( ) [ ] { }. Check if the brackets are valid. Valid means every opening bracket has a matching closing bracket, in the right order.\nExample: \"()\" is valid.\nExample: \"()[]{}\" is valid.\nExample: \"(]\" is not valid — the ( is closed by the wrong bracket.\nExample: \"([)]\" is not valid — the brackets close in the wrong order.\n\nHow to solve it: Use a stack. A stack is like a pile of plates — you can only add or remove from the top.\nWhen you see an opening bracket, push it onto the stack.\nWhen you see a closing bracket, look at the top of the stack. It must be the matching opening bracket. If it matches, pop it off. If it does not match, the string is invalid.\nAt the end, the stack must be empty. If something is still on the stack, some bracket was never closed.",
"code": "function isValid(s) {\n  const stack = [];\n  const pairs = {\n    ')': '(',\n    ']': '[',\n    '}': '{'\n  };\n  \n  for (const char of s) {\n    if (char === '(' || char === '[' || char === '{') {\n      stack.push(char);\n    } else if (char in pairs) {\n      if (stack.pop() !== pairs[char]) return false;\n    }\n  }\n  \n  return stack.length === 0;\n}\n \nisValid('()');       // true\nisValid('()[]{}');   // true\nisValid('(]');       // false\nisValid('([)]');     // false\nisValid('{[]}');     // true",
"howTo": "1. The word \"valid\" plus brackets that must match and nest correctly is a big signal for a stack -- you always need to know the most recent unclosed bracket.\n2. Think of it like a pile of open boxes: every time you open one, put it on top. When you close one, it must match the box on top of the pile.\n3. Walk through the string one character at a time. If it's an opening bracket, push it. If it's a closing bracket, check the top of the stack -- if it matches the right opening bracket, pop it; if not, the string is invalid right away.\n4. Use a small map like ')' -> '(' so you can check matches in one line instead of a pile of if-statements.\n5. At the end, the stack must be completely empty. Leftover unmatched opening brackets mean it's invalid.\n6. Watch the edge case: a closing bracket showing up when the stack is already empty -- that must also return false.",
"dryRun": {
"input": "s = \"([)]\"",
"frames": [
"char='(' — opening bracket, push it. stack=['(']",
"char='[' — opening bracket, push it. stack=['(', '[']",
"char=')' — closing bracket. It must match '('. Pop the top of the stack: we get '['. '[' does not match '(' — mismatch!",
"Return false right away, no need to keep going."
],
"result": "return false"
},
"pitfalls": [
"Empty string should return true — empty stack, nothing to check",
"A closing bracket appearing when the stack is empty must return false immediately — never pop from an empty stack",
"A string with only opening brackets like \"(((\" must return false, because the stack is not empty at the end",
"Matching bracket TYPES is not enough — the ORDER matters too, like in \"([)]\""
],
"patternTakeaway": "If you see brackets, tags, or any pair of open/close symbols that must match the most recent unmatched one, always think: a stack — push opens, pop and compare on close.",
"pattern": "Stack & Queue"
},
{
"id": "algo-cat4-q2",
"guide": "Algorithms Guide",
"topic": "Stack",
"topicNum": 4,
"level": "Medium",
"badge": "[Medium]  LeetCode #155  Pattern: Stack Design | Asked at: Amazon, Google, Bloomberg | Time: O(1) all ops  Space: O(n)",
"question": "Min Stack",
"explanation": "Build a stack that supports 4 operations, and every operation must run in O(1) time (very fast, no matter how big the stack is):\npush(value) — add a value.\npop() — remove the top value.\ntop() — look at the top value.\ngetMin() — return the smallest value currently in the stack.\n\nExample: push -2, push 0, push -3. Now getMin() returns -3. After pop(), top() returns 0, and getMin() returns -2.\n\nHow to solve it: Use two stacks.\nThe first stack (main) holds the real values, just like a normal stack.\nThe second stack (minStack) holds the smallest value seen so far, at each point in time.\nWhen you push a new value, also push the smaller of (new value, current minimum) onto minStack.\nWhen you pop, pop from both stacks together, so they always stay the same size.",
"code": "class MinStack {\n  constructor() {\n    this.stack = [];\n    this.minStack = [];\n  }\n  \n  push(val) {\n    this.stack.push(val);\n    \n    const currentMin = this.minStack.length === 0 \n      ? val \n      : Math.min(val, this.minStack[this.minStack.length - 1]);\n    this.minStack.push(currentMin);\n  }\n  \n  pop() {\n    this.stack.pop();\n    this.minStack.pop();\n  }\n  \n  top() {\n    return this.stack[this.stack.length - 1];\n  }\n  \n  getMin() {\n    return this.minStack[this.minStack.length - 1];\n  }\n}\n \nconst ms = new MinStack();\nms.push(-2); ms.push(0); ms.push(-3);\nms.getMin(); // -3\nms.pop();\nms.top();    // 0\nms.getMin(); // -2",
"howTo": "1. The requirement \"getMin in O(1)\" is the clue -- a normal stack can't tell you the minimum instantly, so you need to track it as you go, not recompute it each time.\n2. The trick: keep a second stack that remembers what the minimum was at each point in time, like a shadow of the main stack.\n3. Build two stacks: one holds the real values, the other holds the minimum-so-far for every push.\n4. When you push a new value, also push the smaller of (new value, current minimum) onto the min stack.\n5. When you pop, pop from both stacks together so they always stay in sync.\n6. Common mistake: forgetting to pop from the min stack too, or using one running minimum variable instead of a full stack -- that breaks once you pop below where the minimum changed.",
"dryRun": {
"input": "push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()",
"frames": [
"push(-2): stack=[-2], minStack=[-2] (min so far is -2)",
"push(0): stack=[-2,0], minStack=[-2,-2] (min(0,-2) is still -2)",
"push(-3): stack=[-2,0,-3], minStack=[-2,-2,-3] (min(-3,-2) is now -3)",
"getMin() reads the top of minStack: -3",
"pop(): removes from BOTH stacks. stack=[-2,0], minStack=[-2,-2]",
"top() reads the top of stack: 0. getMin() reads the top of minStack: -2"
],
"result": "getMin() → -3, then top() → 0, then getMin() → -2"
},
"pitfalls": [
"Forgetting to pop from minStack when you pop from the main stack — they must always stay in sync",
"Using one single \"current min\" variable instead of a second stack — this breaks once you pop past the point where the min changed",
"Pushing a value onto minStack even when it's not a new minimum — you always push something (the smaller of new value vs current min) so both stacks stay the same length",
"Calling getMin() or top() on an empty stack — worth checking what the expected behavior is"
],
"patternTakeaway": "If you need an operation like getMin/getMax done in O(1) on a stack that keeps changing, always think: keep a second shadow stack that tracks that value at every level.",
"pattern": "Stack & Queue"
},
{
"id": "algo-cat4-q3",
"guide": "Algorithms Guide",
"topic": "Stack",
"topicNum": 4,
"level": "Medium",
"badge": "[Medium]  LeetCode #150  Pattern: Stack | Asked at: Amazon, LinkedIn, Yandex | Time: O(n)  Space: O(n)",
"question": "Evaluate Reverse Polish Notation",
"explanation": "You get a math expression written in Reverse Polish Notation (also called postfix). This means the operator comes AFTER its two numbers, not between them. The operators are +, -, *, /.\nExample: [\"2\",\"1\",\"+\",\"3\",\"*\"] means (2+1)*3 = 9.\nExample: [\"10\",\"6\",\"9\",\"3\",\"+\",\"-11\",\"*\",\"/\",\"*\",\"17\",\"+\",\"5\",\"+\"] = 22.\n\nHow to solve it: Use a stack.\nGo through the tokens one by one.\nIf a token is a number, push it onto the stack.\nIf a token is an operator, pop the two most recent numbers off the stack, apply the operator, and push the result back.\nBe careful with order: for - and /, the second number you pop is the LEFT side of the operation.\nDivision should cut off the decimal part toward zero (truncate), not round down.",
"code": "function evalRPN(tokens) {\n  const stack = [];\n  const operators = {\n    '+': (a, b) => a + b,\n    '-': (a, b) => a - b,\n    '*': (a, b) => a * b,\n    '/': (a, b) => Math.trunc(a / b), // truncate toward zero\n  };\n  \n  for (const token of tokens) {\n    if (token in operators) {\n      const b = stack.pop();\n      const a = stack.pop();\n      stack.push(operators[token](a, b));\n    } else {\n      stack.push(parseInt(token, 10));\n    }\n  }\n  \n  return stack[0];\n}\n \nevalRPN(['2', '1', '+', '3', '*']); // 9\nevalRPN(['4', '13', '5', '/', '+']); // 6 (4 + (13/5))\nevalRPN(['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+']); // 22",
"howTo": "1. Numbers followed later by an operator that acts on \"the last two things you saw\" is the clue for a stack -- postfix notation is built exactly around that idea.\n2. Core trick: read tokens left to right. Numbers go onto the stack. When you hit an operator, it always applies to the two most recent numbers.\n3. Loop through tokens: if it's a number, push it. If it's an operator, pop two values off the stack, apply the operator, and push the result back.\n4. Pay attention to order: the second value you pop is the left side of the operation, the first one you pop is the right side. This matters for minus and divide.\n5. When the loop ends, the single value left in the stack is your answer.\n6. Edge case to check: division should truncate toward zero, not just floor -- that matters for negative numbers.",
"dryRun": {
"input": "tokens = [\"2\",\"1\",\"+\",\"3\",\"*\"]",
"frames": [
"token=\"2\" — a number, push it. stack=[2]",
"token=\"1\" — a number, push it. stack=[2, 1]",
"token=\"+\" — an operator. Pop b=1, pop a=2. Compute a+b=3. Push it back. stack=[3]",
"token=\"3\" — a number, push it. stack=[3, 3]",
"token=\"*\" — an operator. Pop b=3, pop a=3. Compute a*b=9. Push it back. stack=[9]"
],
"result": "return stack[0] = 9"
},
"pitfalls": [
"Order matters for minus and divide — the SECOND value you pop is the LEFT operand, the FIRST value you pop is the RIGHT operand",
"Division must truncate toward zero, not just floor — this matters for negative numbers (e.g. -7/2 should be -3, not -4)",
"Tokens can be negative numbers themselves (like \"-11\") — make sure your number check doesn't confuse a negative number with the \"-\" operator",
"The input is assumed to always be a valid RPN expression, so the stack should have exactly one value left at the end"
],
"patternTakeaway": "If you must process tokens left to right and combine the two most recent values, always think: a stack, and watch operand order for non-commutative operators like minus and divide.",
"pattern": "Stack & Queue"
},
{
"id": "algo-cat4-q4",
"guide": "Algorithms Guide",
"topic": "Stack",
"topicNum": 4,
"level": "Medium",
"badge": "[Medium]  LeetCode #22  Pattern: Stack / Backtracking | Asked at: Meta, Google, Amazon | Time: O(4^n / sqrt(n))  Space: O(n)",
"question": "Generate Parentheses",
"explanation": "You are given a number n. Generate every possible way to write n pairs of parentheses so that they are all correctly matched.\nExample: n = 3 gives [\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"].\n\nHow to solve it: Use backtracking. This means you build a string one character at a time, and go back to try a different choice whenever a path stops being useful.\nKeep two counters: how many '(' you have used (openCount), and how many ')' you have used (closeCount).\nYou may add '(' only if openCount is still less than n.\nYou may add ')' only if closeCount is still less than openCount — otherwise the string would become invalid.\nWhen the string reaches length 2n, it is a complete, valid answer — save it.",
"code": "function generateParenthesis(n) {\n  const result = [];\n  \n  function backtrack(current, openCount, closeCount) {\n    if (current.length === 2 * n) {\n      result.push(current);\n      return;\n    }\n    \n    // Add ( if we still have some\n    if (openCount < n) {\n      backtrack(current + '(', openCount + 1, closeCount);\n    }\n    \n    // Add ) only if it would still be valid\n    if (closeCount < openCount) {\n      backtrack(current + ')', openCount, closeCount + 1);\n    }\n  }\n  \n  backtrack('', 0, 0);\n  return result;\n}\n \ngenerateParenthesis(3);\n// [\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]\n \ngenerateParenthesis(1); // [\"()\"]",
"howTo": "1. \"Generate all valid combinations\" is a signal for backtracking (trying choices and undoing them), not a stack or a formula -- you build strings piece by piece and abandon bad paths early.\n2. Core trick: instead of building a string and checking validity at the end, only add a character if it keeps the string on track to be valid, so you never waste time on dead ends.\n3. Track two counters as you build: how many \"(\" you've used and how many \")\" you've used.\n4. At each step, you can add \"(\" if you haven't used all n of them yet, and you can add \")\" only if fewer \")\" have been used than \"(\" so far.\n5. When your string reaches length 2n, it's a complete valid combination -- save it.\n6. Common mistake: allowing a \")\" when closeCount equals openCount -- that would create an unmatched closing bracket, so always keep that guard.",
"dryRun": {
"input": "n = 2",
"frames": [
"current=\"\", open=0, close=0. open(0) < n(2), so add '(' → current=\"(\"",
"current=\"(\", open=1, close=0. open(1) < n(2), so add '(' again → current=\"((\", open=2",
"current=\"((\", open=2, close=0. Can't add '(' anymore (open=n). close(0)<open(2), so add ')' twice → current=\"(())\", length=4 → save \"(())\"",
"Backtrack up to current=\"(\", open=1, close=0. Now try ')' instead: close(0)<open(1) → current=\"()\", open=1, close=1",
"current=\"()\", add '(' → \"()(\", open=2. Then add ')' → \"()()\", length=4 → save \"()()\""
],
"result": "[\"(())\", \"()()\"]"
},
"pitfalls": [
"Allowing a ')' when closeCount equals openCount creates an unmatched closing bracket — always guard with closeCount < openCount",
"Forgetting to stop adding '(' once openCount reaches n",
"n = 0 should return an empty result or [\"\"] depending on the exact spec — check what's expected before assuming",
"It's easy to think this needs a stack, but it actually needs backtracking (trying and undoing choices), since you must generate every valid combination"
],
"patternTakeaway": "If you need to generate all valid combinations built step by step, where some choices can make the rest of the string invalid, always think: backtracking, and skip illegal choices before making them.",
"pattern": "Stack & Queue"
},
{
"id": "algo-cat4-q5",
"guide": "Algorithms Guide",
"topic": "Stack",
"topicNum": 4,
"level": "Medium",
"badge": "[Medium]  LeetCode #739  Pattern: Monotonic Stack | Asked at: Meta, Amazon, Google | Time: O(n)  Space: O(n)",
"question": "Daily Temperatures",
"explanation": "You get a list of daily temperatures. For each day, find how many days you must wait until a warmer temperature comes. If no warmer day ever comes, the answer for that day is 0.\nExample: [73,74,75,71,69,72,76,73] gives [1,1,4,2,1,1,0,0].\n\nHow to solve it: Use a monotonic stack — a stack that only holds days whose answer is still unknown, kept so that temperatures get smaller as you go down the stack.\nGo through the days one by one.\nBefore moving to a new day, check the stack: while the current temperature is warmer than the temperature at the top of the stack, that older day now has its answer — pop it and set its answer to (current day's index − that day's index).\nThen push the current day's index onto the stack.\nAny day still left in the stack at the end never found a warmer day, so its answer stays 0.",
"code": "function dailyTemperatures(temperatures) {\n  const result = new Array(temperatures.length).fill(0);\n  const stack = []; // indices\n  \n  for (let i = 0; i < temperatures.length; i++) {\n    // While current temp is warmer than stack top\n    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {\n      const prevIndex = stack.pop();\n      result[prevIndex] = i - prevIndex;\n    }\n    stack.push(i);\n  }\n  \n  return result;\n}\n \ndailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]);\n// [1, 1, 4, 2, 1, 1, 0, 0]\n \ndailyTemperatures([30, 40, 50, 60]); // [1, 1, 1, 0]\ndailyTemperatures([30, 60, 90]);     // [1, 1, 0]",
"howTo": "1. \"Days until a warmer day\" for every element is the clue for a stack -- you need to remember unresolved past values until something bigger comes along to resolve them.\n2. Core trick: keep a stack of indices whose answer you don't know yet, kept so temperatures get smaller as you go down the stack (a \"monotonic\" stack).\n3. Walk through the days one by one. Before pushing the current day, check the top of the stack: if the current temperature is warmer than the day at the top, that older day now has its answer -- pop it and set its result to today's index minus its index.\n4. Keep popping like that as long as the current temperature beats the stack's top, then push today's index.\n5. Days left in the stack at the end never found a warmer day, so their answer stays 0.\n6. Mistake to avoid: storing temperatures in the stack instead of indices -- you need the index to compute the day-gap for the answer.",
"dryRun": {
"input": "temperatures = [73, 71, 69, 72, 76]",
"frames": [
"i=0, temp=73. Stack is empty, nothing to pop. Push index 0. stack=[0]",
"i=1, temp=71. Not warmer than top's temp (73), so no pop. Push index 1. stack=[0,1]",
"i=2, temp=69. Not warmer than top's temp (71). Push index 2. stack=[0,1,2]",
"i=3, temp=72. Warmer than top (69 at index2): pop it, answer[2]=3-2=1. Now top is 71 at index1: 72 is warmer too, pop it, answer[1]=3-1=2. Now top is 73 at index0: 72 is not warmer, stop popping. Push index 3. stack=[0,3]",
"i=4, temp=76. Warmer than top (72 at index3): pop it, answer[3]=4-3=1. Warmer than new top (73 at index0): pop it, answer[0]=4-0=4. Stack is empty, push index 4. stack=[4]"
],
"result": "[4, 2, 1, 1, 0] — index 4 never finds a warmer day, so it stays 0"
},
"pitfalls": [
"Store indices in the stack, not the temperatures themselves — you need the index to compute the day-gap for the answer",
"Days that never find a warmer day must stay 0 — pre-fill the result array with 0, don't leave anything undefined",
"Equal temperatures do NOT count as warmer — only a strictly greater temperature should trigger a pop",
"An empty temperatures array should just return an empty array"
],
"patternTakeaway": "If you need to find, for each element, the next element that is bigger (or smaller) than it, always think: a monotonic stack of indices.",
"pattern": "Stack & Queue"
},
{
"id": "algo-cat4-q6",
"guide": "Algorithms Guide",
"topic": "Stack",
"topicNum": 4,
"level": "Hard",
"badge": "[Hard]  LeetCode #84  Pattern: Monotonic Stack | Asked at: Amazon, Google, Microsoft | Time: O(n)  Space: O(n)",
"question": "Largest Rectangle in Histogram",
"explanation": "You get the heights of bars in a histogram (bar chart), where every bar has width 1. Find the area of the largest rectangle that fits inside the histogram.\nExample: heights = [2,1,5,6,2,3] gives 10 (using the bars of height 5 and 6, together making width 2).\n\nHow to solve it: Use a monotonic stack — a stack that only holds bars with increasing height, from bottom to top.\nGo through the bars one at a time. While the current bar is shorter than the bar at the top of the stack, that top bar can no longer grow to the right — pop it and compute the rectangle it could make.\nThe width of that rectangle is: current index − (new top of stack's index) − 1.\nThe height is the popped bar's own height. Multiply height by width for the area, and keep the biggest area seen.\nAt the very end, add a fake bar of height 0 so that any bars still left in the stack get popped and measured too.",
"code": "function largestRectangleArea(heights) {\n  const stack = []; // monotonic increasing indices\n  let maxArea = 0;\n  \n  for (let i = 0; i <= heights.length; i++) {\n    // Use 0 as sentinel at end to flush stack\n    const currentHeight = i === heights.length ? 0 : heights[i];\n    \n    while (stack.length > 0 && currentHeight < heights[stack[stack.length - 1]]) {\n      const height = heights[stack.pop()];\n      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;\n      maxArea = Math.max(maxArea, height * width);\n    }\n    \n    stack.push(i);\n  }\n  \n  return maxArea;\n}\n \nlargestRectangleArea([2, 1, 5, 6, 2, 3]); // 10\nlargestRectangleArea([2, 4]);              // 4\nlargestRectangleArea([1]);                  // 1",
"howTo": "1. \"Largest rectangle\" across bars of different heights is a strong sign for a monotonic stack -- for each bar you need to know how far it can stretch left and right before a shorter bar blocks it.\n2. Core trick: a bar's rectangle is only limited by the first shorter bar on its left and the first shorter bar on its right, so process bars left to right and pop from the stack whenever you find something shorter than what's stored.\n3. Keep a stack of indices with increasing heights. For each new bar, while it's shorter than the bar at the top of the stack, pop that bar and calculate the rectangle it could have made, using the new bar as its right boundary and whatever is now under it in the stack as its left boundary.\n4. Push the current index onto the stack after resolving anything taller.\n5. Add a fake bar of height 0 at the very end so any bars still sitting in the stack get flushed out and measured.\n6. Common mistake: getting the width formula wrong -- width is current index minus the new top of stack minus 1, not just the distance between two popped bars.",
"dryRun": {
"input": "heights = [2, 4]",
"frames": [
"i=0, height=2. Stack is empty, push index 0. stack=[0]",
"i=1, height=4. 4 is not less than heights[0]=2, so no pop. Push index 1. stack=[0,1]",
"i=2 (past the end — use a fake sentinel height of 0). 0 < heights[1]=4: pop index 1 (height 4). stack=[0]. Width = 2-0-1 = 1. Area = 4*1 = 4. maxArea=4",
"Still sentinel height 0 < heights[0]=2: pop index 0 (height 2). Stack is now empty, so width = i = 2. Area = 2*2 = 4. maxArea stays 4"
],
"result": "return maxArea = 4"
},
"pitfalls": [
"Width formula: when the stack still has something left after popping, width = current index − new top's index − 1, not just the gap between the popped bar and the current bar",
"When the stack becomes empty after popping, width equals the current index i (that popped bar could have extended all the way from index 0)",
"Add a sentinel bar of height 0 at the end (or run one extra loop step) so any bars still sitting in the stack get flushed out and measured",
"A single bar (array of length 1) should still return that bar's own height as the area"
],
"patternTakeaway": "If you need to find, for each bar, how far it can stretch before a shorter bar blocks it on both sides, always think: a monotonic increasing stack of indices.",
"pattern": "Stack & Queue"
},
{
"id": "algo-cat5-q1",
"guide": "Algorithms Guide",
"topic": "Binary Search",
"topicNum": 5,
"level": "Easy",
"badge": "[Easy]  LeetCode #704  Pattern: Binary Search | Asked at: Microsoft, Apple, Bloomberg | Time: O(log n)  Space: O(1)",
"question": "Binary Search",
"explanation": "You get a sorted array and a target number. Find the index of the target. If the target is not there, return -1. Your solution must run in O(log n) time, meaning it should not just check every element one by one.\nExample: nums = [-1,0,3,5,9,12], target = 9 → return 4.\nExample: nums = [-1,0,3,5,9,12], target = 2 → return -1.\n\nHow to solve it: This is classic binary search. Keep a left and a right boundary around the part of the array that might still contain the target.\nLook at the middle element. If it equals the target, you found it. If it is smaller than the target, move the left boundary past the middle. If it is bigger, move the right boundary before the middle.\nRepeat until you find the target or the boundaries cross.\nCompute mid as left + Math.floor((right − left) / 2) — this avoids a rare overflow bug in some languages.",
"code": "function search(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n  \n  while (left <= right) {\n    const mid = left + Math.floor((right - left) / 2);\n    \n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  \n  return -1;\n}\n \nsearch([-1, 0, 3, 5, 9, 12], 9); // 4\nsearch([-1, 0, 3, 5, 9, 12], 2); // -1\nsearch([5], 5);                   // 0\nsearch([5], -5);                  // -1",
"howTo": "1. \"Sorted array, find target, must be O(log n)\" is the textbook signal for binary search -- whenever the array is sorted, you can cut the search space in half instead of scanning it all.\n2. Core trick: at every step, look at the middle element. Since the array is sorted, you instantly know if the target is smaller (search left) or bigger (search right) -- you never need to check the other half.\n3. Keep a left and right boundary. While left is less than or equal to right, compute the middle.\n4. If the middle equals the target, you're done. If the middle is smaller than target, move left past the middle. If it's bigger, move right before the middle.\n5. If left ever crosses right, the target isn't in the array -- return -1.\n6. Watch this edge case: compute mid as left + (right - left) / 2, not (left + right) / 2, so it doesn't overflow on very large arrays -- a good habit even when it doesn't strictly matter in your language.",
"dryRun": {
"input": "nums = [-1,0,3,5,9,12], target = 5",
"frames": [
"left=0, right=5. mid=2, nums[2]=3. 3<5, so search the right half: left=mid+1=3",
"left=3, right=5. mid=4, nums[4]=9. 9>5, so search the left half: right=mid-1=3",
"left=3, right=3. mid=3, nums[3]=5. 5===5 — found it!"
],
"result": "return 3"
},
"pitfalls": [
"Compute mid as left + Math.floor((right-left)/2), not Math.floor((left+right)/2) — this is a good habit to avoid overflow-style bugs in other languages",
"Use left <= right (not <) as the loop condition, since you're looking for an exact match and both ends still need checking",
"An empty array should immediately return -1",
"When the target isn't in the array, make sure left eventually crosses right so the loop actually ends"
],
"patternTakeaway": "If the array is sorted and you need to find something fast, always think: binary search instead of scanning one by one.",
"pattern": "Sorting & Binary Search"
},
{
"id": "algo-cat5-q2",
"guide": "Algorithms Guide",
"topic": "Binary Search",
"topicNum": 5,
"level": "Medium",
"badge": "[Medium]  LeetCode #33  Pattern: Modified Binary Search | Asked at: Meta, Amazon, Google, Microsoft | Time: O(log n)  Space: O(1)",
"question": "Search in Rotated Sorted Array",
"explanation": "A sorted array was rotated (cut at some unknown point, and the two pieces were swapped). Find the target's index in O(log n) time. There are no duplicate values.\nExample: nums = [4,5,6,7,0,1,2], target = 0 → return 4.\nExample: nums = [4,5,6,7,0,1,2], target = 3 → return -1.\n\nHow to solve it: Use a modified binary search. Even though the whole array isn't sorted anymore, one half around the middle is always still sorted.\nAt each step, check which half is sorted — the left half (from left to mid) or the right half (from mid to right).\nThen check if the target could be inside that sorted half's range. If yes, search that half. If no, search the other half.\nKeep repeating until you find the target or run out of range.",
"code": "function search(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n  \n  while (left <= right) {\n    const mid = left + Math.floor((right - left) / 2);\n    \n    if (nums[mid] === target) return mid;\n    \n    // Left half is sorted\n    if (nums[left] <= nums[mid]) {\n      if (target >= nums[left] && target < nums[mid]) {\n        right = mid - 1;\n      } else {\n        left = mid + 1;\n      }\n    } \n    // Right half is sorted\n    else {\n      if (target > nums[mid] && target <= nums[right]) {\n        left = mid + 1;\n      } else {\n        right = mid - 1;\n      }\n    }\n  }\n  \n  return -1;\n}\n \nsearch([4, 5, 6, 7, 0, 1, 2], 0); // 4\nsearch([4, 5, 6, 7, 0, 1, 2], 3); // -1\nsearch([1], 0);                    // -1",
"howTo": "1. \"Sorted array, but rotated at some unknown point\" is the clue to reach for a modified binary search -- it's still O(log n), you just need one extra check before deciding which side to search.\n2. Core trick: even though the whole array isn't sorted anymore, one of the two halves around the middle is always perfectly sorted. Figure out which half is sorted first, then use normal sorted-array logic on that half.\n3. Compute mid as usual. If nums[left] <= nums[mid], the left half is sorted; otherwise the right half is sorted.\n4. If the left half is sorted, check if the target falls inside that sorted range -- if yes search left, if no search right. Do the mirror check when the right half is the sorted one.\n5. Keep narrowing left and right until you find the target or the range closes.\n6. Edge case to double check: use <= and >= carefully at the boundaries so you don't accidentally skip the target when it sits exactly on an edge value.",
"dryRun": {
"input": "nums = [4,5,6,7,0,1,2], target = 0",
"frames": [
"left=0, right=6. mid=3, nums[3]=7. Left side (nums[0]=4 to nums[3]=7) is sorted. Target 0 is not between 4 and 7, so search the right half: left=mid+1=4",
"left=4, right=6. mid=5, nums[5]=1. Left side (nums[4]=0 to nums[5]=1) is sorted. Target 0 IS between 0 and 1, so search there: right=mid-1=4",
"left=4, right=4. mid=4, nums[4]=0. Matches the target!"
],
"result": "return 4"
},
"pitfalls": [
"Duplicates are NOT allowed in this version — with duplicates, you can't always tell which half is sorted (that's a harder follow-up problem)",
"Use <= (not <) when comparing nums[left] and nums[mid], so it works correctly even with only 1-2 elements left",
"Get the boundary comparisons right (>= and < vs > and <=) so you don't skip the target when it sits exactly on an edge value",
"A single-element array should still work correctly"
],
"patternTakeaway": "If a sorted array has been rotated at an unknown point, always think: one half around the middle is still sorted — figure out which half, then binary search normally inside it.",
"pattern": "Sorting & Binary Search"
},
{
"id": "algo-cat5-q3",
"guide": "Algorithms Guide",
"topic": "Binary Search",
"topicNum": 5,
"level": "Medium",
"badge": "[Medium]  LeetCode #153  Pattern: Modified Binary Search | Asked at: Microsoft, Amazon, Bloomberg | Time: O(log n)  Space: O(1)",
"question": "Find Minimum in Rotated Sorted Array",
"explanation": "A sorted array was rotated at some unknown point. Find the smallest value in O(log n) time. There are no duplicate values.\nExample: [3,4,5,1,2] → 1.\nExample: [4,5,6,7,0,1,2] → 0.\n\nHow to solve it: Compare the middle value with the rightmost value.\nIf nums[mid] is bigger than nums[right], the smallest value must be somewhere to the right of mid, so move the left boundary to mid + 1.\nOtherwise, the smallest value is at mid or somewhere to its left, so move the right boundary to mid (keep mid included — it could be the answer).\nKeep going while left is less than right. When they meet, that position holds the minimum.",
"code": "function findMin(nums) {\n  let left = 0;\n  let right = nums.length - 1;\n  \n  while (left < right) {\n    const mid = left + Math.floor((right - left) / 2);\n    \n    if (nums[mid] > nums[right]) {\n      // Min is in right half\n      left = mid + 1;\n    } else {\n      // Min is in left half (including mid)\n      right = mid;\n    }\n  }\n  \n  return nums[left];\n}\n \nfindMin([3, 4, 5, 1, 2]);       // 1\nfindMin([4, 5, 6, 7, 0, 1, 2]); // 0\nfindMin([11, 13, 15, 17]);       // 11 (not rotated)",
"howTo": "1. Again \"rotated sorted array\" with an O(log n) requirement points to binary search -- but here you're hunting for the rotation point itself, not a specific value.\n2. Core trick: compare the middle element to the rightmost element. If mid is bigger than the rightmost, the smallest number must be to the right of mid. If mid is smaller or equal, the smallest number is at mid or to its left.\n3. Keep left and right pointers, loop while left < right (not <=, since you're closing in on one answer, not searching for a match).\n4. If nums[mid] > nums[right], the minimum is in the right half, so move left to mid + 1. Otherwise, the minimum is in the left half including mid itself, so move right to mid (don't exclude mid).\n5. When left equals right, that position holds the minimum.\n6. Common mistake: comparing nums[mid] to nums[left] instead of nums[right] -- comparing against the right edge is what correctly tells you which side is rotated.",
"dryRun": {
"input": "nums = [4,5,6,7,0,1,2]",
"frames": [
"left=0, right=6. mid=3, nums[3]=7. 7 > nums[right]=2, so the minimum is to the right: left=mid+1=4",
"left=4, right=6. mid=5, nums[5]=1. 1 is NOT greater than nums[right]=2, so the minimum is at mid or to its left: right=mid=5",
"left=4, right=5. mid=4, nums[4]=0. 0 is NOT greater than nums[right]=1, so right=mid=4",
"left=4, right=4. Loop stops since left is no longer less than right."
],
"result": "return nums[4] = 0"
},
"pitfalls": [
"Compare nums[mid] to nums[right], not nums[left] — comparing against the right edge is what correctly tells you which side is rotated",
"Use left < right as the loop condition (not <=), since you're closing in on one single answer, not matching a target value",
"When nums[mid] <= nums[right], keep mid IN the search range (right = mid, not mid - 1), because mid itself could be the minimum",
"If the array was never actually rotated, the algorithm should still correctly return the first element"
],
"patternTakeaway": "If you need to find the 'break point' or minimum in a rotated sorted array, always think: compare the middle to the right edge to decide which side still holds the minimum.",
"pattern": "Sorting & Binary Search"
},
{
"id": "algo-cat5-q4",
"guide": "Algorithms Guide",
"topic": "Binary Search",
"topicNum": 5,
"level": "Medium",
"badge": "[Medium]  LeetCode #74  Pattern: Binary Search 2D | Asked at: Amazon, Google, Microsoft | Time: O(log(m*n))  Space: O(1)",
"question": "Search a 2D Matrix",
"explanation": "Search for a target value inside an m x n matrix (a grid of numbers), where each row is sorted left to right, and the first number of each row is bigger than the last number of the row above it.\nExample:\n[[1,3,5,7],\n [10,11,16,20],\n [23,30,34,60]], target = 3 → true.\n\nHow to solve it: Because of the rules above, the whole matrix behaves like one long sorted list if you read it row by row.\nTreat it as one big virtual array of length rows × cols, and run a normal binary search over it.\nWhen you land on a middle index, convert it into a real (row, column) using row = Math.floor(mid / cols) and col = mid % cols.\nCompare that cell's value to the target and move the boundaries just like normal binary search.",
"code": "function searchMatrix(matrix, target) {\n  const rows = matrix.length;\n  const cols = matrix[0].length;\n  \n  let left = 0;\n  let right = rows * cols - 1;\n  \n  while (left <= right) {\n    const mid = left + Math.floor((right - left) / 2);\n    const r = Math.floor(mid / cols);\n    const c = mid % cols;\n    const val = matrix[r][c];\n    \n    if (val === target) return true;\n    if (val < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  \n  return false;\n}\n \nsearchMatrix([\n  [1, 3, 5, 7],\n  [10, 11, 16, 20],\n  [23, 30, 34, 60]\n], 3);  // true\n \nsearchMatrix([\n  [1, 3, 5, 7],\n  [10, 11, 16, 20],\n  [23, 30, 34, 60]\n], 13); // false",
"howTo": "1. \"Each row sorted, and each row starts bigger than the previous row ends\" is the clue that the whole matrix behaves like one long sorted list -- so you can binary search it directly instead of searching row by row.\n2. Core trick: pretend the 2D grid is flattened into a single 1D array of length rows times cols, and run a normal binary search over the imaginary indices 0 to rows*cols-1.\n3. When you land on a middle index, convert it back into a real (row, col) pair using row = index / cols (rounded down) and col = index % cols.\n4. Compare the value at that cell to the target just like normal binary search: too small, move the left boundary up; too big, move the right boundary down.\n5. Stop when you find the target, or when the boundaries cross (not found).\n6. Edge case: make sure the matrix isn't empty and every row has the same length before computing cols, otherwise the row/col math breaks.",
"dryRun": {
"input": "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3",
"frames": [
"left=0, right=11. mid=5 → row=1, col=1 → value=11. 11>3, so search left: right=mid-1=4",
"left=0, right=4. mid=2 → row=0, col=2 → value=5. 5>3, so right=mid-1=1",
"left=0, right=1. mid=0 → row=0, col=0 → value=1. 1<3, so left=mid+1=1",
"left=1, right=1. mid=1 → row=0, col=1 → value=3. Matches the target!"
],
"result": "return true"
},
"pitfalls": [
"This only works because each row's first value is bigger than the previous row's last value — if rows were just individually sorted without that rule, you'd need a different approach (like starting from a corner)",
"Converting a flat index back to (row, col) must use integer division for the row (Math.floor(mid/cols)) and modulo for the column (mid % cols)",
"Check for an empty matrix or empty rows before computing cols, to avoid errors",
"Don't confuse this with the 'staircase search' variant, where rows and columns are each sorted but rows don't connect to each other"
],
"patternTakeaway": "If a 2D grid is sorted in a way that makes it act like one long sorted line, always think: flatten it mentally and binary search the virtual 1D array.",
"pattern": "Sorting & Binary Search"
},
{
"id": "algo-cat5-q5",
"guide": "Algorithms Guide",
"topic": "Binary Search",
"topicNum": 5,
"level": "Medium",
"badge": "[Medium]  LeetCode #875  Pattern: Binary Search on Answer | Asked at: Google, Meta | Time: O(n log m)  Space: O(1)",
"question": "Koko Eating Bananas",
"explanation": "Koko has piles of bananas. She wants to eat all the bananas within h hours. Each hour, she picks one pile and eats up to k bananas from it (if the pile has fewer than k left, she just finishes that pile and stops for the hour). Find the smallest possible eating speed k so she finishes within h hours.\nExample: piles = [3,6,7,11], h = 8 → 4.\nExample: piles = [30,11,23,4,20], h = 5 → 30.\n\nHow to solve it: This is called 'binary search on the answer' — instead of searching inside the array, you search over possible speeds k.\nSearch the range from 1 to the biggest pile size.\nFor a candidate speed, calculate the total hours needed: for every pile, round pile / k UP to the nearest whole hour, and add them all together.\nIf the total hours fit within h, this speed works — try a smaller (slower) speed. If not, try a bigger (faster) speed.\nKeep narrowing until you find the smallest speed that still works.",
"code": "function minEatingSpeed(piles, h) {\n  let left = 1;\n  let right = Math.max(...piles);\n  \n  const hoursNeeded = (k) => {\n    let total = 0;\n    for (const pile of piles) {\n      total += Math.ceil(pile / k);\n    }\n    return total;\n  };\n  \n  while (left < right) {\n    const mid = left + Math.floor((right - left) / 2);\n    \n    if (hoursNeeded(mid) <= h) {\n      // mid works, try smaller\n      right = mid;\n    } else {\n      // mid too slow, try larger\n      left = mid + 1;\n    }\n  }\n  \n  return left;\n}\n \nminEatingSpeed([3, 6, 7, 11], 8);    // 4\nminEatingSpeed([30, 11, 23, 4, 20], 5);  // 30\nminEatingSpeed([30, 11, 23, 4, 20], 6);  // 23",
"howTo": "1. The clue here is subtle: you're not searching for a value in an array, you're searching for the smallest valid speed \"k\" -- whenever the question is really \"find the smallest (or largest) number that satisfies a condition,\" that's binary search on the answer, not on the array.\n2. Core trick: as k (bananas eaten per hour) increases, the number of hours needed only ever goes down -- that's a monotonic relationship, which is exactly what lets you binary search over possible answers.\n3. Set your search range from 1 (slowest possible) to the biggest pile (fastest anyone would ever need to go).\n4. For a candidate speed in the middle of that range, calculate the total hours needed (sum of ceil(pile / speed) for every pile).\n5. If that's within the allowed hours, this speed works, so try something slower (move right down). If it's too slow, this speed fails, so try faster (move left up).\n6. Common mistake: forgetting to round hours needed per pile UP (ceiling), not down -- Koko can't eat a fraction of a pile in one sitting, so any leftover still costs a full hour.",
"dryRun": {
"input": "piles = [3,6,7,11], h = 8",
"frames": [
"left=1, right=11. mid=6: hours needed = ceil(3/6)+ceil(6/6)+ceil(7/6)+ceil(11/6) = 1+1+2+2 = 6. Since 6<=8 (fast enough), try slower: right=mid=6",
"left=1, right=6. mid=3: hours needed = 1+2+3+4 = 10. Since 10>8 (too slow), try faster: left=mid+1=4",
"left=4, right=6. mid=5: hours needed = 1+2+2+3 = 8. Since 8<=8, try slower: right=mid=5",
"left=4, right=5. mid=4: hours needed = 1+2+2+3 = 8. Still fits, try slower: right=mid=4",
"left=4, right=4. Loop stops."
],
"result": "return left = 4"
},
"pitfalls": [
"Always round hours per pile UP with Math.ceil, never down — Koko can't finish a partial pile in less than a full hour",
"Search range must start at 1 (not 0), since eating speed 0 means she never finishes",
"The upper bound should be the largest pile size — any faster speed is wasted, since one pile takes at most 1 hour to eat at that speed",
"This isn't searching an array — it's searching over possible answer values, which only works because 'hours needed' shrinks steadily as speed increases"
],
"patternTakeaway": "If the question asks for the smallest (or largest) number that still satisfies some condition, and increasing that number makes the condition steadily easier or harder, always think: binary search on the answer, not on the array.",
"pattern": "Sorting & Binary Search"
},
{
"id": "algo-cat5-q6",
"guide": "Algorithms Guide",
"topic": "Binary Search",
"topicNum": 5,
"level": "Medium",
"badge": "[Medium]  LeetCode #34  Pattern: Binary Search (Lower/Upper Bound) | Asked at: LinkedIn, Bloomberg | Time: O(log n)  Space: O(1)",
"question": "Find First and Last Position of Element",
"explanation": "You get a sorted array and a target value. Find the FIRST index AND the LAST index where the target appears. If the target is not in the array, return [-1, -1]. Your solution must run in O(log n) time.\nExample: nums = [5,7,7,8,8,10], target = 8 → [3,4].\n\nHow to solve it: Run two separate binary searches.\nThe first search looks for the leftmost position: whenever it finds a match, it saves that index but keeps searching further LEFT, in case there's an earlier match.\nThe second search looks for the rightmost position: whenever it finds a match, it saves that index but keeps searching further RIGHT, in case there's a later match.\nIf the target is never found, both searches return -1, and you return [-1, -1].",
"code": "function searchRange(nums, target) {\n  const findFirst = () => {\n    let left = 0, right = nums.length - 1;\n    let result = -1;\n    while (left <= right) {\n      const mid = Math.floor((left + right) / 2);\n      if (nums[mid] >= target) {\n        if (nums[mid] === target) result = mid;\n        right = mid - 1;\n      } else {\n        left = mid + 1;\n      }\n    }\n    return result;\n  };\n  \n  const findLast = () => {\n    let left = 0, right = nums.length - 1;\n    let result = -1;\n    while (left <= right) {\n      const mid = Math.floor((left + right) / 2);\n      if (nums[mid] <= target) {\n        if (nums[mid] === target) result = mid;\n        left = mid + 1;\n      } else {\n        right = mid - 1;\n      }\n    }\n    return result;\n  };\n  \n  return [findFirst(), findLast()];\n}\n \nsearchRange([5, 7, 7, 8, 8, 10], 8); // [3, 4]\nsearchRange([5, 7, 7, 8, 8, 10], 6); // [-1, -1]",
"howTo": "1. \"Find the first AND last position, and it must be O(log n)\" tells you a single binary search isn't enough, but two of them still are -- the sorted array is your ticket to a log n solution instead of scanning.\n2. Core trick: instead of finding just any occurrence of the target, run one binary search biased to keep pushing left when it finds a match (to land on the first one), and another biased to keep pushing right (to land on the last one).\n3. For the first position: whenever nums[mid] >= target, record mid as a candidate and keep searching further left, since there might be an earlier equal value.\n4. For the last position: whenever nums[mid] <= target, record mid as a candidate and keep searching further right, for the same reason in reverse.\n5. Run both searches independently and return them as a pair.\n6. Edge case to check: if the target never appears at all, both searches should end up returning -1, so return [-1, -1] instead of some leftover mid value.",
"dryRun": {
"input": "nums = [5,7,7,8,8,10], target = 8",
"frames": [
"Find first: left=0, right=5. mid=2, nums[2]=7 < 8, so go right: left=3",
"Find first: left=3, right=5. mid=4, nums[4]=8 matches — save index 4, but keep searching left for an earlier 8: right=3. Next mid=3, nums[3]=8 matches too — save index 3, right=2. Loop ends. First position = 3",
"Find last: left=0, right=5. mid=2, nums[2]=7 <= 8, save index 2 as candidate, search right: left=3",
"Find last: left=3, right=5. mid=4, nums[4]=8 <=8, save index 4, search right: left=5. mid=5, nums[5]=10 not <=8, go left: right=4. Loop ends. Last position = 4"
],
"result": "return [3, 4]"
},
"pitfalls": [
"Run two separate, independent binary searches — one biased to keep moving left after a match (to find the first), one biased to keep moving right (to find the last)",
"If the target does not exist at all, both searches must return -1, and the final result should be [-1, -1], not some leftover mid index",
"Don't stop at the first match found — a normal binary search only finds 'a' position, not necessarily the first or last one",
"Watch off-by-one mistakes when narrowing left/right after a match — moving the wrong boundary can miss the true first or last index"
],
"patternTakeaway": "If you need the first and last position of a value in a sorted array, always think: two binary searches, each biased to keep searching past a match in one direction.",
"pattern": "Sorting & Binary Search"
},
{
"id": "algo-cat6-q1",
"guide": "Algorithms Guide",
"topic": "Linked List",
"topicNum": 6,
"level": "Easy",
"badge": "[Easy]  LeetCode #206  Pattern: Pointer Manipulation | Asked at: Amazon, Google, Meta, Microsoft, Apple | Time: O(n)  Space: O(1) iterative / O(n) recursive",
"question": "Reverse Linked List",
"explanation": "Problem:\nYou have a singly linked list. Reverse it, so the last node becomes the first node.\nExample: 1 -> 2 -> 3 -> 4 -> 5 -> None\nbecomes: 5 -> 4 -> 3 -> 2 -> 1 -> None\n\nApproach:\nUse three pointers: prev, current, and next.\n1. Before you change anything, save current.next into a variable called next. This keeps your place in the rest of the list.\n2. Point current.next backward, to prev.\n3. Move prev forward to current.\n4. Move current forward to the saved next.\nRepeat this until current is None. At the end, prev is sitting on the new head of the reversed list.",
"code": "class ListNode {\n  constructor(val = 0, next = null) {\n    this.val = val;\n    this.next = next;\n  }\n}\n \n// Iterative\nfunction reverseList(head) {\n  let prev = null;\n  let current = head;\n  \n  while (current !== null) {\n    const next = current.next; // save\n    current.next = prev;       // reverse\n    prev = current;            // advance prev\n    current = next;            // advance current\n  }\n  \n  return prev; // new head\n}\n \n// Recursive\nfunction reverseListRecursive(head) {\n  if (!head || !head.next) return head;\n  \n  const newHead = reverseListRecursive(head.next);\n  head.next.next = head;\n  head.next = null;\n  \n  return newHead;\n}",
"howTo": "1. \"Reverse a linked list\" is the classic signal for the pointer-flipping pattern -- you don't need extra memory, you just carefully rewire each node's next pointer as you walk through.\n2. Core trick: at every node, before you break its link to the next node, save that next node somewhere safe -- otherwise you'd lose the rest of the list the moment you rewire.\n3. Use three pointers: prev (starts as null), current (starts at head), and a temporary next.\n4. At each step: save current.next into a temp variable, point current.next backward to prev, move prev up to current, then move current up to the saved temp.\n5. Keep looping until current becomes null -- at that point, prev is sitting on the new head of the reversed list.\n6. Edge case to check: an empty list or a one-node list should just be returned as-is without crashing -- trace through the loop mentally to confirm it still works.",
"dryRun": {
"input": "1 -> 2 -> 3 -> None",
"frames": [
"prev=None, curr=1. Save next=2. curr.next=prev, so node 1 now points to None. prev=1, curr=2.",
"prev=1, curr=2. Save next=3. curr.next=prev, so node 2 now points to node 1. prev=2, curr=3.",
"prev=2, curr=3. Save next=None. curr.next=prev, so node 3 now points to node 2. prev=3, curr=None.",
"curr is None, so the loop stops. prev is the new head."
],
"result": "3 -> 2 -> 1 -> None"
},
"pitfalls": [
"Empty list (head is None) — the loop never runs, prev stays None, which is correct.",
"Forgetting to save current.next before overwriting it loses the rest of the list forever.",
"Returning current instead of prev at the end — current is always None when the loop stops.",
"Single node list — should just return that same node unchanged."
],
"patternTakeaway": "If you need to reverse a linked list, always think: three pointers (prev, current, next) that flip each link one node at a time.",
"pattern": "Linked List"
},
{
"id": "algo-cat6-q2",
"guide": "Algorithms Guide",
"topic": "Linked List",
"topicNum": 6,
"level": "Easy",
"badge": "[Easy]  LeetCode #21  Pattern: Two Pointers | Asked at: Amazon, Apple, Microsoft, Adobe | Time: O(n + m)  Space: O(1)",
"question": "Merge Two Sorted Lists",
"explanation": "Problem:\nYou have two linked lists, and both are already sorted. Merge them into one single sorted linked list.\nExample:\nlist1: 1 -> 2 -> 4\nlist2: 1 -> 3 -> 4\nResult: 1 -> 1 -> 2 -> 3 -> 4 -> 4\n\nApproach:\nCreate a dummy node at the start. This removes the need for special code when attaching the very first real node.\nUse a \"current\" pointer that starts at dummy.\nCompare the front node of list1 and list2. Attach whichever one is smaller to current.next, then move that list forward.\nWhen one list becomes empty, attach the rest of the other list in one step (it's already sorted).\nReturn dummy.next.",
"code": "function mergeTwoLists(list1, list2) {\n  const dummy = new ListNode(0);\n  let current = dummy;\n  \n  while (list1 !== null && list2 !== null) {\n    if (list1.val <= list2.val) {\n      current.next = list1;\n      list1 = list1.next;\n    } else {\n      current.next = list2;\n      list2 = list2.next;\n    }\n    current = current.next;\n  }\n  \n  // Attach the remaining list\n  current.next = list1 || list2;\n  \n  return dummy.next;\n}",
"howTo": "1. \"Merge two sorted lists into one sorted list\" is a two-pointer signal -- since both lists are already sorted, you just need to walk them side by side and always take the smaller front.\n2. Core trick: use a dummy placeholder node as a fake \"head before the head\" -- that way you never need special-case code for attaching the very first real node.\n3. Keep a pointer into each list and a \"current\" pointer starting at the dummy. At each step, compare the fronts of both lists and attach whichever is smaller to current.next, then move that list's pointer forward and move current forward.\n4. Keep doing this until one of the two lists runs out.\n5. Once one list is empty, attach the entire remaining list in one shot -- no need to walk it node by node, since it's already sorted.\n6. Common mistake: skipping the dummy node and trying to track the \"real\" head manually -- it makes the first-node case messy and error-prone.",
"dryRun": {
"input": "list1 = 1 -> 3 -> None, list2 = 2 -> 4 -> None",
"frames": [
"dummy -> None, current = dummy. Compare 1 vs 2: 1 is smaller. current.next = 1. list1 moves to 3. current moves to node 1.",
"Compare 3 vs 2: 2 is smaller. current.next = 2. list2 moves to 4. current moves to node 2.",
"Compare 3 vs 4: 3 is smaller. current.next = 3. list1 becomes None. current moves to node 3.",
"list1 is empty, so attach the rest of list2 directly: current.next = 4."
],
"result": "1 -> 2 -> 3 -> 4 -> None"
},
"pitfalls": [
"Skipping the dummy node makes handling the first attached node messy.",
"Forgetting to attach the remaining nodes of the non-empty list at the end.",
"Both lists empty — dummy.next is still None, which is correct, but easy to forget to check.",
"Using strict < instead of <= changes which equal-value node goes first (rarely matters, but know it)."
],
"patternTakeaway": "If you need to merge two sorted linked lists, always think: dummy head plus two pointers, always attaching the smaller front node.",
"pattern": "Linked List"
},
{
"id": "algo-cat6-q3",
"guide": "Algorithms Guide",
"topic": "Linked List",
"topicNum": 6,
"level": "Easy",
"badge": "[Easy]  LeetCode #141  Pattern: Floyd Two Pointers (Tortoise & Hare) | Asked at: Amazon, Microsoft, Bloomberg | Time: O(n)  Space: O(1)",
"question": "Linked List Cycle",
"explanation": "Problem:\nCheck if a linked list has a cycle (a loop that never reaches the end). Return true or false.\n\nApproach:\nUse two pointers: slow and fast.\nSlow moves one step at a time. Fast moves two steps at a time.\nIf there is a cycle, fast will eventually catch up to slow and they will land on the same node.\nIf there is no cycle, fast will simply reach the end (null) first.\nThis uses no extra memory, which is better than storing every visited node in a set.",
"code": "function hasCycle(head) {\n  if (!head) return false;\n  \n  let slow = head;\n  let fast = head;\n  \n  while (fast !== null && fast.next !== null) {\n    slow = slow.next;\n    fast = fast.next.next;\n    \n    if (slow === fast) return true;\n  }\n  \n  return false;\n}\n \n// Variation: Find cycle START (LeetCode 142)\nfunction detectCycle(head) {\n  let slow = head;\n  let fast = head;\n  \n  // Find meeting point\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) {\n      // Reset slow to head, walk both at same speed\n      slow = head;\n      while (slow !== fast) {\n        slow = slow.next;\n        fast = fast.next;\n      }\n      return slow; // cycle start\n    }\n  }\n  \n  return null;\n}",
"howTo": "1. \"Detect a cycle\" with no extra space expected is the clue for the fast/slow pointer trick (Floyd's algorithm) instead of a hash set of visited nodes.\n2. Core trick: imagine two runners on a track -- one moving at normal speed, one moving twice as fast. If the track has a loop, the faster runner will eventually lap the slower one and they'll meet. If there's no loop, the faster runner simply reaches the finish line (null) first.\n3. Start both slow and fast pointers at the head. Move slow one step at a time, and fast two steps at a time, in the same loop.\n4. If at any point slow and fast point to the exact same node, there's a cycle -- return true.\n5. If fast (or fast.next) hits null before that happens, there's no cycle -- return false.\n6. Bonus edge case for the follow-up (finding where the cycle starts): after slow and fast meet, reset one pointer to the head and move both one step at a time -- they'll meet again exactly at the start of the cycle. Don't skip resetting to head, that's the part people forget.",
"dryRun": {
"input": "1 -> 2 -> 3 -> 4 -> back to 2 (cycle)",
"frames": [
"slow = 1, fast = 1 (starting point).",
"Step 1: slow moves to 2. fast moves two steps (1->2->3), so fast = 3. Not equal.",
"Step 2: slow moves to 3. fast moves two steps through the cycle (3->4->2), so fast = 2. Not equal.",
"Step 3: slow moves to 4. fast moves two steps (2->3->4), so fast = 4. Equal — slow and fast are on the same node!"
],
"result": "return true (cycle detected)"
},
"pitfalls": [
"Empty list — check head is not null before starting the loop.",
"Forgetting to check both fast and fast.next for null before moving fast two steps causes a crash.",
"Single node list with no cycle — fast.next becomes null quickly and the loop exits with false, which is correct but easy to not trust.",
"A cycle of size 1 (a node pointing to itself) should still be detected correctly."
],
"patternTakeaway": "If you need to detect a cycle in a linked list without extra memory, always think: fast and slow pointers (tortoise and hare).",
"pattern": "Linked List"
},
{
"id": "algo-cat6-q4",
"guide": "Algorithms Guide",
"topic": "Linked List",
"topicNum": 6,
"level": "Medium",
"badge": "[Medium]  LeetCode #19  Pattern: Two Pointers (Gap) | Asked at: Meta, Amazon, Google | Time: O(n)  Space: O(1)",
"question": "Remove Nth Node From End of List",
"explanation": "Problem:\nRemove the n-th node counted from the end of the list, and return the head. You must do it in one pass.\nExample: 1 -> 2 -> 3 -> 4 -> 5, n = 2, removes the node with value 4.\nResult: 1 -> 2 -> 3 -> 5\n\nApproach:\nUse two pointers with a fixed gap of n between them.\n1. Add a dummy node before the head. This handles the case where the head itself must be removed.\n2. Move the fast pointer n+1 steps ahead of slow.\n3. Move slow and fast forward together, one step at a time, until fast becomes null.\n4. Now slow is sitting right before the node to remove. Skip it: slow.next = slow.next.next.\n5. Return dummy.next.",
"code": "function removeNthFromEnd(head, n) {\n  const dummy = new ListNode(0, head);\n  let slow = dummy;\n  let fast = dummy;\n  \n  // Move fast n+1 steps ahead\n  for (let i = 0; i <= n; i++) {\n    fast = fast.next;\n  }\n  \n  // Move both until fast reaches end\n  while (fast !== null) {\n    slow = slow.next;\n    fast = fast.next;\n  }\n  \n  // Remove the node\n  slow.next = slow.next.next;\n  \n  return dummy.next;\n}",
"howTo": "1. \"Remove the nth node from the end, in one pass\" is the clue for the two-pointer gap trick -- you don't know the list's length up front, so you create a fixed gap between two pointers and slide them together.\n2. Core trick: if you move one pointer n+1 steps ahead of the other first, then walk both forward at the same speed, the gap between them stays exactly n+1 the whole way -- so when the front pointer falls off the end, the back pointer is sitting right before the node you need to remove.\n3. Add a dummy node before the head, and start both slow and fast pointers there -- this saves you from writing special code for the case where the head itself is the node to remove.\n4. Move fast forward n+1 steps first, then move slow and fast forward together, one step each, until fast becomes null.\n5. Now slow.next is the node to delete -- skip it by setting slow.next = slow.next.next, and return dummy.next as the new head.\n6. Double check the off-by-one on that first n+1 move; it's the easiest part to get wrong.",
"dryRun": {
"input": "1 -> 2 -> 3 -> 4 -> 5 -> None, n = 2",
"frames": [
"dummy -> 1 -> 2 -> 3 -> 4 -> 5 -> None. slow = dummy, fast = dummy.",
"Move fast n+1 = 3 steps ahead: dummy -> 1 -> 2 -> 3. fast is now at node 3.",
"Move slow and fast together until fast is null: slow moves to 1, fast to 4; slow to 2, fast to 5; slow to 3, fast to None.",
"fast is null, stop. slow is at node 3, so slow.next (node 4) is the one to remove: slow.next = slow.next.next."
],
"result": "1 -> 2 -> 3 -> 5 -> None"
},
"pitfalls": [
"Removing the head itself when n equals the list length — the dummy node makes this work correctly without extra code.",
"Single node list with n = 1 — removes the only node, and dummy.next correctly becomes None.",
"Off-by-one mistake on the first move: it must be n+1 steps, not n steps.",
"Skipping the dummy node forces extra special-case code for removing the head."
],
"patternTakeaway": "If you need to find a node a fixed distance from the end of a linked list in one pass, always think: two pointers kept a fixed gap apart.",
"pattern": "Linked List"
},
{
"id": "algo-cat6-q5",
"guide": "Algorithms Guide",
"topic": "Linked List",
"topicNum": 6,
"level": "Medium",
"badge": "[Medium]  LeetCode #143  Pattern: 3-Step: Find Middle + Reverse + Merge | Asked at: Meta, Amazon | Time: O(n)  Space: O(1)",
"question": "Reorder List",
"explanation": "Problem:\nReorder the list into this zig-zag pattern: first node, last node, second node, second-to-last node, third node, third-to-last node, and so on.\nExample: 1 -> 2 -> 3 -> 4 becomes 1 -> 4 -> 2 -> 3\nExample: 1 -> 2 -> 3 -> 4 -> 5 becomes 1 -> 5 -> 2 -> 4 -> 3\n\nApproach:\nThis is three simpler problems combined into one:\n1. Find the middle of the list (slow/fast pointers).\n2. Reverse the second half of the list.\n3. Merge the first half and the reversed second half, taking one node from each side in turn.",
"code": "function reorderList(head) {\n  if (!head || !head.next) return;\n  \n  // 1. Find middle\n  let slow = head, fast = head;\n  while (fast.next && fast.next.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n  }\n  \n  // 2. Reverse second half\n  let second = slow.next;\n  slow.next = null; // break the list\n  let prev = null;\n  while (second) {\n    const next = second.next;\n    second.next = prev;\n    prev = second;\n    second = next;\n  }\n  \n  // 3. Merge two halves alternately\n  let first = head;\n  second = prev;\n  while (second) {\n    const tmp1 = first.next;\n    const tmp2 = second.next;\n    first.next = second;\n    second.next = tmp1;\n    first = tmp1;\n    second = tmp2;\n  }\n}",
"howTo": "1. This problem's zig-zag pattern (first, last, second, second-to-last, ...) is a clue to break it into three problems you already know how to solve: finding the middle, reversing a list, and merging two lists.\n2. Core trick: if you find the middle of the list, reverse the second half, and then weave the first half and the reversed second half together one node at a time, you get exactly the required order -- no extra memory or array needed.\n3. Step one: use slow/fast pointers to find the middle node of the list.\n4. Step two: cut the list into two halves at the middle, then reverse the second half in place (same technique as reversing any linked list).\n5. Step three: merge the two halves by alternating one node from the first half, then one from the reversed second half, relinking next pointers as you go.\n6. Edge case to check: when the list has an odd number of nodes, one half will be one node longer -- make sure your merge loop stops cleanly once the shorter (second) half runs out, without dropping the leftover node.",
"dryRun": {
"input": "1 -> 2 -> 3 -> 4 -> None",
"frames": [
"Find middle: slow=1, fast=1 -> slow=2, fast=3. fast.next.next is None so the loop stops. Middle is node 2.",
"Split at the middle: first half = 1 -> 2 -> None, second half = 3 -> 4 -> None.",
"Reverse the second half: 3 -> 4 becomes 4 -> 3 -> None.",
"Merge by alternating: take 1 from first half, then 4 from reversed second half, then 2, then 3."
],
"result": "1 -> 4 -> 2 -> 3 -> None"
},
"pitfalls": [
"Odd number of nodes — one half ends up one node longer, so don't lose or duplicate the middle node.",
"Forgetting to cut the first half's tail (slow.next = null) before reversing can leave a hidden loop.",
"Empty list or single node — should be returned unchanged, no crash.",
"During the merge step, forgetting to stop cleanly once the shorter (second) half runs out."
],
"patternTakeaway": "If a linked list problem asks for reordering or a zig-zag pattern, always think: find the middle, reverse one half, then merge the two halves.",
"pattern": "Linked List"
},
{
"id": "algo-cat6-q6",
"guide": "Algorithms Guide",
"topic": "Linked List",
"topicNum": 6,
"level": "Medium",
"badge": "[Medium]  LeetCode #138  Pattern: Hash Map / Interleaving | Asked at: Meta, Amazon, Microsoft, Bloomberg | Time: O(n)  Space: O(n) hash / O(1) interleave",
"question": "Copy List with Random Pointer",
"explanation": "Problem:\nEach node in this linked list has two pointers: \"next\" (the normal one) and \"random\" (which can point to any other node in the list, or to nothing). Make a full, independent deep copy of the whole list.\n\nApproach (using a hash map):\n1. First pass: walk the original list from start to end. For each original node, create a new copy node, and store the pair in a map: original node -> its copy.\n2. Second pass: walk the original list again. For each node, use the map to set copy.next and copy.random to the matching copied nodes.\n3. Return the copy that matches the original head.\nThis two-pass approach is needed because a random pointer might point to a node you haven't copied yet.",
"code": "// Hash Map approach (cleaner)\nfunction copyRandomList(head) {\n  if (!head) return null;\n  \n  const map = new Map();\n  \n  // First pass: create copies\n  let current = head;\n  while (current) {\n    map.set(current, new Node(current.val));\n    current = current.next;\n  }\n  \n  // Second pass: link next and random\n  current = head;\n  while (current) {\n    const copy = map.get(current);\n    copy.next = map.get(current.next) || null;\n    copy.random = map.get(current.random) || null;\n    current = current.next;\n  }\n  \n  return map.get(head);\n}",
"howTo": "1. \"Deep copy a list where nodes also point randomly to other nodes anywhere in the list\" is the clue for a hash map -- you need a fast way to translate \"original node\" into \"its brand new copy\" wherever that copy shows up, including out-of-order random pointers.\n2. Core trick: since a random pointer might point to a node you haven't copied yet, don't try to build links in a single pass -- first create all the copies, then go back and wire up the connections once every copy already exists.\n3. First pass: walk the original list start to end, creating a new copy node for each original node, and store the mapping original-node -> copy-node in a map (don't set next/random yet).\n4. Second pass: walk the original list again. For each original node, look up its copy in the map, then set copy.next = map.get(original.next) and copy.random = map.get(original.random).\n5. Return map.get(head) as the head of the new list.\n6. Edge case to check: original.next or original.random might be null -- map.get(null) should safely resolve to null too, not crash, so guard for that.",
"dryRun": {
"input": "A(val=1) -> B(val=2) -> None, where A.random = B and B.random = A",
"frames": [
"First pass: create copy A'. map: A -> A'. Move to B, create copy B'. map: B -> B'. Both copies exist now, but next/random are not set yet.",
"Second pass, at A: A'.next = map.get(A.next) = map.get(B) = B'. A'.random = map.get(A.random) = map.get(B) = B'.",
"Second pass, at B: B'.next = map.get(B.next) = map.get(None) = None. B'.random = map.get(B.random) = map.get(A) = A'."
],
"result": "A'(val=1, next=B', random=B') -> B'(val=2, next=None, random=A')"
},
"pitfalls": [
"map.get(null) must safely return null/undefined instead of crashing — guard for missing next or random.",
"Trying to link next/random during the first pass can fail because the target copy might not exist yet.",
"Empty list (head is null) — return null right away.",
"Accidentally linking original nodes together instead of the copied nodes."
],
"patternTakeaway": "If you need to deep-copy a structure with extra pointers to random nodes, always think: hash map from original node to its copy, built in one pass, then linked in a second pass.",
"pattern": "Linked List"
},
{
"id": "algo-cat6-q7",
"guide": "Algorithms Guide",
"topic": "Linked List",
"topicNum": 6,
"level": "Medium",
"badge": "[Medium]  LeetCode #2  Pattern: Linked List Math | Asked at: Amazon, Microsoft, Apple, Adobe | Time: O(max(n, m))  Space: O(max(n, m))",
"question": "Add Two Numbers",
"explanation": "Problem:\nTwo linked lists represent numbers. Each node holds one digit, and digits are stored in reverse order (the ones digit comes first). Add the two numbers and return the sum as a linked list, also in reverse order.\nExample: l1 = 2 -> 4 -> 3 (means 342), l2 = 5 -> 6 -> 4 (means 465)\nResult: 7 -> 0 -> 8 (means 807)\n\nApproach:\nWalk both lists at the same time, just like adding numbers by hand on paper.\nKeep a \"carry\" value, starting at 0.\nAt each step: sum = digit from l1 + digit from l2 + carry (use 0 if a list already ended).\nnewDigit = sum % 10, and the new carry = sum / 10, rounded down.\nKeep going until both lists are finished AND carry is 0 — don't forget that last carry can add one more digit.",
"code": "function addTwoNumbers(l1, l2) {\n  const dummy = new ListNode(0);\n  let current = dummy;\n  let carry = 0;\n  \n  while (l1 || l2 || carry) {\n    const v1 = l1 ? l1.val : 0;\n    const v2 = l2 ? l2.val : 0;\n    const sum = v1 + v2 + carry;\n    \n    carry = Math.floor(sum / 10);\n    current.next = new ListNode(sum % 10);\n    current = current.next;\n    \n    if (l1) l1 = l1.next;\n    if (l2) l2 = l2.next;\n  }\n  \n  return dummy.next;\n}",
"howTo": "1. Two linked lists holding digits in reverse order, that need to be added together, is a clue to simulate grade-school addition digit by digit instead of converting the whole list into a real number.\n2. Core trick: since the digits are already stored least-significant-first (reversed), you can add them directly from front to front, just like adding numbers on paper from right to left, carrying over any overflow to the next pair of digits.\n3. Walk both lists at the same time. At each step, take the current digit from each list (treat a finished list as contributing 0), plus any carry left over from before.\n4. The new digit to store is sum % 10, and the new carry is Math.floor(sum / 10).\n5. Build the result list as you go using a dummy head node, appending each new digit node.\n6. Common mistake: stopping as soon as both lists run out, forgetting that a leftover carry (like 1) still needs one more node appended at the very end.",
"dryRun": {
"input": "l1 = 2 -> 4 -> 3, l2 = 5 -> 6 -> 4",
"frames": [
"carry=0. digits: 2+5+0=7. newDigit=7, carry=0. Append node 7. Move both lists forward.",
"digits: 4+6+0=10. newDigit=0, carry=1. Append node 0. Move both lists forward.",
"digits: 3+4+1=8. newDigit=8, carry=0. Append node 8. Both lists are now empty and carry is 0, so stop."
],
"result": "7 -> 0 -> 8 -> None (represents 807)"
},
"pitfalls": [
"Forgetting to add one more node when a carry is left over after both lists end (e.g. 5+5=10 needs an extra node for the leading 1).",
"Lists of different lengths — treat the missing digits as 0 instead of stopping early.",
"Losing or resetting the carry value between loop iterations.",
"Confusing the digit order — the lists store the least significant digit first, so you add from front to front, not by reversing first."
],
"patternTakeaway": "If you need to add numbers stored digit-by-digit in linked lists, always think: walk both lists together while tracking a carry, just like addition on paper.",
"pattern": "Linked List"
},
{
"id": "algo-cat6-q8",
"guide": "Algorithms Guide",
"topic": "Linked List",
"topicNum": 6,
"level": "Hard",
"badge": "[Hard]  LeetCode #23  Pattern: Heap / Divide & Conquer | Asked at: Amazon, Meta, Google, Microsoft | Time: O(n log k)  Space: O(k)",
"question": "Merge K Sorted Lists",
"explanation": "Problem:\nYou have k sorted linked lists. Merge all of them into one single sorted linked list.\nExample: [[1,4,5], [1,3,4], [2,6]] becomes 1 -> 1 -> 2 -> 3 -> 4 -> 4 -> 5 -> 6\n\nApproach (divide and conquer):\nYou already know how to merge two sorted lists efficiently. Instead of merging the lists one at a time (which is slow), pair them up and merge each pair. This cuts the number of lists in half every round.\nKeep repeating this pairing-and-merging process on the smaller set of lists until only one list remains.",
"code": "// Approach: Divide and Conquer (no heap needed)\nfunction mergeKLists(lists) {\n  if (lists.length === 0) return null;\n  \n  while (lists.length > 1) {\n    const merged = [];\n    \n    for (let i = 0; i < lists.length; i += 2) {\n      const l1 = lists[i];\n      const l2 = i + 1 < lists.length ? lists[i + 1] : null;\n      merged.push(mergeTwoLists(l1, l2));\n    }\n    \n    lists = merged;\n  }\n  \n  return lists[0];\n}\n \nfunction mergeTwoLists(l1, l2) {\n  const dummy = new ListNode(0);\n  let current = dummy;\n  \n  while (l1 && l2) {\n    if (l1.val <= l2.val) {\n      current.next = l1;\n      l1 = l1.next;\n    } else {\n      current.next = l2;\n      l2 = l2.next;\n    }\n    current = current.next;\n  }\n  current.next = l1 || l2;\n  return dummy.next;\n}",
"howTo": "1. \"Merge k sorted lists\" (not just two) is the clue to either use a heap or, more simply, reuse a \"merge two lists\" building block repeatedly -- this is a divide-and-conquer signal, since combining many sorted things pairs naturally.\n2. Core trick: you already know how to merge two sorted lists efficiently -- so instead of merging list 1 with 2, then with 3, then with 4 one at a time (slow), pair up the lists and merge them two-by-two in rounds, cutting the number of lists in half every round.\n3. In round one, merge list 0 with list 1, list 2 with list 3, and so on, producing half as many lists.\n4. Repeat this pairing process on the new, smaller set of merged lists.\n5. Keep going until only one list remains -- that's your fully merged, sorted result.\n6. Edge case to check: an odd list left unpaired in a round should just be carried over untouched to the next round, and an empty input (k = 0) should return null right away.",
"dryRun": {
"input": "lists = [1 -> 4, 2 -> 3, 5]",
"frames": [
"Round 1: pair list0 (1->4) with list1 (2->3), merge them into 1->2->3->4. list2 (5) has no partner, so it just carries over unchanged.",
"After round 1: lists = [1->2->3->4, 5].",
"Round 2: pair the two remaining lists and merge: (1->2->3->4) merged with (5) gives 1->2->3->4->5.",
"Only one list remains, so stop."
],
"result": "1 -> 2 -> 3 -> 4 -> 5 -> None"
},
"pitfalls": [
"Empty input array (k = 0) — should return null right away.",
"An odd number of lists in a round — the leftover list must carry over untouched to the next round, not get dropped.",
"One or more of the k lists being null/empty — mergeTwoLists must handle a null list without crashing.",
"Merging lists one-by-one in a simple loop instead of pairing them is a correct but much slower alternative."
],
"patternTakeaway": "If you need to merge many sorted lists (or sorted arrays) efficiently, always think: divide and conquer, pairing them up and merging two at a time.",
"pattern": "Linked List"
},
{
"id": "algo-cat7-q1",
"guide": "Algorithms Guide",
"topic": "Trees",
"topicNum": 7,
"level": "Easy",
"badge": "[Easy]  LeetCode #226  Pattern: Recursion / DFS | Asked at: Google, Apple, Amazon | Time: O(n)  Space: O(h) — h is height",
"question": "Invert Binary Tree",
"explanation": "Problem:\nFlip a binary tree so it becomes its own mirror image. Every left child and every right child must swap places, at every node in the tree.\n\nApproach:\nUse recursion. At each node, swap its left child and right child. Then do the same thing on the left child and on the right child. If the node is null (empty spot), just return null — there is nothing to swap.",
"code": "class TreeNode {\n  constructor(val = 0, left = null, right = null) {\n    this.val = val;\n    this.left = left;\n    this.right = right;\n  }\n}\n \nfunction invertTree(root) {\n  if (!root) return null;\n  \n  // Swap children\n  [root.left, root.right] = [root.right, root.left];\n  \n  invertTree(root.left);\n  invertTree(root.right);\n  \n  return root;\n}\n \n// Iterative with BFS queue\nfunction invertTreeIterative(root) {\n  if (!root) return null;\n  \n  const queue = [root];\n  while (queue.length > 0) {\n    const node = queue.shift();\n    [node.left, node.right] = [node.right, node.left];\n    \n    if (node.left) queue.push(node.left);\n    if (node.right) queue.push(node.right);\n  }\n  \n  return root;\n}",
"howTo": "1. The problem says \"mirror\" the tree — every node's left and right child must swap. That's a sign to think recursively: fix one node, and trust recursion to fix the rest of the tree the same way.\n2. The core trick: you don't need to see the whole tree at once. Just swap the left and right pointers of the CURRENT node, then let the same logic run on its children.\n3. Build it in this order: write the base case first (null node returns null, nothing to invert). Then swap root.left and root.right. Then call invert on root.left and on root.right (which now point at what used to be the other side).\n4. Double check the empty tree case (root is null) returns null cleanly, and that you swap before recursing, not after — the order doesn't actually break it here, but it's the kind of detail interviewers ask you to explain.",
"dryRun": {
"input": "tree = [4,2,7,1,3,6,9]",
"frames": [
"invertTree(4): swap 4's children. Now left points to the old 7-node, right points to the old 2-node.",
"invertTree on the old 7-node (now on the left): swap its children 6 and 9. Now left=9, right=6.",
"invertTree(9) and invertTree(6): both are leaves with no children, nothing to swap, they just return.",
"invertTree on the old 2-node (now on the right): swap its children 1 and 3. Now left=3, right=1.",
"invertTree(3) and invertTree(1): both leaves, nothing to swap, they return."
],
"result": "tree becomes [4,7,2,9,6,3,1]"
},
"pitfalls": [
"Empty tree (root is null) — must return null right away, not crash.",
"Single node tree — swapping two null children is still safe, don't overthink it.",
"Forgetting to recurse into the children after swapping — only the top node gets flipped instead of the whole tree.",
"This swaps the child POINTERS (left/right), not the values inside the nodes."
],
"patternTakeaway": "If a tree problem asks to mirror, flip, or reverse the tree, always think: swap the left and right child pointers at every node, then let recursion handle the rest of the tree the same way.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat7-q2",
"guide": "Algorithms Guide",
"topic": "Trees",
"topicNum": 7,
"level": "Easy",
"badge": "[Easy]  LeetCode #104  Pattern: DFS Recursion | Asked at: Amazon, Google, LinkedIn | Time: O(n)  Space: O(h)",
"question": "Maximum Depth of Binary Tree",
"explanation": "Problem:\nFind the longest path from the root down to a leaf. Count how many nodes are on that path.\n\nApproach:\nUse recursion. The depth of a node is 1 (for itself) plus whichever of its two children has the bigger depth. A null node (empty spot) has depth 0 — that is the base case.",
"code": "function maxDepth(root) {\n  if (!root) return 0;\n  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n}\n \n// BFS - count levels\nfunction maxDepthBFS(root) {\n  if (!root) return 0;\n  \n  let depth = 0;\n  let queue = [root];\n  \n  while (queue.length > 0) {\n    const next = [];\n    for (const node of queue) {\n      if (node.left) next.push(node.left);\n      if (node.right) next.push(node.right);\n    }\n    queue = next;\n    depth++;\n  }\n  \n  return depth;\n}",
"howTo": "1. \"Longest path from root to a leaf\" is a depth question about a tree — that's your cue to think recursively: what does this function return for ONE node, based on what its children return.\n2. Core idea: the depth of a node is 1 (for itself) plus whichever of its two children is deeper. You never manually count the whole tree — you trust the recursive calls on the children.\n3. Steps: base case — a null node has depth 0. Recursive case — ask for the depth of the left child, ask for the depth of the right child, return 1 plus the bigger of the two.\n4. Good to mention in an interview: the BFS version does the same thing by counting levels with a queue instead of recursion — useful if you're asked to avoid recursion.\n5. Common mistake: forgetting the \"+1\" for the current node, so a single-node tree wrongly comes out as depth 0 instead of 1.",
"dryRun": {
"input": "tree = [3,9,20,null,null,15,7]",
"frames": [
"maxDepth(3) first calls maxDepth(9).",
"maxDepth(9): both children are null, so left=0 and right=0. Returns 1 + max(0,0) = 1.",
"maxDepth(3) then calls maxDepth(20).",
"maxDepth(20) calls maxDepth(15) and maxDepth(7) — both leaves, each returns 1. So left=1, right=1. Returns 1 + max(1,1) = 2.",
"Back at maxDepth(3): left=1, right=2. Returns 1 + max(1,2) = 3."
],
"result": "return 3"
},
"pitfalls": [
"Empty tree (root is null) must return 0, not crash or return 1.",
"Forgetting the '+1' for the current node — a single-node tree would wrongly come out as depth 0 instead of 1.",
"An unbalanced tree still uses max (not sum) of the two child depths.",
"Do not confuse depth (counts nodes) with edges (counts connections) — they differ by exactly one."
],
"patternTakeaway": "If a tree problem asks for a count of nodes or levels along a path, always think recursively: depth(node) = 1 + max(depth(left), depth(right)), with a null node returning 0.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat7-q3",
"guide": "Algorithms Guide",
"topic": "Trees",
"topicNum": 7,
"level": "Easy",
"badge": "[Easy]  LeetCode #100  Pattern: DFS Recursion | Asked at: Google, Amazon | Time: O(n)  Space: O(h)",
"question": "Same Tree",
"explanation": "Problem:\nCheck if two binary trees are exactly the same: same shape AND same values in every matching position.\n\nApproach:\nUse recursion. If both nodes being compared are null, that is a match. If only one is null, it's not a match. If both exist but their values are different, it's not a match. Otherwise, check that the left children match each other AND the right children match each other.",
"code": "function isSameTree(p, q) {\n  if (!p && !q) return true;\n  if (!p || !q) return false;\n  if (p.val !== q.val) return false;\n  \n  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);\n}",
"howTo": "1. You're comparing two trees node by node for both shape and values — that's a signal for a recursive comparison, not converting both trees into lists first.\n2. Core idea: two trees are the same only if the current pair of nodes match AND their left subtrees match AND their right subtrees match. Check \"here\", then ask recursion to check \"there\".\n3. Steps: if both nodes are null, that's a match, return true. If only one is null, return false. If both exist but their values differ, return false. Otherwise recurse on the left pair and the right pair, and both must be true.\n4. Common mistake: comparing p.left against q.right (or mixing sides) — always pair left-with-left and right-with-right.",
"dryRun": {
"input": "p = [1,2,3], q = [1,2,4]",
"frames": [
"isSameTree(p=1, q=1): neither is null, and values match (1==1). Now check the left pair and the right pair.",
"isSameTree(p.left=2, q.left=2): neither is null, values match, both have null children — returns true.",
"isSameTree(p.right=3, q.right=4): neither is null, but values 3 and 4 do not match — returns false right away.",
"Back at the root: true (from left side) AND false (from right side) = false."
],
"result": "return false"
},
"pitfalls": [
"Both trees empty (root is null on both sides) should return true, not false.",
"One tree is null and the other is not — check this before comparing .val, or you will crash.",
"Same shape but different values still means the trees are NOT the same.",
"Make sure to compare p.left with q.left and p.right with q.right — don't accidentally cross the sides."
],
"patternTakeaway": "If a tree problem compares two trees node by node, always think recursively: handle the null cases first, compare the current values, then recurse on the matching left-left and right-right pairs.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat7-q4",
"guide": "Algorithms Guide",
"topic": "Trees",
"topicNum": 7,
"level": "Medium",
"badge": "[Medium]  LeetCode #102  Pattern: BFS | Asked at: Amazon, Meta, Microsoft, LinkedIn | Time: O(n)  Space: O(n)",
"question": "Binary Tree Level Order Traversal",
"explanation": "Problem:\nReturn all the node values, grouped level by level, from top to bottom, and left to right within each level.\n\nApproach:\nUse BFS with a queue. Process one full level at a time: before popping anything, remember how many nodes are currently in the queue — that number is exactly the size of this level. Pop that many nodes, collect their values, and push their children for the next level.",
"code": "function levelOrder(root) {\n  if (!root) return [];\n  \n  const result = [];\n  const queue = [root];\n  \n  while (queue.length > 0) {\n    const levelSize = queue.length;\n    const currentLevel = [];\n    \n    for (let i = 0; i < levelSize; i++) {\n      const node = queue.shift();\n      currentLevel.push(node.val);\n      \n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    \n    result.push(currentLevel);\n  }\n  \n  return result;\n}\n \n// Variant: zigzag order (LeetCode 103)\nfunction zigzagLevelOrder(root) {\n  if (!root) return [];\n  \n  const result = [];\n  const queue = [root];\n  let leftToRight = true;\n  \n  while (queue.length > 0) {\n    const size = queue.length;\n    const level = [];\n    \n    for (let i = 0; i < size; i++) {\n      const node = queue.shift();\n      if (leftToRight) level.push(node.val);\n      else level.unshift(node.val);\n      \n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    \n    result.push(level);\n    leftToRight = !leftToRight;\n  }\n  \n  return result;\n}",
"howTo": "1. \"Level by level\" is the strongest possible signal for BFS with a queue — any time the question groups nodes by their depth, reach for BFS instead of DFS.\n2. Core trick: process the queue one full level at a time by remembering how many nodes are currently sitting in the queue BEFORE you start popping any of them.\n3. Steps: push the root into a queue. While the queue isn't empty, save the current queue length as \"levelSize\". Pop exactly that many nodes, collecting their values into one level list and pushing their children for the next round. Save that level list into your final answer.\n4. Common mistake: popping nodes without stopping at levelSize — then you accidentally start mixing next level's children into the current level's results.",
"dryRun": {
"input": "tree = [3,9,20,null,null,15,7]",
"frames": [
"queue=[3]. levelSize=1. Pop 3, add it to this level, push its children 9 and 20. Level result: [3].",
"queue=[9,20]. levelSize=2. Pop 9 (a leaf, no children to push), pop 20 (push its children 15 and 7). Level result: [9,20].",
"queue=[15,7]. levelSize=2. Pop 15 (leaf), pop 7 (leaf). Level result: [15,7].",
"Queue is now empty — stop."
],
"result": "return [[3],[9,20],[15,7]]"
},
"pitfalls": [
"Empty tree (root is null) should return [], not [[]] or crash.",
"Forgetting to snapshot the level size before popping — you'll accidentally mix next level's nodes into the current level.",
"Single node tree should still produce one level containing one value.",
"Must pop from the FRONT of the queue (FIFO order), not the back, or the left-to-right order breaks."
],
"patternTakeaway": "If a tree problem asks for anything grouped by level or depth, always think BFS with a queue, and save the queue's current length before popping so you know exactly where one level ends and the next begins.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat7-q5",
"guide": "Algorithms Guide",
"topic": "Trees",
"topicNum": 7,
"level": "Medium",
"badge": "[Medium]  LeetCode #98  Pattern: DFS with Bounds | Asked at: Meta, Amazon, Microsoft | Time: O(n)  Space: O(h)",
"question": "Validate Binary Search Tree",
"explanation": "Problem:\nCheck if a binary tree is a valid binary search tree (BST). In a valid BST, every node in a left subtree must be smaller than the node above it, and every node in a right subtree must be bigger — and this rule must hold against ALL ancestors above, not just the direct parent.\n\nApproach:\nCarry a valid range (a minimum and a maximum) down as you recurse. Each node must fit strictly inside the range it was handed. When you go left, the maximum becomes the current node's value. When you go right, the minimum becomes the current node's value.",
"code": "function isValidBST(root) {\n  function validate(node, min, max) {\n    if (!node) return true;\n    \n    if (node.val <= min || node.val >= max) return false;\n    \n    return validate(node.left, min, node.val) &&\n           validate(node.right, node.val, max);\n  }\n  \n  return validate(root, -Infinity, Infinity);\n}\n \n// Alternative: in-order traversal (BST in-order is sorted)\nfunction isValidBSTInOrder(root) {\n  let prev = -Infinity;\n  \n  function inorder(node) {\n    if (!node) return true;\n    if (!inorder(node.left)) return false;\n    if (node.val <= prev) return false;\n    prev = node.val;\n    return inorder(node.right);\n  }\n  \n  return inorder(root);\n}",
"howTo": "1. \"Valid BST\" is not just \"child smaller/bigger than its direct parent\" — the rule has to hold against every ancestor, not just the one right above it. That tells you a simple local check is not enough; you need to pass extra information down the recursion.\n2. Core trick: carry a valid range (a min and a max) down as you recurse. Each node must fit strictly inside the range it was handed.\n3. Steps: start the root with range (-infinity, +infinity). At each node, check its value is inside min and max. Recurse into the left child with the same min but max updated to the current node's value. Recurse into the right child with the same max but min updated to the current node's value.\n4. Common mistake: only comparing a node against its direct parent instead of the full chain of ancestors — that misses cases like a deep grandchild that breaks the rule against the root, not against its own parent.",
"dryRun": {
"input": "tree = [5,3,8,null,null,4,9] (4 is the left child of 8)",
"frames": [
"validate(5, min=-infinity, max=infinity): 5 fits. Recurse left with range (-infinity, 5) and right with range (5, infinity).",
"validate(3, -infinity, 5): 3 fits, both children are null, returns true.",
"validate(8, 5, infinity): 8 fits (it's greater than 5). Recurse left with range (5, 8) and right with range (8, infinity).",
"validate(4, 5, infinity): 4 is the left child of 8, so the range is still (5, infinity). But 4 is not greater than 5, so this breaks the rule — return false.",
"Because this check failed, false travels back up through every level — the whole tree is invalid."
],
"result": "return false (not a valid BST, because 4 is smaller than the root 5 even though it's deep in the right subtree)"
},
"pitfalls": [
"Using <= or >= instead of strict < or > — a node equal to a bound should fail (BSTs usually don't allow duplicate values).",
"Only comparing a node to its direct parent instead of the full range from all ancestors — this misses deep violations.",
"Watch out for very large or very small integer values when using number bounds — use actual -Infinity/+Infinity rather than a fixed number.",
"Empty tree (root is null) counts as a valid BST — should return true."
],
"patternTakeaway": "If a tree problem needs a rule to hold against every ancestor, not just the parent, always think: pass a shrinking (min, max) range down the recursion instead of only comparing a node to the one right above it.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat7-q6",
"guide": "Algorithms Guide",
"topic": "Trees",
"topicNum": 7,
"level": "Medium",
"badge": "[Medium]  LeetCode #235  Pattern: BST Traversal | Asked at: Meta, Amazon, LinkedIn | Time: O(h)  Space: O(1) iterative",
"question": "Lowest Common Ancestor of BST",
"explanation": "Problem:\nGiven a binary search tree (BST) and two of its nodes, p and q, find their lowest common ancestor (LCA) — the lowest node that has both p and q somewhere below it (a node can count as its own ancestor).\n\nApproach:\nUse the BST ordering to skip searching both sides. Start at the root. If both p and q are smaller than the current node, the answer must be in the left subtree, so move left. If both are bigger, move right. The moment they split (one is smaller, one is bigger) — or one of them equals the current node — the current node is the answer.",
"code": "function lowestCommonAncestor(root, p, q) {\n  let current = root;\n  \n  while (current) {\n    if (p.val < current.val && q.val < current.val) {\n      current = current.left;\n    } else if (p.val > current.val && q.val > current.val) {\n      current = current.right;\n    } else {\n      return current; // split point or one matches\n    }\n  }\n  \n  return null;\n}\n \n// Variant: General Binary Tree LCA (LeetCode 236)\nfunction lcaBT(root, p, q) {\n  if (!root || root === p || root === q) return root;\n  \n  const left = lcaBT(root.left, p, q);\n  const right = lcaBT(root.right, p, q);\n  \n  if (left && right) return root;\n  return left || right;\n}",
"howTo": "1. Notice it's specifically a BST, not just any binary tree — that ordering property means you can decide which direction to search instead of exploring both sides like you would in a plain tree.\n2. Core trick: treat the BST like a decision path. At each node, compare both target values against the current node's value to know if the answer is to the left, to the right, or right here.\n3. Steps: start at the root. If both targets are smaller than the current node, move left. If both are bigger, move right. The moment they split (one is smaller, one is bigger) or one of them equals the current node, that node is the lowest common ancestor.\n4. Common mistake: writing the heavier \"check both children\" recursive solution used for general binary trees — that also works, but wastes the BST ordering; it's only needed when there's no BST guarantee.",
"dryRun": {
"input": "BST = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4",
"frames": [
"current = 6 (root). p=2 and q=4 are both less than 6, so move left to node 2.",
"current = 2. p.val (2) equals current.val, so it is not strictly less than 2. q.val (4) is greater than 2. This is the split point — return current node 2."
],
"result": "return the node with value 2"
},
"pitfalls": [
"This BST shortcut only works because of the ordering property — a plain binary tree needs the heavier check-both-children recursive approach instead.",
"If p equals the current node (or q does), that still counts as an immediate match — the current node is the LCA.",
"Stop as soon as you hit the split point — don't keep walking further down and overshoot into one subtree.",
"Assumes p and q both actually exist in the tree — some versions of this problem require you to check that first."
],
"patternTakeaway": "If a tree problem is on a BST and asks about ancestor relationships, always think: compare both target values to the current node's value to decide 'go left', 'go right', or 'this is the split point' — don't search both subtrees like a plain binary tree would need.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat7-q7",
"guide": "Algorithms Guide",
"topic": "Trees",
"topicNum": 7,
"level": "Medium",
"badge": "[Medium]  LeetCode #199  Pattern: BFS | Asked at: Amazon, Meta, LinkedIn | Time: O(n)  Space: O(n)",
"question": "Right Side View of Binary Tree",
"explanation": "Problem:\nImagine standing to the right of the tree and looking at it. Return the values of the nodes you can see — that's the rightmost node at each level, from top to bottom.\n\nApproach:\nDo BFS level by level, just like level order traversal. But instead of keeping every node's value, only keep the LAST node processed in each level (since the queue processes left to right, the last one popped is the rightmost).",
"code": "function rightSideView(root) {\n  if (!root) return [];\n  \n  const result = [];\n  const queue = [root];\n  \n  while (queue.length > 0) {\n    const size = queue.length;\n    \n    for (let i = 0; i < size; i++) {\n      const node = queue.shift();\n      \n      // Last node in level = rightmost\n      if (i === size - 1) result.push(node.val);\n      \n      if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n  }\n  \n  return result;\n}\n \n// DFS approach\nfunction rightSideViewDFS(root) {\n  const result = [];\n  \n  function dfs(node, depth) {\n    if (!node) return;\n    \n    // First node at this depth (because we go right first)\n    if (depth === result.length) result.push(node.val);\n    \n    dfs(node.right, depth + 1);\n    dfs(node.left, depth + 1);\n  }\n  \n  dfs(root, 0);\n  return result;\n}",
"howTo": "1. \"What you'd see standing to the right of the tree\" means, for every depth level, you only care about the rightmost node — that's level-by-level thinking, so BFS with a queue fits naturally.\n2. Core trick: walk the tree level by level like a normal level-order traversal, but only keep the LAST node you process in each level (since your queue processes left-to-right).\n3. Steps: do BFS, tracking the size of the current level the same way as level-order traversal. Inside the loop, only save a value into your answer when you're on the last node of that level's batch.\n4. Alternative worth knowing: DFS visiting right child before left child while tracking depth — the first node you reach at each new depth is the rightmost one.\n5. Common mistake: forgetting to still queue up left children even though you don't report them — you need every node to correctly reach the true rightmost nodes further down the tree.",
"dryRun": {
"input": "tree = [1,2,3,null,5,null,4] (2 has right child 5; 3 has right child 4)",
"frames": [
"Level 1: queue=[1], size=1. Pop node 1 — it's the last node in this level (index 0 of size 1), so record 1. Push its children 2 and 3.",
"Level 2: queue=[2,3], size=2. Pop node 2 (not last, skip recording), push its right child 5. Pop node 3 (last in level) — record 3. Push its right child 4.",
"Level 3: queue=[5,4], size=2. Pop node 5 (not last, skip, no children). Pop node 4 (last in level) — record 4.",
"Queue is empty — stop."
],
"result": "return [1, 3, 4]"
},
"pitfalls": [
"Empty tree (root is null) should return [].",
"Don't skip pushing left children into the queue just because you don't record their values — you still need them to reach deeper rightmost nodes.",
"Getting the 'last node in level' check wrong — compare the loop index to (size - 1), using the size snapshotted before popping.",
"If the rightmost spot at some level only has a left child hanging there, that left child becomes the visible node for that level."
],
"patternTakeaway": "If a tree problem asks what's visible from one side at every level, always think BFS by level and keep only the first or last node processed in each level's batch.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat7-q8",
"guide": "Algorithms Guide",
"topic": "Trees",
"topicNum": 7,
"level": "Medium",
"badge": "[Easy/Medium]  LeetCode #543  Pattern: DFS with Side Effect | Asked at: Meta, Google, Amazon | Time: O(n)  Space: O(h)",
"question": "Diameter of Binary Tree",
"explanation": "Problem:\nFind the length of the longest path between any two nodes in the tree, counted in edges (connections). This path does not have to pass through the root.\n\nApproach:\nDo a DFS that computes depth like the max-depth problem, but at every node also check leftDepth + rightDepth — that is the length of the path passing straight through this node. Keep a separate running maximum for this. The function still returns just the depth (1 + the bigger side) up to its parent — the diameter itself is only tracked on the side.",
"code": "function diameterOfBinaryTree(root) {\n  let maxDiameter = 0;\n  \n  function depth(node) {\n    if (!node) return 0;\n    \n    const left = depth(node.left);\n    const right = depth(node.right);\n    \n    // Diameter passing through this node\n    maxDiameter = Math.max(maxDiameter, left + right);\n    \n    // Return depth for parent\n    return 1 + Math.max(left, right);\n  }\n  \n  depth(root);\n  return maxDiameter;\n}",
"howTo": "1. \"Longest path between any two nodes\" — and that path does not have to pass through the root — tells you a single depth calculation is not enough. You need recursion that returns one thing to its caller but also updates a separate running answer as a side effect.\n2. Core trick: at every node, the diameter that passes THROUGH that node is just leftDepth plus rightDepth (the edges going down each side). Calculate this at every node while you're already computing depths anyway.\n3. Steps: write a depth function that works like max-depth (return 1 + max of left/right depth). But before returning, update a variable living outside the recursion with the bigger of its current value and leftDepth + rightDepth.\n4. Common mistake: returning the diameter itself up the recursion instead of the depth — the parent node needs the DEPTH to combine with its own sibling's depth; the diameter is only tracked on the side, never passed upward.",
"dryRun": {
"input": "tree = [1,2,3,4,5] (2 has children 4 and 5)",
"frames": [
"depth(4) and depth(5): both leaves, left=0 and right=0. Path through each of them is 0 (doesn't beat the current max of 0). Each returns depth 1.",
"depth(2): left=depth(4)=1, right=depth(5)=1. Path through node 2 is 1+1=2 — bigger than the current max (0), so maxDiameter becomes 2. Returns depth 1+max(1,1)=2 to its parent.",
"depth(3): a leaf, left=0, right=0. Path through it is 0 (doesn't beat 2). Returns depth 1.",
"depth(1) (root): left=depth(2)=2, right=depth(3)=1. Path through the root is 2+1=3 — bigger than the current max (2), so maxDiameter becomes 3."
],
"result": "return 3"
},
"pitfalls": [
"Returning the diameter itself up the recursion instead of the depth — the parent needs the DEPTH to combine with its own sibling's depth.",
"Forgetting the longest path might not pass through the root — every node must be checked, not just the top one.",
"Single node tree — diameter should be 0 (there are no edges), not 1.",
"Empty tree (root is null) — diameter should be 0."
],
"patternTakeaway": "If a tree problem asks for the longest path that might not pass through the root, always think: compute depth recursively as usual, but update a separate global maximum with leftDepth + rightDepth at every node along the way.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat7-q9",
"guide": "Algorithms Guide",
"topic": "Trees",
"topicNum": 7,
"level": "Medium",
"badge": "[Medium]  LeetCode #105  Pattern: Tree Construction | Asked at: Amazon, Meta, Microsoft | Time: O(n)  Space: O(n)",
"question": "Construct Binary Tree from Preorder and Inorder",
"explanation": "Problem:\nYou are given the preorder traversal and the inorder traversal of a binary tree. Rebuild the original tree from these two lists.\n\nApproach:\nPreorder always lists the root of whatever subtree you're building FIRST. Once you know the root's value, find its position in inorder — everything before that position belongs to the left subtree, everything after belongs to the right subtree. Repeat this recursively for each side. Use a map from value to index so you can find each root's position instantly instead of scanning every time.",
"code": "function buildTree(preorder, inorder) {\n  const inorderIndex = new Map();\n  inorder.forEach((val, i) => inorderIndex.set(val, i));\n  \n  let preorderIdx = 0;\n  \n  function build(left, right) {\n    if (left > right) return null;\n    \n    const rootVal = preorder[preorderIdx++];\n    const root = new TreeNode(rootVal);\n    \n    const inorderIdx = inorderIndex.get(rootVal);\n    \n    root.left = build(left, inorderIdx - 1);\n    root.right = build(inorderIdx + 1, right);\n    \n    return root;\n  }\n  \n  return build(0, inorder.length - 1);\n}",
"howTo": "1. Being handed two different traversal orders (preorder and inorder) is the signal for a tree-construction problem: preorder tells you where the root is, inorder tells you how to split into left and right subtrees.\n2. Core trick: preorder always lists the root of whatever subtree you're currently building first. Once you know the root's value, find that value's position in inorder — everything before it belongs to the left subtree, everything after belongs to the right subtree.\n3. Steps: take the next unused value from preorder as the root of the current subtree. Look up where that value sits in inorder (use a hash map for instant lookup instead of scanning). Recursively build the left side using the inorder slice before that position, then the right side using the slice after it.\n4. Common mistake: searching for the root's position in inorder with a plain loop every time — that's slow for large trees, always precompute a value-to-index map first. Also make sure you consume preorder values in the right order: root, then fully build the left subtree, then the right.",
"dryRun": {
"input": "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]",
"frames": [
"build(whole range): next preorder value is 3 — this is the root. Find 3 in inorder at index 1. Left subtree = inorder[9], right subtree = inorder[15,20,7].",
"build(left range): next preorder value is 9 — since this range is empty on both sides, node 9 is a leaf.",
"build(right range): next preorder value is 20 — root of this subtree. Find 20 in inorder at index 3. Left = inorder[15], right = inorder[7].",
"build(20's left range): next preorder value is 15 — a leaf node.",
"build(20's right range): next preorder value is 7 — a leaf node.",
"Assemble: node 20 gets left child 15 and right child 7; node 3 gets left child 9 and right child 20."
],
"result": "tree = [3,9,20,null,null,15,7]"
},
"pitfalls": [
"Using a plain loop to find each root's position in inorder instead of a precomputed value-to-index map — this becomes slow for large trees.",
"Getting the build order wrong — you must fully build the left subtree before moving on to the right subtree, since preorder always continues left-first.",
"Duplicate values in the tree break this approach, since it assumes each value maps to exactly one index in inorder.",
"Off-by-one mistakes when splitting the inorder range into 'before root index' and 'after root index'."
],
"patternTakeaway": "If a tree problem gives you preorder and inorder traversals and asks you to rebuild the tree, always think: preorder tells you the root, inorder tells you how to split into left and right, and recurse on each half.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat7-q10",
"guide": "Algorithms Guide",
"topic": "Trees",
"topicNum": 7,
"level": "Hard",
"badge": "[Hard]  LeetCode #124  Pattern: DFS with Side Effect | Asked at: Amazon, Meta, Google | Time: O(n)  Space: O(h)",
"question": "Binary Tree Maximum Path Sum",
"explanation": "Problem:\nA path is any sequence of nodes connected by edges — it does not need to pass through the root, and it can bend at one node. Find the maximum possible sum along any such path. Node values can be negative.\n\nApproach:\nDo a DFS where each call returns the best sum a subtree can contribute UP to its parent — but only using one side (left or right), since a path can't branch once it continues upward. At the same time, for every node, also check the best path sum that passes THROUGH that node using both sides, and keep that in a separate running maximum. Ignore any side that would contribute a negative amount — just treat it as 0.",
"code": "function maxPathSum(root) {\n  let max = -Infinity;\n  \n  function dfs(node) {\n    if (!node) return 0;\n    \n    // Max contribution from each side (0 if negative)\n    const leftGain = Math.max(0, dfs(node.left));\n    const rightGain = Math.max(0, dfs(node.right));\n    \n    // Path passing through current node\n    max = Math.max(max, node.val + leftGain + rightGain);\n    \n    // Return value to parent: must pick ONE side\n    return node.val + Math.max(leftGain, rightGain);\n  }\n  \n  dfs(root);\n  return max;\n}",
"howTo": "1. \"Path doesn't need to pass through the root\" plus \"values can be negative\" tells you a simple top-down running sum will not work — you need a function that returns something limited to its own subtree, while a separate global variable tracks the true best answer.\n2. Core trick: split the idea into two things at each node — (a) the best path passing THROUGH this node, which can use both children and only matters for updating your global best, and (b) the best path this node can hand UP to its parent, which can only use one side, because a path can't fork once it goes upward.\n3. Steps: for each node, get the best contribution from its left and right subtrees, but treat any negative contribution as 0 (just skip that branch, don't hurt your sum). Update the global max with node.value + leftGain + rightGain. Return to the parent node.value + the bigger of leftGain and rightGain — never both.\n4. Common mistake: returning the \"both sides included\" sum up to the parent instead of just one side — once a path leaves a node going up, it can't branch in two directions anymore.",
"dryRun": {
"input": "tree = [-10,9,20,null,null,15,7]",
"frames": [
"dfs(9): a leaf. leftGain=0, rightGain=0. Path through 9 alone = 9. Global max becomes 9. Returns 9 to its parent.",
"dfs(15) and dfs(7): both leaves. Path through 15 = 15 (global max updates to 15). Path through 7 = 7 (doesn't beat 15). Each returns its own value.",
"dfs(20): leftGain = max(0, 15) = 15, rightGain = max(0, 7) = 7. Path through 20 = 20+15+7 = 42. Global max updates to 42. Returns 20 + max(15,7) = 35 to its parent — only the better side.",
"dfs(-10) (root): leftGain = max(0, 9) = 9, rightGain = max(0, 35) = 35. Path through root = -10+9+35 = 34, which is less than the current max of 42, so max stays 42."
],
"result": "return 42 (the path 15 -> 20 -> 7)"
},
"pitfalls": [
"Forgetting to clamp negative contributions to 0 — a negative subtree should be skipped entirely, not subtracted from the sum.",
"Returning the two-sided sum (leftGain + rightGain + node value) up to the parent instead of just the better single side — a path can't fork once it continues upward.",
"Single node tree, even if negative — the answer is just that one node's value.",
"All-negative tree — the answer is the single largest (least negative) node, not 0, because a path must include at least one node."
],
"patternTakeaway": "If a tree problem asks for the best path that can start and end anywhere and might not pass through the root, always think: track a global 'best path through this node' separately from the 'best single-branch value' you return upward to the parent.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat8-q1",
"guide": "Algorithms Guide",
"topic": "Tries & Heap",
"topicNum": 8,
"level": "Medium",
"badge": "[Medium]  LeetCode #208  Pattern: Trie Design | Asked at: Google, Amazon, Meta, Microsoft | Time: O(L) per op  Space: O(N*L)",
"question": "Implement Trie (Prefix Tree)",
"explanation": "Problem:\nBuild a Trie (also called a prefix tree). It must support: insert(word), search(word) for an exact word, and startsWith(prefix) to check if any word starts with that prefix. Tries are used for things like autocomplete and spell-check.\n\nApproach:\nEach node in the tree has two things: a map from letter to child node, and a flag called isEnd that marks 'a real word ends here'.\nTo insert a word: walk down the tree one letter at a time. If a letter's node doesn't exist yet, create it. When you reach the last letter, mark that node's isEnd as true.\nTo search a word: walk down the same way. If any letter is missing, the word doesn't exist. If you reach the end, the word only counts as found if isEnd is true.\nTo check startsWith: walk down the same way, but you do NOT check isEnd — you only care that the path of letters exists.",
"code": "class TrieNode {\n  constructor() {\n    this.children = new Map();\n    this.isEnd = false;\n  }\n}\n \nclass Trie {\n  constructor() {\n    this.root = new TrieNode();\n  }\n  \n  insert(word) {\n    let node = this.root;\n    for (const char of word) {\n      if (!node.children.has(char)) {\n        node.children.set(char, new TrieNode());\n      }\n      node = node.children.get(char);\n    }\n    node.isEnd = true;\n  }\n  \n  search(word) {\n    const node = this._traverse(word);\n    return node !== null && node.isEnd;\n  }\n  \n  startsWith(prefix) {\n    return this._traverse(prefix) !== null;\n  }\n  \n  _traverse(str) {\n    let node = this.root;\n    for (const char of str) {\n      if (!node.children.has(char)) return null;\n      node = node.children.get(char);\n    }\n    return node;\n  }\n}\n \nconst trie = new Trie();\ntrie.insert('apple');\ntrie.search('apple');  // true\ntrie.search('app');    // false (not a complete word)\ntrie.startsWith('app'); // true\ntrie.insert('app');\ntrie.search('app');    // true now",
"howTo": "1. The problem is all about words and prefixes (insert, search, starts-with) — whenever \"prefix\" shows up in an interview question, a trie (prefix tree) is almost always the structure to reach for, much better than scanning a list of strings.\n2. Core trick: think of each letter as one step down a tree. Every node holds a map from character to child node, plus a flag marking \"a full word ends right here.\"\n3. Steps: for insert, walk the word letter by letter, creating a new child node any time one doesn't already exist, then mark the last node's end-flag true. For search, do the same walk, but fail immediately if any letter is missing, and only return true if the final node has its end-flag set. For starts-with, do the same walk but skip the end-flag check — you only care that the whole prefix exists as a path.\n4. Common mistake: mixing up search and starts-with — search must check the end-of-word flag, starts-with must not, since a prefix doesn't need to be a complete word on its own.",
"dryRun": {
"input": "trie.insert('ab'); trie.search('ab'); trie.search('a'); trie.startsWith('a')",
"frames": [
"insert 'ab': at root, letter 'a' is missing, so create a new node for it and move into it.",
"insert 'ab': at the 'a' node, letter 'b' is missing, so create a new node for it, move into it, and mark this node isEnd = true.",
"search 'ab': from root, follow 'a' (exists), then follow 'b' (exists). Reached end of word and isEnd is true -> match.",
"search 'a': from root, follow 'a' (exists). Reached end of word, but this node's isEnd is false (only 'ab' is a full word) -> no match.",
"startsWith 'a': from root, follow 'a' (exists). The path exists, so this returns true — isEnd is not checked here."
],
"result": "search('ab') = true, search('a') = false, startsWith('a') = true"
},
"pitfalls": [
"Forgetting to check isEnd inside search — without it, search would wrongly say a prefix is a full word.",
"Checking isEnd inside startsWith by mistake — a prefix does not need to be a complete word on its own.",
"Not handling an empty string input cleanly.",
"Inserting the same word twice should be harmless (it just marks isEnd again) — make sure your code doesn't break on repeats."
],
"patternTakeaway": "If a question keeps mentioning prefixes, words, or autocomplete, always think: build a trie (prefix tree) where each node maps a letter to a child node and marks where real words end.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat8-q2",
"guide": "Algorithms Guide",
"topic": "Tries & Heap",
"topicNum": 8,
"level": "Medium",
"badge": "[Medium]  LeetCode #211  Pattern: Trie + DFS | Asked at: Meta, Amazon, Google | Time: O(L) add, O(L * 26^d) search  Space: O(N*L)",
"question": "Design Add and Search Words (with .)",
"explanation": "Problem:\nBuild a data structure with addWord(word) and search(word). In search, the character '.' can match any single letter. Example: after adding 'bad', 'dad', 'mad': search('pad') is false, search('.ad') is true, search('b..') is true.\n\nApproach:\nUse a trie just like before for storing words. addWord works exactly like a normal trie insert.\nFor search, walk through the search string with a recursive helper. If the current character is a normal letter, follow only that one matching child (fail if it's missing). If the current character is '.', you don't know which child to follow, so try EVERY child of the current node, and succeed if any one of them leads to a full match. You only return true once you've used the whole string AND landed on a node marked as the end of a word.",
"code": "class WordDictionary {\n  constructor() {\n    this.root = new TrieNode();\n  }\n  \n  addWord(word) {\n    let node = this.root;\n    for (const char of word) {\n      if (!node.children.has(char)) {\n        node.children.set(char, new TrieNode());\n      }\n      node = node.children.get(char);\n    }\n    node.isEnd = true;\n  }\n  \n  search(word) {\n    return this._dfs(word, 0, this.root);\n  }\n  \n  _dfs(word, index, node) {\n    if (index === word.length) return node.isEnd;\n    \n    const char = word[index];\n    \n    if (char === '.') {\n      // Try every child\n      for (const child of node.children.values()) {\n        if (this._dfs(word, index + 1, child)) return true;\n      }\n      return false;\n    } else {\n      if (!node.children.has(char)) return false;\n      return this._dfs(word, index + 1, node.children.get(char));\n    }\n  }\n}",
"howTo": "1. It's the same insert-and-search idea as a plain trie, but now a '.' can match any letter — that wildcard is the clue that a simple trie walk isn't enough. You need to branch and try multiple paths, which means DFS/backtracking layered on top of the trie.\n2. Core trick: whenever you hit a '.', you don't know which child to follow — so try EVERY child from that node and see if any of them leads to a full match.\n3. Steps: build the trie exactly like a normal trie's insert. For search, write a recursive helper that tracks your position in the word. If the current character is a normal letter, follow that one specific child (fail if it's missing). If it's a '.', loop through every child of the current node and recurse into each — succeed the moment any one of them returns true. Base case: once you've used up the whole word, return whether the current node is marked as the end of a word.\n4. Common mistake: forgetting to check the end-of-word flag at the base case (so it accepts a valid prefix as a full match), or not stopping the loop early once one wildcard branch has already found a match.",
"dryRun": {
"input": "wordDict.addWord('bad'); wordDict.search('b.d')",
"frames": [
"addWord('bad'): walk root -> 'b' -> 'a' -> 'd', creating nodes as needed, and mark the last node isEnd = true.",
"search('b.d'), index=0, char='b': normal letter, so follow the single child 'b' (it exists), then recurse with index=1.",
"index=1, char='.': wildcard, so try every child of the 'b' node. The only child is 'a'. Recurse into it with index=2.",
"index=2, char='d': normal letter, follow the single child 'd' of the 'a' node (it exists), recurse with index=3.",
"index=3 equals the word length, so check this node's isEnd. It is true, so return true. This true bubbles all the way back up."
],
"result": "search('b.d') = true"
},
"pitfalls": [
"Forgetting to check isEnd at the base case, which would accept a valid prefix as a full match.",
"When hitting '.', only trying the first child instead of trying every child at that node.",
"Not stopping as soon as one wildcard branch succeeds — technically still correct, but wastes time exploring extra branches unnecessarily.",
"Mixing up 'index reached the end of the string' with 'node exists' — you need both conditions together."
],
"patternTakeaway": "If a trie problem lets one character match anything (a wildcard like '.'), always think: trie plus DFS — when you hit the wildcard, branch out and try every child.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat8-q3",
"guide": "Algorithms Guide",
"topic": "Tries & Heap",
"topicNum": 8,
"level": "Hard",
"badge": "[Hard]  LeetCode #212  Pattern: Trie + Backtracking | Asked at: Amazon, Microsoft, Google | Time: O(M * 4^L)  Space: O(N*L)",
"question": "Word Search II (Trie + DFS Backtracking)",
"explanation": "Problem:\nYou get a 2D grid of letters and a list of words. Find every word from the list that can be spelled by walking between adjacent cells (up, down, left, right). You cannot reuse the same cell twice inside one word. Example: board with letters and words ['oath','pea','eat','rain'] should find ['oath','eat'].\n\nApproach:\nSearching for each word separately is slow, since many words share the same starting letters. Instead, build ONE trie out of all the words first. Then do a single DFS sweep over the whole grid, starting from every cell. At each step, only keep exploring a neighbor if that letter exists as a child in the trie — this stops you from wasting time on paths that can never spell a real word. When you land on a trie node marked as the end of a word, add that word to your results. Mark each cell as visited while you explore from it (for example, temporarily overwrite it), and restore it afterward (backtrack) so other paths can still use that cell.",
"code": "function findWords(board, words) {\n  // Build trie\n  const root = new TrieNode();\n  for (const word of words) {\n    let node = root;\n    for (const char of word) {\n      if (!node.children.has(char)) {\n        node.children.set(char, new TrieNode());\n      }\n      node = node.children.get(char);\n    }\n    node.word = word; // store word at end node\n  }\n  \n  const result = new Set();\n  const rows = board.length;\n  const cols = board[0].length;\n  \n  function dfs(r, c, node) {\n    if (r < 0 || r >= rows || c < 0 || c >= cols) return;\n    \n    const char = board[r][c];\n    if (char === '#' || !node.children.has(char)) return;\n    \n    const childNode = node.children.get(char);\n    if (childNode.word) result.add(childNode.word);\n    \n    board[r][c] = '#'; // mark visited\n    dfs(r + 1, c, childNode);\n    dfs(r - 1, c, childNode);\n    dfs(r, c + 1, childNode);\n    dfs(r, c - 1, childNode);\n    board[r][c] = char; // unmark (backtrack)\n  }\n  \n  for (let r = 0; r < rows; r++) {\n    for (let c = 0; c < cols; c++) {\n      dfs(r, c, root);\n    }\n  }\n  \n  return [...result];\n}",
"howTo": "1. You need to find many words at once inside a grid — searching for each word separately would repeat a lot of work. The moment several words share prefixes, think trie. Combine that with \"find a path through a grid\" which is DFS with backtracking and a visited marker.\n2. Core trick: build ONE trie out of all the words first, then do a single DFS sweep over the grid — at every step, only keep exploring a direction if the current letter exists as a child in the trie. The trie prunes away paths that can never spell a real word.\n3. Steps: insert every word into a shared trie, and stamp the complete word string onto its ending node (so you can grab it directly without rebuilding it from the path). Then, starting from every cell in the grid, DFS in all four directions, but only continue into a neighbor if the trie has a matching child for that letter. Mark the current cell as visited (temporarily overwrite it) before recursing deeper, then restore it afterward. Any time you land on a trie node that has a stored word, add that word to your results.\n4. Common mistake: forgetting to restore (un-mark) the visited cell after backtracking out of it — later paths starting from a different cell need to reuse that same cell.",
"dryRun": {
"input": "board = [['o','a'],['e','t']], words = ['oa','et']",
"frames": [
"Build the trie: root -> 'o' -> 'a' (this node stores word 'oa'); root -> 'e' -> 't' (this node stores word 'et').",
"DFS starts at (0,0)='o'. The trie root has a child 'o', so move into it. Mark (0,0) as visited.",
"From (0,0), try neighbor (0,1)='a'. The 'o' trie node has a child 'a' — move into it. This node stores word 'oa', so add 'oa' to the results. Then unmark (0,1) after exploring it.",
"Unmark (0,0) and move on to start cell (1,0)='e'. The trie root has a child 'e', so move into it. Mark (1,0) as visited.",
"From (1,0), try neighbor (1,1)='t'. The 'e' trie node has a child 't' storing word 'et', so add 'et' to the results."
],
"result": "['oa', 'et']"
},
"pitfalls": [
"Forgetting to restore (un-mark) a visited cell after backtracking out of it — this blocks valid paths that start from a different cell.",
"Running a separate DFS per word instead of one shared trie sweep — correct but much slower.",
"Adding the same word to the results twice — use a Set for the results, not a plain array.",
"Not storing the actual word string on the trie's end node — forces you to rebuild the word from the path, which is extra work and error-prone."
],
"patternTakeaway": "If you need to find many words at once inside a grid, always think: build one shared trie from all the words, then do DFS with backtracking over the grid, letting the trie prune paths that can never spell a real word.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat8-q4",
"guide": "Algorithms Guide",
"topic": "Tries & Heap",
"topicNum": 8,
"level": "Medium",
"badge": "[Medium]  LeetCode #215  Pattern: Heap / QuickSelect | Asked at: Amazon, Meta, Google, LinkedIn | Time: O(n log k) heap / O(n) avg quickselect  Space: O(k)",
"question": "Kth Largest Element in Array",
"explanation": "Problem:\nFind the kth LARGEST number in an unsorted array. Example: [3,2,1,5,6,4], k=2 -> 5.\n\nApproach:\nThe simplest way is to sort the whole array — it works but does more work than necessary (O(n log n)).\nA better way: keep a min-heap that holds only k numbers. Go through the array and push every number onto the heap. Whenever the heap grows bigger than k, remove its smallest number (pop) — it can't be one of the true top-k, so it's safe to drop. After going through the whole array, the top of the heap (its smallest value) is exactly the kth largest number, because only the k biggest numbers ever survive in the heap.\nAn even faster average-case approach called quickselect (a partial quicksort) also exists, worth mentioning to an interviewer.",
"code": "// Approach 1: Sort\nfunction findKthLargestSort(nums, k) {\n  return nums.sort((a, b) => b - a)[k - 1];\n}\n \n// Approach 2: Min-Heap (using simplified heap)\n// Note: JS doesn't have built-in heap. Here's a simple impl:\nclass MinHeap {\n  constructor() { this.heap = []; }\n  size() { return this.heap.length; }\n  peek() { return this.heap[0]; }\n  push(val) {\n    this.heap.push(val);\n    this._bubbleUp(this.heap.length - 1);\n  }\n  pop() {\n    const top = this.heap[0];\n    const last = this.heap.pop();\n    if (this.heap.length > 0) {\n      this.heap[0] = last;\n      this._sinkDown(0);\n    }\n    return top;\n  }\n  _bubbleUp(i) {\n    while (i > 0) {\n      const parent = Math.floor((i - 1) / 2);\n      if (this.heap[parent] <= this.heap[i]) break;\n      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];\n      i = parent;\n    }\n  }\n  _sinkDown(i) {\n    const n = this.heap.length;\n    while (true) {\n      const left = 2 * i + 1, right = 2 * i + 2;\n      let smallest = i;\n      if (left < n && this.heap[left] < this.heap[smallest]) smallest = left;\n      if (right < n && this.heap[right] < this.heap[smallest]) smallest = right;\n      if (smallest === i) break;\n      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];\n      i = smallest;\n    }\n  }\n}\n \nfunction findKthLargest(nums, k) {\n  const heap = new MinHeap();\n  for (const num of nums) {\n    heap.push(num);\n    if (heap.size() > k) heap.pop();\n  }\n  return heap.peek();\n}\n \n// Approach 3: QuickSelect\nfunction findKthLargestQS(nums, k) {\n  k = nums.length - k; // convert to kth smallest\n  \n  function partition(left, right) {\n    const pivot = nums[right];\n    let i = left;\n    for (let j = left; j < right; j++) {\n      if (nums[j] <= pivot) {\n        [nums[i], nums[j]] = [nums[j], nums[i]];\n        i++;\n      }\n    }\n    [nums[i], nums[right]] = [nums[right], nums[i]];\n    return i;\n  }\n  \n  let left = 0, right = nums.length - 1;\n  while (true) {\n    const pivotIdx = partition(left, right);\n    if (pivotIdx === k) return nums[pivotIdx];\n    if (pivotIdx < k) left = pivotIdx + 1;\n    else right = pivotIdx - 1;\n  }\n}",
"howTo": "1. \"Kth largest\" (or smallest) in an unsorted array is the classic trigger for a heap — sorting the whole array works but does more work than you need for just one position.\n2. Core trick: keep a min-heap that holds only the k largest numbers seen so far. Since it's a min-heap, its very top is always the smallest of those k largest numbers — which is exactly your kth largest answer.\n3. Steps: walk through the array, pushing every number onto the min-heap. The moment the heap grows past size k, pop off its smallest item (it can't be one of the true top-k, so it's safe to drop). After you finish the array, the top of the heap is your answer.\n4. Worth mentioning to the interviewer: quickselect (a partial quicksort) solves this in average O(n) time with no heap at all, if they want an even faster approach.\n5. Common mistake: building a max-heap of every element instead of a min-heap capped at size k — that gives the right answer but throws away the whole point of using a heap here, since you'd store everything instead of just the top k.",
"dryRun": {
"input": "nums = [3,2,1,5,6,4], k = 2",
"frames": [
"Push 3. heap = {3} (size 1 <= k, keep everything so far).",
"Push 2. heap = {2,3} (size 2 <= k, keep). The heap's smallest (top) is 2.",
"Push 1. Heap size becomes 3, which is more than k=2, so pop the smallest (1). heap = {2,3}.",
"Push 5. Heap size becomes 3 again, pop the smallest (2). heap = {3,5}.",
"Push 6. Heap size becomes 3, pop the smallest (3). heap = {5,6}.",
"Push 4. Heap size becomes 3, pop the smallest — that's 4 itself (4 < 5 and 4 < 6). heap stays {5,6}."
],
"result": "heap's smallest remaining value (top) = 5 -> return 5"
},
"pitfalls": [
"Using a max-heap of every number instead of a min-heap capped at size k — it works but throws away the whole benefit of the heap.",
"Off-by-one when comparing heap size to k (using >= instead of > or vice versa).",
"Assuming duplicates need special handling — they don't, the same logic works fine with repeated values.",
"Not considering an empty array or a k larger than the array length."
],
"patternTakeaway": "If you keep needing the kth largest/smallest value, or the top-k items, from a changing or streaming set, always think: a heap (priority queue) capped at size k.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat8-q5",
"guide": "Algorithms Guide",
"topic": "Tries & Heap",
"topicNum": 8,
"level": "Medium",
"badge": "[Medium]  LeetCode #973  Pattern: Max-Heap of size K | Asked at: Meta, Amazon, LinkedIn | Time: O(n log k)  Space: O(k)",
"question": "K Closest Points to Origin",
"explanation": "Problem:\nGiven a list of points (x, y), return the k points closest to the origin (0,0), using straight-line distance. Example: points = [[1,3],[-2,2]], k = 1 -> [[-2,2]].\n\nApproach:\nThis is like the kth-largest problem, but now you want the k SMALLEST distances, so use a max-heap capped at size k. That way the heap's top is always the current farthest point among the k you're keeping — the one you can throw away when something closer shows up.\nFor each point, compute its squared distance to the origin (skip the real square root — it's slower and unnecessary, since squared distance keeps the same ordering). If the heap has fewer than k points, just add the new point. Otherwise, only replace the heap's top (the current farthest) if the new point's distance is smaller.",
"code": "function kClosest(points, k) {\n  // Sort by distance (simplest but O(n log n))\n  return points\n    .sort((a, b) => (a[0]**2 + a[1]**2) - (b[0]**2 + b[1]**2))\n    .slice(0, k);\n}\n \n// Better: Max-heap of size k\nfunction kClosestHeap(points, k) {\n  // Custom max-heap by distance\n  // For brevity, using sort-based approach with all logic\n  // In real interview, implement heap\n  \n  const heap = []; // max-heap of [distance, point]\n  \n  for (const [x, y] of points) {\n    const dist = x*x + y*y;\n    \n    if (heap.length < k) {\n      heap.push({ dist, point: [x, y] });\n      // bubble up by dist (max-heap)\n    } else if (dist < heap[0].dist) {\n      heap[0] = { dist, point: [x, y] };\n      // sink down\n    }\n  }\n  \n  return heap.map(item => item.point);\n}",
"howTo": "1. \"K closest points\" is the same family of problem as \"kth largest\" — again a heap signal, but this time you want to keep the k SMALLEST distances, so you need a max-heap capped at size k, so you can always kick out the current farthest point.\n2. Core trick: keep a max-heap holding at most k points. Whenever a new point turns out to be closer than the current farthest point sitting in the heap, swap it in and drop the old farthest one.\n3. Steps: for every point, compute its squared distance to the origin (skip the actual square root — it's unnecessary work since squared distance keeps the same ordering). If the heap has fewer than k points so far, just add the new point. Otherwise, only replace the heap's top (the farthest point) if the new point's distance is smaller.\n4. Common mistake: sorting the whole array first when k is much smaller than the array size — it gives the right answer but defeats the purpose of using a heap; also make sure you compare distances consistently (don't mix real distance with squared distance).",
"dryRun": {
"input": "points = [[1,3],[-2,2],[5,8],[0,1]], k = 2",
"frames": [
"Point [1,3]: distance = 1+9 = 10. Heap has 0 < k=2 points, so add it. heap = {10}.",
"Point [-2,2]: distance = 4+4 = 8. Heap has 1 < k=2 points, so add it. heap = {10,8}, farthest (top) = 10.",
"Point [5,8]: distance = 25+64 = 89. Heap already has k=2 points and 89 is not smaller than the current farthest (10), so skip this point.",
"Point [0,1]: distance = 0+1 = 1. Heap has k=2 points, and 1 IS smaller than the current farthest (10), so replace it: remove [1,3] (distance 10), add [0,1] (distance 1)."
],
"result": "heap ends with [-2,2] (distance 8) and [0,1] (distance 1) -> return [[-2,2],[0,1]]"
},
"pitfalls": [
"Computing the real square-root distance instead of squared distance — works but is slower and can introduce floating point issues.",
"Using a min-heap instead of a max-heap by mistake — the opposite of what the kth-largest problem uses.",
"Sorting the whole array when k is much smaller than the array — correct but defeats the purpose of using a heap.",
"Comparing distances inconsistently, mixing squared and real distance in the same comparison."
],
"patternTakeaway": "If you keep needing the k smallest/closest items out of many, always think: a max-heap capped at size k, so you can drop the current worst item whenever something better shows up.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat8-q6",
"guide": "Algorithms Guide",
"topic": "Tries & Heap",
"topicNum": 8,
"level": "Hard",
"badge": "[Hard]  LeetCode #295  Pattern: Two Heaps | Asked at: Amazon, Google, Microsoft | Time: O(log n) add, O(1) median  Space: O(n)",
"question": "Find Median from Data Stream",
"explanation": "Problem:\nBuild a data structure that supports addNum(num) to add a number from an incoming stream, and findMedian() to return the median of every number seen so far. Example: addNum(1); addNum(2); findMedian() -> 1.5; addNum(3); findMedian() -> 2.0.\n\nApproach:\nUse TWO heaps. A max-heap called 'small' holds the smaller half of the numbers (its top is the biggest of the small numbers). A min-heap called 'large' holds the larger half (its top is the smallest of the big numbers). Keep the two heaps balanced — their sizes should always be equal, or differ by at most 1.\nWhen a new number arrives: add it to 'small' first. Then check if 'small''s top is now bigger than 'large''s top — if so, move that number over to 'large' to keep the ordering correct. Then rebalance: if one heap ends up more than one bigger than the other, move its top item to the smaller heap.\nTo read the median: if both heaps are the same size, average their two top values. If one heap is bigger, its top alone is the median.",
"code": "class MedianFinder {\n  constructor() {\n    this.small = new MaxHeap(); // smaller half\n    this.large = new MinHeap(); // larger half\n  }\n  \n  addNum(num) {\n    // Always add to small first\n    this.small.push(num);\n    \n    // Move max of small to large to maintain order\n    if (this.small.size() > 0 && this.large.size() > 0 &&\n        this.small.peek() > this.large.peek()) {\n      this.large.push(this.small.pop());\n    }\n    \n    // Balance sizes\n    if (this.small.size() > this.large.size() + 1) {\n      this.large.push(this.small.pop());\n    } else if (this.large.size() > this.small.size() + 1) {\n      this.small.push(this.large.pop());\n    }\n  }\n  \n  findMedian() {\n    if (this.small.size() > this.large.size()) {\n      return this.small.peek();\n    } else if (this.large.size() > this.small.size()) {\n      return this.large.peek();\n    } else {\n      return (this.small.peek() + this.large.peek()) / 2;\n    }\n  }\n}\n \n// Note: MaxHeap and MinHeap implementations needed (similar to before)",
"howTo": "1. You need the median of numbers that keep arriving one at a time, and it must update after every new number — re-sorting on every insert is too slow. This exact shape (a growing stream, need a running middle value) is the classic signal for the \"two heaps\" pattern.\n2. Core trick: split all numbers seen so far into two halves — a max-heap holding the smaller half (so its top is the biggest of the small numbers) and a min-heap holding the larger half (so its top is the smallest of the big numbers). Keep the two halves close to equal in size at all times.\n3. Steps: when a new number arrives, add it to the max-heap (small half) first. Then check if the max-heap's top is now bigger than the min-heap's top — if so, move that top number over to the min-heap to keep the two halves properly ordered. Finally, rebalance: if one heap ends up with more than one extra element compared to the other, move its top item over to the smaller heap.\n4. To read the median: if both heaps are the same size, average their two top values. If one heap is bigger, its top alone is the median.\n5. Common mistake: skipping the rebalance step after an insert — if the two heaps are allowed to drift apart in size, the median calculation silently becomes wrong.",
"dryRun": {
"input": "addNum(1); addNum(2); findMedian(); addNum(3); findMedian()",
"frames": [
"addNum(1): push 1 into 'small'. small={1}, large={}. Sizes are 1 and 0, already balanced.",
"addNum(2): push 2 into 'small'. small={1,2}. Rebalance: small has 2 items, large has 0, that's more than one extra, so move small's top (2) over to large. small={1}, large={2}.",
"findMedian(): sizes are equal (1 and 1), so average their tops: (1+2)/2 = 1.5.",
"addNum(3): push 3 into 'small'. small={1,3}, top of small = 3. Since 3 > large's top (2), move 3 over to large. small={1}, large={2,3}. Sizes 1 and 2 are balanced (differ by 1).",
"findMedian(): large (size 2) is bigger than small (size 1), so the median is large's top = 2."
],
"result": "medians returned: 1.5, then 2.0"
},
"pitfalls": [
"Forgetting to rebalance the heap sizes after inserting — the heaps drift apart and the median calculation silently becomes wrong.",
"Mixing up which heap is the max-heap and which is the min-heap.",
"Not moving a number across heaps when it breaks the ordering (small's top bigger than large's top).",
"Getting the odd-sized-stream rule backwards — deciding wrong which heap should hold the extra element."
],
"patternTakeaway": "If you need a running median (or a running boundary between a smaller half and a larger half) while numbers keep streaming in, always think: two heaps — a max-heap for the smaller half, a min-heap for the larger half, kept balanced in size.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat9-q1",
"guide": "Algorithms Guide",
"topic": "Backtracking",
"topicNum": 9,
"level": "Medium",
"badge": "[Medium]  LeetCode #78  Pattern: Backtracking | Asked at: Meta, Amazon, Google | Time: O(n * 2^n)  Space: O(n)",
"question": "Subsets",
"explanation": "Problem:\nGiven a list of distinct numbers, return every possible subset (this is called the power set), including the empty subset and the full list itself. No duplicate subsets allowed. Example: nums = [1,2,3] -> [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]].\n\nApproach:\nThis is classic backtracking. For every number, you make one of two choices: include it, or skip it. Trying both choices for every number naturally produces every subset (2^n total subsets).\nUse a recursive helper that carries the subset built so far and a 'start' index. At every call, first save a COPY of the current subset to the results — every point in the recursion is itself a valid subset. Then loop over the remaining numbers starting from 'start': add one number, recurse, then remove it again (this is the 'backtrack' step) before trying the next number.",
"code": "function subsets(nums) {\n  const result = [];\n  \n  function backtrack(start, current) {\n    result.push([...current]); // copy current\n    \n    for (let i = start; i < nums.length; i++) {\n      current.push(nums[i]);\n      backtrack(i + 1, current);\n      current.pop(); // backtrack\n    }\n  }\n  \n  backtrack(0, []);\n  return result;\n}\n \nsubsets([1, 2, 3]);\n// [[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]\n \n// Iterative approach\nfunction subsetsIter(nums) {\n  let result = [[]];\n  \n  for (const num of nums) {\n    const newSubsets = result.map(sub => [...sub, num]);\n    result = result.concat(newSubsets);\n  }\n  \n  return result;\n}",
"howTo": "1. The question says \"return ALL possible subsets\" — when a problem wants every possible combination, that's your cue to reach for backtracking, not a clever one-pass loop.\n2. Core idea: for every number in the list, you make one of two choices — include it or skip it. Trying both choices for every number naturally gives you every subset.\n3. Build it like this: write a recursive helper that carries the current partial subset and a \"start\" index. First thing inside: save a COPY of the current subset as one valid answer (every point in the recursion is itself a subset). Then loop over the remaining numbers, add one, recurse on the rest, then remove it again before trying the next number.\n4. Common mistake: pushing the current array by reference instead of a copy — since the same array keeps changing, all saved subsets would end up showing the final state instead of their own snapshot.",
"dryRun": {
"input": "nums = [1,2]",
"frames": [
"backtrack(start=0, current=[]): save a copy of [] to results. results = [[]].",
"Loop i=0 (num=1): push 1, current=[1]. Recurse backtrack(start=1, current=[1]): save a copy of [1]. results = [[],[1]].",
"Inside that call, loop i=1 (num=2): push 2, current=[1,2]. Recurse backtrack(start=2, current=[1,2]): save [1,2]. results = [[],[1],[1,2]]. No more numbers, return, then pop 2 (backtrack), current=[1].",
"Return from that inner call, pop 1 (backtrack), current=[].",
"Back at the top level, loop i=1 (num=2): push 2, current=[2]. Recurse: save [2]. results = [[],[1],[1,2],[2]]. No more numbers, pop 2, current=[]."
],
"result": "[[], [1], [1,2], [2]]"
},
"pitfalls": [
"Saving the current array by reference instead of a copy — every saved subset would end up reflecting the final state instead of its own snapshot.",
"Forgetting to pop (undo) the last number after recursing — breaks all later branches.",
"Starting the inner loop at index 0 instead of 'start' — creates duplicate subsets in different orders.",
"Forgetting the empty subset — it needs to be saved too, right at the very first call before the loop starts."
],
"patternTakeaway": "If a question asks for 'return ALL possible subsets/combinations' where each item is either included or not, always think: backtracking — save the current path first, then loop, include, recurse, undo.",
"pattern": "Recursion & Backtracking"
},
{
"id": "algo-cat9-q2",
"guide": "Algorithms Guide",
"topic": "Backtracking",
"topicNum": 9,
"level": "Medium",
"badge": "[Medium]  LeetCode #39  Pattern: Backtracking | Asked at: Amazon, Meta, Microsoft | Time: O(2^t)  Space: O(t) recursion",
"question": "Combination Sum",
"explanation": "Problem:\nGiven candidate numbers and a target, find every unique combination of candidates that adds up exactly to the target. The same number can be used more than once. No duplicate combinations allowed. Example: candidates = [2,3,6,7], target = 7 -> [[2,2,3],[7]].\n\nApproach:\nBacktracking again, but this time numbers can repeat. To avoid counting the same combination twice in different orders (like [2,3,2] and [3,2,2]), always pick candidates in order — each recursive call only looks from the current index onward, never backward.\nTrack the remaining amount still needed. If remaining hits exactly 0, you found a valid combination — save it. If remaining goes below 0, that path can never work, so stop exploring it right away (this is called pruning). To allow reusing a candidate, when you recurse after picking candidates[i], pass 'i' again, not 'i + 1'.",
"code": "function combinationSum(candidates, target) {\n  const result = [];\n  \n  function backtrack(start, current, remaining) {\n    if (remaining === 0) {\n      result.push([...current]);\n      return;\n    }\n    if (remaining < 0) return;\n    \n    for (let i = start; i < candidates.length; i++) {\n      current.push(candidates[i]);\n      // Allow REUSING current candidate -> pass i, not i+1\n      backtrack(i, current, remaining - candidates[i]);\n      current.pop();\n    }\n  }\n  \n  backtrack(0, [], target);\n  return result;\n}\n \ncombinationSum([2, 3, 6, 7], 7);  // [[2,2,3],[7]]\ncombinationSum([2, 3, 5], 8);     // [[2,2,2,2],[2,3,3],[3,5]]",
"howTo": "1. The question asks for every unique combination that sums to a target, and lets you reuse the same number many times — \"find all ways\" plus \"numbers can repeat\" is a classic backtracking-with-reuse setup.\n2. Core idea: at each step, try adding one candidate number and check if the leftover target still makes sense; if it goes negative, that path is dead, so stop exploring it (this is called pruning).\n3. Build order: recurse with a start index, the combination built so far, and the remaining amount needed. If remaining hits exactly 0, save the combination. If it goes below 0, return immediately. Otherwise loop from start to the end, add a candidate, recurse WITHOUT moving the start index forward (so the same number can be picked again), then remove it and try the next candidate.\n4. Watch out for: passing \"i\" instead of \"i + 1\" to the recursive call is what allows reuse — pass \"i + 1\" by accident and you silently turn this into a no-repeats problem with wrong answers.",
"dryRun": {
"input": "candidates = [2,3], target = 5",
"frames": [
"backtrack(start=0, current=[], remaining=5): remaining is not 0 or negative. Loop i=0 (candidate 2): push 2, current=[2], remaining becomes 3.",
"Recurse backtrack(start=0, current=[2], remaining=3): loop i=0 (2) again since reuse is allowed: push 2, current=[2,2], remaining becomes 1.",
"Recurse backtrack(start=0, current=[2,2], remaining=1): loop i=0 (2): push 2, current=[2,2,2], remaining becomes -1 -> dead end, return immediately, pop 2 back to [2,2].",
"Still inside that call, loop i=1 (3): push 3, current=[2,2,3], remaining becomes -2 -> dead end, return, pop 3 back to [2,2]. No more candidates, return, pop 2 back to [2].",
"Back at current=[2], remaining=3, loop i=1 (3): push 3, current=[2,3], remaining becomes 0 -> save [2,3] to results!"
],
"result": "[[2,3]]"
},
"pitfalls": [
"Passing 'i + 1' instead of 'i' when recursing — accidentally disallows reusing the same number.",
"Not stopping (pruning) as soon as remaining goes negative — wastes time exploring paths that can never work.",
"Starting the loop at index 0 instead of 'start' — creates duplicate combinations in different orders.",
"Forgetting to pop the current number after recursing (the backtrack step)."
],
"patternTakeaway": "If you need combinations that sum to a target and numbers can be reused, always think: backtracking that passes the same start index forward (not index+1) to allow repeats, and prunes as soon as the remaining sum goes negative.",
"pattern": "Recursion & Backtracking"
},
{
"id": "algo-cat9-q3",
"guide": "Algorithms Guide",
"topic": "Backtracking",
"topicNum": 9,
"level": "Medium",
"badge": "[Medium]  LeetCode #46  Pattern: Backtracking | Asked at: Meta, Amazon, Microsoft | Time: O(n * n!)  Space: O(n)",
"question": "Permutations",
"explanation": "Problem:\nGiven a list of distinct numbers, return every possible ordering (permutation) of them. Example: nums = [1,2,3] -> [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]].\n\nApproach:\nBacktracking with a 'used' tracker. Unlike subsets, order matters here, so at every position you can pick ANY number that hasn't been used yet, not just numbers after a moving start index.\nBuild one full permutation at a time: at each step, loop over every number, skip the ones already used, mark the chosen one as used, add it to the current path, recurse, then undo (unmark it and remove it) before trying the next number. When the current path reaches full length, save a copy of it.",
"code": "function permute(nums) {\n  const result = [];\n  const used = new Array(nums.length).fill(false);\n  \n  function backtrack(current) {\n    if (current.length === nums.length) {\n      result.push([...current]);\n      return;\n    }\n    \n    for (let i = 0; i < nums.length; i++) {\n      if (used[i]) continue;\n      \n      used[i] = true;\n      current.push(nums[i]);\n      backtrack(current);\n      current.pop();\n      used[i] = false;\n    }\n  }\n  \n  backtrack([]);\n  return result;\n}\n \npermute([1, 2, 3]);\n// [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
"howTo": "1. The question wants every possible ORDERING of the numbers, not subsets — when order matters and you need every arrangement, that's backtracking with a \"used\" tracker.\n2. Core idea: build one full-length permutation at a time by picking, at each position, any number you haven't already placed; once you reach full length, that's one complete answer.\n3. Build order: keep a \"used\" boolean array the same length as the input. Recurse with the current partial permutation. Base case: when its length equals nums.length, save a copy. Otherwise loop over every number, skip ones marked used, mark it used, add it, recurse, then unmark it and remove it (backtrack) before trying the next number.\n4. Common mistake: forgetting to reset \"used[i] = false\" after the recursive call — without undoing the choice, later branches think that number is permanently gone and you'll miss most permutations.",
"dryRun": {
"input": "nums = [1,2]",
"frames": [
"backtrack(current=[]): length 0 is not 2. Loop i=0 (num=1): not used. Mark used[0]=true, push 1, current=[1].",
"Recurse backtrack(current=[1]): length 1 is not 2. i=0 is used, skip. i=1 (num=2): not used. Mark used[1]=true, push 2, current=[1,2].",
"Recurse backtrack(current=[1,2]): length 2 equals 2, save a copy [1,2]. results = [[1,2]]. Return.",
"Back up: pop 2, unmark used[1]=false, current=[1]. Loop finished, return. Back up again: pop 1, unmark used[0]=false, current=[].",
"Loop continues at the top level: i=1 (num=2): not used. Mark used[1]=true, push 2, current=[2]. Recurse and eventually adds 1, producing [2,1]."
],
"result": "[[1,2], [2,1]]"
},
"pitfalls": [
"Forgetting to reset used[i] = false after the recursive call — later branches think that number is permanently gone, and most permutations get missed.",
"Looping from a 'start' index like in Subsets/Combination Sum instead of always checking 'used' from index 0 — permutations need to revisit earlier numbers in different positions.",
"Saving the current array by reference instead of copying it.",
"Not handling duplicate numbers in the input (this basic version assumes all numbers are distinct)."
],
"patternTakeaway": "If you need every possible ORDERING of items, not just groupings, always think: backtracking with a 'used' tracker, looping from index 0 every time instead of a moving start index.",
"pattern": "Recursion & Backtracking"
},
{
"id": "algo-cat9-q4",
"guide": "Algorithms Guide",
"topic": "Backtracking",
"topicNum": 9,
"level": "Medium",
"badge": "[Medium]  LeetCode #79  Pattern: DFS Backtracking on Grid | Asked at: Meta, Amazon, Microsoft | Time: O(m*n * 4^L)  Space: O(L)",
"question": "Word Search",
"explanation": "Problem:\nGiven a 2D grid of letters and a word, return true if the word can be traced by moving between adjacent cells (up, down, left, right), without reusing the same cell twice. Example: a grid and word 'ABCCED' -> true.\n\nApproach:\nTry starting a search from every cell in the grid. From a starting cell, do DFS trying to match the word one letter at a time by stepping to a neighboring cell. If a step doesn't match the needed letter, goes out of bounds, or lands on an already-used cell, give up on that path right away.\nTemporarily mark a cell as visited (for example, overwrite it with a placeholder character) while exploring from it, then restore its original letter afterward — this is the backtracking step, and it lets other search paths reuse that cell later.",
"code": "function exist(board, word) {\n  const rows = board.length;\n  const cols = board[0].length;\n  \n  function dfs(r, c, index) {\n    if (index === word.length) return true;\n    \n    if (r < 0 || r >= rows || c < 0 || c >= cols ||\n        board[r][c] !== word[index]) {\n      return false;\n    }\n    \n    const original = board[r][c];\n    board[r][c] = '#'; // mark visited\n    \n    const found = dfs(r + 1, c, index + 1) ||\n                  dfs(r - 1, c, index + 1) ||\n                  dfs(r, c + 1, index + 1) ||\n                  dfs(r, c - 1, index + 1);\n    \n    board[r][c] = original; // restore\n    return found;\n  }\n  \n  for (let r = 0; r < rows; r++) {\n    for (let c = 0; c < cols; c++) {\n      if (dfs(r, c, 0)) return true;\n    }\n  }\n  \n  return false;\n}",
"howTo": "1. You're searching a grid for a path of adjacent letters that spells a word — \"adjacent cells, can't reuse a cell\" is the signature of DFS with backtracking on a grid.\n2. Core idea: from any starting cell, try to match the word one letter at a time by stepping to a neighboring cell; if a step ever doesn't match, immediately give up on that path.\n3. Build order: for every cell in the grid, start a DFS trying to match word[0]. Inside DFS: if you've matched the whole word, return true. If the current cell is out of bounds, already used, or doesn't match the next needed letter, return false. Otherwise temporarily mark the cell as visited, try all 4 directions, and — this is the backtracking part — restore the cell's original letter afterward whether or not that path succeeded.\n4. Common mistake: forgetting to restore the cell after exploring it — if you don't put the original letter back, an unrelated path starting elsewhere in the grid will wrongly think that cell is blocked.",
"dryRun": {
"input": "board = [['A','B'],['S','C']], word = 'ABC'",
"frames": [
"Start dfs(0,0,index=0): board[0][0]='A' matches word[0]='A'. Mark board[0][0]='#' (visited). Try the 4 neighbors for index=1.",
"dfs(1,0,index=1): board[1][0]='S', word[1]='B' — no match, return false.",
"dfs(0,1,index=1): board[0][1]='B' matches word[1]='B'. Mark board[0][1]='#'. Try neighbors for index=2.",
"dfs(1,1,index=2): board[1][1]='C' matches word[2]='C'. index+1=3 equals word.length -> return true.",
"true bubbles back up through both recursive calls; we can stop immediately since the word was found."
],
"result": "true"
},
"pitfalls": [
"Forgetting to restore the cell's original letter after backtracking — later paths, even from a different starting cell, would wrongly think that cell is permanently blocked.",
"Not checking grid bounds before checking the letter — can cause an out-of-bounds read.",
"Reusing the same cell twice inside one path attempt — must mark it visited during the walk.",
"Stopping the outer loop too early instead of trying every possible starting cell."
],
"patternTakeaway": "If you need to trace a path of adjacent cells in a grid without reusing a cell, always think: DFS with backtracking — mark the cell visited going in, restore it going back out.",
"pattern": "Recursion & Backtracking"
},
{
"id": "algo-cat9-q5",
"guide": "Algorithms Guide",
"topic": "Backtracking",
"topicNum": 9,
"level": "Medium",
"badge": "[Medium]  LeetCode #17  Pattern: Backtracking | Asked at: Amazon, Meta, Google | Time: O(4^n)  Space: O(n)",
"question": "Letter Combinations of a Phone Number",
"explanation": "Problem:\nGiven a string of digits from 2-9, return every letter combination the number could represent, using the old phone-keypad mapping (2=abc, 3=def, ..., 9=wxyz). Example: '23' -> ['ad','ae','af','bd','be','bf','cd','ce','cf'].\n\nApproach:\nBacktracking. Build the answer string one digit at a time. For the current digit, look up its possible letters and try each one; for every choice, recurse to build the rest of the string using the remaining digits. When you've used every digit, save the completed string. If the input string is empty, return an empty list right away, not a list containing one empty string.",
"code": "function letterCombinations(digits) {\n  if (!digits) return [];\n  \n  const map = {\n    '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',\n    '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'\n  };\n  \n  const result = [];\n  \n  function backtrack(index, current) {\n    if (index === digits.length) {\n      result.push(current);\n      return;\n    }\n    \n    const letters = map[digits[index]];\n    for (const letter of letters) {\n      backtrack(index + 1, current + letter);\n    }\n  }\n  \n  backtrack(0, '');\n  return result;\n}\n \nletterCombinations('23');\n// [\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]",
"howTo": "1. Each digit maps to a few possible letters and you need every combination across all digits — \"every combination across several independent choices\" is a straightforward backtracking pattern.\n2. Core idea: build the answer string one digit at a time; for the current digit, try each of its letters, and for each choice go build the rest of the string from the remaining digits.\n3. Build order: recurse with an index into the digit string and the string built so far. Base case: when index reaches the end of digits, save the built string. Otherwise, look up the letters for the current digit, and for each letter, recurse with index+1 and the string plus that letter.\n4. Edge case to check: an empty input string should return an empty list, not a list containing one empty string — handle that before you start recursing.",
"dryRun": {
"input": "digits = '23'",
"frames": [
"backtrack(index=0, current=''): index is not the string length. digit '2' maps to 'abc'. Try letter 'a': recurse with index=1, current='a'.",
"backtrack(index=1, current='a'): digit '3' maps to 'def'. Try letter 'd': recurse index=2, current='ad'. index equals length -> save 'ad'. results=['ad'].",
"Back in the index=1 call: try 'e' -> save 'ae'. Try 'f' -> save 'af'. results=['ad','ae','af'].",
"Back in the index=0 call, try letter 'b': recurse with index=1, current='b', producing 'bd','be','bf' the same way. results now has 6 entries.",
"Try letter 'c': produces 'cd','ce','cf'. results now has all 9 entries."
],
"result": "['ad','ae','af','bd','be','bf','cd','ce','cf']"
},
"pitfalls": [
"Not handling the empty-string input case (it should return [] , not [''] ).",
"Off-by-one in the base case check when comparing index to the digits length.",
"Typo in the digit-to-letters map — most digits map to 3 letters, but 7 ('pqrs') and 9 ('wxyz') map to 4 letters.",
"Unlike other backtracking problems, this one doesn't need an explicit 'undo' step, since new strings are built by concatenation, not by mutating one shared array."
],
"patternTakeaway": "If each step has a small independent set of choices (like digit-to-letters) and you need every combination across all steps, always think: backtracking that tries each choice at the current position, then recurses into the next position.",
"pattern": "Recursion & Backtracking"
},
{
"id": "algo-cat9-q6",
"guide": "Algorithms Guide",
"topic": "Backtracking",
"topicNum": 9,
"level": "Hard",
"badge": "[Hard]  LeetCode #51  Pattern: Backtracking | Asked at: Microsoft, Apple | Time: O(n!)  Space: O(n^2)",
"question": "N-Queens",
"explanation": "Problem:\nPlace N queens on an N x N chessboard so that no two queens attack each other. Queens attack along the same row, column, or diagonal. Return every distinct valid arrangement.\n\nApproach:\nPlace exactly one queen per row, one row at a time. For the current row, try every column. Before placing, check that the column isn't already used, and that neither diagonal is already used. Track this with a column set and two diagonal sets (row-col identifies one diagonal direction, row+col identifies the other), so each safety check is instant (O(1)) instead of scanning the whole board.\nIf a spot is safe, place the queen, record its column and both diagonals, and recurse to the next row. After the recursive call returns, undo the placement — remove the queen and clear its column/diagonal records — before trying the next column (backtracking).",
"code": "function solveNQueens(n) {\n  const result = [];\n  const board = Array.from({ length: n }, () => '.'.repeat(n).split(''));\n  const cols = new Set();\n  const diag1 = new Set(); // row - col\n  const diag2 = new Set(); // row + col\n  \n  function backtrack(row) {\n    if (row === n) {\n      result.push(board.map(r => r.join('')));\n      return;\n    }\n    \n    for (let col = 0; col < n; col++) {\n      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) {\n        continue;\n      }\n      \n      // Place queen\n      board[row][col] = 'Q';\n      cols.add(col);\n      diag1.add(row - col);\n      diag2.add(row + col);\n      \n      backtrack(row + 1);\n      \n      // Backtrack\n      board[row][col] = '.';\n      cols.delete(col);\n      diag1.delete(row - col);\n      diag2.delete(row + col);\n    }\n  }\n  \n  backtrack(0);\n  return result;\n}",
"howTo": "1. You must place queens so none attack another and list every valid layout — \"place items one per row so no two conflict, find all ways\" is the classic backtracking-with-constraints setup.\n2. Core idea: place one queen per row, always checking before you place her that she doesn't share a column or diagonal with a queen already placed above; if she's safe, move to the next row, if a row runs out of safe spots, backtrack.\n3. Build order: recurse row by row. For the current row, try every column; skip a column if it's already used, or on a diagonal already used (track two diagonal ids: row-col and row+col, plus a column set). If safe, place the queen and record column and both diagonals, recurse to the next row, then undo the placement before trying the next column.\n4. Common mistake: only checking columns and forgetting the two diagonal directions — every cell on the same \"/\" diagonal shares the same (row+col) value, and every cell on the same \"\\\" diagonal shares the same (row-col) value, which is the neat trick for checking diagonals in O(1).",
"dryRun": {
"input": "n = 4 (showing the start of the search)",
"frames": [
"backtrack(row=0): try col=0. cols, diag1(0-0=0), diag2(0+0=0) are all empty -> safe. Place queen at (0,0). cols={0}, diag1={0}, diag2={0}. Recurse to row=1.",
"backtrack(row=1): try col=0 -> blocked (0 is already in cols). Try col=1 -> blocked (diag1 value 1-1=0 is already used, same diagonal as (0,0)). Try col=2 -> cols ok, diag1(1-2=-1) ok, diag2(1+2=3) ok -> safe. Place queen at (1,2). Recurse to row=2.",
"backtrack(row=2): every column conflicts with one of the two placed queens -> no safe column found anywhere in this row. This is a dead end, so return without saving a solution.",
"Back at row=1, undo the queen at (1,2): cols={0}, diag1={0}, diag2={0} again. Try col=3 -> safe. Place queen at (1,3). Recurse to row=2 and keep searching.",
"Eventually a full arrangement (one safe queen per row for all 4 rows) is found, the board is copied into the results, and then queens are removed row by row (backtrack) to look for other valid arrangements."
],
"result": "all valid N-Queens boards for n=4 (2 solutions total)"
},
"pitfalls": [
"Only checking columns and forgetting the two diagonals — cells on the same '\\' diagonal share row-col, cells on the same '/' diagonal share row+col.",
"Forgetting to remove the column/diagonal records when backtracking, which corrupts later safety checks.",
"Copying a reference to the mutable board into the results instead of copying/joining the rows into fresh strings.",
"Checking every individual cell instead of placing exactly one queen per row — placing row by row is what keeps this efficient."
],
"patternTakeaway": "If you must place items one per row/position under multiple conflict constraints and need every valid arrangement, always think: backtracking with fast O(1) conflict tracking (sets for columns and both diagonals), placing and undoing as you go.",
"pattern": "Recursion & Backtracking"
},
{
"id": "algo-cat10-q1",
"guide": "Algorithms Guide",
"topic": "Graphs",
"topicNum": 10,
"level": "Medium",
"badge": "[Medium]  LeetCode #200  Pattern: DFS / BFS on Grid | Asked at: Amazon, Meta, Google, Microsoft, Bloomberg | Time: O(m*n)  Space: O(m*n) worst",
"question": "Number of Islands",
"explanation": "Problem:\nYou get a grid made of \"1\" (land) and \"0\" (water). Count how many islands there are. An island is a group of \"1\"s connected up, down, left, or right (not diagonally).\nExample:\n11000\n11000\n00100\n00011\nAnswer: 3 islands.\n\nApproach:\nGo through every cell in the grid. When you find a \"1\" you have not visited yet, that is a brand new island — add 1 to your counter. Then use DFS (or BFS) to visit every connected \"1\" next to it, marking each one as visited (for example, change it to \"0\"). This way you never count the same island twice.",
"code": "function numIslands(grid) {\n  if (!grid.length) return 0;\n  \n  const rows = grid.length;\n  const cols = grid[0].length;\n  let count = 0;\n  \n  function dfs(r, c) {\n    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') return;\n    \n    grid[r][c] = '0'; // mark visited\n    \n    dfs(r + 1, c);\n    dfs(r - 1, c);\n    dfs(r, c + 1);\n    dfs(r, c - 1);\n  }\n  \n  for (let r = 0; r < rows; r++) {\n    for (let c = 0; c < cols; c++) {\n      if (grid[r][c] === '1') {\n        count++;\n        dfs(r, c);\n      }\n    }\n  }\n  \n  return count;\n}\n \nnumIslands([\n  ['1','1','0','0','0'],\n  ['1','1','0','0','0'],\n  ['0','0','1','0','0'],\n  ['0','0','0','1','1']\n]); // 3",
"howTo": "1. You have a grid of land/water and need to count separate connected blobs of land — \"count connected groups in a grid\" is the signal for DFS/BFS flood fill.\n2. Core idea: whenever you find an unvisited land cell, that's the start of a brand-new island; flood-fill outward from it (up/down/left/right) marking every connected land cell as visited so you never count it again.\n3. Build order: scan every cell in the grid. When you hit a '1' you haven't visited yet, increment your island counter, then run DFS (or BFS) from that cell, marking each visited land cell (e.g., flipping it to '0') as you go so the flood fill naturally stops at water or out-of-bounds cells.\n4. Common mistake: forgetting to mark cells as visited, or skipping the bounds/water checks — without that, the DFS can recurse forever or count the same island more than once.",
"dryRun": {
"input": "grid = [[1,1,0],[0,1,0],[0,0,1]]",
"frames": [
"Start at (0,0) = '1', not visited yet. This is a new island! count = 1. Start DFS from (0,0).",
"DFS marks (0,0) as visited (set to '0'). Look at its neighbors: (0,1) = '1', so DFS moves there too and marks it visited.",
"From (0,1), neighbor (1,1) = '1', so DFS moves there and marks it visited. No more '1' neighbors from (1,1), so DFS backtracks. Island #1 is done: {(0,0),(0,1),(1,1)}.",
"Continue scanning the grid. Cells (0,2), (1,0), (1,2), (2,0), (2,1) are all '0' — skip them.",
"Reach (2,2) = '1', not visited. New island! count = 2. DFS marks it visited. It has no '1' neighbors, so island #2 is just that one cell."
],
"result": "return 2 (two islands)"
},
"pitfalls": [
"Empty grid (grid.length === 0) — check this first or you will crash reading grid[0].length.",
"Forgetting to mark a cell visited before recursing — this can cause an infinite loop bouncing between two cells.",
"Not checking bounds (row/col out of range) before reading grid[r][c] — this crashes or reads the wrong data.",
"Only connecting up/down/left/right, not diagonals — a diagonal '1' is a separate island."
],
"patternTakeaway": "If you see a grid of connected regions and need to count or explore them, always think: DFS or BFS from each unvisited cell, marking visited as you go so you never revisit or double-count.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat10-q2",
"guide": "Algorithms Guide",
"topic": "Graphs",
"topicNum": 10,
"level": "Medium",
"badge": "[Medium]  LeetCode #133  Pattern: DFS / BFS with HashMap | Asked at: Meta, Amazon, Google | Time: O(V+E)  Space: O(V)",
"question": "Clone Graph",
"explanation": "Problem:\nYou get a connected graph with no direction on its edges (undirected). Each node has a value and a list of neighbor nodes. Make a full deep copy of this graph — new nodes, new neighbor lists, but the exact same shape.\n\nApproach:\nUse a HashMap that maps each original node to its clone.\nDFS (or BFS):\n1. If a node was already cloned (check the map), just return that clone.\n2. Otherwise, create a new clone node and save it in the map right away.\n3. For each neighbor of the original node, clone it too (recursively) and add it to the new node's neighbor list.\nSaving the clone in the map BEFORE visiting its neighbors is the important part — it stops infinite loops when the graph has cycles.",
"code": "function cloneGraph(node) {\n  if (!node) return null;\n  \n  const cloneMap = new Map(); // original -> clone\n  \n  function dfs(orig) {\n    if (cloneMap.has(orig)) return cloneMap.get(orig);\n    \n    const clone = new Node(orig.val);\n    cloneMap.set(orig, clone);\n    \n    for (const neighbor of orig.neighbors) {\n      clone.neighbors.push(dfs(neighbor));\n    }\n    \n    return clone;\n  }\n  \n  return dfs(node);\n}\n \n// BFS version\nfunction cloneGraphBFS(node) {\n  if (!node) return null;\n  \n  const cloneMap = new Map();\n  cloneMap.set(node, new Node(node.val));\n  \n  const queue = [node];\n  while (queue.length > 0) {\n    const orig = queue.shift();\n    const clone = cloneMap.get(orig);\n    \n    for (const neighbor of orig.neighbors) {\n      if (!cloneMap.has(neighbor)) {\n        cloneMap.set(neighbor, new Node(neighbor.val));\n        queue.push(neighbor);\n      }\n      clone.neighbors.push(cloneMap.get(neighbor));\n    }\n  }\n  \n  return cloneMap.get(node);\n}",
"howTo": "1. You need to copy a graph node by node while keeping the same connections — \"deep copy a graph without infinite loops\" tells you to combine DFS/BFS with a map from old node to its new clone.\n2. Core idea: the tricky part of graphs (unlike trees) is cycles — you might revisit the same node again through a different neighbor — so before cloning a node, always check \"have I already cloned this one?\" and reuse that clone instead of making a new one.\n3. Build order: keep a map from original node to its clone. In your DFS function: if the current node is already in the map, just return its clone (this stops infinite loops). Otherwise create a new clone, store it in the map immediately, then for each neighbor of the original, recursively clone it and add that clone to the new node's neighbor list.\n4. Common mistake: adding the node to the map only AFTER cloning its neighbors — you must store it right away, otherwise a cycle back to this same node causes infinite recursion.",
"dryRun": {
"input": "triangle graph: node1<->node2, node2<->node3, node3<->node1 (each node's neighbors are the other two)",
"frames": [
"Start dfs(1). Node 1 is not in the map yet. Create clone1, save map = {1: clone1} right away.",
"Look at orig1's neighbors [2,3]. First visit 2: dfs(2). Node 2 not in map. Create clone2, map = {1:clone1, 2:clone2}.",
"orig2's neighbors are [1,3]. dfs(1): node 1 IS in the map now — just return clone1 (no infinite loop!). clone2.neighbors = [clone1].",
"Still inside dfs(2), visit neighbor 3: dfs(3). Node 3 not in map. Create clone3, map = {1:clone1, 2:clone2, 3:clone3}. Its neighbors [1,2] are both already in the map, so clone3.neighbors = [clone1, clone2].",
"dfs(2) finishes: clone2.neighbors = [clone1, clone3]. Back in dfs(1), visit the last neighbor 3: already in map, return clone3. clone1.neighbors = [clone2, clone3]."
],
"result": "return clone1 — a full deep copy where clone1<->clone2<->clone3<->clone1 mirrors the original triangle"
},
"pitfalls": [
"Forgetting to save the clone in the map before recursing into its neighbors — this causes infinite recursion on cycles.",
"Empty graph (node is null) — return null right away.",
"A single node with no neighbors — the code must still return a valid clone, not crash.",
"Confusing the original node object with its value when using it as a map key, especially if values are not unique."
],
"patternTakeaway": "If you need to copy a graph (or any structure that may have cycles) node by node, always think: DFS/BFS plus a map from original to clone, and store the clone in the map before visiting its neighbors.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat10-q3",
"guide": "Algorithms Guide",
"topic": "Graphs",
"topicNum": 10,
"level": "Medium",
"badge": "[Medium]  LeetCode #207  Pattern: Topological Sort | Asked at: Amazon, Meta, Microsoft | Time: O(V+E)  Space: O(V+E)",
"question": "Course Schedule (Detect Cycle)",
"explanation": "Problem:\nYou have numCourses courses, numbered 0 to numCourses-1. Some courses need other courses finished first (prerequisites). Can you finish all the courses? This is the same as asking: does the dependency graph have a cycle? If yes, it is impossible.\nExample: numCourses=2, prerequisites=[[1,0]] -> true (take course 0, then course 1).\nExample: numCourses=2, prerequisites=[[1,0],[0,1]] -> false (0 needs 1, and 1 needs 0 — a cycle, impossible).\n\nApproach:\nUse topological sort with Kahn's algorithm (BFS):\n1. Build the graph, and count how many prerequisites each course still needs (this count is called \"indegree\").\n2. Put every course with indegree 0 (no prerequisites left) into a queue.\n3. Take courses out of the queue one at a time. Count each as \"taken\". For every course that depends on it, reduce its indegree by 1. If that indegree hits 0, add it to the queue.\n4. At the end, if the number of taken courses equals numCourses, there is no cycle — return true. Otherwise some courses are stuck in a cycle — return false.",
"code": "// Approach 1: Kahn's Algorithm (BFS)\nfunction canFinish(numCourses, prerequisites) {\n  const graph = Array.from({ length: numCourses }, () => []);\n  const indegree = new Array(numCourses).fill(0);\n  \n  // Build graph: prerequisites[i] = [course, requires]\n  for (const [course, req] of prerequisites) {\n    graph[req].push(course);\n    indegree[course]++;\n  }\n  \n  // Start with all 0-indegree courses\n  const queue = [];\n  for (let i = 0; i < numCourses; i++) {\n    if (indegree[i] === 0) queue.push(i);\n  }\n  \n  let taken = 0;\n  while (queue.length > 0) {\n    const course = queue.shift();\n    taken++;\n    \n    for (const next of graph[course]) {\n      indegree[next]--;\n      if (indegree[next] === 0) queue.push(next);\n    }\n  }\n  \n  return taken === numCourses;\n}\n \n// Approach 2: DFS with cycle detection\nfunction canFinishDFS(numCourses, prerequisites) {\n  const graph = Array.from({ length: numCourses }, () => []);\n  for (const [course, req] of prerequisites) {\n    graph[req].push(course);\n  }\n  \n  // 0=unvisited, 1=visiting, 2=visited\n  const state = new Array(numCourses).fill(0);\n  \n  function hasCycle(node) {\n    if (state[node] === 1) return true;  // back edge - cycle!\n    if (state[node] === 2) return false; // already done\n    \n    state[node] = 1;\n    \n    for (const next of graph[node]) {\n      if (hasCycle(next)) return true;\n    }\n    \n    state[node] = 2;\n    return false;\n  }\n  \n  for (let i = 0; i < numCourses; i++) {\n    if (hasCycle(i)) return false;\n  }\n  \n  return true;\n}",
"howTo": "1. \"Can you finish all courses given prerequisites\" is really asking \"does this dependency graph have a cycle\" — dependency chains plus \"is it even possible\" is the signal for topological sort / cycle detection.\n2. Core idea: if you can process every node by always starting with ones that have no remaining unmet dependencies, and you run out of such nodes before finishing everyone, there must be a cycle blocking the rest.\n3. Build order (Kahn's/BFS way): build the graph and count, for each course, how many prerequisites it still needs (indegree). Put every course with indegree 0 into a queue. Repeatedly take a course out, count it as taken, and reduce the indegree of everything that depends on it — if any drops to 0, add it to the queue. At the end, compare the number of taken courses to the total.\n4. Common mistake / edge case: don't forget courses that never reach indegree 0 — if taken != numCourses, some courses are stuck in a cycle and can never be finished.",
"dryRun": {
"input": "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]",
"frames": [
"Build the graph: 0 -> [1,2], 1 -> [3], 2 -> [3]. Indegree counts: course0=0, course1=1, course2=1, course3=2.",
"Only course0 has indegree 0. queue = [0].",
"Take course0 out. taken=1. Reduce indegree of its dependents 1 and 2: indegree1=0, indegree2=0. Both hit 0, so queue = [1, 2].",
"Take course1 out. taken=2. Reduce indegree of 3: indegree3 = 2-1 = 1 (not 0 yet, don't add). Take course2 out. taken=3. Reduce indegree of 3 again: indegree3 = 1-1 = 0. Now queue = [3].",
"Take course3 out. taken=4. No dependents left. queue is now empty."
],
"result": "taken (4) === numCourses (4) -> return true, no cycle, you can finish all courses"
},
"pitfalls": [
"Forgetting that some courses might never reach indegree 0 — if taken != numCourses at the end, there IS a cycle, return false.",
"Mixing up the edge direction — prerequisites[i] = [course, req] means req must come before course, so the edge goes req -> course.",
"numCourses given but the prerequisites list is empty — every course already has indegree 0, the answer should just be true.",
"A self-loop like [0,0] (a course requires itself) — that alone makes it impossible, its indegree never reaches 0."
],
"patternTakeaway": "If you see 'dependencies' or 'must finish X before Y' and need to know if it is even possible, always think: build a directed graph and check for a cycle using topological sort (Kahn's BFS or DFS with visiting states).",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat10-q4",
"guide": "Algorithms Guide",
"topic": "Graphs",
"topicNum": 10,
"level": "Medium",
"badge": "[Medium]  LeetCode #417  Pattern: DFS from edges | Asked at: Google, Amazon | Time: O(m*n)  Space: O(m*n)",
"question": "Pacific Atlantic Water Flow",
"explanation": "Problem:\nYou get a grid of heights (m rows by n columns). The Pacific Ocean touches the top and left edges. The Atlantic Ocean touches the bottom and right edges. Water can flow from a cell to a neighbor only if the neighbor's height is less than or equal to the current cell's height (water flows downhill or flat). Find all cells where water can reach BOTH oceans.\n\nApproach:\nChecking every cell's path forward one by one is too slow. Instead, flip the direction: start DFS from the ocean edges and walk \"uphill\" (only move to a neighbor with height >= current height).\n1. DFS from every top and left edge cell — mark all cells reached this way as \"can reach Pacific.\"\n2. DFS from every bottom and right edge cell — mark all cells reached this way as \"can reach Atlantic.\"\n3. Any cell marked by both DFS runs can send water to both oceans — add it to the answer.",
"code": "function pacificAtlantic(heights) {\n  const rows = heights.length;\n  const cols = heights[0].length;\n  \n  const pacific = Array.from({ length: rows }, () => new Array(cols).fill(false));\n  const atlantic = Array.from({ length: rows }, () => new Array(cols).fill(false));\n  \n  function dfs(r, c, visited, prevHeight) {\n    if (r < 0 || r >= rows || c < 0 || c >= cols) return;\n    if (visited[r][c]) return;\n    if (heights[r][c] < prevHeight) return; // can't flow uphill\n    \n    visited[r][c] = true;\n    \n    dfs(r + 1, c, visited, heights[r][c]);\n    dfs(r - 1, c, visited, heights[r][c]);\n    dfs(r, c + 1, visited, heights[r][c]);\n    dfs(r, c - 1, visited, heights[r][c]);\n  }\n  \n  // Pacific: top and left edges\n  for (let c = 0; c < cols; c++) dfs(0, c, pacific, -Infinity);\n  for (let r = 0; r < rows; r++) dfs(r, 0, pacific, -Infinity);\n  \n  // Atlantic: bottom and right edges\n  for (let c = 0; c < cols; c++) dfs(rows - 1, c, atlantic, -Infinity);\n  for (let r = 0; r < rows; r++) dfs(r, cols - 1, atlantic, -Infinity);\n  \n  const result = [];\n  for (let r = 0; r < rows; r++) {\n    for (let c = 0; c < cols; c++) {\n      if (pacific[r][c] && atlantic[r][c]) result.push([r, c]);\n    }\n  }\n  return result;\n}",
"howTo": "1. Water flows downhill to two different oceans, and you need cells that reach BOTH — instead of tracing every cell's path forward (expensive), the \"start from the edges and go backward\" trick is the key signal here.\n2. Core idea: reverse the direction of thinking — instead of asking \"where does water from this cell go?\", ask \"which cells could reach the ocean if we walked UPHILL from the ocean's edge?\" Do that separately for each ocean, then intersect the results.\n3. Build order: make two visited grids, one for Pacific and one for Atlantic. Run DFS starting from all top+left edge cells for Pacific, only moving to a neighbor if its height is greater than or equal to the current cell (uphill in reverse). Do the same DFS from all bottom+right edge cells for Atlantic. Finally, collect every cell marked true in both grids.\n4. Common mistake: writing the flow condition backwards — you're simulating water flowing downhill in reality but tracing uphill from the ocean, so the DFS should only continue to a neighbor whose height is >= the current cell's height, not <=.",
"dryRun": {
"input": "heights = [[1,2],[3,4]]",
"frames": [
"Start Pacific DFS from the top+left edges: (0,0)=1 and (0,1)=2 [top row], (0,0)=1 and (1,0)=3 [left column].",
"From (0,0)=1: mark pacific[0][0]=true. Neighbor (1,0)=3 is >= 1 (uphill OK) -> visit it, mark pacific[1][0]=true. Neighbor (0,1)=2 is >= 1 -> visit it, mark pacific[0][1]=true.",
"From (1,0)=3, neighbor (1,1)=4 is >= 3 (uphill OK) -> visit it, mark pacific[1][1]=true. Now every cell reaches the Pacific.",
"Start Atlantic DFS from the bottom+right edges: (1,0)=3, (1,1)=4 [bottom row], (0,1)=2, (1,1)=4 [right column]. Mark those true directly.",
"From (1,0)=3, try neighbor (0,0)=1: is 1 >= 3? No, stop. From (0,1)=2, try (0,0)=1: is 1 >= 2? No, stop. So atlantic[0][0] stays false — it is the only cell that fails."
],
"result": "return [[0,1],[1,0],[1,1]] — every cell except (0,0) reaches both oceans"
},
"pitfalls": [
"Getting the flow direction backwards — since you trace UPHILL from the ocean, the condition should be neighbor height >= current height, not <=.",
"Forgetting to run DFS from all 4 edges separately (top and left for Pacific; bottom and right for Atlantic).",
"Corner cells belong to two starting edges at once — make sure they still get visited correctly, not skipped.",
"Empty grid or a grid with 0 rows/columns — check before accessing heights[0].length."
],
"patternTakeaway": "If you need cells reachable from two different boundaries under a directional flow rule, always think: reverse the direction and DFS/BFS inward from each boundary separately, then intersect the results.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat10-q5",
"guide": "Algorithms Guide",
"topic": "Graphs",
"topicNum": 10,
"level": "Medium",
"badge": "[Medium]  LeetCode #994  Pattern: BFS Multi-source | Asked at: Amazon, Google | Time: O(m*n)  Space: O(m*n)",
"question": "Rotting Oranges",
"explanation": "Problem:\nYou get a grid where 0 = empty, 1 = fresh orange, 2 = rotten orange. Every minute, any fresh orange next to a rotten orange (up, down, left, or right) becomes rotten too. Find the minimum number of minutes until no fresh orange is left. If that is impossible, return -1.\nExample: [[2,1,1],[1,1,0],[0,1,1]] -> 4 minutes.\n\nApproach:\nThis is BFS starting from ALL the rotten oranges at the same time (multi-source BFS), not just one.\n1. Scan the grid once: put every rotten orange into the queue, and count the fresh oranges.\n2. Process the queue one full level (one minute) at a time: for every orange currently in the queue, check its 4 neighbors. If a neighbor is fresh, make it rotten, subtract 1 from the fresh count, and add it to the queue for the next minute.\n3. After each full level, add 1 to the minute counter.\n4. At the end: if the fresh count is 0, return the minutes. If some fresh oranges are still left (never reached), return -1.",
"code": "function orangesRotting(grid) {\n  const rows = grid.length;\n  const cols = grid[0].length;\n  const queue = [];\n  let fresh = 0;\n  \n  // Find all initially rotten and count fresh\n  for (let r = 0; r < rows; r++) {\n    for (let c = 0; c < cols; c++) {\n      if (grid[r][c] === 2) queue.push([r, c]);\n      else if (grid[r][c] === 1) fresh++;\n    }\n  }\n  \n  if (fresh === 0) return 0;\n  \n  let minutes = 0;\n  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];\n  \n  while (queue.length > 0 && fresh > 0) {\n    const size = queue.length;\n    \n    for (let i = 0; i < size; i++) {\n      const [r, c] = queue.shift();\n      \n      for (const [dr, dc] of dirs) {\n        const nr = r + dr, nc = c + dc;\n        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {\n          grid[nr][nc] = 2;\n          fresh--;\n          queue.push([nr, nc]);\n        }\n      }\n    }\n    \n    minutes++;\n  }\n  \n  return fresh === 0 ? minutes : -1;\n}",
"howTo": "1. Multiple rotten oranges spread at the same time step, and you need the number of steps until they're all rotten — \"spreads outward simultaneously from several starting points, minute by minute\" is the exact signal for multi-source BFS.\n2. Core idea: instead of running BFS once per rotten orange, throw ALL rotten oranges into the queue at once as minute 0, and process the queue level by level (one full level = one minute) so everything spreads in lockstep just like the real problem.\n3. Build order: scan the grid once to collect all rotten oranges into the queue and count the fresh oranges. Then repeatedly process one level of the queue at a time: for every orange currently in the queue, look at its 4 neighbors, and if a neighbor is fresh, rot it, decrease the fresh counter, and add it to the queue for the next level. After a full level, increment your minute counter.\n4. Edge case to check: if there were zero fresh oranges to begin with, answer is 0 immediately; and if any fresh oranges are still left unrotted after BFS finishes (unreachable), return -1 instead of the minute count.",
"dryRun": {
"input": "grid = [[2,1,1],[1,1,0],[0,1,1]]",
"frames": [
"Scan the grid: rotten orange found at (0,0). queue = [(0,0)]. Count fresh oranges: 6 fresh cells total.",
"Minute 1: process level [(0,0)]. Neighbors of (0,0): (1,0)=1 fresh -> rot it, fresh=5, push. (0,1)=1 fresh -> rot it, fresh=4, push. queue = [(1,0),(0,1)].",
"Minute 2: process [(1,0),(0,1)]. From (1,0): neighbor (1,1)=1 fresh -> rot, fresh=3, push. From (0,1): neighbor (0,2)=1 fresh -> rot, fresh=2, push. queue = [(1,1),(0,2)].",
"Minute 3: process [(1,1),(0,2)]. From (1,1): neighbor (2,1)=1 fresh -> rot, fresh=1, push. (0,2) has no fresh neighbors left. queue = [(2,1)].",
"Minute 4: process [(2,1)]. Neighbor (2,2)=1 fresh -> rot, fresh=0, push. queue = [(2,2)]. Fresh is now 0, so the while loop stops after this round."
],
"result": "fresh === 0, so return minutes = 4"
},
"pitfalls": [
"Forgetting the case where there are zero fresh oranges at the start — the answer is 0 immediately, no need to run BFS.",
"Processing the queue one orange at a time instead of one full level at a time — this breaks the minute count.",
"Leftover fresh oranges that are unreachable (blocked by 0s) — must return -1, not the minute count so far.",
"Marking an orange rotten but forgetting to decrement the fresh counter, which throws off the final check."
],
"patternTakeaway": "If several starting points all spread out at the same time and you need the time until everything is covered, always think: multi-source BFS — put every starting point in the queue at minute 0, and process level by level.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat10-q6",
"guide": "Algorithms Guide",
"topic": "Graphs",
"topicNum": 10,
"level": "Hard",
"badge": "[Hard]  LeetCode #127  Pattern: BFS | Asked at: Amazon, Meta, Google, LinkedIn | Time: O(N * L^2)  Space: O(N * L)",
"question": "Word Ladder",
"explanation": "Problem:\nYou get a beginWord, an endWord, and a wordList. Find the length of the shortest chain of words from beginWord to endWord, where each step changes exactly ONE letter, and every word in between must be in wordList. Return 0 if no such chain exists.\nExample: begin=\"hit\", end=\"cog\", wordList=[\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]. Answer: 5 (hit -> hot -> dot -> dog -> cog).\n\nApproach:\nThis is a shortest-path problem, so use BFS (BFS always finds the shortest path when every step has equal cost).\nTrick: comparing every pair of words to see if they differ by exactly one letter is too slow. Instead, use patterns:\n1. For each word, replace one letter at a time with \"*\" to make patterns, like \"h*t\", \"*ot\", \"ho*\" for \"hot\".\n2. Build a map: pattern -> list of words that match that pattern. Words sharing a pattern are exactly one letter apart, so they are \"connected.\"\n3. Run BFS from beginWord. At each word, look up all its patterns, get the connected words, and visit any that are not yet visited.\n4. Stop as soon as you reach endWord — return the path length.",
"code": "function ladderLength(beginWord, endWord, wordList) {\n  if (!wordList.includes(endWord)) return 0;\n  \n  // Build pattern -> words map\n  const patterns = new Map();\n  const allWords = [beginWord, ...wordList];\n  \n  for (const word of allWords) {\n    for (let i = 0; i < word.length; i++) {\n      const pattern = word.slice(0, i) + '*' + word.slice(i + 1);\n      if (!patterns.has(pattern)) patterns.set(pattern, []);\n      patterns.get(pattern).push(word);\n    }\n  }\n  \n  // BFS\n  const queue = [[beginWord, 1]];\n  const visited = new Set([beginWord]);\n  \n  while (queue.length > 0) {\n    const [word, length] = queue.shift();\n    \n    if (word === endWord) return length;\n    \n    for (let i = 0; i < word.length; i++) {\n      const pattern = word.slice(0, i) + '*' + word.slice(i + 1);\n      \n      for (const next of (patterns.get(pattern) || [])) {\n        if (!visited.has(next)) {\n          visited.add(next);\n          queue.push([next, length + 1]);\n        }\n      }\n    }\n  }\n  \n  return 0;\n}",
"howTo": "1. You need the SHORTEST transformation sequence between two words — \"shortest path\" between nodes is a strong signal for BFS, since BFS naturally finds shortest paths in unweighted graphs.\n2. Core idea: treat every word as a node, and two words are \"connected\" if they differ by exactly one letter; comparing every pair of words directly is too slow, so instead group words by a wildcard pattern (like \"h*t\") so words that could transform into each other land in the same bucket.\n3. Build order: first, for every word (including beginWord), generate all its wildcard patterns and put it into a map from pattern to list of matching words. Then run BFS from beginWord, tracking the path length so far. At each word, generate its patterns again, look up all words sharing a pattern (those are one-letter-away neighbors), and if unvisited, enqueue them with length+1. Stop as soon as you dequeue endWord and return its length.\n4. Common mistake: marking words visited only when you dequeue them instead of the moment you enqueue them — otherwise the same word gets added to the queue multiple times and wastes work.",
"dryRun": {
"input": "beginWord=\"hit\", endWord=\"cog\", wordList=[\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]",
"frames": [
"Build the pattern map from all words (hit + wordList). For 'hot': patterns '*ot','h*t','ho*'. Example: pattern '*ot' -> [hot, dot, lot].",
"Start BFS: queue=[(hit,1)], visited={hit}. Dequeue hit. Its pattern 'h*t' matches 'hot'. hot is unvisited -> add it. queue=[(hot,2)], visited={hit,hot}.",
"Dequeue hot. Pattern '*ot' matches [hot,dot,lot] -> dot and lot are unvisited, add both. queue=[(dot,3),(lot,3)].",
"Dequeue dot. Pattern 'do*' matches [dot,dog] -> dog is unvisited, add it with length 4. Dequeue lot. Pattern 'lo*' matches [lot,log] -> log is unvisited, add it with length 4. queue=[(dog,4),(log,4)].",
"Dequeue dog. It is not endWord yet. Pattern '*og' matches [dog,log,cog] -> cog is unvisited, add it with length 5. queue=[(log,4),(cog,5)]."
],
"result": "eventually dequeue cog (length 5); word === endWord -> return 5"
},
"pitfalls": [
"endWord not in wordList — return 0 immediately, no need to search at all.",
"Marking a word visited only when it is dequeued instead of when it is enqueued — this causes duplicate work and can blow up the queue.",
"Forgetting that beginWord itself needs to be included when building the pattern map, or the very first step may not connect.",
"Recomputing patterns for the same word many times instead of once — wastes time on long word lists."
],
"patternTakeaway": "If you need the shortest number of steps between two items where each step is one small valid change, always think: BFS over an implicit graph, using a smart trick (like wildcard patterns) to find neighbors quickly instead of comparing everything pairwise.",
"pattern": "Trees & Graphs"
},
{
"id": "algo-cat11-q1",
"guide": "Algorithms Guide",
"topic": "Dynamic Programming",
"topicNum": 11,
"level": "Easy",
"badge": "[Easy]  LeetCode #70  Pattern: DP / Fibonacci | Asked at: Amazon, Apple, Adobe | Time: O(n)  Space: O(1)",
"question": "Climbing Stairs",
"explanation": "Problem:\nYou are climbing a staircase with n steps. Each time, you can go up 1 step or 2 steps. How many different ways are there to reach the top?\nExample: n=3 -> 3 ways (1+1+1, 1+2, 2+1)\n\nApproach:\nThis works just like Fibonacci. To land on step n, your very last move was either 1 step from step n-1, or 2 steps from step n-2. So ways(n) = ways(n-1) + ways(n-2). The \"state\" here is simply: how many ways exist to reach this one step. You only ever need the last two answers, so you can keep just two numbers instead of a full array.",
"code": "// Optimal: O(1) space\nfunction climbStairs(n) {\n  if (n <= 2) return n;\n  \n  let prev2 = 1;\n  let prev1 = 2;\n  \n  for (let i = 3; i <= n; i++) {\n    const current = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = current;\n  }\n  \n  return prev1;\n}\n \n// Memoization version\nfunction climbStairsMemo(n, memo = {}) {\n  if (n <= 2) return n;\n  if (memo[n]) return memo[n];\n  memo[n] = climbStairsMemo(n - 1, memo) + climbStairsMemo(n - 2, memo);\n  return memo[n];\n}\n \nclimbStairs(2);  // 2\nclimbStairs(3);  // 3\nclimbStairs(45); // 1836311903",
"howTo": "1. You're counting the number of ways to reach a step where each move is 1 or 2 steps — \"ways to reach step n from step n-1 or n-2\" is literally the Fibonacci recurrence, which is your cue for simple 1D DP.\n2. Core idea: the number of ways to reach step n is the ways to reach step n-1 plus the ways to reach step n-2, because your very last move was either a single step from n-1 or a double step from n-2. The \"state\" here is simply \"how many ways to reach this particular step\".\n3. Build order: handle base cases first (n=1 gives 1 way, n=2 gives 2 ways). Then either build a memoized recursive function that caches each f(n) once computed, or loop from 3 up to n keeping just the previous two values and add them together each time.\n4. Common mistake: recomputing f(n-1) and f(n-2) from scratch every time with plain recursion and no memo — that blows up to exponential time, so always cache or iterate bottom-up.",
"dryRun": {
"input": "n = 5",
"frames": [
"Base cases: ways(1) = 1, ways(2) = 2.",
"ways(3) = ways(2) + ways(1) = 2 + 1 = 3.",
"ways(4) = ways(3) + ways(2) = 3 + 2 = 5.",
"ways(5) = ways(4) + ways(3) = 5 + 3 = 8."
],
"result": "return 8"
},
"pitfalls": [
"Forgetting the base cases: ways(1)=1 and ways(2)=2, not both 1.",
"Off-by-one in the loop — make sure it runs up to and including n.",
"Using plain recursion with no memo causes exponential time — always cache or build bottom-up."
],
"patternTakeaway": "If the answer for n only depends on the answers for a few smaller n's (like n-1 and n-2), always think: DP — build up from the smallest cases instead of recomputing them.",
"pattern": "Dynamic Programming"
},
{
"id": "algo-cat11-q2",
"guide": "Algorithms Guide",
"topic": "Dynamic Programming",
"topicNum": 11,
"level": "Medium",
"badge": "[Medium]  LeetCode #198  Pattern: DP | Asked at: Amazon, Microsoft, LinkedIn | Time: O(n)  Space: O(1)",
"question": "House Robber",
"explanation": "Problem:\nYou are robbing houses lined up in a row. Each house holds some money. If you rob two houses that are next to each other, an alarm goes off. Find the largest amount of money you can rob.\nExample: [2,7,9,3,1] -> 12 (rob houses at index 0, 2, 4: 2+9+1)\n\nApproach:\nGo through the houses one at a time. At each house, you have two choices: skip it and keep the best total you already had, or rob it and add its money to the best total from two houses back (since the house right before it is off-limits). The \"state\" is: the most money you could have robbed using houses up to this point. Keep only the last two totals so you don't need a full array.",
"code": "function rob(nums) {\n  let prev2 = 0; // max up to i-2\n  let prev1 = 0; // max up to i-1\n  \n  for (const num of nums) {\n    const current = Math.max(prev1, prev2 + num);\n    prev2 = prev1;\n    prev1 = current;\n  }\n  \n  return prev1;\n}\n \nrob([1, 2, 3, 1]);    // 4\nrob([2, 7, 9, 3, 1]); // 12\nrob([2, 1, 1, 2]);    // 4\n \n// Variant: House Robber II - houses in a CIRCLE (LeetCode 213)\nfunction robCircular(nums) {\n  if (nums.length === 1) return nums[0];\n  \n  // Either skip first OR skip last\n  return Math.max(\n    rob(nums.slice(0, -1)),  // skip last\n    rob(nums.slice(1))        // skip first\n  );\n}",
"howTo": "1. You can't rob two adjacent houses, and you want the max total — \"adjacent items are forbidden together, maximize a value\" is a classic 1D DP pattern.\n2. Core idea: at each house, you have two choices — skip it and keep whatever max you already had, or rob it and add its value to the best total from two houses back, since the house right before it is off-limits. The \"state\" is \"the most money you could have robbed using houses up to this point\".\n3. Build order: keep two running values — the best total up to two houses ago, and the best total up to the previous house. Walk through the houses one by one; the new best is the max of (previous best, skipping this house) versus (best from two houses back plus this house's value). Slide both tracked values forward each time.\n4. Common mistake: mixing up which \"previous\" value to add the current house to — you must add to the max from i-2, not i-1, since robbing the adjacent house at i-1 would trigger the alarm.",
"dryRun": {
"input": "nums = [2,7,9,3,1]",
"frames": [
"Start: prev2=0, prev1=0.",
"House 2: current = max(0, 0+2) = 2. Now prev2=0, prev1=2.",
"House 7: current = max(2, 0+7) = 7. Now prev2=2, prev1=7.",
"House 9: current = max(7, 2+9) = 11. Now prev2=7, prev1=11.",
"House 3: current = max(11, 7+3) = 11. Now prev2=11, prev1=11.",
"House 1: current = max(11, 11+1) = 12. Now prev1=12."
],
"result": "return 12"
},
"pitfalls": [
"Don't add the current house to the previous house's total — only to the total from two houses back.",
"Empty input should return 0; a single house should return that house's own value.",
"If houses form a circle instead of a line, the first and last house can't both be robbed — that needs a special case (LeetCode 213 variant)."
],
"patternTakeaway": "If you must pick items but can never pick two neighbors, and you want to maximize a total, always think: DP where each state is 'best total using items up to here, choosing skip vs take'.",
"pattern": "Dynamic Programming"
},
{
"id": "algo-cat11-q3",
"guide": "Algorithms Guide",
"topic": "Dynamic Programming",
"topicNum": 11,
"level": "Medium",
"badge": "[Medium]  LeetCode #300  Pattern: DP | Asked at: Amazon, Meta, Microsoft | Time: O(n^2) DP / O(n log n) optimal  Space: O(n)",
"question": "Longest Increasing Subsequence",
"explanation": "Problem:\nYou get an array of numbers. Find the length of the longest subsequence where the numbers keep getting bigger. A subsequence means you can skip numbers, but the order must stay the same.\nExample: [10,9,2,5,3,7,101,18] -> 4, for example the subsequence [2,3,7,101]\n\nApproach:\nFor each position i, imagine an increasing subsequence that ends exactly at i. Look back at every earlier position j. If the number at j is smaller than the number at i, you could stretch that earlier subsequence by adding the number at i to its end. The \"state\" dp[i] means: the length of the longest increasing subsequence that ends right at index i. Every dp[i] starts at 1, since a number by itself is a subsequence of length 1. The final answer is the biggest value anywhere in the dp array, not just the last one.",
"code": "// O(n^2) DP\nfunction lengthOfLIS(nums) {\n  const dp = new Array(nums.length).fill(1);\n  \n  for (let i = 1; i < nums.length; i++) {\n    for (let j = 0; j < i; j++) {\n      if (nums[j] < nums[i]) {\n        dp[i] = Math.max(dp[i], dp[j] + 1);\n      }\n    }\n  }\n  \n  return Math.max(...dp);\n}\n \n// O(n log n) with binary search\nfunction lengthOfLISOptimal(nums) {\n  const tails = []; // tails[i] = smallest tail of LIS of length i+1\n  \n  for (const num of nums) {\n    let left = 0, right = tails.length;\n    while (left < right) {\n      const mid = Math.floor((left + right) / 2);\n      if (tails[mid] < num) left = mid + 1;\n      else right = mid;\n    }\n    \n    if (left === tails.length) tails.push(num);\n    else tails[left] = num;\n  }\n  \n  return tails.length;\n}\n \nlengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18]); // 4",
"howTo": "1. You need the longest subsequence (order kept, gaps allowed) that keeps increasing — \"longest chain under a growing condition, subsequence not substring\" points to DP where each index asks \"what's the best chain ending exactly here\".\n2. Core idea: for every position i, imagine the increasing subsequence must END at i; its best length is 1 by itself, unless some earlier, smaller number j lets you extend that chain by one. The \"state\" dp[i] means \"length of the longest increasing subsequence that ends at index i\".\n3. Build order: create a dp array filled with 1s (every element alone is a subsequence of length 1). For each index i, loop over every earlier index j; if nums[j] is smaller than nums[i], you could place nums[i] right after that chain, so try dp[i] = max(dp[i], dp[j] + 1). The final answer is the largest value anywhere in dp.\n4. Common mistake: returning dp[n-1] (the last element) instead of the max across the whole dp array — the longest subsequence doesn't have to end at the last element.",
"dryRun": {
"input": "nums = [10,9,2,5,3,7]",
"frames": [
"Start: dp = [1,1,1,1,1,1] (every number alone counts as length 1).",
"i=3, value=5. Check earlier: only nums[2]=2 is smaller. dp[3] = dp[2]+1 = 2.",
"i=4, value=3. Check earlier: only nums[2]=2 is smaller. dp[4] = dp[2]+1 = 2.",
"i=5, value=7. Check earlier: nums[2]=2, nums[3]=5, nums[4]=3 are all smaller. Best is dp[3]+1 = 3. dp[5] = 3."
],
"result": "return max(dp) = 3"
},
"pitfalls": [
"Don't return dp[n-1] (the last element) — the answer is the maximum value anywhere in the dp array.",
"Every dp[i] must start at 1, since a single number alone is a valid subsequence of length 1.",
"A subsequence is not a substring — the chosen numbers don't need to sit next to each other."
],
"patternTakeaway": "If you need the longest chain that ends at each position, and later positions can extend earlier ones, always think: DP where dp[i] = best chain ending exactly at i, built from earlier dp[j] values.",
"pattern": "Dynamic Programming"
},
{
"id": "algo-cat11-q4",
"guide": "Algorithms Guide",
"topic": "Dynamic Programming",
"topicNum": 11,
"level": "Medium",
"badge": "[Medium]  LeetCode #322  Pattern: DP | Asked at: Amazon, Meta, Google | Time: O(n*amount)  Space: O(amount)",
"question": "Coin Change",
"explanation": "Problem:\nYou have coins of different values, and you can reuse each coin as many times as you want. Given a target amount, find the smallest number of coins that add up to exactly that amount. If it's impossible, return -1.\nExample: coins=[1,2,5], amount=11 -> 3 (5+5+1)\nExample: coins=[2], amount=3 -> -1\n\nApproach:\nFor each amount i from 1 up to the target, try every coin. If you use that coin last, the rest of the amount is i - coin, and you already know the fewest coins needed for that smaller amount. Add 1 for the coin you just used, and keep the smallest result across all coin choices. The \"state\" dp[i] means: the fewest coins needed to make exactly amount i. Start dp[0] = 0 (zero coins for zero amount), and everything else at a large placeholder number meaning \"not reachable yet\".",
"code": "function coinChange(coins, amount) {\n  const dp = new Array(amount + 1).fill(Infinity);\n  dp[0] = 0;\n  \n  for (let i = 1; i <= amount; i++) {\n    for (const coin of coins) {\n      if (coin <= i && dp[i - coin] !== Infinity) {\n        dp[i] = Math.min(dp[i], dp[i - coin] + 1);\n      }\n    }\n  }\n  \n  return dp[amount] === Infinity ? -1 : dp[amount];\n}\n \ncoinChange([1, 2, 5], 11); // 3\ncoinChange([2], 3);         // -1\ncoinChange([1], 0);         // 0\n \n// Variant: Coin Change II - count number of WAYS (LeetCode 518)\nfunction change(amount, coins) {\n  const dp = new Array(amount + 1).fill(0);\n  dp[0] = 1;\n  \n  for (const coin of coins) {\n    for (let i = coin; i <= amount; i++) {\n      dp[i] += dp[i - coin];\n    }\n  }\n  \n  return dp[amount];\n}",
"howTo": "1. You need the FEWEST coins to reach an exact amount, and coins are reusable — \"minimum count to hit an exact target, unlimited reuse\" is a bottom-up DP signature.\n2. Core idea: to make amount i, try each coin as the \"last coin used\", then add 1 to however many coins it took to make the smaller leftover amount (i - coin); pick whichever coin choice gives the smallest total. The \"state\" dp[i] means \"fewest coins needed to make exactly amount i\".\n3. Build order: make a dp array from 0 to amount, filled with a large placeholder value (like Infinity) except dp[0] = 0. For each amount i from 1 up to the target, loop through every coin; if the coin is small enough and the remainder (i - coin) was reachable, update dp[i] to the minimum of its current value and dp[i-coin] + 1.\n4. Edge case to check: if dp[amount] is still Infinity at the end, no combination of coins reaches that amount exactly — return -1 instead of the placeholder value.",
"dryRun": {
"input": "coins = [1,2,5], amount = 6",
"frames": [
"dp[0] = 0 (base case).",
"dp[1]: only coin 1 fits. dp[1] = dp[0]+1 = 1.",
"dp[2]: coin 1 gives dp[1]+1=2, coin 2 gives dp[0]+1=1. dp[2] = 1.",
"dp[5]: coin 5 gives dp[0]+1=1 (best option). dp[5] = 1.",
"dp[6]: coin 1 gives dp[5]+1=2, coin 5 gives dp[1]+1=2. dp[6] = 2."
],
"result": "return 2 (5+1)"
},
"pitfalls": [
"If dp[amount] is still the placeholder (Infinity) at the end, return -1, not the placeholder value itself.",
"Only use a coin if it's small enough (coin <= i) and the leftover amount (i - coin) was actually reachable.",
"dp[0] must start at 0, not Infinity — making zero amount needs zero coins."
],
"patternTakeaway": "If you need the minimum number of reusable items to hit an exact target, always think: DP where dp[amount] is built from dp[amount - item] for every item choice.",
"pattern": "Dynamic Programming"
},
{
"id": "algo-cat11-q5",
"guide": "Algorithms Guide",
"topic": "Dynamic Programming",
"topicNum": 11,
"level": "Medium",
"badge": "[Medium]  LeetCode #139  Pattern: DP | Asked at: Meta, Amazon, Google | Time: O(n^2 * k)  Space: O(n)",
"question": "Word Break",
"explanation": "Problem:\nYou get a string s and a list of dictionary words. Check whether s can be cut into pieces where every piece is a word from the dictionary.\nExample: s=\"leetcode\", wordDict=[\"leet\",\"code\"] -> true, because \"leet\" + \"code\" makes \"leetcode\"\nExample: s=\"catsandog\", wordDict=[\"cats\",\"dog\",\"sand\",\"and\",\"cat\"] -> false\n\nApproach:\nThink about each prefix of the string — the first i characters. That prefix can be broken into dictionary words if there is some earlier cut point j where the part before j was already breakable, and the piece from j to i is itself a dictionary word. The \"state\" dp[i] means: can the first i characters of the string be fully split into dictionary words. dp[0] = true, because an empty string needs no words at all. Check every possible cut point for each i, and store the dictionary in a Set so lookups are fast.",
"code": "function wordBreak(s, wordDict) {\n  const wordSet = new Set(wordDict);\n  const dp = new Array(s.length + 1).fill(false);\n  dp[0] = true;\n  \n  for (let i = 1; i <= s.length; i++) {\n    for (let j = 0; j < i; j++) {\n      if (dp[j] && wordSet.has(s.substring(j, i))) {\n        dp[i] = true;\n        break;\n      }\n    }\n  }\n  \n  return dp[s.length];\n}\n \nwordBreak('leetcode', ['leet', 'code']);              // true\nwordBreak('applepenapple', ['apple', 'pen']);          // true\nwordBreak('catsandog', ['cats','dog','sand','and','cat']); // false",
"howTo": "1. You need to know if a string can be split into dictionary words — \"can this be fully chopped into valid pieces\" signals DP where each prefix position asks \"is everything up to here breakable\".\n2. Core idea: a prefix of the string (the first i characters) is breakable if there's some earlier cut point j where the part before j was already breakable, AND the piece from j to i is itself a dictionary word. The \"state\" dp[i] means \"can the first i characters of the string be fully split into dictionary words\".\n3. Build order: make a boolean dp array of size length+1, with dp[0] = true (empty prefix is trivially breakable). For each end position i from 1 to length, try every earlier cut point j from 0 to i; if dp[j] is true and the substring from j to i is in your word set, mark dp[i] true and stop checking more cuts for this i. The final answer is dp[length].\n4. Common mistake: off-by-one on the substring boundaries (j and i), or checking the dictionary with a slow list search instead of putting the words in a Set first for fast lookup.",
"dryRun": {
"input": "s = \"leetcode\", wordDict = [\"leet\",\"code\"]",
"frames": [
"dp[0] = true (empty prefix is always breakable).",
"i=1..3: no piece ending here matches a dictionary word with a true dp[j]. dp stays false.",
"i=4: try j=0, s[0:4]=\"leet\" is in the dictionary and dp[0]=true. dp[4] = true.",
"i=5..7: no valid combination found yet. dp stays false.",
"i=8: try j=4, s[4:8]=\"code\" is in the dictionary and dp[4]=true. dp[8] = true."
],
"result": "return dp[8] = true"
},
"pitfalls": [
"dp[0] must be true — an empty prefix always counts as breakable.",
"Use a Set for the dictionary, not an array — checking membership in an array is much slower.",
"Watch the substring boundaries: s[j:i] must exactly match a dictionary word, so double-check for off-by-one errors."
],
"patternTakeaway": "If you need to know whether a string can be fully split into valid pieces, always think: DP where dp[i] = true if some earlier valid cut point j lets the piece from j to i complete a word.",
"pattern": "Dynamic Programming"
},
{
"id": "algo-cat11-q6",
"guide": "Algorithms Guide",
"topic": "Dynamic Programming",
"topicNum": 11,
"level": "Medium",
"badge": "[Medium]  LeetCode #53  Pattern: DP / Kadane | Asked at: Amazon, Meta, Microsoft | Time: O(n)  Space: O(1)",
"question": "Maximum Subarray (Kadane Algorithm)",
"explanation": "Problem:\nYou get an array of numbers, some positive and some negative. Find the contiguous run of numbers (next to each other, no skipping) with the biggest sum.\nExample: [-2,1,-3,4,-1,2,1,-5,4] -> 6, from the subarray [4,-1,2,1]\n\nApproach:\nWalk through the array left to right. At each number, decide: keep extending your current running sum by adding this number, or — if the running sum has become a drag — throw it away and start fresh from just this number. The \"state\" is: the best sum of a subarray that ends exactly at this position. Also keep a separate \"best seen so far\" value that updates every step, since the best subarray might not end at the very last position.",
"code": "function maxSubArray(nums) {\n  let currentSum = nums[0];\n  let maxSum = nums[0];\n  \n  for (let i = 1; i < nums.length; i++) {\n    currentSum = Math.max(nums[i], currentSum + nums[i]);\n    maxSum = Math.max(maxSum, currentSum);\n  }\n  \n  return maxSum;\n}\n \nmaxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]); // 6\nmaxSubArray([1]);            // 1\nmaxSubArray([5, 4, -1, 7, 8]); // 23\n \n// Variant: Maximum Product Subarray (LeetCode 152)\n// Trickier because negative * negative = positive\nfunction maxProduct(nums) {\n  let maxSoFar = nums[0];\n  let minSoFar = nums[0]; // track min too! (for negatives)\n  let result = nums[0];\n  \n  for (let i = 1; i < nums.length; i++) {\n    const num = nums[i];\n    const tempMax = Math.max(num, maxSoFar * num, minSoFar * num);\n    minSoFar = Math.min(num, maxSoFar * num, minSoFar * num);\n    maxSoFar = tempMax;\n    result = Math.max(result, maxSoFar);\n  }\n  \n  return result;\n}",
"howTo": "1. You need the contiguous run of numbers (not just any subsequence) with the biggest sum — \"contiguous subarray, biggest total\" is the classic signal for Kadane's one-pass DP trick.\n2. Core idea: as you scan left to right, at each number you decide — keep extending your current running sum, or if that running sum has gone so negative it's dragging you down, abandon it and restart fresh from just this number. The \"state\" is \"the best sum of a subarray that ends exactly at this position\".\n3. Build order: start currentSum and maxSum both at the first number. For each next number, set currentSum to the bigger of (currentSum + number) or (number alone) — this decides whether to keep the streak or restart. Then update maxSum to be the bigger of maxSum or the new currentSum. Return maxSum at the end.\n4. Edge case to check: arrays that are all negative numbers — the answer should be the least-negative single number, not zero, so initialize maxSum from the first element, not from 0.",
"dryRun": {
"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
"frames": [
"Start: currentSum = -2, maxSum = -2.",
"num=1: currentSum = max(1, -2+1) = 1. maxSum = max(-2, 1) = 1.",
"num=-3: currentSum = max(-3, 1-3) = -2. maxSum stays 1.",
"num=4: currentSum = max(4, -2+4) = 4. maxSum = max(1, 4) = 4.",
"num=-1, 2, 1: currentSum grows to 3, 5, 6. maxSum updates to 6."
],
"result": "return 6"
},
"pitfalls": [
"If the array is all negative numbers, the answer is the least-negative single number, not zero — start maxSum from the first element, not from 0.",
"When restarting, reset currentSum to the current number itself, not to 0.",
"Check the problem's constraints on empty arrays — this problem usually assumes at least one element."
],
"patternTakeaway": "If you need the best contiguous run (not any subsequence) and negative values can drag your running total down, always think: DP one-pass (Kadane) — at each step, decide to extend or restart.",
"pattern": "Dynamic Programming"
},
{
"id": "algo-cat11-q7",
"guide": "Algorithms Guide",
"topic": "Dynamic Programming",
"topicNum": 11,
"level": "Medium",
"badge": "[Medium]  LeetCode #62  Pattern: 2D DP | Asked at: Amazon, Meta, Bloomberg | Time: O(m*n)  Space: O(m*n) -> O(n)",
"question": "Unique Paths",
"explanation": "Problem:\nA robot starts at the top-left corner of a grid with m rows and n columns. It wants to reach the bottom-right corner, moving only right or down. Count how many different paths exist.\nExample: m=3, n=7 -> 28 different paths\n\nApproach:\nBuild a grid dp[i][j] where each cell holds the number of ways to reach that cell. The only way to arrive at a cell is from the cell directly above it or the cell directly to its left, so dp[i][j] = dp[i-1][j] + dp[i][j-1]. The \"state\" dp[i][j] means: the number of distinct paths from the start to cell (i, j). The whole first row and first column are set to 1, because there's only one straight-line way to reach any of those cells.",
"code": "function uniquePaths(m, n) {\n  const dp = Array.from({ length: m }, () => new Array(n).fill(1));\n  \n  for (let i = 1; i < m; i++) {\n    for (let j = 1; j < n; j++) {\n      dp[i][j] = dp[i - 1][j] + dp[i][j - 1];\n    }\n  }\n  \n  return dp[m - 1][n - 1];\n}\n \n// Optimized: O(n) space\nfunction uniquePathsOpt(m, n) {\n  let row = new Array(n).fill(1);\n  \n  for (let i = 1; i < m; i++) {\n    for (let j = 1; j < n; j++) {\n      row[j] += row[j - 1];\n    }\n  }\n  \n  return row[n - 1];\n}\n \nuniquePaths(3, 7); // 28\nuniquePaths(3, 2); // 3",
"howTo": "1. You're counting paths through a grid moving only right or down — \"count paths in a grid with restricted moves\" is a signal for 2D DP where each cell's answer builds from the cells above and to the left.\n2. Core idea: the number of ways to reach any cell is the sum of the ways to reach the cell directly above it and the cell directly to its left, since those are the only two directions you could have arrived from. The \"state\" dp[i][j] means \"number of distinct paths from the start to cell (i, j)\".\n3. Build order: set every cell in the first row and first column to 1 (only one way to reach them — a straight line of downs or rights). Then fill the rest of the grid row by row using dp[i][j] = dp[i-1][j] + dp[i][j-1]. The bottom-right cell holds the answer.\n4. Common mistake: forgetting to initialize the first row/column to 1 before running the recurrence — without that base case, the DP has nothing valid to build from.",
"dryRun": {
"input": "m = 3, n = 3 grid",
"frames": [
"First row and first column filled with 1s (only one way to reach any edge cell).",
"dp[1][1] = dp[0][1] + dp[1][0] = 1 + 1 = 2.",
"dp[1][2] = dp[0][2] + dp[1][1] = 1 + 2 = 3.",
"dp[2][1] = dp[1][1] + dp[2][0] = 2 + 1 = 3.",
"dp[2][2] = dp[1][2] + dp[2][1] = 3 + 3 = 6."
],
"result": "return dp[2][2] = 6"
},
"pitfalls": [
"Forgetting to set the entire first row and first column to 1 before filling in the rest of the grid.",
"Mixing up m (rows) and n (columns) when building the grid's dimensions.",
"Confusing this with the version that has obstacles — this basic version has none, so every cell is reachable."
],
"patternTakeaway": "If you're counting paths through a grid with restricted moves (like only right or down), always think: 2D DP where each cell's count is the sum of the cells it could have come from.",
"pattern": "Dynamic Programming"
},
{
"id": "algo-cat11-q8",
"guide": "Algorithms Guide",
"topic": "Dynamic Programming",
"topicNum": 11,
"level": "Medium",
"badge": "[Medium]  LeetCode #1143  Pattern: 2D DP | Asked at: Amazon, Google, Microsoft | Time: O(m*n)  Space: O(m*n)",
"question": "Longest Common Subsequence",
"explanation": "Problem:\nYou get two strings. Find the length of their longest common subsequence — the longest sequence of characters that appears in both strings in the same order, but the characters don't need to be next to each other.\nExample: text1=\"abcde\", text2=\"ace\" -> 3, because \"ace\" appears in both in order\nExample: text1=\"abc\", text2=\"def\" -> 0\n\nApproach:\nBuild a 2D table where dp[i][j] means: the length of the longest common subsequence between the first i characters of text1 and the first j characters of text2. Compare characters one pair at a time. If the current characters match, you found one shared character, so add 1 to the best answer from right before both strings passed it (dp[i-1][j-1] + 1). If they don't match, take the better of dropping one character from either string (the bigger of dp[i-1][j] and dp[i][j-1]).",
"code": "function longestCommonSubsequence(text1, text2) {\n  const m = text1.length;\n  const n = text2.length;\n  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));\n  \n  for (let i = 1; i <= m; i++) {\n    for (let j = 1; j <= n; j++) {\n      if (text1[i - 1] === text2[j - 1]) {\n        dp[i][j] = dp[i - 1][j - 1] + 1;\n      } else {\n        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n      }\n    }\n  }\n  \n  return dp[m][n];\n}\n \nlongestCommonSubsequence('abcde', 'ace'); // 3\nlongestCommonSubsequence('abc', 'abc');    // 3\nlongestCommonSubsequence('abc', 'def');    // 0",
"howTo": "1. You're comparing two strings for the longest sequence they share (order matters, gaps OK) — \"shared subsequence between two sequences\" is the classic 2D DP-on-two-strings signal.\n2. Core idea: walk both strings together; if the current characters match, that's one guaranteed common character, so add 1 to whatever the best answer was right before both strings advanced past it. If they don't match, the best answer carries over from dropping one character off either string, whichever gives the bigger result. The \"state\" dp[i][j] means \"length of the longest common subsequence between the first i characters of text1 and the first j characters of text2\".\n3. Build order: make a 2D grid of size (m+1) by (n+1), all zeros. Fill row by row: if text1[i-1] equals text2[j-1], set dp[i][j] = dp[i-1][j-1] + 1; otherwise set dp[i][j] = the max of dp[i-1][j] and dp[i][j-1]. The answer is dp[m][n].\n4. Common mistake: off-by-one indexing — dp is sized (m+1)x(n+1) so \"zero characters used\" is a valid state, meaning dp[i][j] actually compares text1[i-1] and text2[j-1], not text1[i] and text2[j].",
"dryRun": {
"input": "text1 = \"abc\", text2 = \"ac\"",
"frames": [
"dp table is 4 rows by 3 columns, all starting at 0.",
"i=1 (a), j=1 (a): match! dp[1][1] = dp[0][0] + 1 = 1.",
"i=2 (b), j=1 (a): no match. dp[2][1] = max(dp[1][1]=1, dp[2][0]=0) = 1.",
"i=2 (b), j=2 (c): no match. dp[2][2] = max(dp[1][2]=1, dp[2][1]=1) = 1.",
"i=3 (c), j=2 (c): match! dp[3][2] = dp[2][1] + 1 = 2."
],
"result": "return dp[3][2] = 2 (\"ac\")"
},
"pitfalls": [
"The table is sized (m+1) x (n+1) — dp[i][j] compares text1[i-1] and text2[j-1], not text1[i] and text2[j]. Easy to slip on this off-by-one.",
"The first row and first column must stay 0, meaning comparing against an empty string always gives length 0.",
"Don't confuse this with Longest Common Substring — subsequence allows gaps, substring does not."
],
"patternTakeaway": "If you're comparing two sequences for the longest shared order-preserving pattern, always think: 2D DP where dp[i][j] compares the first i and first j elements, extending diagonally on a match.",
"pattern": "Dynamic Programming"
},
{
"id": "algo-cat11-q9",
"guide": "Algorithms Guide",
"topic": "Dynamic Programming",
"topicNum": 11,
"level": "Hard",
"badge": "[Hard]  LeetCode #72  Pattern: 2D DP | Asked at: Google, Amazon, Microsoft | Time: O(m*n)  Space: O(m*n)",
"question": "Edit Distance",
"explanation": "Problem:\nYou get two words. Find the minimum number of operations to turn word1 into word2. Allowed operations: insert a character, delete a character, or replace a character. Each operation costs 1.\nExample: word1=\"horse\", word2=\"ros\" -> 3 operations\nExample: word1=\"intention\", word2=\"execution\" -> 5 operations\n\nApproach:\nBuild a 2D table where dp[i][j] means: the minimum operations to turn the first i characters of word1 into the first j characters of word2. Base cases: turning an empty word1 into the first j characters of word2 needs j inserts, so dp[0][j] = j; turning the first i characters of word1 into an empty word2 needs i deletes, so dp[i][0] = i. When the current characters already match, no operation is needed — just copy dp[i-1][j-1]. When they don't match, you must spend one operation, so pick the cheapest of delete (dp[i-1][j]), insert (dp[i][j-1]), or replace (dp[i-1][j-1]), then add 1.",
"code": "function minDistance(word1, word2) {\n  const m = word1.length;\n  const n = word2.length;\n  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));\n  \n  // Base cases\n  for (let i = 0; i <= m; i++) dp[i][0] = i;\n  for (let j = 0; j <= n; j++) dp[0][j] = j;\n  \n  for (let i = 1; i <= m; i++) {\n    for (let j = 1; j <= n; j++) {\n      if (word1[i - 1] === word2[j - 1]) {\n        dp[i][j] = dp[i - 1][j - 1];\n      } else {\n        dp[i][j] = 1 + Math.min(\n          dp[i - 1][j],     // delete\n          dp[i][j - 1],     // insert\n          dp[i - 1][j - 1]  // replace\n        );\n      }\n    }\n  }\n  \n  return dp[m][n];\n}\n \nminDistance('horse', 'ros');             // 3\nminDistance('intention', 'execution');   // 5",
"howTo": "1. You need the minimum insert/delete/replace operations to turn one word into another — \"minimum edit operations between two strings\" is a 2D DP problem much like Longest Common Subsequence, just with a different recurrence.\n2. Core idea: compare the two strings character by character; if the current letters already match, no operation is needed, so just copy the answer from one step back diagonally. If they don't match, you must spend one operation, and you pick whichever of insert, delete, or replace leaves you with the smallest remaining problem. The \"state\" dp[i][j] means \"minimum operations to turn the first i characters of word1 into the first j characters of word2\".\n3. Build order: build a 2D grid of size (m+1) x (n+1). Set base cases first: dp[i][0] = i (delete everything) and dp[0][j] = j (insert everything). Then for each cell, if the characters match, dp[i][j] = dp[i-1][j-1]; otherwise dp[i][j] = 1 + the minimum of dp[i-1][j] (delete), dp[i][j-1] (insert), and dp[i-1][j-1] (replace). The answer is dp[m][n].\n4. Common mistake: confusing which neighbor represents insert vs delete — both cost 1 so the final number is unaffected, but mixing up the LCS recurrence with this one (forgetting the +1 for a mismatch) is the classic slip-up to double check.",
"dryRun": {
"input": "word1 = \"ab\", word2 = \"a\"",
"frames": [
"Base cases: dp[0][0]=0, dp[0][1]=1 (insert 'a'), dp[1][0]=1 (delete 'a'), dp[2][0]=2 (delete 'a' and 'b').",
"i=1 (a), j=1 (a): match! dp[1][1] = dp[0][0] = 0.",
"i=2 (b), j=1 (a): no match. dp[2][1] = 1 + min(dp[1][1]=0, dp[2][0]=2, dp[1][0]=1) = 1."
],
"result": "return dp[2][1] = 1 (delete 'b')"
},
"pitfalls": [
"Set the base cases first — dp[i][0]=i and dp[0][j]=j — before filling in the rest of the table.",
"On a mismatch, remember to add +1 for the operation — don't accidentally copy the Longest Common Subsequence recurrence, which skips that +1.",
"Insert and delete both cost 1, so it's easy to mix up which neighbor cell represents which — the final number is the same, but keep it straight when tracing through by hand."
],
"patternTakeaway": "If you need the minimum insert/delete/replace operations to transform one sequence into another, always think: 2D DP where dp[i][j] copies the diagonal on a match, or takes the min of three neighbors plus one on a mismatch.",
"pattern": "Dynamic Programming"
},
{
"id": "algo-cat12-q1",
"guide": "Algorithms Guide",
"topic": "Bit Manipulation",
"topicNum": 12,
"level": "Easy",
"badge": "[Easy]  LeetCode #136  Pattern: XOR | Asked at: Amazon, Google, Apple | Time: O(n)  Space: O(1)",
"question": "Single Number",
"explanation": "You get a list of numbers. Every number appears exactly two times, except for one number that appears only once. Find that one number.\nExample: [4,1,2,1,2] -> the answer is 4, because 1 and 2 each appear twice, but 4 appears only once.\nYou must solve this in O(n) time and O(1) extra space (no hash map or extra array allowed).\n\nHow to solve it:\nXOR has two useful rules: a number XORed with itself gives 0, and a number XORed with 0 stays the same.\nSo if you XOR all the numbers together, every pair cancels out to 0. The only number left at the end is the one without a pair.",
"code": "function singleNumber(nums) {\n  let result = 0;\n  for (const num of nums) {\n    result ^= num;\n  }\n  return result;\n}\n \nsingleNumber([2, 2, 1]);       // 1\nsingleNumber([4, 1, 2, 1, 2]); // 4\nsingleNumber([1]);             // 1\n \n// Trace [4,1,2,1,2]:\n// 0 ^ 4 = 4\n// 4 ^ 1 = 5\n// 5 ^ 2 = 7\n// 7 ^ 1 = 6\n// 6 ^ 2 = 4 ✓",
"howTo": "1. Every number appears twice except one — 'find the one without a pair' is a signal to use XOR instead of a hash set.\n2. Remember two XOR facts: a number XORed with itself is 0, and a number XORed with 0 stays the same.\n3. XOR all the numbers together in one pass. Every pair cancels itself out.\n4. Whatever value is left at the end is your answer — it never had a partner to cancel with.\n5. Common mistake: using a hash map to count occurrences also works, but uses extra space. If the problem asks for O(1) space, XOR is the trick they want.",
"dryRun": {
"input": "nums = [4,1,2,1,2]",
"frames": [
"result = 0 (start)",
"result = 0 ^ 4 = 4",
"result = 4 ^ 1 = 5",
"result = 5 ^ 2 = 7",
"result = 7 ^ 1 = 6",
"result = 6 ^ 2 = 4"
],
"result": "return 4"
},
"pitfalls": [
"Array with only one element — just return it; the XOR loop still works fine (0 ^ x = x).",
"This trick only works when every OTHER number appears exactly twice. If they appear three times instead, you need a different bit-counting trick.",
"In JavaScript, bitwise operators work on 32-bit signed integers — very large numbers can behave unexpectedly."
],
"patternTakeaway": "If every number in the list appears twice except one, always think: XOR everything together — the duplicates cancel out and the lone number remains.",
"pattern": "Bit Manipulation"
},
{
"id": "algo-cat12-q2",
"guide": "Algorithms Guide",
"topic": "Bit Manipulation",
"topicNum": 12,
"level": "Easy",
"badge": "[Easy]  LeetCode #191  Pattern: Bit Manipulation | Asked at: Apple, Microsoft | Time: O(1) — at most 32 bits  Space: O(1)",
"question": "Number of 1 Bits (Hamming Weight)",
"explanation": "You get a 32-bit unsigned integer. Count how many of its bits are 1.\nExample: 11 in binary is 1011, so the answer is 3.\n\nHow to solve it:\nSimple way: check each of the 32 bit positions one by one, and count how many are 1.\nFaster way: use the trick n & (n-1). This always removes the lowest 1-bit from n. Keep doing this and counting until n becomes 0 — the count is your answer.",
"code": "// Approach 1: Check each bit\nfunction hammingWeight(n) {\n  let count = 0;\n  for (let i = 0; i < 32; i++) {\n    if ((n >>> i) & 1) count++;\n  }\n  return count;\n}\n \n// Approach 2: n & (n-1) trick (faster)\nfunction hammingWeightFast(n) {\n  let count = 0;\n  while (n !== 0) {\n    n = n & (n - 1); // remove lowest set bit\n    count++;\n  }\n  return count;\n}\n \nhammingWeight(11);  // 3 (1011)\nhammingWeight(128); // 1 (10000000)\n \n// Why does n & (n-1) work?\n// 12 = 1100\n// 11 = 1011\n// & =  1000  (lowest 1 cleared)",
"howTo": "1. The question asks how many 1-bits a number has — that means working with the number in binary, one bit at a time.\n2. Simple way: check all 32 positions with a mask and count the ones that are set.\n3. Faster trick: n AND (n-1) always deletes the lowest 1-bit in n. Counting how many times you can do this before n hits 0 gives you the bit count.\n4. Start a counter at 0. Loop while n is not 0: do n = n AND (n-1), add 1 to the counter.\n5. Return the counter once n reaches 0.\n6. Edge case: this loop runs once per 1-bit, not 32 times — don't confuse it with the slower fixed-32-iteration approach.",
"dryRun": {
"input": "n = 11 (binary 1011)",
"frames": [
"n = 1011 (11), count = 0",
"n & (n-1) = 1011 & 1010 = 1010 (10). count = 1",
"n & (n-1) = 1010 & 1001 = 1000 (8). count = 2",
"n & (n-1) = 1000 & 0111 = 0000 (0). count = 3",
"n is now 0, stop the loop"
],
"result": "return 3"
},
"pitfalls": [
"n = 0 has zero 1-bits — the loop should not run at all and should return 0.",
"In JavaScript, use >>> (unsigned shift), not >>, or negative numbers will give wrong bit checks.",
"The n & (n-1) trick loops once per 1-bit, not always 32 times — don't confuse it with the slower fixed 32-iteration approach."
],
"patternTakeaway": "If you need to count set bits (1-bits) in a number, always think: use n & (n-1) to strip the lowest 1-bit one at a time instead of checking all 32 positions.",
"pattern": "Bit Manipulation"
},
{
"id": "algo-cat12-q3",
"guide": "Algorithms Guide",
"topic": "Bit Manipulation",
"topicNum": 12,
"level": "Easy",
"badge": "[Easy]  LeetCode #338  Pattern: DP + Bit Manipulation | Asked at: Amazon, Apple | Time: O(n)  Space: O(n)",
"question": "Counting Bits",
"explanation": "You get a number n. Return an array of length n+1, where each position i holds the count of 1-bits in the number i.\nExample: n=2 -> [0,1,1], because 0 has zero 1-bits, 1 (binary 1) has one 1-bit, and 2 (binary 10) has one 1-bit.\n\nHow to solve it:\nInstead of counting bits for every number from scratch, reuse answers you already found.\nRemoving the last bit of i (shift right by 1) gives a smaller number whose answer you already know.\nSo: bits[i] = bits[i >> 1] + (1 if the last bit of i is 1, otherwise 0).",
"code": "function countBits(n) {\n  const bits = new Array(n + 1).fill(0);\n  \n  for (let i = 1; i <= n; i++) {\n    bits[i] = bits[i >> 1] + (i & 1);\n  }\n  \n  return bits;\n}\n \ncountBits(2); // [0, 1, 1]\ncountBits(5); // [0, 1, 1, 2, 1, 2]\n \n// Alternative DP recurrence: bits[i] = bits[i & (i-1)] + 1\nfunction countBitsAlt(n) {\n  const bits = new Array(n + 1).fill(0);\n  for (let i = 1; i <= n; i++) {\n    bits[i] = bits[i & (i - 1)] + 1;\n  }\n  return bits;\n}",
"howTo": "1. You need the bit-count for every number from 0 to n — needing many related answers at once is a signal to reuse previous results (dynamic programming) instead of recomputing each from scratch.\n2. Core trick: dropping the last bit of i (shift right by 1) gives a smaller number whose bit-count you already computed.\n3. The count for i equals the count for (i shifted right by 1), plus 1 if i's last bit is 1.\n4. Build an array of size n+1, set index 0 to 0.\n5. Fill in each index i using that formula, moving left to right.\n6. Double check index 0 is correct first — every other answer depends on earlier ones being right.",
"dryRun": {
"input": "n = 5",
"frames": [
"bits[0] = 0 (base case)",
"i=1: bits[1] = bits[1>>1] + (1&1) = bits[0] + 1 = 0+1 = 1",
"i=2: bits[2] = bits[2>>1] + (2&1) = bits[1] + 0 = 1+0 = 1",
"i=3: bits[3] = bits[3>>1] + (3&1) = bits[1] + 1 = 1+1 = 2",
"i=4: bits[4] = bits[4>>1] + (4&1) = bits[2] + 0 = 1+0 = 1",
"i=5: bits[5] = bits[5>>1] + (5&1) = bits[2] + 1 = 1+1 = 2"
],
"result": "return [0,1,1,2,1,2]"
},
"pitfalls": [
"n = 0 means the result array is just [0] — don't forget this smallest case.",
"Always set bits[0] = 0 first — every other answer in the array is built on top of earlier values.",
"Recomputing bit counts from scratch for every i is O(n log n) — slower than the O(n) trick of reusing earlier results."
],
"patternTakeaway": "If you need bit-counts for every number from 0 to n, always think: reuse bits[i >> 1] (dynamic programming) instead of recomputing each number's bits separately.",
"pattern": "Bit Manipulation"
},
{
"id": "algo-cat12-q4",
"guide": "Algorithms Guide",
"topic": "Bit Manipulation",
"topicNum": 12,
"level": "Easy",
"badge": "[Easy]  LeetCode #190  Pattern: Bit Manipulation | Asked at: Apple, Amazon | Time: O(1)  Space: O(1)",
"question": "Reverse Bits",
"explanation": "You get a 32-bit unsigned integer. Reverse the order of its bits — the first bit becomes the last, and so on.\nExample: 43261596 becomes 964176192.\n\nHow to solve it:\nGo through all 32 bits one at a time. Take the last bit of n and add it to the front of your result.\nEach step: shift the result left by 1 to make room, then OR in the last bit of n. Then shift n right by 1 to move to the next bit. Repeat this 32 times.",
"code": "function reverseBits(n) {\n  let result = 0;\n  \n  for (let i = 0; i < 32; i++) {\n    result = (result << 1) | (n & 1); // append last bit of n\n    n >>>= 1; // shift n right (unsigned)\n  }\n  \n  return result >>> 0; // ensure unsigned\n}\n \nreverseBits(43261596);  // 964176192\nreverseBits(4294967293); // 3221225471",
"howTo": "1. 'Reverse the bits of a 32-bit number' means you must process it bit by bit, not treat it as one big value.\n2. Core trick: repeatedly pull the last bit off the input and stack it onto the front of your result, like peeling digits off one number and building a new one in reverse.\n3. Start result at 0 and loop 32 times.\n4. Each loop: shift result left by 1 to make room, then OR in the last bit of n.\n5. Then shift n right by 1 so the next bit becomes the new 'last bit'.\n6. Common mistake: use an UNSIGNED shift on n and force the final result unsigned too, or JavaScript may treat it as a negative number.",
"dryRun": {
"input": "n = 1000 in binary (shown with only 4 bits to keep it simple; the real code always loops all 32 bits the same way)",
"frames": [
"n=1000. last bit of n = 0. result = (0000<<1)|0 = 0000. n >>>= 1 -> n=0100",
"n=0100. last bit of n = 0. result = (0000<<1)|0 = 0000. n >>>= 1 -> n=0010",
"n=0010. last bit of n = 0. result = (0000<<1)|0 = 0000. n >>>= 1 -> n=0001",
"n=0001. last bit of n = 1. result = (0000<<1)|1 = 0001. n >>>= 1 -> n=0000"
],
"result": "return 0001 (1) — the bits of 1000 reversed"
},
"pitfalls": [
"Must use unsigned right shift (>>>) not signed (>>), or negative numbers break the bit extraction in JavaScript.",
"Remember to force `result >>> 0` at the end, or JavaScript may treat the result as a negative number.",
"The loop always runs exactly 32 times, even for small n — leading zero bits still matter for a correct reversal."
],
"patternTakeaway": "If you need to reverse the bits of a fixed-width number, always think: peel the last bit off one side and push it onto the other side, one bit per loop iteration.",
"pattern": "Bit Manipulation"
},
{
"id": "algo-cat12-q5",
"guide": "Algorithms Guide",
"topic": "Bit Manipulation",
"topicNum": 12,
"level": "Easy",
"badge": "[Easy]  LeetCode #268  Pattern: XOR / Math | Asked at: Amazon, Microsoft, Bloomberg | Time: O(n)  Space: O(1)",
"question": "Missing Number",
"explanation": "You get an array of n distinct numbers, all picked from the range 0 to n. One number in that range is missing from the array. Find it.\nExample: [3,0,1] -> the full range is 0 to 3, and 2 is missing.\n\nHow to solve it (XOR way):\nXOR every index (0 to n) together with every value in the array. Numbers that exist in the array cancel out with their matching index. What's left at the end is the missing number.\n(There is also a math way: subtract the array's actual sum from the expected sum of 0..n — but XOR avoids overflow problems on huge inputs.)",
"code": "// Approach 1: Math\nfunction missingNumber(nums) {\n  const n = nums.length;\n  const expected = n * (n + 1) / 2;\n  const actual = nums.reduce((sum, num) => sum + num, 0);\n  return expected - actual;\n}\n \n// Approach 2: XOR\nfunction missingNumberXOR(nums) {\n  let result = nums.length; // start with n itself\n  \n  for (let i = 0; i < nums.length; i++) {\n    result ^= i ^ nums[i];\n  }\n  \n  return result;\n}\n \nmissingNumber([3, 0, 1]); // 2\nmissingNumber([0, 1]);    // 2\nmissingNumber([9, 6, 4, 2, 3, 5, 7, 0, 1]); // 8",
"howTo": "1. You have n distinct numbers that should span a range of n+1 values, and one is missing — 'expected values vs actual values' signals a sum formula or an XOR cancellation.\n2. XOR trick: XOR every index (0 to n) together with every array value. Numbers that exist cancel with their matching index.\n3. Start result at n (the one extra index beyond the array).\n4. Loop through the array once, XOR-ing in both the index and the value each time.\n5. What's left in result is the missing number.\n6. Edge case: the sum-formula approach works too but can overflow on huge arrays — XOR avoids that risk.",
"dryRun": {
"input": "nums = [3,0,1] (n=3, full range is 0..3)",
"frames": [
"result = n = 3 (start)",
"i=0: result = 3 ^ 0 ^ nums[0](3) = 3^0^3 = 0",
"i=1: result = 0 ^ 1 ^ nums[1](0) = 0^1^0 = 1",
"i=2: result = 1 ^ 2 ^ nums[2](1) = 1^2^1 = 2"
],
"result": "return 2"
},
"pitfalls": [
"The array has n elements but the range is 0 to n (n+1 possible values) — off-by-one mistakes are easy here.",
"Start the XOR result at n itself (the one extra index beyond the array's length), not at 0.",
"The sum-formula approach can overflow on very large arrays — XOR avoids that risk entirely."
],
"patternTakeaway": "If you're missing exactly one number from a known range like 0..n, always think: XOR all indices and all values together — matches cancel out and the missing number remains.",
"pattern": "Bit Manipulation"
},
{
"id": "algo-cat12-q6",
"guide": "Algorithms Guide",
"topic": "Bit Manipulation",
"topicNum": 12,
"level": "Medium",
"badge": "[Medium]  LeetCode #371  Pattern: Bit Manipulation | Asked at: Microsoft, Apple | Time: O(1)  Space: O(1)",
"question": "Sum of Two Integers (without + or -)",
"explanation": "Add two numbers, a and b, without using the + or - operator.\nExample: a=2, b=3 -> 5\n\nHow to solve it:\nXOR of two numbers adds them but forgets to carry — for example 1 XOR 1 = 0, which loses the carry.\nAND of two numbers, shifted left by 1, tells you exactly where that missing carry belongs.\nRepeat: new sum = a XOR b, new carry = (a AND b) shifted left by 1. Set a = new sum, b = new carry, and keep going until there is no carry left (b = 0). Then a is the answer.",
"code": "function getSum(a, b) {\n  while (b !== 0) {\n    const carry = (a & b) << 1;\n    a = a ^ b;\n    b = carry;\n  }\n  return a;\n}\n \ngetSum(1, 2);   // 3\ngetSum(2, 3);   // 5\ngetSum(-1, 1);  // 0\n \n// Trace getSum(2, 3):\n// 2 = 010, 3 = 011\n// XOR = 001 (1), carry = (010 & 011) << 1 = 010 << 1 = 100\n// a=1, b=4\n// XOR = 101 (5), carry = 0\n// Return 5",
"howTo": "1. Banning + and - is a strong hint to simulate addition using bit tricks instead.\n2. XOR of two numbers adds them but drops any carry. AND of two numbers, shifted left by one, tells you exactly where a carry lands.\n3. Loop while the carry (b) is not zero.\n4. Each round: compute carry as (a AND b) shifted left by 1, then set a to (a XOR b).\n5. Set b to that new carry and repeat until b is 0, then return a.\n6. Common mistake: this same loop handles negative numbers correctly through two's complement — don't add special cases for them.",
"dryRun": {
"input": "a=2, b=3 (binary 010, 011)",
"frames": [
"a=010 (2), b=011 (3)",
"carry = (a & b) << 1 = (010 & 011) << 1 = 010 << 1 = 100 (4)",
"a = a ^ b = 010 ^ 011 = 001 (1)",
"b = carry = 100 (4). b is not 0, loop again",
"carry = (a & b) << 1 = (001 & 100) << 1 = 000 << 1 = 000 (0)",
"a = a ^ b = 001 ^ 100 = 101 (5). b = 0, stop the loop"
],
"result": "return 5"
},
"pitfalls": [
"This same loop correctly handles negative numbers through two's complement — no special case is needed.",
"Update a and b together each round; using the old a after computing the new one breaks the trick.",
"The loop must continue until the carry (b) is exactly 0, not just small."
],
"patternTakeaway": "If you must add numbers without using + or -, always think: XOR gives the sum without carry, and AND shifted left gives the carry — loop until the carry is zero.",
"pattern": "Bit Manipulation"
},
{
"id": "algo-cat13-q1",
"guide": "Algorithms Guide",
"topic": "Intervals",
"topicNum": 13,
"level": "Medium",
"badge": "[Medium]  LeetCode #57  Pattern: Intervals | Asked at: Google, Meta, LinkedIn | Time: O(n)  Space: O(n)",
"question": "Insert Interval",
"explanation": "You have a list of intervals that are already sorted by start time and don't overlap with each other. You get one new interval. Insert it into the list, merging with any intervals it overlaps.\nExample: intervals=[[1,3],[6,9]], newInterval=[2,5] -> [[1,5],[6,9]]\n\nHow to solve it, in three steps:\n1. Copy over every interval that ends before the new interval starts — there's no overlap, so it's safe to keep as is.\n2. While an interval's start is at or before the new interval's end, merge it in — grow the new interval to cover both.\n3. Push the final, fully-grown new interval, then copy over whatever intervals are left.",
"code": "function insert(intervals, newInterval) {\n  const result = [];\n  let i = 0;\n  const n = intervals.length;\n  \n  // 1. Intervals before newInterval (no overlap)\n  while (i < n && intervals[i][1] < newInterval[0]) {\n    result.push(intervals[i]);\n    i++;\n  }\n  \n  // 2. Merge overlapping intervals with newInterval\n  while (i < n && intervals[i][0] <= newInterval[1]) {\n    newInterval[0] = Math.min(newInterval[0], intervals[i][0]);\n    newInterval[1] = Math.max(newInterval[1], intervals[i][1]);\n    i++;\n  }\n  result.push(newInterval);\n  \n  // 3. Remaining intervals\n  while (i < n) {\n    result.push(intervals[i]);\n    i++;\n  }\n  \n  return result;\n}\n \ninsert([[1,3],[6,9]], [2,5]); // [[1,5],[6,9]]\ninsert([[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8]);\n// [[1,2],[3,10],[12,16]]",
"howTo": "1. The intervals are already sorted and non-overlapping — that setup is a signal you can do one clean sweep instead of re-sorting everything.\n2. Split the work into three zones: intervals fully before the new one, intervals that overlap it, and intervals fully after it.\n3. Copy over every interval that ends before the new interval starts — no overlap possible there.\n4. While an interval's start is at or before the new interval's end, merge it in: stretch the new interval's start and end to cover both.\n5. Push the fully merged new interval, then copy over whatever intervals remain.\n6. Edge case: your overlap check must compare against the new interval's CURRENT end (which may have already grown), not its original end.",
"dryRun": {
"input": "intervals=[[1,3],[6,9]], newInterval=[2,5]",
"frames": [
"Phase 1: intervals[0]=[1,3]. Its end(3) is not before newInterval.start(2), so phase 1 adds nothing yet. result=[]",
"Phase 2: intervals[0]=[1,3]. start(1) <= newInterval.end(5), so merge: newInterval = [min(2,1), max(5,3)] = [1,5]. i=1",
"intervals[1]=[6,9]. start(6) <= newInterval.end(5)? No (6>5). Stop phase 2.",
"Push the merged newInterval [1,5] into result. result=[[1,5]]",
"Phase 3: push the remaining intervals[1]=[6,9]. result=[[1,5],[6,9]]"
],
"result": "return [[1,5],[6,9]]"
},
"pitfalls": [
"Always compare against the new interval's CURRENT (possibly already-grown) start/end during merging, not its original values.",
"If the new interval doesn't overlap anything at all, phase 2 simply merges zero intervals — that's still a valid, correct case.",
"Empty input intervals list — just return [newInterval]."
],
"patternTakeaway": "If the intervals are already sorted and non-overlapping and you must insert one more, always think: split into before / overlapping / after, and grow the new interval while sweeping through the overlapping zone.",
"pattern": "Intervals & Greedy"
},
{
"id": "algo-cat13-q2",
"guide": "Algorithms Guide",
"topic": "Intervals",
"topicNum": 13,
"level": "Medium",
"badge": "[Medium]  LeetCode #56  Pattern: Intervals | Asked at: Meta, Amazon, Google, Bloomberg | Time: O(n log n)  Space: O(n)",
"question": "Merge Intervals",
"explanation": "You get a list of intervals that are NOT necessarily sorted. Merge every pair that overlaps.\nExample: [[1,3],[2,6],[8,10],[15,18]] -> [[1,6],[8,10],[15,18]]\n\nHow to solve it:\nFirst sort the intervals by their start value. Then walk through them one at a time.\nCompare each interval to the last one you kept in your result. If the new one starts at or before the last one's end, they overlap — stretch the last one's end to cover both. Otherwise, add it as a brand new separate interval.",
"code": "function merge(intervals) {\n  if (intervals.length === 0) return [];\n  \n  intervals.sort((a, b) => a[0] - b[0]);\n  \n  const result = [intervals[0]];\n  \n  for (let i = 1; i < intervals.length; i++) {\n    const current = intervals[i];\n    const last = result[result.length - 1];\n    \n    if (current[0] <= last[1]) {\n      // Overlap - merge\n      last[1] = Math.max(last[1], current[1]);\n    } else {\n      // No overlap\n      result.push(current);\n    }\n  }\n  \n  return result;\n}\n \nmerge([[1,3],[2,6],[8,10],[15,18]]); // [[1,6],[8,10],[15,18]]\nmerge([[1,4],[4,5]]);                 // [[1,5]]\nmerge([[1,4],[2,3]]);                 // [[1,4]]",
"howTo": "1. The intervals are NOT guaranteed to be sorted — an unsorted-overlap setup is the classic signal to sort by start time first, then do one pass.\n2. Once sorted, you only ever need to compare each interval to the LAST one you kept — anything further back is already handled.\n3. Sort all intervals by start value.\n4. Put the first interval in your result as the current 'last kept' interval.\n5. For each next interval: if its start is at or before the last kept interval's end, stretch that last interval's end to cover both. Otherwise, push it as a new separate interval.\n6. Edge case: touching intervals like [1,4] and [4,5] still overlap (start <= end, not strictly less than) — don't miss that boundary.",
"dryRun": {
"input": "intervals=[[1,3],[2,6],[8,10],[15,18]]",
"frames": [
"Sort by start: [[1,3],[2,6],[8,10],[15,18]] (already sorted here)",
"result=[[1,3]] (start with the first interval)",
"current=[2,6]. last=[1,3]. current.start(2) <= last.end(3)? Yes, overlap. Merge: last.end = max(3,6)=6. result=[[1,6]]",
"current=[8,10]. last=[1,6]. current.start(8) <= last.end(6)? No. Push as new. result=[[1,6],[8,10]]",
"current=[15,18]. last=[8,10]. current.start(15) <= last.end(10)? No. Push as new. result=[[1,6],[8,10],[15,18]]"
],
"result": "return [[1,6],[8,10],[15,18]]"
},
"pitfalls": [
"The input is NOT guaranteed to be sorted — always sort by start time first, or the merge logic breaks.",
"Touching intervals like [1,4] and [4,5] DO count as overlapping (start <= end, not strictly less than) — they should merge into [1,5].",
"Compare against the last KEPT interval in your result, not the previous original interval from the input."
],
"patternTakeaway": "If you're dealing with a list of ranges/intervals and need to merge overlaps, always think: sort by start time first, then sweep through comparing each one to the last kept interval.",
"pattern": "Intervals & Greedy"
},
{
"id": "algo-cat13-q3",
"guide": "Algorithms Guide",
"topic": "Intervals",
"topicNum": 13,
"level": "Medium",
"badge": "[Medium]  LeetCode #435  Pattern: Greedy + Intervals | Asked at: Amazon, Google | Time: O(n log n)  Space: O(1)",
"question": "Non-overlapping Intervals",
"explanation": "You get a list of intervals. Find the minimum number of intervals you need to remove so that none of the remaining ones overlap.\nExample: [[1,2],[2,3],[3,4],[1,3]] -> 1 (remove [1,3])\n\nHow to solve it:\nSort the intervals by their END time, not their start time. This is a greedy trick: always keep the interval that finishes earliest, because finishing early leaves the most room for whatever comes next.\nWalk through the sorted list. If the current interval starts before the last kept interval ends, they overlap — remove the current one (count it). Otherwise, keep it and update the last-kept end.",
"code": "function eraseOverlapIntervals(intervals) {\n  if (intervals.length === 0) return 0;\n  \n  // Sort by end time\n  intervals.sort((a, b) => a[1] - b[1]);\n  \n  let removed = 0;\n  let lastEnd = intervals[0][1];\n  \n  for (let i = 1; i < intervals.length; i++) {\n    if (intervals[i][0] < lastEnd) {\n      // Overlap - remove current\n      removed++;\n    } else {\n      lastEnd = intervals[i][1];\n    }\n  }\n  \n  return removed;\n}\n \neraseOverlapIntervals([[1,2],[2,3],[3,4],[1,3]]); // 1\neraseOverlapIntervals([[1,2],[1,2],[1,2]]);        // 2\neraseOverlapIntervals([[1,2],[2,3]]);              // 0",
"howTo": "1. You need the minimum removals to eliminate overlaps — this is a greedy interval problem, but the twist is you sort by END time, not start time.\n2. Core trick: keep whichever interval finishes earliest at each step, because ending early leaves the most room for what comes next.\n3. Sort intervals by end value.\n4. Track the end time of the last interval you decided to keep, starting with the first one.\n5. For each next interval: if its start is before your last kept end, it overlaps — count it as removed. Otherwise keep it and update your last-kept end.\n6. Common mistake: sorting by start time instead of end time — that's the wrong pattern here and gives wrong answers.",
"dryRun": {
"input": "intervals=[[1,2],[2,3],[3,4],[1,3]]",
"frames": [
"Sort by end time: [[1,2],[2,3],[1,3],[3,4]]",
"lastEnd = 2 (from [1,2]). removed=0",
"[2,3]: start(2) < lastEnd(2)? No. Keep it. lastEnd=3",
"[1,3]: start(1) < lastEnd(3)? Yes, overlap. removed=1 (this one gets removed)",
"[3,4]: start(3) < lastEnd(3)? No. Keep it. lastEnd=4"
],
"result": "return 1"
},
"pitfalls": [
"Must sort by END time, not start time — sorting by start gives wrong answers on this problem.",
"Equal boundaries (start == lastEnd) are NOT an overlap — use a strict < check, not <=.",
"All identical intervals like [[1,2],[1,2],[1,2]] should remove n-1 of them, keeping just one."
],
"patternTakeaway": "If you need the minimum removals to make intervals non-overlapping, always think: sort by END time and greedily keep whichever interval finishes earliest.",
"pattern": "Intervals & Greedy"
},
{
"id": "algo-cat13-q4",
"guide": "Algorithms Guide",
"topic": "Intervals",
"topicNum": 13,
"level": "Easy",
"badge": "[Easy]  LeetCode #252  Pattern: Intervals | Asked at: Amazon, Meta, Google | Time: O(n log n)  Space: O(1)",
"question": "Meeting Rooms",
"explanation": "You get a list of meeting time intervals. Can one person attend all of them with no time conflicts? Return true or false.\nExample: [[0,30],[5,10],[15,20]] -> false, because they overlap.\n\nHow to solve it:\nSort the meetings by start time. Then check each meeting against the one right before it. If a meeting starts before the previous one ends, there's a conflict.",
"code": "function canAttendMeetings(intervals) {\n  intervals.sort((a, b) => a[0] - b[0]);\n  \n  for (let i = 1; i < intervals.length; i++) {\n    if (intervals[i][0] < intervals[i - 1][1]) {\n      return false; // overlap\n    }\n  }\n  \n  return true;\n}\n \ncanAttendMeetings([[0,30],[5,10],[15,20]]); // false\ncanAttendMeetings([[7,10],[2,4]]);           // true",
"howTo": "1. The question just asks yes/no — can one person attend everything — that's the simplest interval check: sort by start, then compare neighbors.\n2. Once sorted by start time, a conflict can only happen between an interval and the one right before it.\n3. Sort the intervals by start time.\n4. Walk through them, comparing each interval's start to the PREVIOUS interval's end.\n5. If any interval starts before the previous one ends, return false immediately.\n6. If you finish the whole list with no conflict, return true. Edge case: back-to-back meetings (one starts exactly when another ends) are fine, not a conflict.",
"dryRun": {
"input": "intervals=[[0,30],[5,10],[15,20]]",
"frames": [
"Sort by start time: [[0,30],[5,10],[15,20]] (already sorted here)",
"i=1: current=[5,10], previous=[0,30]. Check if current.start(5) < previous.end(30).",
"5 < 30 is true — that's a conflict, so we can stop right away."
],
"result": "return false"
},
"pitfalls": [
"Input may not be sorted by start time — always sort first.",
"Back-to-back meetings (one starts exactly when the previous ends) are fine — use a strict < check for conflicts, not <=.",
"An empty list or a single meeting has nothing to conflict with — should return true immediately."
],
"patternTakeaway": "If you just need a yes/no answer about whether any meetings/intervals overlap, always think: sort by start time and compare each interval only to the one right before it.",
"pattern": "Intervals & Greedy"
},
{
"id": "algo-cat13-q5",
"guide": "Algorithms Guide",
"topic": "Intervals",
"topicNum": 13,
"level": "Medium",
"badge": "[Medium]  LeetCode #253  Pattern: Intervals + Heap / Two Pointers | Asked at: Meta, Amazon, Google, Microsoft | Time: O(n log n)  Space: O(n)",
"question": "Meeting Rooms II",
"explanation": "You get a list of meeting time intervals. Find the minimum number of rooms needed so all meetings can happen without conflicts.\nExample: [[0,30],[5,10],[15,20]] -> 2 rooms are needed.\n\nHow to solve it (two pointers way):\nSplit the meetings into two separate lists: one of all start times, one of all end times. Sort both lists.\nWalk through the start times with one pointer, and the end times with another pointer.\nFor each start time: if it happens before the earliest unfinished meeting ends, you need a brand new room. Otherwise, a room just freed up — move the end pointer forward and reuse that room.",
"code": "// Approach 2: Two pointers (no heap needed)\nfunction minMeetingRooms(intervals) {\n  const starts = intervals.map(i => i[0]).sort((a, b) => a - b);\n  const ends = intervals.map(i => i[1]).sort((a, b) => a - b);\n  \n  let rooms = 0;\n  let endPointer = 0;\n  \n  for (let i = 0; i < starts.length; i++) {\n    if (starts[i] < ends[endPointer]) {\n      // New meeting starts before any ends -> need new room\n      rooms++;\n    } else {\n      // A meeting ended, can reuse that room\n      endPointer++;\n    }\n  }\n  \n  return rooms;\n}\n \nminMeetingRooms([[0,30],[5,10],[15,20]]); // 2\nminMeetingRooms([[7,10],[2,4]]);           // 1\nminMeetingRooms([[1,5],[8,9],[8,9]]);      // 2",
"howTo": "1. Now you need the minimum number of ROOMS, not just yes/no — counting how many things overlap at once is a signal to track starts and ends as separate timelines.\n2. Think of every start as needing a room and every end as freeing one. Sweeping through sorted starts and ends together tells you the max rooms in use at any moment.\n3. Split the intervals into a starts array and an ends array, sort each separately.\n4. Use two pointers, one walking through starts and one through ends.\n5. For each start: if it happens before the earliest unfinished meeting ends, you need a new room. Otherwise, that earlier meeting freed a room — move the end-pointer forward and reuse it.\n6. Common mistake: worrying that separating starts from ends loses track of which meeting is which — that's fine here, since you only need the COUNT of overlaps.",
"dryRun": {
"input": "intervals=[[0,30],[5,10],[15,20]]",
"frames": [
"starts sorted = [0,5,15]. ends sorted = [10,20,30]",
"start=0: 0 < ends[0](10)? Yes -> need a new room. rooms=1",
"start=5: 5 < ends[0](10)? Yes -> need a new room. rooms=2",
"start=15: 15 < ends[0](10)? No -> a room freed up, move the end pointer. endPointer=1"
],
"result": "return 2"
},
"pitfalls": [
"Splitting starts and ends loses track of which meeting owns which time, but that's fine — you only need the COUNT of overlaps, not which meeting is where.",
"Compare each start to the CURRENT unfinished end (ends[endPointer]), not always the very first end value.",
"A meeting ending exactly when another starts should NOT need an extra room — use a strict < check for 'needs new room', not <=."
],
"patternTakeaway": "If you need the minimum number of resources (rooms) to handle overlapping intervals at once, always think: sort starts and ends separately, then sweep with two pointers counting rooms in use.",
"pattern": "Intervals & Greedy"
},
{
"id": "algo-cat14-q1",
"guide": "Algorithms Guide",
"topic": "Greedy",
"topicNum": 14,
"level": "Medium",
"badge": "[Medium]  LeetCode #53  Pattern: Greedy / Kadane | Asked at: Amazon, Microsoft, LinkedIn | Time: O(n)  Space: O(1)",
"question": "Maximum Subarray (Greedy version)",
"explanation": "Problem: Find the contiguous (unbroken) part of the array with the largest sum. Example: for [-2,1,-3,4,-1,2,1,-5,4] the answer is 6.\n\nHow to solve it: Walk through the array once. At each number, ask a simple question: is my running sum still helping me, or is it better to start over from this number alone? A running sum that is negative only hurts future numbers, so drop it and restart. Keep a second variable that remembers the best sum you have seen so far.",
"code": "function maxSubArray(nums) {\n  let currentSum = nums[0];\n  let maxSum = nums[0];\n  \n  for (let i = 1; i < nums.length; i++) {\n    // Greedy decision: continue or start fresh\n    currentSum = Math.max(nums[i], currentSum + nums[i]);\n    maxSum = Math.max(maxSum, currentSum);\n  }\n  \n  return maxSum;\n}\n \nmaxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]); // 6",
"howTo": "1. You want the biggest sum from a contiguous run of numbers — 'contiguous, one pass, running total' is the signal for Kadane's greedy trick.\n2. At every position, ask: is my running sum still helping, or would I do better starting fresh from this number alone? A negative running sum only drags down the future.\n3. Start both a current-sum and a best-sum-so-far at the first number.\n4. For each next number, pick the bigger of (extend the run) or (start fresh from this number).\n5. After updating current-sum, update best-sum-so-far if current-sum is now bigger.\n6. Edge case: if every number is negative, the answer is the largest single number, not zero — make sure you don't allow an empty subarray.",
"dryRun": {
"input": "nums = [-2,1,-3,4,-1,2]",
"frames": [
"Start: currentSum=-2, maxSum=-2 (both set to the first number).",
"i=1, num=1. currentSum=max(1, -2+1=-1)=1. maxSum=max(-2,1)=1.",
"i=2, num=-3. currentSum=max(-3, 1-3=-2)=-2. maxSum stays 1.",
"i=3, num=4. currentSum=max(4, -2+4=2)=4. maxSum=max(1,4)=4.",
"i=4, num=-1. currentSum=max(-1, 4-1=3)=3. maxSum stays 4.",
"i=5, num=2. currentSum=max(2, 3+2=5)=5. maxSum=max(4,5)=5."
],
"result": "return 5 (best subarray is [4,-1,2])"
},
"pitfalls": [
"Empty array has no valid answer — check the input length first.",
"If every number is negative, the answer is the largest single negative number, not 0.",
"Initialize both currentSum and maxSum to nums[0], not to 0.",
"A one-element array should just return that element."
],
"patternTakeaway": "If you need the best contiguous run and can decide at each step whether to extend or restart, always think: greedy running-sum (Kadane) — carrying a negative sum never helps.",
"pattern": "Intervals & Greedy"
},
{
"id": "algo-cat14-q2",
"guide": "Algorithms Guide",
"topic": "Greedy",
"topicNum": 14,
"level": "Medium",
"badge": "[Medium]  LeetCode #55  Pattern: Greedy | Asked at: Amazon, Meta, Microsoft | Time: O(n)  Space: O(1)",
"question": "Jump Game",
"explanation": "Problem: Each number in the array tells you the farthest you can jump from that spot. Starting at index 0, can you reach the last index? Example: [2,3,1,1,4] gives true, but [3,2,1,0,4] gives false.\n\nHow to solve it: Keep track of the farthest index you could reach so far. Walk through the array from left to right. If your current position is already past the farthest reachable index, you are stuck — return false. Otherwise, update the farthest reachable index using the current position plus its jump value. If you get through the whole array, you can reach the end.",
"code": "function canJump(nums) {\n  let maxReach = 0;\n  \n  for (let i = 0; i < nums.length; i++) {\n    if (i > maxReach) return false;\n    maxReach = Math.max(maxReach, i + nums[i]);\n  }\n  \n  return true;\n}\n \ncanJump([2, 3, 1, 1, 4]); // true\ncanJump([3, 2, 1, 0, 4]); // false\n \n// Variant: Jump Game II - MIN jumps to reach end (LeetCode 45)\nfunction jump(nums) {\n  let jumps = 0;\n  let currentEnd = 0;\n  let farthest = 0;\n  \n  for (let i = 0; i < nums.length - 1; i++) {\n    farthest = Math.max(farthest, i + nums[i]);\n    \n    if (i === currentEnd) {\n      jumps++;\n      currentEnd = farthest;\n    }\n  }\n  \n  return jumps;\n}",
"howTo": "1. The question only asks 'can you reach the end' — plain reachability over a max-jump array signals a greedy furthest-reach tracker, no need for BFS or DP.\n2. Keep track of the farthest index you could reach so far. As long as your current position is within that reach, you're fine.\n3. Start maxReach at 0.\n4. At each index i, first check: if i is already past maxReach, return false — you can't have gotten here.\n5. Otherwise update maxReach to the bigger of itself or (i plus how far this position can jump).\n6. If you finish the array without getting stuck, return true. Common mistake: check reachability BEFORE using nums[i] at that position, not after.",
"dryRun": {
"input": "nums = [2,3,1,1,4]",
"frames": [
"i=0, nums[0]=2. Is 0 > maxReach(0)? No. maxReach=max(0,0+2)=2.",
"i=1, nums[1]=3. Is 1 > maxReach(2)? No. maxReach=max(2,1+3)=4.",
"i=2, nums[2]=1. Is 2 > maxReach(4)? No. maxReach=max(4,2+1)=4.",
"i=3, nums[3]=1. Is 3 > maxReach(4)? No. maxReach=max(4,3+1)=4.",
"i=4, nums[4]=4. Is 4 > maxReach(4)? No. maxReach=max(4,4+4)=8."
],
"result": "loop finishes without getting stuck -> return true"
},
"pitfalls": [
"A single-element array is always true — you're already at the last index.",
"Check i > maxReach BEFORE updating maxReach with nums[i], not after.",
"A 0 in the array can trap you if maxReach hasn't already passed it.",
"Don't confuse this with Jump Game II (minimum number of jumps) — this only needs a yes/no answer."
],
"patternTakeaway": "If you only need to know whether you can reach the end (not how), always think: greedy — track the farthest index reachable so far, no BFS or DP needed.",
"pattern": "Intervals & Greedy"
},
{
"id": "algo-cat14-q3",
"guide": "Algorithms Guide",
"topic": "Greedy",
"topicNum": 14,
"level": "Medium",
"badge": "[Medium]  LeetCode #134  Pattern: Greedy | Asked at: Amazon, Google, Microsoft | Time: O(n)  Space: O(1)",
"question": "Gas Station",
"explanation": "Problem: There are gas stations arranged in a circle. gas[i] is the fuel you get at station i, and cost[i] is the fuel needed to drive from station i to the next one. Find the starting station that lets you complete the full circle, or return -1 if it's impossible. Example: gas=[1,2,3,4,5], cost=[3,4,5,1,2] gives 3.\n\nHow to solve it: Two facts make this easy. First, if the total gas is less than the total cost, it's impossible no matter where you start. Second, if a solution exists, it is unique. So walk through the stations once, keeping a running tank total. Whenever the running tank goes negative, none of the stations you passed since your last starting guess can work — so move your candidate starting point to the very next station and reset the running tank to 0.",
"code": "function canCompleteCircuit(gas, cost) {\n  let totalTank = 0;\n  let currentTank = 0;\n  let start = 0;\n  \n  for (let i = 0; i < gas.length; i++) {\n    const diff = gas[i] - cost[i];\n    totalTank += diff;\n    currentTank += diff;\n    \n    if (currentTank < 0) {\n      // Can't reach i+1 from start - try i+1\n      start = i + 1;\n      currentTank = 0;\n    }\n  }\n  \n  return totalTank >= 0 ? start : -1;\n}\n \ncanCompleteCircuit([1,2,3,4,5], [3,4,5,1,2]); // 3\ncanCompleteCircuit([2,3,4], [3,4,3]);          // -1",
"howTo": "1. It's a circular route with one unique valid start — that combination signals a greedy running-tank approach instead of testing every start, which would be too slow.\n2. If total gas is less than total cost, it's impossible everywhere — no search needed. Otherwise there IS a unique start, found by watching where your tank goes empty.\n3. Track totalTank (whole trip) and currentTank (since your last tried start), plus a candidate start at index 0.\n4. At each station, add (gas[i] - cost[i]) to both totals.\n5. Whenever currentTank drops below zero, none of the stations up to here can work — reset currentTank to 0 and move your candidate start to the next station.\n6. At the end, return the candidate start if totalTank is not negative, else -1. Edge case: check totalTank only at the very end, not along the way.",
"dryRun": {
"input": "gas = [1,2,3,4,5], cost = [3,4,5,1,2]",
"frames": [
"i=0: diff=1-3=-2. totalTank=-2, currentTank=-2. Negative -> reset: start=1, currentTank=0.",
"i=1: diff=2-4=-2. totalTank=-4, currentTank=-2. Negative -> reset: start=2, currentTank=0.",
"i=2: diff=3-5=-2. totalTank=-6, currentTank=-2. Negative -> reset: start=3, currentTank=0.",
"i=3: diff=4-1=3. totalTank=-3, currentTank=3. Still fine, no reset.",
"i=4: diff=5-2=3. totalTank=0, currentTank=6. Still fine, no reset."
],
"result": "totalTank=0 which is >= 0, so return start = 3"
},
"pitfalls": [
"Check totalTank only at the very end, not during the loop — a temporary negative currentTank doesn't mean it's impossible overall.",
"If sum(gas) < sum(cost), return -1 immediately — no valid start exists.",
"Reset currentTank to 0 (not to the diff value) whenever it goes negative.",
"The answer is guaranteed to be unique when a solution exists, so there's no need to check multiple candidates."
],
"patternTakeaway": "If you need one unique starting point in a circular route and totals must stay non-negative, always think: greedy running-tank — move your candidate start forward whenever the running total dips below zero.",
"pattern": "Intervals & Greedy"
},
{
"id": "algo-cat14-q4",
"guide": "Algorithms Guide",
"topic": "Greedy",
"topicNum": 14,
"level": "Medium",
"badge": "[Medium]  LeetCode #846  Pattern: Greedy + Map | Asked at: Google, Yelp | Time: O(n log n)  Space: O(n)",
"question": "Hand of Straights",
"explanation": "Problem: You have a hand of cards with values, and a groupSize. Return true if you can rearrange all the cards into groups, where each group has groupSize consecutive values. Example: hand=[1,2,3,6,2,3,4,7,8], groupSize=3 gives true, because you can make [1,2,3], [2,3,4], [6,7,8].\n\nHow to solve it: Always start a new group with the smallest card you still have. This works because the smallest remaining card can't fit anywhere except the start of a new group — nothing smaller is left to build a group around it. Count how many of each card value you have. Go through the values from smallest to largest. Whenever a value still has cards left, use it to start groupSize new groups, taking one card from each of the next groupSize consecutive values. If any of those values is missing or doesn't have enough cards, it's impossible.",
"code": "function isNStraightHand(hand, groupSize) {\n  if (hand.length % groupSize !== 0) return false;\n  \n  const counts = new Map();\n  for (const card of hand) {\n    counts.set(card, (counts.get(card) || 0) + 1);\n  }\n  \n  const sortedKeys = [...counts.keys()].sort((a, b) => a - b);\n  \n  for (const start of sortedKeys) {\n    if (counts.get(start) === 0) continue;\n    \n    const need = counts.get(start);\n    \n    for (let i = 0; i < groupSize; i++) {\n      const card = start + i;\n      if (!counts.has(card) || counts.get(card) < need) return false;\n      counts.set(card, counts.get(card) - need);\n    }\n  }\n  \n  return true;\n}\n \nisNStraightHand([1,2,3,6,2,3,4,7,8], 3); // true\nisNStraightHand([1,2,3,4,5], 4);          // false",
"howTo": "1. You need to split cards into groups of CONSECUTIVE values — that's a signal for greedy: always try to start a new group with the smallest card left over.\n2. If the smallest remaining card can't start a full run, no other card can either, since everything else is even less flexible. So commit to the smallest card first, every time.\n3. Count how many of each card value you have, and sort the unique values.\n4. Go from smallest to largest, skipping any value whose count is already zero.\n5. For a value with cards left, that count tells you how many groups must start here — try to take that many of each of the next groupSize consecutive values. If any value is missing or short, return false.\n6. Common mistake: forgetting to first check hand.length is divisible by groupSize — if not, it's impossible before you even start.",
"dryRun": {
"input": "hand = [1,2,3,3,4,5], groupSize = 3",
"frames": [
"Count cards: {1:1, 2:1, 3:2, 4:1, 5:1}. Sorted unique values: [1,2,3,4,5].",
"start=1, count=1 (>0). need=1. Take one each of 1,2,3 -> counts become {1:0,2:0,3:1,4:1,5:1}. Group [1,2,3] formed.",
"start=2, count=0 -> skip, nothing to do here.",
"start=3, count=1 (>0). need=1. Take one each of 3,4,5 -> counts become {3:0,4:0,5:0}. Group [3,4,5] formed.",
"start=4 and start=5: both have count 0 -> skip."
],
"result": "return true (groups [1,2,3] and [3,4,5])"
},
"pitfalls": [
"First check hand.length % groupSize !== 0 — if it doesn't divide evenly, it's impossible right away.",
"Always start a new group with the smallest remaining card — never a larger one.",
"If a needed consecutive card is missing or has too few copies, return false immediately.",
"groupSize equal to 1, or equal to hand.length, are worth checking as edge cases."
],
"patternTakeaway": "If you must split items into consecutive-value groups, always think: greedy — always start a new group from the smallest leftover value, since it has no other place to go.",
"pattern": "Intervals & Greedy"
},
{
"id": "algo-cat14-q5",
"guide": "Algorithms Guide",
"topic": "Greedy",
"topicNum": 14,
"level": "Medium",
"badge": "[Medium]  LeetCode #763  Pattern: Greedy + Hash Map | Asked at: Amazon, Google | Time: O(n)  Space: O(1) — limited alphabet",
"question": "Partition Labels",
"explanation": "Problem: Split a string into as many parts as possible so that each letter appears in only one part. Return the length of each part. Example: \"ababcbacadefegdehijhklij\" gives [9,7,8].\n\nHow to solve it: First, find the last index where each letter appears anywhere in the string. Then scan the string left to right with a growing window. As you scan, keep extending the end of the window to the last-seen index of every letter you encounter. Once your current position reaches that end, it means every letter inside the window has had its last occurrence included — so the window is complete. Record its length and start a new window right after it.",
"code": "function partitionLabels(s) {\n  const lastIndex = {};\n  for (let i = 0; i < s.length; i++) {\n    lastIndex[s[i]] = i;\n  }\n  \n  const result = [];\n  let start = 0;\n  let end = 0;\n  \n  for (let i = 0; i < s.length; i++) {\n    end = Math.max(end, lastIndex[s[i]]);\n    \n    if (i === end) {\n      result.push(end - start + 1);\n      start = i + 1;\n    }\n  }\n  \n  return result;\n}\n \npartitionLabels('ababcbacadefegdehijhklij'); // [9, 7, 8]",
"howTo": "1. Each letter must stay inside only ONE part — that's a clue to first record where every character last appears, then greedily grow a window until it's safe to cut.\n2. A partition can only end once every character seen so far has had its LAST occurrence included — so keep expanding the window's end to the furthest last-seen index of any letter inside it.\n3. First pass: map each character to the index of its last appearance.\n4. Second pass: track a start and an end for the current window, both starting at 0.\n5. For each character, update end to the max of itself and that character's last-seen index.\n6. When your position reaches end, the window is done — record its length, then start the next window right after. This works because you're always looking ahead using the last-seen map.",
"dryRun": {
"input": "s = \"abac\"",
"frames": [
"Build last-index map: a->2, b->1, c->3 (last position each letter appears).",
"i=0, char='a'. end=max(0, lastIndex['a']=2)=2. i(0) != end(2), keep scanning.",
"i=1, char='b'. end=max(2, lastIndex['b']=1)=2. i(1) != end(2), keep scanning.",
"i=2, char='a'. end=max(2, lastIndex['a']=2)=2. i(2) == end(2) -> partition closes! length=2-0+1=3. start=3.",
"i=3, char='c'. end=max(2, lastIndex['c']=3)=3. i(3) == end(3) -> partition closes! length=3-3+1=1. start=4."
],
"result": "return [3, 1] (partitions \"aba\" and \"c\")"
},
"pitfalls": [
"An empty string returns an empty array — handle that first.",
"A window can only close when i equals end, meaning every letter inside it has had its last occurrence included.",
"Build the last-index map in a full first pass, before the second window-scanning pass.",
"A string where a character repeats across the whole string can force one big partition covering everything."
],
"patternTakeaway": "If a window can only close once every element inside has shown its last occurrence, always think: greedy expanding window using a last-seen index map.",
"pattern": "Intervals & Greedy"
},
{
"id": "algo-cat15-q1",
"guide": "Algorithms Guide",
"topic": "Math & Matrix",
"topicNum": 15,
"level": "Medium",
"badge": "[Medium]  LeetCode #48  Pattern: Matrix | Asked at: Amazon, Apple, Microsoft | Time: O(n^2)  Space: O(1)",
"question": "Rotate Image",
"explanation": "Problem: Rotate a square (n x n) matrix 90 degrees clockwise, without using another matrix — change it in place. Example: [[1,2,3],[4,5,6],[7,8,9]] becomes [[7,4,1],[8,5,2],[9,6,3]].\n\nHow to solve it: A 90-degree clockwise rotation is the same as two simpler steps combined. Step one: transpose the matrix, meaning flip it along its main diagonal by swapping matrix[i][j] with matrix[j][i] for every i less than j. Step two: reverse every row. Doing transpose then row-reverse gives exactly the rotated result, using no extra matrix.",
"code": "function rotate(matrix) {\n  const n = matrix.length;\n  \n  // 1. Transpose\n  for (let i = 0; i < n; i++) {\n    for (let j = i + 1; j < n; j++) {\n      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];\n    }\n  }\n  \n  // 2. Reverse each row\n  for (let i = 0; i < n; i++) {\n    matrix[i].reverse();\n  }\n}\n \nconst m = [[1,2,3],[4,5,6],[7,8,9]];\nrotate(m);\n// m becomes [[7,4,1],[8,5,2],[9,6,3]]",
"howTo": "1. The problem demands rotating IN-PLACE with no extra matrix — that constraint is a clue to find simple swaps instead of building a new grid.\n2. Rotating 90 degrees clockwise equals flipping the matrix along its diagonal (transpose), then flipping each row left-to-right (reverse).\n3. Transpose first: for every cell where row index is less than column index, swap matrix[i][j] with matrix[j][i].\n4. Then reverse each row of the transposed matrix in place.\n5. That combination gives you the 90-degree clockwise rotation with no extra storage.\n6. Common mistake: swapping for ALL i,j pairs instead of only i < j — that swaps everything twice and undoes your own work.",
"dryRun": {
"input": "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
"frames": [
"Start: [[1,2,3],[4,5,6],[7,8,9]].",
"Transpose swap (0,1): matrix[0][1]=2 and matrix[1][0]=4 swap -> row0=[1,4,3], row1=[2,5,6].",
"Transpose swap (0,2): matrix[0][2]=3 and matrix[2][0]=7 swap -> row0=[1,4,7], row2=[3,8,9].",
"Transpose swap (1,2): matrix[1][2]=6 and matrix[2][1]=8 swap -> row1=[2,5,8], row2=[3,6,9]. Transposed matrix: [[1,4,7],[2,5,8],[3,6,9]].",
"Reverse each row: [1,4,7]->[7,4,1], [2,5,8]->[8,5,2], [3,6,9]->[9,6,3]."
],
"result": "matrix becomes [[7,4,1],[8,5,2],[9,6,3]]"
},
"pitfalls": [
"Only swap for i < j during the transpose step — swapping for all i,j pairs undoes your own work.",
"This trick only works for square (n x n) matrices, not rectangular ones.",
"A 1x1 matrix needs no changes at all.",
"Reverse the rows AFTER transposing, not before — the order matters."
],
"patternTakeaway": "If you need to rotate a square matrix in place, always think: transpose (flip along the diagonal) then reverse each row — no extra matrix needed.",
"pattern": "Math & Matrix"
},
{
"id": "algo-cat15-q2",
"guide": "Algorithms Guide",
"topic": "Math & Matrix",
"topicNum": 15,
"level": "Medium",
"badge": "[Medium]  LeetCode #54  Pattern: Matrix | Asked at: Microsoft, Amazon, Apple, Google | Time: O(m*n)  Space: O(1) — output excluded",
"question": "Spiral Matrix",
"explanation": "Problem: Given a matrix, return all its elements visited in spiral order, going clockwise starting from the top-left. Example: [[1,2,3],[4,5,6],[7,8,9]] gives [1,2,3,6,9,8,7,4,5].\n\nHow to solve it: Track four boundaries — top, bottom, left, right — that shrink as you go. Walk one edge of the current box at a time: right across the top row, down the right column, left across the bottom row, and up the left column. After finishing each edge, move that boundary inward. Before doing the third and fourth edges, double check the boundaries still make sense, since a single row or column can otherwise get visited twice. Stop once top passes bottom or left passes right.",
"code": "function spiralOrder(matrix) {\n  const result = [];\n  if (matrix.length === 0) return result;\n  \n  let top = 0;\n  let bottom = matrix.length - 1;\n  let left = 0;\n  let right = matrix[0].length - 1;\n  \n  while (top <= bottom && left <= right) {\n    // Right along top\n    for (let i = left; i <= right; i++) result.push(matrix[top][i]);\n    top++;\n    \n    // Down along right\n    for (let i = top; i <= bottom; i++) result.push(matrix[i][right]);\n    right--;\n    \n    // Left along bottom (check still valid)\n    if (top <= bottom) {\n      for (let i = right; i >= left; i--) result.push(matrix[bottom][i]);\n      bottom--;\n    }\n    \n    // Up along left (check still valid)\n    if (left <= right) {\n      for (let i = bottom; i >= top; i--) result.push(matrix[i][left]);\n      left++;\n    }\n  }\n  \n  return result;\n}\n \nspiralOrder([[1,2,3],[4,5,6],[7,8,9]]);\n// [1,2,3,6,9,8,7,4,5]",
"howTo": "1. Reading elements in a clockwise spiral, outside in, is a clue to track four shrinking boundaries — top, bottom, left, right — instead of computing a formula per index.\n2. Walk one edge of the current box at a time: right along the top, down the right, left along the bottom, up the left. Then shrink the boundary and repeat.\n3. Set top, bottom, left, right to the matrix's edges.\n4. Loop while top <= bottom and left <= right: go right across the top row and move top down; go down the right column and move right inward.\n5. Check top <= bottom still holds before going left across the bottom row (then move bottom up); check left <= right before going up the left column (then move left inward).\n6. Common mistake: skipping those extra boundary checks before the third and fourth edges — without them you double-count cells on a single row or column matrix.",
"dryRun": {
"input": "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
"frames": [
"Boundaries start: top=0, bottom=2, left=0, right=2.",
"Right along top row: push 1,2,3. top becomes 1.",
"Down along right column: push matrix[1][2]=6, matrix[2][2]=9. right becomes 1.",
"Left along bottom row (top<=bottom still holds): push matrix[2][1]=8, matrix[2][0]=7. bottom becomes 1.",
"Up along left column (left<=right still holds): push matrix[1][0]=4. left becomes 1.",
"New loop: top=1, bottom=1, left=1, right=1. Right along top: push matrix[1][1]=5. top becomes 2, now top>bottom, loop ends."
],
"result": "return [1,2,3,6,9,8,7,4,5]"
},
"pitfalls": [
"An empty matrix (0 rows) must return an empty array immediately.",
"Single-row or single-column matrices need the extra top<=bottom / left<=right checks before the 3rd and 4th edges, or cells get counted twice.",
"Boundaries must shrink after each edge (top++, right--, bottom--, left++), or the loop never ends.",
"Non-square (m x n) matrices work fine too — don't assume rows equal columns."
],
"patternTakeaway": "If you need to visit a matrix's cells outside-in in a spiral, always think: four shrinking boundaries (top, bottom, left, right), walking one edge at a time.",
"pattern": "Math & Matrix"
},
{
"id": "algo-cat15-q3",
"guide": "Algorithms Guide",
"topic": "Math & Matrix",
"topicNum": 15,
"level": "Medium",
"badge": "[Medium]  LeetCode #73  Pattern: Matrix | Asked at: Amazon, Microsoft | Time: O(m*n)  Space: O(1) optimal",
"question": "Set Matrix Zeroes",
"explanation": "Problem: In a matrix, if a cell is 0, set its entire row and its entire column to 0 — and do this in place, without using extra rows/columns of storage. Example: [[1,1,1],[1,0,1],[1,1,1]] becomes [[1,0,1],[0,0,0],[1,0,1]].\n\nHow to solve it: Instead of extra arrays, reuse the matrix's own first row and first column as marker space. First, remember (in two booleans) whether the first row or first column originally contained any zero — you'll need that later. Then scan the rest of the matrix: whenever you find a 0 at (i,j), mark its row by setting matrix[i][0]=0 and mark its column by setting matrix[0][j]=0. Scan again: for every other cell, if its row-marker or column-marker is 0, zero that cell. Finally, zero the first row and/or first column themselves, based on the booleans you saved at the start.",
"code": "function setZeroes(matrix) {\n  const rows = matrix.length;\n  const cols = matrix[0].length;\n  \n  let firstRowZero = false;\n  let firstColZero = false;\n  \n  // Check first row and column\n  for (let j = 0; j < cols; j++) {\n    if (matrix[0][j] === 0) firstRowZero = true;\n  }\n  for (let i = 0; i < rows; i++) {\n    if (matrix[i][0] === 0) firstColZero = true;\n  }\n  \n  // Mark using first row/col\n  for (let i = 1; i < rows; i++) {\n    for (let j = 1; j < cols; j++) {\n      if (matrix[i][j] === 0) {\n        matrix[i][0] = 0;\n        matrix[0][j] = 0;\n      }\n    }\n  }\n  \n  // Zero out cells based on markers\n  for (let i = 1; i < rows; i++) {\n    for (let j = 1; j < cols; j++) {\n      if (matrix[i][0] === 0 || matrix[0][j] === 0) {\n        matrix[i][j] = 0;\n      }\n    }\n  }\n  \n  // Zero first row/col if needed\n  if (firstRowZero) {\n    for (let j = 0; j < cols; j++) matrix[0][j] = 0;\n  }\n  if (firstColZero) {\n    for (let i = 0; i < rows; i++) matrix[i][0] = 0;\n  }\n}",
"howTo": "1. The O(1) extra space requirement is a clue that you need to store your zero-markers inside the matrix itself, not in separate arrays.\n2. Use the matrix's own first row and first column as marker space — if cell (i,j) should become zero, mark its row's first cell and column's first cell as zero.\n3. Before touching anything, save two booleans: did the first row or first column originally have any zero?\n4. Scan the rest of the matrix (skip row 0, col 0); for each zero found at (i,j), set matrix[i][0]=0 and matrix[0][j]=0.\n5. Scan again (still skipping row 0, col 0): if a cell's row-marker or column-marker is zero, zero that cell.\n6. Finally, zero the first row and/or column themselves based on your saved booleans. Edge case: save those booleans BEFORE step 4, or you'll lose track of the original state.",
"dryRun": {
"input": "matrix = [[1,1,1],[1,0,1],[1,1,1]]",
"frames": [
"Check first row/col for zeros: none found, so firstRowZero=false, firstColZero=false.",
"Scan inner cells: (1,1)=0 -> mark matrix[1][0]=0 and matrix[0][1]=0. Matrix now: row0=[1,0,1], row1=[0,0,1], row2=[1,1,1].",
"No other inner cell was zero, so no more marks are made.",
"Second pass, using markers: cell (1,1) has row-marker matrix[1][0]=0 -> zero it (already 0). Cell (1,2) has row-marker matrix[1][0]=0 -> zero it -> matrix[1][2]=0.",
"Cell (2,1) has col-marker matrix[0][1]=0 -> zero it -> matrix[2][1]=0. Cell (2,2): markers matrix[2][0]=1 and matrix[0][2]=1, both nonzero -> stays 1.",
"firstRowZero and firstColZero are both false, so row 0 and column 0 are left as they are."
],
"result": "matrix becomes [[1,0,1],[0,0,0],[1,0,1]]"
},
"pitfalls": [
"Save the firstRowZero / firstColZero flags BEFORE marking anything, or you'll lose the original state.",
"Skip row 0 and column 0 during the marking and zeroing passes — they're being used as marker storage.",
"A matrix with no zeros at all should come out unchanged.",
"1x1 or single-row/column matrices are edge cases — trace them by hand to be sure."
],
"patternTakeaway": "If you must mark cells for later processing but can't use extra space, always think: reuse part of the existing structure (like the matrix's first row/column) as your marker storage.",
"pattern": "Math & Matrix"
},
{
"id": "algo-cat15-q4",
"guide": "Algorithms Guide",
"topic": "Math & Matrix",
"topicNum": 15,
"level": "Medium",
"badge": "[Medium]  LeetCode #50  Pattern: Math / Recursion | Asked at: Meta, LinkedIn, Bloomberg | Time: O(log n)  Space: O(log n)",
"question": "Pow(x, n)",
"explanation": "Problem: Compute x raised to the power n, without using the built-in power function. Example: pow(2, 10) = 1024, pow(2, -2) = 0.25.\n\nHow to solve it: Multiplying x by itself n times is too slow for large n. Instead use fast exponentiation: x^n equals (x^(n/2)) squared, when n is even. So compute the half-power once, store it, and square the stored value — this roughly halves the work at every step, giving about log(n) multiplications instead of n. When n is odd, pull out one extra factor of x and reduce to an even power. When n is negative, compute using the positive power and take 1 divided by the result.",
"code": "function myPow(x, n) {\n  if (n === 0) return 1;\n  if (n < 0) return 1 / myPow(x, -n);\n  \n  if (n % 2 === 0) {\n    const half = myPow(x, n / 2);\n    return half * half;\n  } else {\n    return x * myPow(x, n - 1);\n  }\n}\n \nmyPow(2, 10);   // 1024\nmyPow(2, -2);   // 0.25\nmyPow(2.1, 3);  // 9.261\n \n// Iterative version (avoids stack)\nfunction myPowIter(x, n) {\n  if (n < 0) {\n    x = 1 / x;\n    n = -n;\n  }\n  \n  let result = 1;\n  while (n > 0) {\n    if (n % 2 === 1) result *= x;\n    x *= x;\n    n = Math.floor(n / 2);\n  }\n  \n  return result;\n}",
"howTo": "1. Banning the built-in power function while asking for x to the power n is a clue for fast (binary) exponentiation instead of a plain loop.\n2. Core trick: x^n equals (x^(n/2)) squared when n is even — so you only need about log(n) multiplications instead of n.\n3. Handle the base case: anything to the power 0 is 1.\n4. Handle negative n by converting to 1 divided by x to the power of positive n.\n5. If n is even, compute the half-power once, store it, and square that stored value; if n is odd, multiply x by power(x, n-1) to make it even again.\n6. Common mistake: calling the half-power function twice instead of storing it once and squaring — that quietly turns your fast solution back into a slow one.",
"dryRun": {
"input": "myPow(2, 5)",
"frames": [
"myPow(2,5): n=5 is odd -> return 2 * myPow(2,4).",
"myPow(2,4): n=4 is even -> half = myPow(2,2); will return half*half.",
"myPow(2,2): n=2 is even -> half = myPow(2,1); will return half*half.",
"myPow(2,1): n=1 is odd -> return 2 * myPow(2,0) = 2 * 1 = 2.",
"Unwind: myPow(2,2) = half*half = 2*2 = 4. Then myPow(2,4) = 4*4 = 16.",
"Unwind: myPow(2,5) = 2 * 16 = 32."
],
"result": "return 32"
},
"pitfalls": [
"n = 0 must return 1 immediately, including when x = 0.",
"Negative n means 1 / x^(-n) — remember to flip before recursing.",
"Compute the half-power once and square the stored value — calling myPow twice for the half doubles the work and breaks the O(log n) speed.",
"Very large n can risk deep recursion in the recursive version — the iterative version avoids that."
],
"patternTakeaway": "If you need x to the power n fast and can't use the built-in function, always think: fast exponentiation — halve n each time (square the stored half-result) instead of multiplying n times.",
"pattern": "Math & Matrix"
},
{
"id": "algo-cat15-q5",
"guide": "Algorithms Guide",
"topic": "Math & Matrix",
"topicNum": 15,
"level": "Easy",
"badge": "[Easy]  LeetCode #66  Pattern: Array Math | Asked at: Google, Apple | Time: O(n)  Space: O(1)",
"question": "Plus One",
"explanation": "Problem: A number is given as an array of digits. Add one to the number and return the new array of digits. Example: [1,2,3] becomes [1,2,4]. Example: [9,9,9] becomes [1,0,0,0].\n\nHow to solve it: Adding one only changes digits starting from the rightmost one, and only as far as any carries travel. Walk the array from right to left. If the current digit is less than 9, just add one to it and you're done — return right away. If the digit is 9, it becomes 0 and the carry moves one step further left. If you reach the very start of the array and every digit was 9, the number has grown one digit longer, so add a new 1 at the front.",
"code": "function plusOne(digits) {\n  for (let i = digits.length - 1; i >= 0; i--) {\n    if (digits[i] < 9) {\n      digits[i]++;\n      return digits;\n    }\n    digits[i] = 0;\n  }\n  \n  // All were 9 - prepend 1\n  return [1, ...digits];\n}\n \nplusOne([1, 2, 3]); // [1, 2, 4]\nplusOne([9]);        // [1, 0]\nplusOne([9, 9, 9]); // [1, 0, 0, 0]",
"howTo": "1. The number is stored as an array of digits — that framing is a clue you must simulate manual addition with carries, not convert to a real number, which could overflow.\n2. Adding one only affects digits from the rightmost one leftward, and only as far as the carries travel.\n3. Walk the digits array from right to left.\n4. If the current digit is less than 9, add one to it and return immediately — no carry needed.\n5. If the digit is 9, set it to 0 and let the loop continue left to carry into the next digit.\n6. Edge case: if every digit was 9, like [9,9,9], the loop finishes without returning — you must prepend a new 1, since the number grows one digit longer.",
"dryRun": {
"input": "digits = [9,9,9]",
"frames": [
"i=2, digits[2]=9. Not less than 9, so set to 0 (carry). digits=[9,9,0].",
"i=1, digits[1]=9. Not less than 9, so set to 0 (carry). digits=[9,0,0].",
"i=0, digits[0]=9. Not less than 9, so set to 0 (carry). digits=[0,0,0].",
"Loop finished without returning — every digit was 9, so prepend a new 1 at the front."
],
"result": "return [1,0,0,0]"
},
"pitfalls": [
"If every digit is 9, prepend a new leading 1 — the number becomes one digit longer.",
"Only the digits affected by the carry need to change; stop as soon as a digit is less than 9.",
"Don't convert the whole array to a real number — it can overflow for very long digit arrays.",
"A single-digit input like [9] still needs the prepend case, giving [1,0]."
],
"patternTakeaway": "If a number is stored as an array of digits and you must add one, always think: simulate the carry from the rightmost digit, just like adding by hand on paper.",
"pattern": "Math & Matrix"
},
{
"id": "algo-cat15-q6",
"guide": "Algorithms Guide",
"topic": "Math & Matrix",
"topicNum": 15,
"level": "Easy",
"badge": "[Easy]  LeetCode #202  Pattern: Math / Cycle Detection | Asked at: Google, Amazon | Time: O(log n)  Space: O(log n) or O(1)",
"question": "Happy Number",
"explanation": "Problem: A number is \"happy\" if, when you keep replacing it with the sum of the squares of its digits, you eventually reach 1. If it instead loops forever without hitting 1, it is not happy. Example: 19 is happy (1^2+9^2=82, then 8^2+2^2=68, ..., eventually reaching 1). Example: 2 is not happy, because it loops forever.\n\nHow to solve it: Keep a set of every number you have already produced. Repeatedly replace n with the sum of the squares of its digits. If you ever reach 1, it's happy — return true. If you ever produce a number you've already seen before, you're stuck in a loop that will never reach 1 — return false. A faster version uses two pointers (slow and fast) like cycle detection in a linked list, avoiding the extra set.",
"code": "function isHappy(n) {\n  const seen = new Set();\n  \n  while (n !== 1 && !seen.has(n)) {\n    seen.add(n);\n    n = sumOfSquares(n);\n  }\n  \n  return n === 1;\n}\n \nfunction sumOfSquares(n) {\n  let sum = 0;\n  while (n > 0) {\n    const digit = n % 10;\n    sum += digit * digit;\n    n = Math.floor(n / 10);\n  }\n  return sum;\n}\n \nisHappy(19); // true\nisHappy(2);  // false\n \n// Floyd cycle - O(1) space\nfunction isHappyFloyd(n) {\n  let slow = n;\n  let fast = sumOfSquares(n);\n  \n  while (fast !== 1 && slow !== fast) {\n    slow = sumOfSquares(slow);\n    fast = sumOfSquares(sumOfSquares(fast));\n  }\n  \n  return fast === 1;\n}\n\n\nFinal Interview Tips for Algorithm Rounds\nClarify the problem first: Ask about input size, edge cases, return type. Never start coding immediately.\nWalk through an example: Trace your understanding of the problem with a concrete input. Catches misunderstandings early.\nState approach BEFORE coding: Describe your plan in plain English. Get interviewer buy-in before writing code.\nStart with brute force: It's OK to mention an O(n^2) solution first, then optimize. Shows analytical thinking.\nState complexity explicitly: After solving, say \"this is O(n) time and O(1) space because...\". Interviewers love this.\nTest your code: After writing, walk through the code with the example input. Find bugs before they do.\nEdge cases ALWAYS: Empty input, single element, duplicates, negative numbers, overflow. Mention them.\nThink out loud: Silent thinking is bad. Even partial thoughts help — interviewer can guide you.\nDon't fake confidence: If stuck, say \"I haven't seen this — let me think about similar patterns I know\".\nPractice typing on actual keyboard: Whiteboard interviews are dying. Most are real-coding now. Build typing speed.\nGood luck!\nPattern recognition beats memorization. Practice consistently and trust the process.",
"howTo": "1. Repeatedly applying a rule and checking if you hit 1, where it's possible to loop forever instead of stopping, is the classic clue for cycle detection.\n2. Keep applying the rule (sum of squares of digits). If you land on 1, it's happy. If you're not making progress, you must eventually repeat a number, since only so many sums are possible — a repeat means an infinite loop, not happy.\n3. Simple way: keep a set of every number you've produced so far.\n4. Repeat: replace n with the sum of squares of its digits. If it's 1, return true. If it's already in your set, return false. Otherwise add it and continue.\n5. Space-saving way: use slow and fast pointers like linked-list cycle detection — slow applies the rule once per step, fast applies it twice. If they meet on a value that isn't 1, that's a cycle.\n6. Common mistake: rushing the digit-sum helper — it needs to repeatedly peel digits off with modulo 10 and integer-divide by 10.",
"dryRun": {
"input": "n = 19",
"frames": [
"n=19. Not 1, not seen before. Add 19 to the set. sumOfSquares(19)=1^2+9^2=82. n becomes 82.",
"n=82. Not 1, not seen before. Add 82. sumOfSquares(82)=8^2+2^2=68. n becomes 68.",
"n=68. Not 1, not seen before. Add 68. sumOfSquares(68)=6^2+8^2=100. n becomes 100.",
"n=100. Not 1, not seen before. Add 100. sumOfSquares(100)=1^2+0^2+0^2=1. n becomes 1.",
"n=1 -> the while loop's condition (n !== 1) is now false, so it stops."
],
"result": "return true (19 is happy)"
},
"pitfalls": [
"A cycle that never reaches 1 (like starting from 2) means you must stop using a seen-set or Floyd's cycle detection — don't loop forever.",
"n=1 itself is trivially happy — the while loop won't even run once.",
"The digit-extraction helper must carefully use modulo 10 and integer division by 10 so no digit is skipped or duplicated.",
"The Floyd (slow/fast pointer) version needs the fast pointer to apply the rule TWICE per step, not once."
],
"patternTakeaway": "If repeatedly applying a rule to a number might loop forever instead of terminating, always think: cycle detection — track seen values (or use slow/fast pointers) to know when you're stuck.",
"pattern": "Math & Matrix"
}
];
