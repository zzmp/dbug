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
