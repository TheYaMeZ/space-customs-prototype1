(function bootstrap(namespace) {
  namespace.ui.bindEvents();
  namespace.engine.reset();
  console.info("Prototype generator checks:", namespace.generator.validate());
  window.setInterval(namespace.engine.tick, 1000);
})(window.SpaceCustoms);
