#!/bin/bash

#Written by Terminal Prophet
#Not for enterprise use

#CHANGELOG
#2/8/18: Tested sleep .1, worked but took ~2h. Taking it down to .025, should take > 30m
#2/8/18: Added start/end timestamps for testing/debugging
#2/8/18: Changed file creation to a variable, for easier nbtscan integration
#2/8/18: NBTScan integration, using variables in functions
#2/9/18: Sleep .025 works
#2/9/18: Added ASCII art logo and branding


#user=$(whoami)
#echo "$user"
mkdir /root/Documents/cartographer_results
function pause(){
	read -p "$*"
}

function psweep3(){
#echo "Enter 1st, 2nd, 3rd octets seperated by a space (ex: 192 168 1)"
read oct1 oct2 oct3
printf 'Start = %(%H:%M:%S)T'
echo
echo
for ip in $(seq 1 254); do
ping -c 1  $oct1.$oct2.$oct3.$ip |grep "bytes from" |cut -d" " -f4|cut -d";" -f1&
sleep .025
done
echo
printf 'End = %(%H:%M:%S)T'
echo
echo
}

function psweep2(){
#echo "Enter 1st, 2nd octets seperated by a space (ex: 192 168)"
read oct1 oct2
printf 'Start = %(%H:%M:%S)T'
echo
echo
for ip3 in $(seq 0 255); do
	for ip4 in $(seq 1 254); do
		ping -c 1  $oct1.$oct2.$ip3.$ip4 |grep "bytes from" |cut -d" " -f4|cut -d";" -f1&
	sleep .025
	done
done
echo
printf 'End = %(%H:%M:%S)T'
echo
echo
}


function psweep1(){
#echo "Enter 1st octet"
read oct1
printf 'Start = %(%H:%M:%S)T'
echo
echo
for ip2 in $(seq 0 255); do
	for ip3 in $(seq 0 255); do
		for ip4 in $(seq 1 254); do
			ping -c 1  $oct1.$ip2.$ip3.$ip4 |grep "bytes from" |cut -d" " -f4|cut -d";" -f1&
		sleep .025
		done
	done
done
echo
printf 'End = %(%H:%M:%S)T'
echo
echo
}

clear
echo "   ______           __                               __               "
echo "  / ____/___ ______/ /_____   ____ __________ ____  / /_  ___  _____  "
echo " / /   / __ / ___/  __/ __  \/ _  / ___/ __  / __ \/ __ \/ _ \/ ___/  "
echo "/ /___/ /_/ / /  / /_/ /_/ / /_/ / /  / /_/ / /_/ / / / /  __/ /      "
echo "\____/\__,_/_/   \__/\____/\__, /_/   \__,_/ .___/_/ /_/\___/_/       "
echo "                          /____/          /_/                         "
echo "						By: TerminalProphet								"
echo " 	Kali Edition "
echo " "
echo "		Active host discovery made easy						"
echo " "
echo " "
echo " "
echo "Please select number of octets to set:"
PS3='>>>'
options=("1 octet (not recommended)" "2 octets (about 30min)" "3 octets (about 30sec)" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        
        "1 octet (not recommended)")
    #oneoct
	echo "Enter 1st octet"
text1="/root/Documents/cartographer_results/ClassA_$(date +%Y%m%d_%H-%M-%S)"
	psweep1 > $text1.txt
	/usr/bin/nbtscan $oct1.0.0.0/8 >> $text1.txt
	echo "Results have been stored at $text1"
	pause 'Press any key to continue...'
	clear
        ;;

        
        "2 octets (about 30min)")
	#twooct
	echo "Enter 1st and 2nd octets seperated by a space (ex: 192 168)"
text2="/root/Documents/cartographer_results/ClassB_$(date +%Y%m%d_%H-%M-%S)"
	psweep2 > $text2.txt
	/usr/bin/nbtscan $oct1.$oct2.0.0/16 >> $text2.txt
	echo "Results have been stored at $text2"
	pause 'Press any key to continue...'
	clear
        ;;

        
        "3 octets (about 30sec)")
	#threeoct
	echo "Enter 1st, 2nd, 3rd octets seperated by a space (ex: 192 168 1)"
text3="/root/Documents/cartographer_results/ClassC_$(date +%Y%m%d_%H-%M)"
	psweep3 > $text3.txt
	/usr/bin/nbtscan $oct1.$oct2.$oct3.0/24 >> $text3.txt
	echo "Results have been stored at $text3"
	pause 'Press any key to continue...'
	clear
	;;
        "Quit")
			clear
            break
            ;;
        *) echo invalid option;;
    esac
done
