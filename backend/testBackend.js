fetch('http://localhost:5050/api/workspaces')
  .then(res => console.log('Backend is up! res:', res.status))
  .catch(err => console.error('Backend is DOWN', err.message));
