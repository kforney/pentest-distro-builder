## 0.3.1 - 25 September 2018

### Fixed

* Error while generating Dockerfile for 'other' [#504](https://github.com/Microsoft/vscode-docker/issues/504)

## 0.3.0 - 21 September 2018

### Added

* Add Docker Files to Workspace
  - Support multiple versions of .NET Core (ASP .NET and Console apps)

### Fixed
* Some private registries returning 404 error [#471](https://github.com/Microsoft/vscode-docker/issues/471)
* You shouldn't have to reload vscode in order for changes to docker.attachShellCommand.{linux,windows}Container to take effect [#463](https://github.com/microsoft/vscode-docker/issues/463)
* Engineering improvements (lint, tests, work toward strict null checking, etc.)

## 0.2.0 - 5 September 2018

### Added
* Add preview support for connecting to private registries
* Improved workflow for Tag Image:
  - User will be asked on the first usage of Tag Image with a registry to save it to the `docker.defaultRegistryPath` setting
  - User will be prompted to tag an image if attempting to push an image with no registry or username
  - New `Set as Default Registry Path` menu on registries
  - When default registry path is prefixed to the image name, it is selected for easy removal or editing
* Improved workflow for Build Image:
  - Previous image name will be remembered
* Azure container registries can now be browsed without having "Admin user" turned on. However, deploying to Azure app service currently still requires it, and you still need to log in to Azure in docker [#359](https://github.com/Microsoft/vscode-docker/issues/359)
* A new [API](https://github.com/microsoft/vscode-docker/blob/master/docs\api.md) has been added for other extensions to be able to control the "Add Docker Files to Workspace" functionality.
* You can now create and delete Azure (ACR) registries and delete Azure repositories and images directly from the extension.

### Fixed
* Images list does not refresh after tagging an image [#371](https://github.com/Microsoft/vscode-docker/issues/371)
* Don't prompt for Dockerfile if only one in project (command palette->Build Image) [#377](https://github.com/Microsoft/vscode-docker/issues/377)
* Docker Hub repos are not alphabetized consistently [#410](https://github.com/Microsoft/vscode-docker/issues/410)
* Obsolete usage of `go-wrapper` removed from Go Dockerfile (thanks @korservick)
* Error when listing Azure Registries when some of the accounts do not have appropriate permissions (thanks @estebanreyl) [#336](https://github.com/Microsoft/vscode-docker/issues/336)
* UDP exposed ports not launching correctly [#284](https://github.com/Microsoft/vscode-docker/issues/284)
* Adopt version 0.0.19 of the language server (thanks @rcjsuen) [#392](https://github.com/Microsoft/vscode-docker/pull/392). This fix includes:
  - Folding support for comments
  - Fix for [#338 Multi-line LABEL directives highlight as errors](https://github.com/Microsoft/vscode-docker/issues/338)
  - Support for handling SCTP ports in EXPOSE instructions per Docker CE 18.03
  - Optional warning/error for WORKDIR instructions that are not absolute paths (to try to enforce good practices per the official guidelines and recommendations document for Dockerfiles
  - New `docker.languageserver.diagnostics.instructionWorkdirRelative` configuration setting
* Output title corrected [#428](https://github.com/Microsoft/vscode-docker/pull/428)

### Changed
* The `docker.defaultRegistry` setting is now obsolete. Instead of using a combination of `docker.defaultRegistry` and `docker.defaultRegistryPath`, now simply use `docker.defaultRegistryPath`. This will be suggested automatically the first time the extension is run.

## 0.1.0 - 26 July 2018
* Update .NET Core Dockerfile generation [#264](https://github.com/Microsoft/vscode-docker/issues/264). Per the .NET team, don't generate `docker-compose` files for .NET Core
* Update to version 0.0.18 of the language server (thanks @rcjsuen) [#291](https://github.com/Microsoft/vscode-docker/pull/291).  This includes fixes for:
  * Auto-complete/intellisense types too much - it repeats what's already written [#277](https://github.com/Microsoft/vscode-docker/issues/277)
  * Dockerfile linting error in FROM [#269](https://github.com/Microsoft/vscode-docker/issues/269), [#280](https://github.com/Microsoft/vscode-docker/issues/280), [#288](https://github.com/Microsoft/vscode-docker/issues/288), and others
  * Other linting fixes
* Update Linux post-install link in README.md (thanks @gregvanl) [#275](https://github.com/Microsoft/vscode-docker/pull/275)
* Add docker.host setting as alternative for setting DOCKER_HOST environment variable (thanks @tfenster) [#304](https://github.com/Microsoft/vscode-docker/pull/304)
* Basic Dockerfile for Ruby (thanks @MiguelSavignano) [#276](https://github.com/Microsoft/vscode-docker/pull/276)
* Azure container registries bugfixes and enhancements (thanks @estebanreyl, @julialieberman) [#299](https://github.com/Microsoft/vscode-docker/pull/299)
  * Fixes [#266](https://github.com/Microsoft/vscode-docker/issues/266) to fix error when expanding empty container registry
  * Improves Azure explorer expansion speed by parallelizing network calls
  * Alphabetically organized registries listed from azure and organized tags by date of creation
* Add "Docker: Compose Restart" command [#316](https://github.com/Microsoft/vscode-docker/pull/316)
* Add link to extension docs and Azure publish tutorial to readme
* Fix [#295](https://github.com/Microsoft/vscode-docker/issues/295) to provide proper error handling if project file can't be found adding Dockerfile to project
* Fix [#302](https://github.com/Microsoft/vscode-docker/issues/302) so that Compose Up/Down work correctly from the text editor context menu
* Clarify README documentation on DOCKER_HOST to note that DOCKER_CER_PATH may be required for TLS (thanks @mikepatrick) [#324](https://github.com/Microsoft/vscode-docker/pull/324)
* Engineering improvements (tests and lint fixes)

## 0.0.27 - 19 May 2018

* Fixes indentation problem with Python docker-compose.yml files (thanks @brettcannon) [#242](https://github.com/Microsoft/vscode-docker/pull/242)
* Adds support for showing the Docker explorer in a new Activity Bar view
* Adopt v0.0.17 of the language server (thanks @rcjsuen!) [#249](https://github.com/Microsoft/vscode-docker/pull/249)

## 0.0.26 - 30 Mar 2018

* Support generating Java Dockerfiles (thanks @testforstephen) [#235](https://github.com/Microsoft/vscode-docker/pull/235)
* Support generating Python Dockerfiles (thanks @brettcannon) [#219](https://github.com/Microsoft/vscode-docker/pull/219)

## 0.0.25 - 27 Feb 2018

* Fixes [#217](https://github.com/Microsoft/vscode-docker/issues/217) to adopt the usage of ASAR in VS Code
* Support for multi-select of `docker-compose` files and then issuing the `compose up` or `compose down` commands.
* Changed the default of `promptOnSystemPrune` setting to `true`, meaning you will get a confirmation when running the `System Prune` prune command by default. You can change this by setting `docker.promptOnSystemPrune: false` in your `settings.json`. Thanks to [@driskell](https://github.com/driskell) for [PR #213](https://github.com/Microsoft/vscode-docker/pull/213).
* Right click commands on `dockerfile` and `docker-compose.yml` files are now enabled based on a regular expression over the file name rather than being hard coded.

## 0.0.24 - 02 Feb 2018

* Fixes [#189](https://github.com/Microsoft/vscode-docker/issues/189) to provide friendly errors when Docker is not running
* Fixes [#200](https://github.com/Microsoft/vscode-docker/issues/200) to provide two new options `dockerComposeBuild` and `dockerComposeDetached` control how `docker-compose` is launched
* Fixes [#208](https://github.com/Microsoft/vscode-docker/issues/208) where an incorrect repository name was being passed to Azure App Services
* Update to `v0.0.13` of the Docker Language Server (thanks @rcjsuen) [#198](https://github.com/Microsoft/vscode-docker/pull/198)
* Activate on `onDebugInitialConfigurations` instead of `onDebug` to delay loading (thanks @gregvanl)
* Thank you to @DovydasNavickas for [PR #202](https://github.com/Microsoft/vscode-docker/pull/202) to fix grammatical errors

## 0.0.23 - 05 Jan 2018

* Do not show dangling images in explorer (thanks @johnpapa) [#175](https://github.com/Microsoft/vscode-docker/pull/175)
* Add configuration to prompt on System Prune, fixes [#183](https://github.com/Microsoft/vscode-docker/issues/183)
* Upgrade to new language server (thanks @rcjsuen) [#173](https://github.com/Microsoft/vscode-docker/pull/173)
* Adding show logs command to dead containers (thanks @FredrikFolkesson) [#178](https://github.com/Microsoft/vscode-docker/pull/178)
* Default to Node 8.9 when generating Dockerfile (thanks @johnpapa) [#174](https://github.com/Microsoft/vscode-docker/pull/174)
* Add `compose up` and `compose down` context menus for files explicitly named `docker-compose.yml` or `docker-compose.debug.yml`
* Browse to the Azure portal context menu, fixes [#151](https://github.com/Microsoft/vscode-docker/issues/151)
* Add `docker.truncateLongRegistryPaths` and `docker.truncateMaxLength` configuration options enable truncation of long image and container names in the Explorer, fixes [#180](https://github.com/Microsoft/vscode-docker/issues/180)
* Images in the Explorer now show age (e.g. '22 days ago')
* Update `Dockerfile` for `go` workspaces (thanks @vladbarosan) [#194](https://github.com/Microsoft/vscode-docker/pull/194)

## 0.0.22 - 13 Nov 2017

* Make shell commands configurable (thanks @FredrikFolkesson) [#160](https://github.com/Microsoft/vscode-docker/pull/160)
* Update usage of Azure Account API to speed up deployment to Azure App Services
* Set CD App Setting when deploying image from Azure Container Registry

## 0.0.21 - 08 Nov 2017

* Update `docker-compose.debug.yml` command to include full the URI to the debug port (fix for [vscode: 36192](https://github.com/Microsoft/vscode/issues/36192))
* Filter the subscriptions presented when deploying to Azure based on the Azure Account subscription filter
* Mark as multi-root ready
* Fix debug configuration generation [VSCode #37648](https://github.com/Microsoft/vscode/issues/37648)
* Add `restart` command for containers (thanks @orfevr) [#152](https://github.com/Microsoft/vscode-docker/pull/152)
* Less aggressive matching for `dockerfile` (thanks @dlech) [#155](https://github.com/Microsoft/vscode-docker/pull/155)
* Support workspace folders for language server settings (thanks @rcjsuen) [#156](https://github.com/Microsoft/vscode-docker/pull/156)
* Add config option for docker build path (thanks @nyamakawa) [#158](https://github.com/Microsoft/vscode-docker/pull/158)

## 0.0.20 - 18 Oct 2017

* No longer take a hard dependency on the [Azure Account](https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account) extension.

## 0.0.19 - 14 Oct 2017

* Add an automatic refresh option for the explorer (`"docker.explorerRefreshInterval": 1000`)
* Add support for Multi-Root Workspaces
* Add support for browsing Docker Hub and Azure Container Registries
* Add support for deploying images from Docker Hub and Azure Container Registries to Azure App Service
* `docker-compose` now runs detached and always invokes a build (e.g. `docker-compose -f docker-compose.yml -d --build`)
* `docker system prune` command no longer prompts for confirmation
* `docker-compose.debuy.yml` no longer contains a volume mapping
* Adopt 0.0.9 release of the [Docker Language Server](https://github.com/rcjsuen/dockerfile-language-server-nodejs)

## 0.0.18 - 18 Sept 2017

* Add configuration option (`"docker.showExplorer": false`) to globally turn off or on the Explorer contribution
* Prompt for confirmation when running `docker system prune` command, improve icon

## 0.0.17 - 16 Sept 2017

* Add `docker inspect` command
* Gracefully handle when Docker is not running
* Add Explorer contribution, letting you view Images and Containers in the Explorer viewlet.
* Add `--rm` to `docker build` to remove intermediate images
* Thanks to @rcjsuen, moved to the [Dockerfile Language Server](https://github.com/rcjsuen/dockerfile-language-server-nodejs)
* Update thirdpartynotices.txt, README.md to reflect changes

## 0.0.16 - 09 June 2017

* Update snippet syntax to be in accordance with the [stricter snippet syntax](https://code.visualstudio.com/updates/v1_13#_strict-snippets)
* Moved source code to support async/await (important if you want to make PRs!)

## 0.0.15 - 25 May 2017

* Updated both the `Docker: Run` and `Docker: Run Interactive` commands to automatically publish the ports that the specified image exposes
* Updated the `Docker: Run` command to run the specified container in the background
* Updated the `Docker: Add docker files to workspace` command to generate a `.dockerignore` file
* Updated the `Docker: Azure CLI` command to fully support running `az acs` commands

## 0.0.14 - 08 May 2017

* Support for Docker multi stage build Dockerfiles (syntax, linting)
* Support different variations on naming of `dockerfile` such as `dockerfile-development`
* Bug fixing

## 0.0.13 - 14 March 2017

* Support for `.yaml` file extension on `docker-compose` files.
* Updated Azure CLI image name, map .azure folder from host file system, fix block running on Windows containers, fix Windows path issues (this didn't make it into `0.0.12`)
* Added telemetry to understand which commands developers find useful. This will help us refine which commands we add in the future. We track whether the following commands are executed:
  * `build image`
  * `compose up`, `compose down`
  * `open shell` on running container and whether or not it is a Windows or Linux based container
  * `push image` (we don't track the image name or the location)
  * `remove image`
  * `show logs`
  * `start container`, `start container interactive`
  * `start Azure CLI` container
  * `stop container`
  * `system prune`
  * `tag` (we don't track tag name)
  * Configure workspace along with the type (e.g. Node or Other)

> Please note, you can turn off telemetry reporting for VS Code and all extensions through the ["telemetry.enableTelemetry": false setting](https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting).

## 0.0.12 - 11 February 2017

* Removed `MAINTAINER` from templates and linting warnings by upgrading the `dockerfile_lint` module (Docker has deprecated `MAINTAINER` in favor of `LABEL`).
* Added command to run `docker system prune`, note we use the `-f` (force) flag to ignore the confirmation prompt.
* `Docker: Attach Shell` command now supports Windows containers [#58](https://github.com/microsoft/vscode-docker/pull/58).

## 0.0.10 - 12 December 2016

* Added context menu support to run the Docker Build command on Dockerfile files from the editor or from the explorer.
* Docker logs now uses the -f flag ([follow](https://docs.docker.com/engine/reference/commandline/logs/)) to continue streaming the logs to terminal.

## 0.0.11 - 4 January 2017

* Fixed [Issue 51](https://github.com/microsoft/vscode-docker/issues/51), a path problem on Windows.
