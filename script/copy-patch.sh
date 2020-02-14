#!/bin/bash

usage() {
    echo "Usage: copyPatch -v <version> -t <topic>"
    echo "   -v  app original build version"
    echo "   -t  firebase topic"
}

while getopts v:t: option
do
case "${option}"
in
v) version=${OPTARG};;
t) topic=${OPTARG};;
esac
done

if [[ -z "$version" ]]; then
    echo Require version argument
    usage
    exit 1
fi

if [[ -z "$topic" ]]; then
    echo Require topic argument
    usage
    exit 1
fi

source ssh.cfg
echo Test connection
test=$(sshpass -p ${pwd} ssh ${usr}@${domain} "echo connected")
if [[ "$test" != connected ]]; then
    echo Cannot connect to host
    exit 1
fi
echo Connection success
echo Making directories
sshpass -p ${pwd} ssh ${usr}@${domain} "mkdir $serverDir/public; mkdir $serverDir/public/$topic; mkdir $serverDir/public/$topic/$version"
echo Sending file from ../app/build/outputs/apk/tinkerPatch/release/patch_signed_7zip.apk to ${usr}@${domain}:${serverDir}/public/${topic}/${version}
sshpass -p ${pwd} scp ../app/build/outputs/apk/tinkerPatch/release/patch_signed_7zip.apk ${usr}@${domain}:${serverDir}/public/${topic}/${version} && success=true
if [[ "$success" = true ]]; then
    echo Send file success
else
    echo Send file failed
fi