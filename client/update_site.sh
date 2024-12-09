#!/bin/bash

source .env
npm run build
sudo cp -r build/* /var/www/html/