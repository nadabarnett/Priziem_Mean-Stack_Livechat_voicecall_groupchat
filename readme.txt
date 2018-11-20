- Install etherpad

git clone https://github.com/ether/etherpad-lite.git
cd etherpad-lite
bin/run.sh

- Setting https
replace files 

cp -Rp /home/pi/Prizem/collab_server/* ./*


- Plugin Headings2

npm install headings2

- run etherpad
node node_modules/ep_etherpad-lite/node/server.js



