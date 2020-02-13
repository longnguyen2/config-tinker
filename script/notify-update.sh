#!/bin/bash

usage() {
    echo "Usage: notifyUpdate <topic>"
    echo "topic: firebase topic"
}

if [[ -z $1 ]]; then
    Require topic argument
    usage
    exit 1
fi
topic=$1

source ssh.cfg
sshpass -p ${pwd} ssh ${usr}@${domain} "node $serverDir/patch_process/update.js $topic" && success=true
echo "done"