const config = {
 server: {
   httpPort: 80,
   httpsPort: 443,
   key: 'apache-selfsigned.key',
   cert: 'apache-selfsigned.crt',
   ca: ''
 }
};

module.exports = config;