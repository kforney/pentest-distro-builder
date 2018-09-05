#!/bin/bash
#----Zero the counter
counter=0
#----Start the loop for the 4th octect.  Must start at 1 since 0 would be broadcast
for ip4 in $(seq 1 254); do
#----Start the loop for the 3rd octect.  This sould start form 0
     for ip3 in $(seq 0 254); do
#----Ping 1 time, look for bytes from to indicate sucessful ping
#----Echo the 4th field form the response which is the ip address
ping -c 1  10.1.$ip3.$ip4 |grep "bytes from" |cut -d" " -f4|cut -d";" -f1&
#echo 10.1.$ip3.$ip4
counter=$((counter+1))
   done
done
echo $counter
