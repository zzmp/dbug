/* This module is here as a placeholder for possible future functionality.
 * It is not actually needed (yet).
 */
angular.module('dbug', []) // :)

!function(angular) {
  /* Set the debugging level. (This can be explicitly overridden with addService.)
   *   |-optionString-|-default-|-effect---------------------------------------------------|
   *   | 'silent'     | `false` | if `true`, nothing will be logged.                       |
   *   | 'factory'    | `false` | if `true`, factories will be logged.                     |
   *   | 'internal'   | `false` | if `true`, functions beginning with `$` will be logged.  |
   *   |              |         |   These are public functions internal to angular.        |
   *   | 'secret'     | `false` | if `true`, functions beginning with `$$` will be logged. |
   *   |              |         |   These are private functions internal to angular.       |
   */
  var options = {
    silent: false,
    factory: false,
    internal: false,
    secret: false
  };

  // The lists of all services, protected through closure
  var serviceList = {}

  /* These blocks must be loaded before any other config/run block (hence, unshifting).
   * This allows dbug to intercept and decorate all registered services,
   * including internal services (those beginning with `$` or `$$`).
   */
  angular.module('ng')
    ._configBlocks.unshift(['$injector', 'invoke', [populateServiceLists]])
  // Every other configBlock is run here, before the first runBlock (above)
  angular.module('ng')
    ._runBlocks.unshift(['$injector', '$log', 'dbug', instantiateAndDecorate
  angular.module('ng').provider('dbug', dbugProvider)

  /* Services with closures and added functions outside of their provider
   * (like http.method shortcuts) must preserve those closures and functionality
   * if they are decorated.
   * `$provide.decorator` does not accomodate this, so we must manually _instantiate_
   * and decorate each service.
   */
  function instantiateAndDecorate ($injector, $log, dbug) {
    angular.forEach(serviceList, function(service) {
      // Instantiate singleton services with the `$injector` prior to decoration.
      decorator(service, $injector.get(service))
    })

    /* Decorate the service instances to log their methods' invocations.
     * TODO: Replace $log with a custom service to better display logging (à lá https://github.com/cameron/periscope).
     */
    function decorator(service, $delegate) {
      // Avoid circular dependencies (these will not be logged).
      if (service === '$browser' || service === '$document' || service === '$window' || service === '$log')
        return

      angular.forEach($delegate, function(method, methodName) {
        // We can only decorate methods.
        if (typeof method === 'function') {
          var originalFn = method
          /* IE will log the first two arguments, so it should be formatted compatibly;
           * see https://github.com/angular/angular.js/blob/master/src/ng/log.js#L158
           */
          var log = $log.log.length ? logIE : logStyled

          var decoratedMethod = function() {
            if (dbug.log(service))
              log(arguments)
            return method.apply($delegate, arguments)
          }

          $delegate[methodName] = decoratedMethod
        }

        function logIE(arguments) {
          $log.log([service + '.' + methodName,
            'invoked with arguments:',
            [].prototype.join.apply(arguments, ',')
          ].join(' '))
        }

        function logStyled(arguments) {
          $log.log('%c%s%c.%c%s%c invoked with arguments:\n\t%O',
            // CSS in the console.
            'color: teal;', service,
            'color: black;',
            'color: blue;', methodName,
            'color: black;',
            arguments)
        }
      })
      return $delegate
    }
  }

  /* Override $provide to cache an additional list of services.
   * This allows for later decoration of these services
   * without explicitly specifying their names.
   */
  function populateServiceLists($provide) {
    $provider = $provide.provider;
    $service = $provide.service;
    $factory = $provide.factory;

    $provide.provider = supportObject($provider);
    $provide.service = supportObject($service);
    $provide.factory = supportObject($factory, true);
    
    // Imitate angular's internal (private) functionality
    function supportObject($delegate, isFactory) {
      return function(key, value) {
        delegate = function(serviceName) {
          // Intercept providers' services
          addServiceToList(serviceName, isFactory)
          // Return normally
          return $delegate.apply($provide, arguments)
        };

        if (angular.isObject(key)) {
          angular.forEach(key, reverseParams(delegate))
        } else {
          return delegate(key, value)
        }
      }
    }
    function reverseParams(iteratorFn) {
      return function(value, key) { iteratorFn(key, value) }
    }

    function addServiceToList(serviceName, isFactory) {
      // Don't self-log
      if (serviceName === 'dbug')
        return

      var service = {}

      if (isFactory) service.factory = true
      if (serviceName[1] === '$') service.secret = true
      else if (serviceName[0] === '$') service.internal = true

      serviceList[serviceName] = service
    }
  }
  populateServiceLists.$inject = ['$provide']

  function dbugProvider() {
    var explicitServices = {}

    this.$get = dbugService
    this.set = set
    this.log = log

    function dbugService() {}

    dbugService.prototype.set = set
    dbugService.prototype.log = log
    
    function set(optionString, value) { 
      if (angular.isDefined(options[optionString]))
        options[optionString] = !!value
    }

    function log(serviceName, toLog) {
      if (arguments.length === 2) {
        if (angular.isDefined(toLog)) {
          explicitServices[serviceName] = !!toLog
        } else {
          delete explicitServices[serviceName]
        }
      } else {
        if (options.silent) {
          return false
        } else if (angular.isDefined(explicitServices[serviceName])) {
          return explicitServices[serviceName]
        } else {
          return checkService(serviceName)
        }
      }
    }

    function checkService(serviceName) {
      if (!angular.isDefined(serviceList[serviceName]))
        return false

      var service = serviceList[serviceName]

      return (!(service.factory || service.internal || service.secret) ||
        (service.factory && options.factory) ||
        (service.internal && options.internal) ||
        (service.secret && options.secret))
    }
  })
}(angular);
angular.module('ng')
  .provider('dbug:click', function dbugClickProvider() {
    this.$get = dbugService

    function clickService($document) {
      // Initialize all available settings to sane defaults
      this.settings = {
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
    }

    clickService.prototype.set = set
    clickService.prototype.setScope = function(scope) { this.set({ scope: scope }) }
    clickService.prototype.setController = function(ctrl) { this.set({ controller: ctrl }) }
    clickService.prototype.setInjector = function(inj) { this.set({ injector: inj }) }
    clickService.prototype.setData = function(data) { this.set({ data: data }) }

    function set(options) {
      angular.forEach(this.settings, function(_, type) {
        angular.forEach(type, function(value, setting) {
          if (angular.isDefined(options[type]) && angular.isDefined(options[type][setting]))
            options[type][setting] = !!value
        })
      })
    }
  })
  .run(function($window, $document, $log, dbug) {
    /* IE will log the first two arguments, so it should be formatted compatibly;
     * see https://github.com/angular/angular.js/blob/master/src/ng/log.js#L158
     */
    var log = $log.log.length ? logIE : logStyled

    $document.on('click', function(e) {
      $el = angular.element(e.target)
      var props = { 
        isolate:    $el.isolateScope(),
        scope:      $el.scope(),
        controller: $el.controller(),
        injector:   $el.injector(),
        data:       $el.inheritedData()
      }

      if (dbug.scope.isolate && isolate)
        scope = isolate

      if (dbug.scope.log || dbug.controller.log || injector.log || dbug.data.log)
        console.info('%cdbug: %o', 'font-weight: bold; font-color: purple;', e.target)

      angular.forEach(['scope', 'controller', 'injector', 'data'], function(type) {
        if (dbug[type].log) {
          log(type, props[type])
        }
        if (dbug[type].assign)
          $window[type] = props[type]
      })
    })

    function logIE(type, prop) {
      $log.log(type + ':')
      $log.log(prop)
    }

    function logStyled() {
      $log.log('%c%s:\n%O', 'color: blue;', p, props[p])
    }
  })
