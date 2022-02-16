#!/bin/bash
set -ex

cd /home/rnet/
which wget || ( apt-get update -y && apt-get install wget -y )
rm -rf /home/rnet/deploy/alpha
mkdir -p /home/rnet/deploy/alpha
git clone -b develop -- https://github.com/ReadOnlyNet/RNet-web.git /home/rnet/deploy/alpha
cd /home/rnet/deploy/alpha
npm ci
cd react
npm ci
cd ..
cp /home/rnet/RNet-web/.env ./.env
rm -rf public
wget "$1" -O artifacts.tar.gz
tar xf artifacts.tar.gz
rm artifacts.tar.gz
mkdir -p /home/rnet/RNet-web-temp/
cp -rf /home/rnet/deploy/alpha/. /home/rnet/RNet-web-temp
rm -rf /home/rnet/old.RNet-web
mv /home/rnet/RNet-web /home/rnet/old.RNet-web
mv /home/rnet/RNet-web-temp /home/rnet/RNet-web
