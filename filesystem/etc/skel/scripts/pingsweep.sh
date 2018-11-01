#!/bin/bash
for ip in $(seq 1 254); do
ping -c 1  172.30.0.$ip |grep "bytes from" |cut -d" " -f4|cut -d";" -f1&
done
