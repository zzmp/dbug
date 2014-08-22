angular.module('ng')
  .run(function($window, $document) {
    $window.dbug = { 
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
    };  
    $document.on('click', function(e) {
      $el = angular.element(e.target);
      var props = { 
        isolate:    $el.isolateScope(),
        scope:      $el.scope(),
        controller: $el.controller(),
        injector:   $el.injector(),
        data:       $el.inheritedData()
      };  

      if ($window.dbug.scope.isolate && isolate)
        scope = isolate;

      if ($window.dbug.scope.log || $window.dbug.controller.log ||
          $window.dbug.injector.log || $window.dbug.data.log)
        console.info('%cdbug: %o', 'font-weight: bold; font-color: purple;', e.target);

      ['scope', 'controller', 'injector', 'data'].forEach(function(p) {
        if ($window.dbug[p].log)
          console.log('%c' + p + ':\n', 'color: blue;', props[p]);
        if ($window.dbug[p].assign)
          $window[p] = props[p];
      }); 
    }); 
  })  
;