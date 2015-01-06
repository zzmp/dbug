dbug
====

> Angular debugging for the confused developer.

---

## Installation

```sh
bower install ng-dbug --save-dev

# or

npm i ng-dbug --save-dev
```

**This package contains two debugging tools bundled together - `dbug` and `dbug:click`:**

## dbug

> Log invocations to service methods _as they happen_.

### Installation

Add `dbug.js` or `index.js` with a script tag before your last angular module:

```html
<!-- Other angular scripts go here -->
<script src="bower_components/dbug/dbug.js"></script>
<!-- No more angular scripts after dbug -->
```

### Use

Sane defaults are already configured. To change them, see [configuration](#configuration).

Once the module is installed, it will log service invocations and their arguments to the console as they occur.

### Configuration

`dbug` may be configured from its service (`dbug`) or provider (`dbugProvider`). Both have the same methods:

##### `set(optionString, value)`

Set an option to a new value. Values will be cast to booleans.

There are four available options to control logging levels - all default to `false`:

- `silent` - when `true`, nothing will be logged.
- `factory` - when `false`, factory methods will not be logged.
- `internal` - when `false`, functions beginning with `$` will not be logged.
  - These are public functions internal to angular.
- `secret` - when `false`, functions beginning with `$$` will not be logged.
  - These are private functions internal to angular.

##### `log(serviceName)`

Returns whether the service will be logged under the current settings.

##### `log(serviceName, toLog)`

If `toLog` is `true`, sets a service to be logged regardless of other settings (it will still respect `silent`).

If `toLog` is `false`, sets a service to not be logged regardless of other settings.

If `toLog` is explicitly set to `undefined`, resets a service to respect other settings again.

## dbug:click

> Find an elements angular attributes by simply clicking it.

### Installation

Add `index.js` with a script tag before your last angular module (as with [dbug](#dbug)),
or just add `click.js` to use this tool without `dbug`:

```html
<!-- Other angular scripts go here -->
<script src="bower_components/dbug/click.js"></script>
<!-- No more angular scripts after dbug -->
```

### Use

Sane defaults are already configured. To change them, see [configuration](#configuration).

Once the module is installed, any mouseclick on an element will trigger a log to the console of that elements angular attributes, using methods of `angular.element`. These include the elements scope, controller, injector, and data.
In addition, it may set a global object (`window.scope`, `window.controller`, `window.injector`, and `window.data`) with these attributes for later debugging.

### Configuration

All configuration is done from the `dbug:click` service with the `set` method:

##### `set(optionsObject)`

Set all options at once. The `optionsObject` must look like this (these are the default settings):

```js
{
  scope: {
    isolate: false,
    log: true,
    assign: true
  },
  controller: {
    log: true,
    assign: false
  },
  injector: {
    log: false,
    assign: true
  },
  data: {
    log: true,
    assign: false
  }
}
```

- If `scope.isolate` is `true`, the `isolate` scope will be used (if available).
- An attribute will only be logged if its `log` property is `true`.
- An attribute will only be assigned to the global object if its `assign` property is `true`.

---

In addition, pieces of configuration can be accessed individually with these helper methods:

##### `setScope(scopeObject)`
##### `setController(scopeObject)`
##### `setInjector(scopeObject)`
##### `setData(scopeObject)`

## Contributing

If you contribute, please run `npm run concat` before making a pull request to update `index.js`.
Any changes should be made to `click.js` and `dbug.js` - `npm run concat` will refresh `index.js` from these files.