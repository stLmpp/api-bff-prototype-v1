import { initApp } from '../index.js';

initApp().then((server) => {
  console.log('Listening on http://localhost:3000');
  const PORT = 3000;
  server.listen(PORT);
});
