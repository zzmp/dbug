  /* This module is here as a placeholder for future functionality.
   * It is not actually needed (yet).
   */
angular.module('dbug', []); // :)


(function(angular) {

  /* The must be loaded in the reverse of the order listed here (hence, unshifting).
   * This allows `dbugProvider` to act as a storage for and capture all registered services,
   * including internal services (those beginning with `$` or `$$`).
   */
  angular.module('ng').
    _runBlocks.unshift(['$injector', '$log', 'dbug', instantiateAndDecorate]); //  /\
  // Every other configBlock is run here, before the first runBlock (above)    // /||\
  angular.module('ng').                                                        //  ||
    _configBlocks.unshift(['$injector', 'invoke', [populateServiceLists]]);    //  ||
  angular.module('ng').                                                        //  ||
    _configBlocks.unshift(['$injector', 'invoke', [provideDbug]]);             //  ||


  /* Services with closures and added functions outside of their provider
   * (like http.method shortcuts) must preserve those closures and functionality
   * if they are decorated.
   * `$provide.decorator` does not accomodate this, so we must manually _instantiate_
   * and decorate each service.
   */
  function instantiateAndDecorate ($injector, $log, dbug) {
      angular.forEach(dbug, function(name) {
        // Instantiate singleton services with the `$injector` prior to decoration.
        decorator(name, $injector.get(name), $log);
      });
    }

    /* Decorate the service instances to log their methods' invocations.
     * TODO: Add flag to change logging status at runtime.
     * TODO: Replace $log with a custom service to better display logging.
     */
    function decorator(name, $delegate, $log) {
      // Avoid circular dependencies.
      if (name === '$browser' || name === '$document' || name === '$window' || name === '$log')
        return;

      angular.forEach($delegate, function(val, key) {
        // We can only decorate methods.
        if (typeof val === 'function') {
          var originalFn = val;

          var logger = function () {
            $log.log('%c' + name + '%c.%c' + key +
                     '%c invoked with arguments:',
                     // CSS in the console.
                     'color: teal;',    // name in teal
                     'color: black;',
                     'color: blue;',    // method in blue
                     'color: black;');
            $log.log('\t', arguments);
            return val.apply($delegate, arguments);
          };

          $delegate[key] = logger;
        }
      });
      return $delegate;
    }

  // Define the `dbug` provider.
  function provideDbug ($provide) {
    $provide.provider('dbug', dbugProviderFn);
  }
  provideDbug.$inject = ['$provide'];

  /* The `dbug` provider.
   * This provider is used to set debugging levels in a config block,
   * as well as to set or block specific services for debugging.
   */
  function dbugProviderFn () {
    var options = {
      silent: false,
      factory: false,
      internal: false,
      secret: false
    };


    /* Set the debugging level. (This can be explicitly overridden with addService.)
     *   |-optionString-|-default-|-effect---------------------------------------------------|
     *   | 'silent'     | `false` | if `true`, nothing will be logged.                       |
     *   | 'factory'    | `false` | if `true`, factories will be logged.                     |
     *   | 'internal'   | `false` | if `true`, functions beginning with `$` will be logged.  |
     *   |              |         |   These are public functions internal to angular.        |
     *   | 'secret'     | `false` | if `true`, functions beginning with `$$` will be logged. |
     *   |              |         |   These are private functions internal to angular.       |
     */
    this.setOption = function(optionString, value) { 
      if (angular.isDefined(options[optionString])) {
        options[optionString] = value;
      }
    };

    var serviceList = [];
    var factoryList = [];
    var $serviceList = [];
    var $$serviceList = [];
    var addedServices = [];
    var blockedServices = [];

    /* Add service to logging services.
     * Services added will be explicitly logged (this does not override the `silent` option).
     * Setting `remove` to `true` will remove the service from explicit logging. It will still
     * be logged according to appropriate `option`s set.
     */
    this.addService = function(serviceName, remove) {
      var index = addedServices.indexOf(serviceName);
      if ((remove && ~index) || (!remove && !~index))
        return;

      if (remove) addedServices.splice(index, 1);
      else addedServices.push(serviceName);
    };

    /* Block service from logging.
     * Services blocked will be explicitly stopped from logging, regardless of other settings.
     * Setting `remove` to `true` will remove the block from the service.
     */
    this.blockService = function(serviceName, remove) {
      var index = blockedServices.indexOf(serviceName);
      if ((remove && ~index) || (!remove && !~index))
        return;

      if (remove) blockedServices.splice(index, 1);
      else blockedServices.push(serviceName);
    };

    // INTERNAL FUNCTION: Add service to logging services.
    this.addServiceToList = function(serviceName, factory) {
      if (factory) {
        factoryList.push(serviceName);
        return;
      }
      if (serviceName[1] === '$') $$serviceList.push(serviceName);
      else if (serviceName[0] === '$') $serviceList.push(serviceName);
      else if (serviceName !== 'dbug') serviceList.push(serviceName);
    };

    this.$get = function() {
      if (options.silent) return [] ;
      var results = serviceList.slice();
      if (options.factory)  results = results.concat(factoryList);
      if (options.internal) results = results.concat($serviceList);
      if (options.secret)   results = results.concat($$serviceList);

      // Explicitly added services
      angular.forEach(addedServices, function(name) {
        if (!~results.indexOf(name)) results.unshift(name);
      });

      // Explicitly blocked services
      angular.forEach(blockedServices, function(name) {
        var index = results.indexOf(name);
        if (~index) results.splice(index, 1);
      });

      // Return list of logging services
      return results;
    };
  }

  /* Override $provide to cache an additional list of services.
   * This allows for later decoration of these services
   * without explicitly specifying their names.
   */
  function populateServiceLists($provide, dbugProvider) {
    $provider = $provide.provider;
    $service = $provide.service;
    $factory = $provide.factory;

    $provide.provider = supportObject($provider);
    $provide.service = supportObject($service);
    $provide.factory = supportObject($factory, true);
    
    // Imitate angular's internal (private) functionality
    function supportObject($delegate, factory) {
      return function(key, value) {
        delegate = function(serviceName) {
          // Intercept providers' services
          dbugProvider.addServiceToList(serviceName, factory);
          return $delegate.apply($provide, arguments);
        };

        if (angular.isObject(key)) {
          angular.forEach(key, reverseParams(delegate));
        } else {
          return delegate(key, value);
        }
      };
    }
    function reverseParams(iteratorFn) {
      return function(value, key) { iteratorFn(key, value); };
    }
  }
  populateServiceLists.$inject = ['$provide', 'dbugProvider'];

}(angular) );
