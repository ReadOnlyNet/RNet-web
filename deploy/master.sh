#!/bin/bash
set -ex

cd /home/rnet/
which wget || ( apt-get update -y && apt-get install wget -y )
which unzip || ( apt-get update -y && apt-get install unzip -y )
rm -rf /home/rnet/deploy/production
mkdir -p /home/rnet/deploy/production
git clone -b master -- https://github.com/ReadOnlyNet/RNet-web.git /home/rnet/deploy/production
cd /home/rnet/deploy/production
npm i
cd react
yarn
cd ..
cp /home/rnet/rnet.cf/.env ./.env
rm -rf public
wget "$1" -O artifacts.zip
unzip artifacts
rm artifacts.zip
mkdir -p /home/rnet/rnet.cf-temp/
cp -rf /home/rnet/deploy/production/. /home/rnet/rnet.cf-temp
rm -rf /home/rnet/old.rnet.cf
mv /home/rnet/rnet.cf /home/rnet/old.rnet.cf
mv /home/rnet/rnet.cf-temp /home/rnet/rnet.cf
#pm2 reload rnet.cf
