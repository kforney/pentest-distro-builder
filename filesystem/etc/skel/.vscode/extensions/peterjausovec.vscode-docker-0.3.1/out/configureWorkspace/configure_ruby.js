"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureRuby = {
    genDockerFile,
    genDockerCompose,
    genDockerComposeDebug
};
function genDockerFile(serviceNameAndRelativePath, platform, os, port, { cmd, author, version, artifactName }) {
    return `FROM ruby:2.5-slim

LABEL Name=${serviceNameAndRelativePath} Version=${version}
EXPOSE ${port}

# throw errors if Gemfile has been modified since Gemfile.lock
RUN bundle config --global frozen 1

WORKDIR /app
COPY . /app

COPY Gemfile Gemfile.lock ./
RUN bundle install

CMD ["ruby", "${serviceNameAndRelativePath}.rb"]
    `;
}
function genDockerCompose(serviceNameAndRelativePath, platform, os, port) {
    return `version: '2.1'

services:
  ${serviceNameAndRelativePath}:
    image: ${serviceNameAndRelativePath}
    build: .
    ports:
      - ${port}:${port}`;
}
function genDockerComposeDebug(serviceNameAndRelativePath, platform, os, port, { fullCommand: cmd }) {
    return `version: '2.1'

services:
  ${serviceNameAndRelativePath}:
    image: ${serviceNameAndRelativePath}
    build:
      context: .
      dockerfile: Dockerfile
    ports:
        - ${port}:${port}
`;
}
//# sourceMappingURL=configure_ruby.js.map