angular.module('d', []); // :)


(function(angular) {


  angular.module('ng')._runBlocks.unshift(['$injector', '$log', 'd', instantiateAndDecorate]);
  angular.module('ng')._configBlocks.unshift(['$injector', 'invoke', [populateServiceLists]]);
  angular.module('ng')._configBlocks.unshift(['$injector', 'invoke', [provideD]]);


  function instantiateAndDecorate ($injector, $log, d) {
      angular.forEach(d, function(name) {
        decorator(name, $injector.get(name), $log);
      });
    }

    function decorator(name, $delegate, $log) {
      // Avoid circular dependencies
      if (name === '$browser' || name === '$document' || name === '$window' || name === '$log')
        return;
      angular.forEach($delegate, function(val, key) {
        if (typeof val === 'function') {
          var originalFn = val;

          var logger = function () {
            $log.log('%c' + name + '%c.%c' + key +
                     '%c invoked with arguments:',
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


  function provideD ($provide) {
    $provide.provider('d', dProviderFn);
  }

  provideD.$inject = ['$provide'];

  function dProviderFn () {
    var options = {
      silent: false,
      factory: false,
      internal: false,
      secret: false
    };

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

    this.addService = function(serviceName, block) {
      if (block) blockedServices.push(serviceName);
      else addedServices.push(serviceName);
    };

    this.addServiceToList = function(serviceName, factory) {
      if (factory) {
        factoryList.push(serviceName);
        return;
      }
      if (serviceName[1] === '$') $$serviceList.push(serviceName);
      else if (serviceName[0] === '$') $serviceList.push(serviceName);
      else if (serviceName !== 'd') serviceList.push(serviceName);
    };

    this.$get = function() {
      if (options.silent) return [];
      var results = serviceList.slice();
      if (options.factory) results = results.concat(factoryList);
      if (options.internal) results = results.concat($serviceList);
      if (options.secret) results = results.concat($$serviceList);

      angular.forEach(addedServices, function(name) {
        if (results.indexOf(name) === -1) results.unshift(name);
      });

      angular.forEach(blockedServices, function(name) {
        var index = results.indexOf(name);
        if (index !== -1) results.splice(index, 1);
      });

      return results;
    };
  }


  function populateServiceLists($provide, dProvider) {
    $provider = $provide.provider;
    $service = $provide.service;
    $factory = $provide.factory;

    $provide.provider = supportObject($provider);
    $provide.service = supportObject($service);
    $provide.factory = supportObject($factory, true);
    
    function supportObject($delegate, factory) {
      return function(key, value) {
        delegate = function(serviceName) {
          dProvider.addServiceToList(serviceName, factory);
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

  populateServiceLists.$inject = ['$provide', 'dProvider'];

}(angular) );
