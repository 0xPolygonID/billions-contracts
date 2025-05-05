#!/bin/bash

# Download the latest.zip file
curl -LO https://privadoid-passport-circuits.s3.eu-west-1.amazonaws.com/v1.0.1/credential_sha256.zip

# Unzip the file into ./circuits
unzip -d ./circuits credential_sha256.zip

# remove the zip file
rm credential_sha256.zip