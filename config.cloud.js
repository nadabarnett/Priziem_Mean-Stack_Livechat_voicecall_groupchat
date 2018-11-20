const config = {
 server: {
   httpPort: 80,
   httpsPort: 443,
   key  : '/etc/letsencrypt/live/theprizem.com/privkey.pem',
   cert : '/etc/letsencrypt/live/theprizem.com/fullchain.pem',
   ca   : '/etc/letsencrypt/live/theprizem.com/chain.pem'
 }
};


module.exports = config;

