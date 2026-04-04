fetch('http://localhost:5050/api/documents/e8d47bfa-c529-45bc-8a71-f9dcf045caaf/logs', {
   headers: { 'Authorization': 'Bearer DUMMY_TOKEN' } // Mock to bypass auth check initially, but `protect` throws 401. 401 means server is UP and routing perfectly. If it throws 500, we have an issue. Wait, if it throws 401 it doesn't execute controller.
})
  .then(res => console.log('Logs endpoint returned:', res.status))
  .catch(err => console.error('Error hitting logs:', err.message));
