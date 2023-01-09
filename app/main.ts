import { initApp } from '../src/index.js';

initApp().then((server) => {
  console.log('Listening on http://localhost:3000');
  server.listen(3000);
});
