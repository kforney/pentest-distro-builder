Import-Module "$PSScriptRoot\dockerBasedBuild.common.psm1"

# VSTS task states: Succeeded|SucceededWithIssues|Failed|Cancelled|Skipped
$succeededStateName = 'Succeeded'
$warningStateName = 'SucceededWithIssues'
$errorStateName = 'Failed'

# store the current state used by *-VstsTaskState and Write-VstsMessage
$script:taskstate = $succeededStateName

# on pre-6.0 PowerShell $IsWindows doesn't exist, but those are always windows
if($IsWindows -eq $null)
{
    $IsWindows = $true
}


# Builds a product based on a Build Json
function Invoke-Build
{
    param(
        [Parameter(Mandatory, ParameterSetName='RepoPath')]
        [string]$RepoPath,

        [Parameter(Mandatory, ParameterSetName='GitHubRepo')]
        [string]$Fork,

        [Parameter(Mandatory, ParameterSetName='GitHubRepo')]
        [string]$Repo,

        [Parameter(Mandatory)]
        [string]$BuildJsonPath,

        [Parameter(ParameterSetName='GitHubRepo')]
        [string]$Branch = 'master',

        [hashtable]$Parameters,

        [String]$Name,
        
        [string[]]$AdditionalFiles
    )

    switch($PSCmdlet.ParameterSetName)
    {
        'GitHubRepo' {
            $repoLocation = Join-Path $PSScriptRoot -ChildPath "project"
            Invoke-CloneGitHubRepo -Fork $Fork -Repo $Repo -Branch $Branch -Location $repoLocation -CleanLocation
        }
        'RepoPath' {
            $repoLocation = $RepoPath
        }
    }

    $buildJsonFullPath = Join-Path $repoLocation -ChildPath $BuildJsonPath

    $buildJson = Get-Content -path $buildJsonFullPath | ConvertFrom-Json

    if($IsWindows)
    {
        # Windows Powershell or PowerShell Core on Windows
        foreach($buildData in $buildJson.Windows)
        {
            if(!$Name -or $buildData.Name -eq $Name)
            {
                Invoke-BuildInDocker -RepoLocation $repoLocation -BuildData $buildData -Parameters $Parameters -AdditionalFiles $AdditionalFiles
            }
        }
    } 
    elseif ($IsLinux -or $IsMacOS) {
        foreach($buildData in $buildJson.Linux)
        {
            if(!$Name -or $buildData.Name -eq $Name)
            {
                Invoke-BuildInDocker -RepoLocation $repoLocation -BuildData $buildData -Parameters $Parameters -AdditionalFiles $AdditionalFiles
            }
        }
    }
    else {
        # All others are not currently supported
        throw "Platform not supported ($($PSVersionTable.OS))."
    }
}

Export-ModuleMember @(
    'Invoke-Build'
)
