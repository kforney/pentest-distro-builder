# Docker Based Build

The repo contains the infrastructure to bulid PowerShell Core in Docker.

The module dockerBasedBuild is the main infrastructure.  The rest of the files are legacy.

Note:  This is currently highly geared toward VSTS, but we are open to contribution which make it more pluggable.  The majority of the VSTS specific operations have already been seperated into a separate module.

## To use this module

1. Create a wrapper script in your repo.  See [PowerShell vstsBuild.ps1](https://github.com/PowerShell/powershell/blob/master/tools/releaseBuild/vstsbuild.ps1)
1. Create Docker file(s) to build your product.  See [PowerShell Images](https://github.com/PowerShell/powershell/blob/master/tools/releaseBuild/Images)
1. Create a build JSON file which describe your docker file and how to build your product.  See [PowerShell build.json](https://github.com/PowerShell/powershell/blob/master/tools/releaseBuild/build.json)

## Other Examples

- [VSCode-Powershell](https://github.com/PowerShell/vscode-powershell/blob/master/tools/releaseBuild)

## Self-Paced Docker Training

- [Self-Packed Docker Training](http://training.play-with-docker.com/)
  - I recommend the IT Pro Training.  The developer training is focused on running web sites in Docker.
