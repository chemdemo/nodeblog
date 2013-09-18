#!/bin/bash

BLOG=$(forever list | grep /data/sites/www.dmfeel.com/app.js | awk '{print $5}')

if [ -z $BLOG ];
then
	echo "blog forever starting ..."
	cd /data/sites/www.dmfeel.com
	# if [ ! -d logs/ ];then mkdir logs
	NODE_ENV=production forever start --spinSleepTime 10000 -o logs/out.log -e logs/err.log -a /data/sites/www.dmfeel.com/app.js
	D=$(date "+%Y-%m-%d %H:%M:%S")
	echo "forever started blog at "$D
else
	echo "blog already started"
fi