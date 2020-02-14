#!/bin/bash

#Root check!
if [ "$EUID" -ne 0 ]
then
    echo "You are not root.  Please re-run this script with sudo."
    exit 1
fi

apt remove sleuthkit autopsy libtsk13 -y
apt install testdisk -y
wget -q -O - https://download.bell-sw.com/pki/GPG-KEY-bellsoft | sudo apt-key add -
echo "deb [arch=amd64] https://apt.bell-sw.com/ stable main" | sudo tee /etc/apt/sources.list.d/bellsoft.list
apt update
apt install bellsoft-java8-full -y
export JAVA_HOME=/usr/lib/jvm/bellsoft-java8-full-amd64/
echo "JAVA_HOME=/usr/lib/jvm/bellsoft-java8-full-amd64/" >> /etc/environment
wget https://github.com/sleuthkit/sleuthkit/releases/download/sleuthkit-4.8.0/sleuthkit-java_4.8.0-1_amd64.deb
apt install ./sleuthkit-java_4.8.0-1_amd64.deb -y
rm sleuthkit-java_4.8.0-1_amd64.deb
wget https://github.com/sleuthkit/autopsy/releases/download/autopsy-4.14.0/autopsy-4.14.0.zip
unzip autopsy-4.14.0.zip
rm autopsy-4.14.0.zip
mv autopsy-4.14.0 /opt/autopsy
cd /opt/autopsy
chmod +x unix_setup.sh
./unix_setup.sh
cd /usr/bin
ln -s /opt/autopsy/bin/autopsy autopsy
chmod +x /opt/autopsy/bin/autopsy
chmod +x /usr/bin/autopsy
cp /opt/autopsy/icon.ico /usr/share/pixmaps/autopsy.ico

cat << EOF > /usr/share/applications/autopsy.desktop
[Desktop Entry]
Name=Autopsy
Exec=autopsy
Comment=The Autopsy Forensic Browser is a GUI for The Sleuth Kit.
Terminal=false
Icon=/usr/share/pixmaps/autopsy.ico
Type=Application
Categories=Utility;11-07-forensic-imaging-tools;
EOF


echo "Done!  Autopsy 4 should be installed."
echo "================================="
echo "NOTE: You should log out and back in before"
echo "running Autopsy as a normal user."
echo "================================="

