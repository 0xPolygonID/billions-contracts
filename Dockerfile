FROM ubuntu:24.04 AS test
ARG GITHUB_TOKEN_ARG

# # Create app directory
# WORKDIR /usr/src/app


RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*


# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN apt-get update && apt-get install -y nodejs npm
RUN git config --global url."https://x-access-token:${GITHUB_TOKEN_ARG}@github.com/".insteadOf "git@github.com:" \
    && git config --global url."https://x-access-token:${GITHUB_TOKEN_ARG}@github.com/".insteadOf "ssh://git@github.com/"

RUN apt-get update && apt-get install -y nodejs npm

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

RUN ./dl_circuits.sh

# Build the application
RUN npm run test
