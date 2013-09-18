#!/bin/bash

BLOG=$(forever list | grep [dir of app run script] | awk '{print $5}')

if [ -z $BLOG ];
then
	echo "blog already stopped"
else
	echo "blog forever stoping ..."
	forever stop [dir of app run script]
	D=$(date "+%Y-%m-%d %H:%M:%S")
	echo "forever stopped blog at "$D
fi
