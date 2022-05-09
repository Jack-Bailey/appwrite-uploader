# Appwrite ShareX uploader + URL shortener

Built mainly to test out appwrite.

Makes use of appwrite's storage and collections to create a simple to deploy and maintain uploader.

# Installation

Please [install appwrite](https://github.com/appwrite/appwrite#installation) before following these steps.

You also need to have node (I used v16.15.0) with yarn or npm installed.

Please also make sure you have git installed, if you do not - please download this repository as a zip, extract it to a suitable location and enter it. Then skip to [getting started](#getting-started)

`git clone https://github.com/Jack-Bailey/appwrite-uploader`

# Getting started

## Create environment variables

### Unix

`cp example.env .env`

### Windows

`copy example.env .env`

Then set each value in the .env file

APPWRITE_PROJECT,APPWRITE_COLLECTION and APPWRITE_BUCKET are all **IDs, not names**

Make sure your SECRET is set to something _secret_ and hard to guess

## Install packages

### NPM

`npm install`

### YARN

`yarn`

## Running appwrite-uploader

`node index.js`

## Additional notes

Anything in ./public will be served directly, without going through the uploader - I've used this function for my personal shortener site - [jck.cx](https://jck.cx)

If you have any issues with this, please reach out to me on [discord](https://jackbailey.dev/discord)
