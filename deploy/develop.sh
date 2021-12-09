#!/bin/bash
set -ex

cd /home/rnet/
which wget || ( apt-get update -y && apt-get install wget -y )
which unzip || ( apt-get update -y && apt-get install unzip -y )
rm -rf /home/rnet/deploy/alpha
mkdir -p /home/rnet/deploy/alpha
git clone -b develop -- https://github.com/ReadOnlyNet/RNet-web.git /home/rnet/deploy/alpha
cd /home/rnet/deploy/alpha
npm i
cd react
yarn
cd ..
cp /home/rnet/RNet-web/.env ./.env
rm -rf public
wget "$1" -O artifacts.zip
unzip artifacts
rm artifacts.zip
mkdir -p /home/rnet/RNet-web-temp/
cp -rf /home/rnet/deploy/alpha/. /home/rnet/RNet-web-temp
rm -rf /home/rnet/old.RNet-web
mv /home/rnet/RNet-web /home/rnet/old.RNet-web
mv /home/rnet/RNet-web-temp /home/rnet/RNet-web
#pm2 reload staff.rnet.cf