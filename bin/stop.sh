#!/bin/bash

BLOG=$(forever list | grep /data/sites/www.dmfeel.com/app.js | awk '{print $5}')

if [ -z $BLOG ];
then
	echo "blog already stopped"
else
	echo "blog forever stoping ..."
	forever stop /data/sites/www.dmfeel.com/app.js
	D=$(date "+%Y-%m-%d %H:%M:%S")
	echo "forever stopped blog at "$D
fi
