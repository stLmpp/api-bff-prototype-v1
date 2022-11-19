import { initApp } from '../src/index.js';

initApp().then((server) => {
  server.listen(3000);
});
