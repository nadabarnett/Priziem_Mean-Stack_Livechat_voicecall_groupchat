#!/bin/bash

SERVER=$1

function invoke {
        ssh_command="ssh  -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=50 -l pi $SERVER /bin/bash -c \"$1\" 2>&1"
        echo -e "$ssh_command\n"

        status=$($ssh_command)
        retcode=$?

        if [[ $retcode == 0 ]] ; then
                echo "OK"
        elif [[ $status == "Permission denied"* ]] ; then
                echo -e "Login failed\n"
                exit 1
        else
                echo -e "Connect or cmd failed: $status, retcode $retcode \n"
                exit 1
        fi
}

function upload {
        ssh_command="scp -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=5 $1 pi@$SERVER:$2"
        echo -e "$ssh_command";

        status=$($ssh_command)

        if [[ $status == `` ]] ; then
                echo "OK"
        elif [[ $status == "Permission denied"* ]] ; then
                echo -e "Login failed\n"
                exit 1
        else
                echo -e "Connection failed: $status\n"
                exit 1
        fi
}

# safety - otherwise it would execute locally if no server is provided in args
if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
    exit 1
fi

# now check if server is accessible through ping
RET=1
while [[ $RET != 0 ]]
do
  echo "trying ping..."
  ping -c 1 -i 1 -t 1 $1 &> /dev/null
  RET=$?
  sleep 1 
done

echo "ping available, now try to ssh"

ssh-keygen -R $1 >/dev/null 2>&1

RET=1
while [[ $RET != 0 ]]
do
  echo "trying ssh..."
  # this clears previous signatures of server
  ./checkssh.exp $1 >/dev/null 2>&1
  RET=$?
  sleep 1
done

echo "Installing..."

# which branch to check out
if [ -z "$2" ]
  then
    branch='master'
  else
    branch=$2
fi

# this sets up ssh keys and authorized_keys on server - in a dirty, dirty way!
# no other way as it doesn't have ssh key yet, just password
./password.exp $1

# now we can continue in a more normal way, set up things there

upload ./ssh/id_rsa /home/pi/.ssh
upload ./ssh/id_rsa.pub /home/pi/.ssh
upload ./ssh/authorized_keys /home/pi/.ssh

invoke 'sudo chmod 600 /home/pi/.ssh/id_rsa && sudo chmod 600 /home/pi/.ssh/id_rsa.pub'
invoke 'sudo service ssh restart'
invoke 'sudo apt-get update'
invoke 'sudo apt-get upgrade -y'
invoke 'sudo apt-get install -y wget curl git-core'

# default vim seems to be 1980s version, mouse-=a means 'do not switch
# to visual mode when selecting with a mouse' - oterwise it will be 
# impossible to select text with a mouse
invoke 'sudo apt-get upgrade -y vim'

invoke 'git config --global user.name "Mikhail Novikov"'
invoke 'git config --global user.email "novikovmaa@gmail.com"'

# prevents git from asking 'the host's key is not cached, do you wish to 
# continue?' which breaks execution without terminal, as being unable to
# ask it assumes 'no'
invoke "ssh-keyscan github.com >>/home/pi/.ssh/known_hosts"

invoke "git clone -b $2 --single-branch git@github.com:codeda/RPI3X.git"

invoke "cd ~/RPI3X && sudo ./wifi.sh"

echo "rebooting, after reboot you can use WiFi"

invoke "sudo reboot" >/dev/null 2>&1
