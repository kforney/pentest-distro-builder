#!/bin/bash
for ip in $(seq 1 254); do
ping -c 1  172.100.100.$ip |grep "bytes from" |cut -d" " -f4|cut -d";" -f1&
done
