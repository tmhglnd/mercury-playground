'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

async function bootstrap(t) {
  const {default: getPorts, portNumbers} = await import('get-port');
  t.context.port = await getPorts({
    port: portNumbers(3000, 3500)
  });
}

exports.bootstrap = bootstrap;
