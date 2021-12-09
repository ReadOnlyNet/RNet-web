#!/bin/bash
set -ex

cd /home/rnet/
which wget || ( apt-get update -y && apt-get install wget -y )
which unzip || ( apt-get update -y && apt-get install unzip -y )
rm -rf /home/rnet/deploy/premium
mkdir -p /home/rnet/deploy/premium
git clone -b premium -- https://github.com/ReadOnlyNet/RNet-web.git /home/rnet/deploy/premium
cd /home/rnet/deploy/premium
npm i
cd react
yarn
cd ..
cp /home/rnet/premium.rnet.cf/.env ./.env
rm -rf public
wget "$1" -O artifacts.zip
unzip artifacts
rm artifacts.zip
mkdir -p /home/rnet/premium.rnet.cf-temp/
cp -rf /home/rnet/deploy/premium/. /home/rnet/premium.rnet.cf-temp
rm -rf /home/rnet/old.premium.rnet.cf
mv /home/rnet/premium.rnet.cf /home/rnet/old.premium.rnet.cf
mv /home/rnet/premium.rnet.cf-temp /home/rnet/premium.rnet.cf
#pm2 reload premium.rnet.cf