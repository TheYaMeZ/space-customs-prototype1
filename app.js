(function bootstrap(namespace) {
  namespace.ui.bindEvents();
  const mode = new URLSearchParams(window.location.search).get("mode");
  if (mode === "random") namespace.engine.initializeRandomShift();
  else namespace.engine.initializeCampaign();
  console.info("Prototype generator checks:", namespace.generator.validate());
  window.setInterval(namespace.engine.tick, 1000);
})(window.SpaceCustoms);
