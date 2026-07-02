(function bootstrap(namespace) {
  namespace.ui.bindEvents();
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const skipTutorial = params.get("skip-tutorial") === "true";
  if (mode === "random") namespace.engine.initializeRandomShift();
  else namespace.engine.initializeCampaign({ skipTutorial });
  console.info("Prototype generator checks:", namespace.generator.validate());
  window.setInterval(namespace.engine.tick, 1000);
})(window.SpaceCustoms);
