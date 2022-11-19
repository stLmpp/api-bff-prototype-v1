import { initApp } from '../src/index';

initApp().then((server) => {
  server.listen(3000);
});
