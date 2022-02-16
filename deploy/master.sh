#!/bin/bash
set -ex

cd /home/rnet/
which wget || ( apt-get update -y && apt-get install wget -y )
rm -rf /home/rnet/deploy/production
mkdir -p /home/rnet/deploy/production
git clone -b master -- https://github.com/ReadOnlyNet/RNet-web.git /home/rnet/deploy/production
cd /home/rnet/deploy/production
npm ci
cd react
npm ci
cd ..
cp /home/rnet/rnet.cf/.env ./.env
rm -rf public
wget "$1" -O artifacts.tar.gz
tar xf artifacts.tar.gz
rm artifacts.tar.gz
mkdir -p /home/rnet/rnet.cf-temp/
cp -rf /home/rnet/deploy/production/. /home/rnet/rnet.cf-temp
rm -rf /home/rnet/old.rnet.cf
mv /home/rnet/rnet.cf /home/rnet/old.rnet.cf
mv /home/rnet/rnet.cf-temp /home/rnet/rnet.cf
