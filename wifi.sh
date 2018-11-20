#!/bin/bash
echo "set mouse-=a" >>/home/pi/.vimrc
chown pi /home/pi/.vimrc

PREFIX="PRIZEM"
SSID=${PREFIX}

getSsid()
{
    read MAC < /sys/class/net/wlan0/address
    MAC=${MAC//':'/''}
    SSID="${PREFIX}-${MAC: -6}"
}

setHostname()
{
    if [ "$SSID" != "$HOSTNAME" ]; then
        echo "Set hostname ..."
        hostnamectl set-hostname $SSID
        #echo $HOSTNAME
    fi
}

replaceSsid()
{
    sed -i -e 's/RPI3X/'"$SSID"'/g' wifi/hostapd.conf
}

configWlan0()
{
    ### Configuration of dhcpcd, wlan0 interface 
    [ -e /etc/dhcpcd.conf ] && rm /etc/dhcpcd.conf
    cp wifi/dhcpcd.conf /etc/
    cp wifi/wlan0 /etc/network/interfaces.d/
    service dhcpcd restart
    ifconfig wlan0 down
    ifconfig wlan0 up

    ### Configuration of hostapd
    mkdir -p /etc/hostapd
    [ -e /etc/hostapd/dhcpcd.conf ] && rm /etc/hostapd/dhcpcd.conf
    cp wifi/hostapd.conf /etc/hostapd/
    mv /etc/default/hostapd /etc/default/hostapd.bak
    cp wifi/hostapd /etc/default/

    ### Configuration of dnsmasq
    mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
    cp wifi/dnsmasq.conf /etc/

    ### Configuration of sysctl
    mv /etc/sysctl.conf /etc/sysctl.conf.bak
    cp wifi/sysctl.conf /etc/
}

configRouting()
{
    sh -c "echo 1 > /proc/sys/net/ipv4/ip_forward"
    sleep 5
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE  
    iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT  
    iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT 
    sleep 5
    sh -c "iptables-save > /etc/iptables.ipv4.nat"
    cp wifi/rc.local /etc/
    chmod +x  /etc/rc.local
}

getSsid
setHostname
replaceSsid
#echo $SSID

apt-get install -y dnsmasq hostapd
echo "Configure wlan0 interface ..."
configWlan0
configRouting

service hostapd start 
service dnsmasq start

