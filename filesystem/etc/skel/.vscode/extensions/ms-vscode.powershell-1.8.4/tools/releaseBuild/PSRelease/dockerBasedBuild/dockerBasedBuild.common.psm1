# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

$psreleaseStrings = Import-PowerShellDataFile -path "$PSScriptRoot\dockerBasedBuild.strings.psd1"

# on pre-6.0 PowerShell $IsWindows doesn't exist, but those are always windows
if($IsWindows -eq $null)
{
    $IsWindows = $true
}


# Get the full images name based on the parameter
function Get-BuildImageName
{
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $image
    )

    return "microsoft/powershell:psrelease-$image"
}

# Get the destination for the build
$script:destinationPath = $null

function Get-Destination
{
    if(!$script:destinationPath)
    {
        $script:destinationPath = Get-TempFolder
    }

    return $script:destinationPath
}

function Get-TempFolder
{
    $tempPath = [System.IO.Path]::GetTempPath()
    # Use the agent temp on VSTS which is cleanup between builds (the user temp is not)
    if($env:AGENT_TEMPDIRECTORY)
    {
        $tempPath = $env:AGENT_TEMPDIRECTORY
    }

    $tempFolder = Join-Path -Path $tempPath -ChildPath ([System.IO.Path]::GetRandomFileName())
    if(!(test-path $tempFolder))
    {
        $null = New-Item -Path $tempFolder -ItemType Directory
    }

    return $tempFolder
}

function Invoke-BuildInDocker
{
    param(
        [Parameter(Mandatory)]
        [BuildData]$BuildData,

        [Parameter(Mandatory)]
        [string]$RepoLocation,

        [hashtable]$Parameters,

        [string[]]$AdditionalFiles
    )

    log "Running Build $($BuildData.Name)"

    $dockerFilePath = Join-Path -Path $RepoLocation $BuildData.DockerFile
    $additionalContextFiles = @()
    foreach($additionalContextFile in $BuildData.AdditionalContextFiles)
    {
        $additionalContextFiles += Join-Path -Path $RepoLocation -ChildPath $additionalContextFile
    }
    $imageName = $BuildData.DockerImageName

    $contextPath = Get-TempFolder
    New-DockerImage `
        -DockerFilePath $dockerFilePath `
        -ContextPath $contextPath `
        -AdditionalContextFiles $additionalContextFiles `
        -ImageName $imageName `
        -AddRepo `
        -RepoLocation $RepoLocation `
        -ContainerRepoLocation $BuildData.RepoDestinationPath `
        -AdditionalFiles $AdditionalFiles

    $extraBuildParams = @{}
    if ($BuildData.BuildDockerOptions)
    {
        $extraBuildParams['DockerOptions'] = $BuildData.BuildDockerOptions
    }

    Invoke-DockerBuild -ImageName $imageName -RepoLocation $RepoLocation -ContainerRepoLocation $BuildData.RepoDestinationPath -BuildCommand $BuildData.BuildCommand -Parameters $Parameters @extraBuildParams

    $publishParams = @{}
    if ($BuildData.VariableForExtractedBinariesPath)
    {
        if($BuildData.ArtifactsExpected -ne 1)
        {
            Write-Warning 'To use VariableForExtractedBinariesPath set ArtifactsExpected to 1'
        }

        $publishParams['Variable'] = $BuildData.VariableForExtractedBinariesPath
    }

    if ($BuildData.ArtifactsExpected -gt 0)
    {
        $publishParams['ExpectedCount'] = $BuildData.ArtifactsExpected
    }

    if ($BuildData.PublishAsFolder)
    {
        $publishParams['PublishAsFolder'] = $true
    }

    if ($BuildData.EnableFeature -and $BuildData.EnableFeature.Contains('ArtifactAsFolder'))
    {
        $publishParams['ArtifactAsFolder'] = $true
    }

    Publish-VstsBuildArtifact -ArtifactPath (Get-Destination) -Bucket $BuildData.BinaryBucket @publishParams
}

# Clone a github repo and recursively init submodules
# Optionally, clean clone location if already exists
function Invoke-CloneGitHubRepo
{
    param(
        [string]$Fork,
        [string]$Repo,
        [string]$Branch,
        [string]$Location,
        [switch]$CleanLocation
    )
    $gitBinFullPath = Get-GitPath

    if((Test-Path $Location) -and $CleanLocation.IsPresent)
    {
        Remove-Item -Path $Location -Recurse -Force
    }

    Start-NativeExecution -sb {& $gitBinFullPath clone -b $branch --quiet https://github.com/$fork/$Repo.git $location}

    Push-Location
    try{
        Set-Location $location
        Start-NativeExecution -sb {& $gitBinFullPath  submodule update --init --recursive --quiet}
    }
    finally
    {
        Pop-Location
    }

}

# Use git to clean an existing repo
function Invoke-CleanRepo
{
    param(
        [string] $RepoLocation
    )

    $gitBinFullPath = Get-GitPath
    Push-Location
    Set-Location $RepoLocation
    try
    {
        Start-NativeExecution -sb {& $gitBinFullPath clean -fdX $RepoLocation}
    }
    finally
    {
        Pop-Location
    }
}

$script:gitPath=$null
function Get-GitPath
{
    if($script:gitPath)
    {
        return $script:gitPath
    }

    $git = Get-Command -Name git -CommandType Application | Select-Object -First 1

    if($git)
    {
        $script:gitPath = $git.Source
        return $script:gitPath
    }

    $gitBinFullPath = (Join-Path "$env:ProgramFiles" 'git\bin\git.exe')
    log "Ensure Git for Windows is available @ $gitBinFullPath"

    if (-not (Test-Path $gitBinFullPath))
    {
        throw "Git for Windows is required to proceed. Install from 'https://git-scm.com/download/win'"
    }
    else
    {
        $script:gitPath = $gitBinFullPath
        return $script:gitPath
    }
}

# Builds a Docker image for the build
function New-DockerImage
{
    [cmdletbinding(DefaultParameterSetName='default')]
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $DockerFilePath,

        [Parameter(Mandatory=$true)]
        [string]
        $ImageName,

        [string[]]
        $AdditionalContextFiles,

        [string]
        $ContextPath,

        [Parameter(ParameterSetName='addrepo',Mandatory)]
        [switch]
        $AddRepo,

        [Parameter(ParameterSetName='addrepo',Mandatory)]
        [string]
        $RepoLocation,

        [Parameter(ParameterSetName='addrepo',Mandatory)]
        [string]
        $ContainerRepoLocation,

        [Parameter(ParameterSetName='addrepo')]
        [string[]]
        $AdditionalFiles
    )

    $ErrorActionPreference = 'Stop'

    try {
        $runtimeContextPath = $null
        if($ContextPath)
        {
            $runtimeContextPath = $ContextPath
            Copy-Item -Path $dockerFilePath -Destination $contextPath
            foreach($additionalContextFile in $AdditionalContextFiles)
            {
                Copy-Item -Path $additionalContextFile -Destination $contextPath
            }
        }
        else
        {
            $runtimeContextPath = Split-Path -Path $DockerFilePath
        }

        $dockerBuildImageName = $ImageName
        if($AddRepo)
        {
            $dockerBuildImageName = $ImageName+'-without-repo'
        }

        # always log docker host information to allow troubleshooting issues with docker
        log "Docker_host: $env:DOCKER_HOST"
        # Build the container, pulling to ensure we have the newest base image
        $null = Invoke-Docker -command build -params '--pull', '--tag', $dockerBuildImageName, $runtimeContextPath

        if($contextPath)
        {
            remove-item $contextPath -Recurse -Force -ErrorAction SilentlyContinue
        }

        if($AddRepo.IsPresent)
        {
            $repoFolderName = 'repolink'

            $dockerBuildFolder = Get-TempFolder

            $repoPath = Join-Path -Path $dockerBuildFolder -ChildPath $repoFolderName

            try
            {
                $addRepoDockerFilePath = Join-Path -Path $dockerBuildFolder -ChildPath 'Dockerfile'

                # TODO: redo using symbolic links, but hit many isssue using them.
                log "Copying repo from: $RepoLocation to: $RepoPath"
                Copy-item -path $RepoLocation -Destination $RepoPath -Recurse

                Invoke-CleanRepo -RepoLocation $repoPath
                
                # Add additional files to the repo after we have cleaned it
                foreach($file in $AdditionalFiles)
                {
                    log "coping $file to $repoPath"
                    Copy-Item -Path $file -Destination $repoPath -Recurse
                }

                $psreleaseStrings.dockerfile -f $dockerBuildImageName, $repoFolderName, $ContainerRepoLocation | Out-File -FilePath $addRepoDockerFilePath -Encoding ascii -Force

                $null = Invoke-Docker -command build -params '--tag', $ImageName, $dockerBuildFolder
            }
            finally
            {
                if(Test-Path $dockerBuildFolder)
                {
                    Remove-Item -Path $dockerBuildFolder -Recurse -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
    catch
    {
        Write-VstsError $_
    }
}

# Run the build in a Docker container.
# When the build finishes, copy artifacts from the container to the destination.
function Invoke-DockerBuild
{
    param(
        [Parameter(Mandatory=$true)]
        [string]
        $ImageName,

        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string] $RepoLocation,

        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string] $ContainerRepoLocation,

        [ValidateNotNullOrEmpty()]
        [string] $Destination = (Get-Destination),

        [string[]] $DockerOptions,

        [string] $BuildCommand,

        [hashtable] $Parameters
    )

    if($Parameters)
    {
        $runtimeParameters = $Parameters.Clone()
    }
    else {
        $runtimeParameters = @{}
    }

    $runtimeParameters['RepoDestinationPath']=$BuildData.RepoDestinationPath

    $ErrorActionPreference = 'Stop'

    try {

        if($IsWindows)
        {
            $outputFolder = 'C:\out'
        }
        else
        {
            $outputFolder = '/mnt'
        }
        $runtimeParameters['DockerVolume']=$outputFolder

        if(!(Test-Path $destination))
        {
            $null = New-Item -Path $destination -ItemType Directory -Force
        }

        $dockerContainerName = 'pswscbuild'

        $params = @('-i', '--name', $dockerContainerName)

        if($DockerOptions)
        {
            $params += $DockerOptions
        }

        $params += $imageName
        $runtimeBuildCommand = [System.Text.StringBuilder]::new($BuildCommand)
        foreach($key in $runtimeParameters.Keys)
        {
            $token = "_${key}_"
            $value = $runtimeParameters.$key
            $null = $runtimeBuildCommand.Replace($token,$value)
        }

        $runtimeBuildCommandString = $runtimeBuildCommand.ToString()
        foreach($param in $runtimeBuildCommandString -split ' ')
        {
            $params += $param
        }

        # Cleanup any existing container from previous runs before starting
        # Ignore failure, because it will fail if they do not exist
        Remove-Container -FailureAction ignore

        $null = Invoke-Docker -command run -params $params

        log "coping artifacts from container" -verbose
        $null = Invoke-Docker -command 'container', 'cp' -params "${dockerContainerName}:$outputFolder", $Destination

        # We are done with the containers, remove them
        Remove-Container
    }
    catch
    {
        Write-VstsError $_
    }
}

$script:dockerVersion
function Get-DockerVersion
{
    if(!$script:dockerVersion)
    {
        $versionString = Invoke-Docker -Command 'version' -Params '--format', '{{.Server.Version}}' -SupressHostOutput -PassThru
        $versionParts = $versionString.Split('-')
        $script:dockerVersion = [Version] $versionParts[0]
    }

    return $script:dockerVersion
}

# Call Docker with appropriate result checks
function Invoke-Docker
{
    param(
        [Parameter(Mandatory=$true)]
        [string[]]
        $Command,
        [ValidateSet("error","warning",'ignore')]
        $FailureAction = 'error',
        [Parameter(Mandatory=$true)]
        [string[]]
        $Params,
        [switch]
        $PassThru,
        [switch]
        $SupressHostOutput
    )

    $ErrorActionPreference = 'Continue'

    # Log how we are running docker for troubleshooting issues
    log "Running docker $command $params"
    $dockerErrors = $null
    if($SupressHostOutput.IsPresent)
    {
        $result = &'docker' $command $params 2>&1
    }
    else
    {
        &'docker' $command $params 2>&1 | Tee-Object -Variable result -ErrorAction SilentlyContinue -ErrorVariable dockerErrors | Out-String -Stream -ErrorAction SilentlyContinue | Write-Host -ErrorAction SilentlyContinue
    }

    if($dockerErrors -and $FailureAction -ne 'ignore')
    {
        foreach($error in $dockerErrors)
        {
            Write-VstsError -Error $error -Type $FailureAction
        }
    }

    $dockerExitCode = $LASTEXITCODE
    if($PassThru.IsPresent)
    {
        return $result
    }
    elseif($dockerExitCode -ne 0 -and $FailureAction -eq 'error')
    {
        Write-VstsMessage -type error -message "docker $command failed with: $result"
        return $false
    }
    elseif($dockerExitCode -ne 0 -and $FailureAction -eq 'warning')
    {
        Write-VstsMessage -type warning -message "docker $command failed with: $result"
        return $false
    }
    elseif($dockerExitCode -ne 0)
    {
        return $false
    }

    return $true
}

function Remove-Container
{
    param(
        [ValidateSet('warning','ignore')]
        $FailureAction = 'warning'
    )

    $commonDockerParams = @{
        FailureAction = $FailureAction
        SupressHostOutput = $true
    }

    if(Get-DockerVersion -ge [Version]'17.06')
    {
        Invoke-Docker -Command 'container', 'prune' -Params '--force' -SupressHostOutput
    }
    else
    {
        # stop all running containers
        Invoke-Docker -Command 'ps' -Params '--format', '{{ json .}}' @commonDockerParams -PassThru |
            Where-Object {$_ -ne $null} |
            ConvertFrom-Json |
            ForEach-Object { $null = Invoke-Docker -Command stop -Params $_.Names  @commonDockerParams}

        # remove all containers
        Invoke-Docker -Command 'ps' -Params '--format', '{{ json .}}', '--all' @commonDockerParams -PassThru |
            Where-Object {$_ -ne $null} |
            ConvertFrom-Json |
            ForEach-Object { $null = Invoke-Docker -Command rm -Params $_.Names  @commonDockerParams}
    }
}


# this function wraps native command Execution
# for more information, read https://mnaoumov.wordpress.com/2015/01/11/execution-of-external-commands-in-powershell-done-right/
function script:Start-NativeExecution([scriptblock]$sb, [switch]$IgnoreExitcode)
{
    log "Running $($sb.ToString())"
    $backupEAP = $script:ErrorActionPreference
    $script:ErrorActionPreference = "Continue"
    try {
        & $sb
        # note, if $sb doesn't have a native invocation, $LASTEXITCODE will
        # point to the obsolete value
        if ($LASTEXITCODE -ne 0 -and -not $IgnoreExitcode) {
            throw "Execution of {$sb} failed with exit code $LASTEXITCODE"
        }
    } finally {
        $script:ErrorActionPreference = $backupEAP
    }
}

function script:log([string]$message) {
    Write-Host -Foreground Green $message
    # Reset colors to default
    [console]::ResetColor()
}

function script:logerror([string]$message) {
    Write-Host -Foreground Red $message
    # Reset colors to default
    [console]::ResetColor()
}

# Class which describes the build data.
class BuildData
{
    # Required: The name of the Build
    [String]$Name

    # Required: The location in the docker container to put the repo
    [String]$RepoDestinationPath

    # Required: The command in the container to run the build
    # Token replacements is allowed for anything you passed in the parameters hash table  _<name>_ will be repalced with the actual value.
    # Built-in tokens include:
    #   _RepoDestinationPath_ - the path in the containter where the repo was placed
    #   _DockerVolume_ - the path to where you should put any output
    [String]$BuildCommand

    # Optional:  Any custom docker options needed when running the build
    [String[]]$BuildDockerOptions

    # Required: The docker file used to build the image used for building
    [String]$DockerFile

    # Required: Any files that should be placed in the docker context (other than the docker file)
    [String[]]$AdditionalContextFiles

    # Required: The name that we will call the image
    [String]$DockerImageName

    # Optional: folder to put binaries from this build in.
    [String]$BinaryBucket = 'release'

    # Optional: Publish Artifacts as a folder (works more reliably)
    [Bool]$PublishAsFolder = $false

    # Optional: the number of expected binaries from the build.
    [Int]$ArtifactsExpected = -1

    # Optional: The name of a variable to set for the path to any extracted binaries.
    [String]$VariableForExtractedBinariesPath

    # Optional: A list of features to enable.
    [ValidateSet("ArtifactAsFolder")]
    [String[]]$EnableFeature
}

function New-BuildData
{
    [BuildData]::new()
}
