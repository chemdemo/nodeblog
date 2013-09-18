#!/bin/bash

BLOG=$(forever list | grep [dir of app run script] | awk '{print $5}')

if [ -z $BLOG ];
then
	echo "blog forever starting ..."
	cd [dir of app]
	# if [ ! -d logs/ ];then mkdir logs
	NODE_ENV=production forever start --spinSleepTime 10000 -o logs/out.log -e logs/err.log -a [dir of app run script]
	D=$(date "+%Y-%m-%d %H:%M:%S")
	echo "forever started blog at "$D
else
	echo "blog already started"
fi
