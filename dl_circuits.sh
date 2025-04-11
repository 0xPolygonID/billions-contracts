#!/bin/bash

# Download the latest.zip file
curl -LO https://privadoid-passport-circuits.s3.eu-west-1.amazonaws.com/v1.0.0/test_credential_sha256.zip

# Unzip the file into ./circuits
unzip -d ./circuits test_credential_sha256.zip

# remove the zip file
rm test_credential_sha256.zip