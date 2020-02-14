#!/bin/bash

usage() {
    echo "Usage: copyArchive -v <version> -t <topic>"
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
sshpass -p ${pwd} ssh ${usr}@${domain} "mkdir $serverDir/archive; mkdir $serverDir/archive/$topic; mkdir $serverDir/archive/$topic/$version"
echo Sending file from ../app/build/bakApk/app-${version}.apk to ${usr}@${domain}:${serverDir}/archive/${topic}/${version}/
cp ../app/build/bakApk/app-${version}.apk ../app/build/bakApk/app.apk
sshpass -p ${pwd} scp  ../app/build/bakApk/app.apk ${usr}@${domain}:${serverDir}/archive/${topic}/${version} && success=true
rm ../app/build/bakApk/app.apk
echo Sending file from ../app/build/bakApk/app-${version}-R.txt to ${usr}@${domain}:${serverDir}/archive/${topic}/${version}/
cp ../app/build/bakApk/app-${version}-R.txt ../app/build/bakApk/app-R.txt
sshpass -p ${pwd} scp ../app/build/bakApk/app-R.txt ${usr}@${domain}:${serverDir}/archive/${topic}/${version} && success=true
rm ../app/build/bakApk/app-R.txt
if [[ "$success" = true ]]; then
    echo Send file success
else
    echo Send file failed
fi