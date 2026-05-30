const app = require('./src/app');
const { port } = require('./src/config/env');

app.listen(port, () => {
  console.log(` RepoSage server running on http://localhost:${port}`);
  console.log(` Health check: http://localhost:${port}/health`);
});