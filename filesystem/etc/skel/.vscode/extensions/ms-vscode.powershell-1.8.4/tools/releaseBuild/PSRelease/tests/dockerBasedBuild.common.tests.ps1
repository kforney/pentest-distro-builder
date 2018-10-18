# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

$moduleName = 'dockerBasedBuild.common'
$modulePath = "$PSScriptRoot\..\dockerBasedBuild\$moduleName.psm1"
Import-module $modulePath -force -Scope Local
$vstsModuleName = 'vstsBuild'
$modulePath = "$PSScriptRoot\..\$vstsModuleName"
Import-module $modulePath -force

Describe "DockerBasedBuild.Common" {
    Context "Invoke-BuildInDocker -ArtifactAsFolder" {
        BeforeAll{
            $buildData = New-BuildData
            $buildData.EnableFeature = @('ArtifactAsFolder')
            $buildData.DockerFile = 'TestDockerFile'
            $buildData.DockerImageName = 'TestImageName'
            $buildData.RepoDestinationPath = '/test'
            $buildData.BuildCommand = './TestBuildCommand.sh'
            $emptyScriptBlock = {}
            Mock -CommandName 'New-DockerImage' -MockWith $emptyScriptBlock -Verifiable -ModuleName $moduleName
            Mock -CommandName 'Invoke-DockerBuild' -MockWith $emptyScriptBlock -Verifiable -ModuleName $moduleName
            Mock -CommandName 'Publish-VstsBuildArtifact' -MockWith $emptyScriptBlock -ModuleName $moduleName
        }

        It "Verify EnableFeature with ArtifactAsFolder triggers that feature" {
            Invoke-BuildInDocker -BuildData $buildData -RepoLocation $TestDrive
            Assert-VerifiableMock
            Assert-MockCalled -CommandName 'Publish-VstsBuildArtifact' -ParameterFilter {
                $ArtifactAsFolder -eq $true
            } -ModuleName $moduleName
        }
    }

    Context "Invoke-BuildInDocker" {
        BeforeAll{
            $buildData = New-BuildData
            $buildData.DockerFile = 'TestDockerFile'
            $buildData.DockerImageName = 'TestImageName'
            $buildData.RepoDestinationPath = '/test'
            $buildData.BuildCommand = './TestBuildCommand.sh'
            $emptyScriptBlock = {}
            Mock -CommandName 'New-DockerImage' -MockWith $emptyScriptBlock -Verifiable -ModuleName $moduleName
            Mock -CommandName 'Invoke-DockerBuild' -MockWith $emptyScriptBlock -Verifiable -ModuleName $moduleName
            Mock -CommandName 'Publish-VstsBuildArtifact' -MockWith $emptyScriptBlock -ModuleName $moduleName
        }

        It "Verify EnableFeature without ArtifactAsFolder does not trigger that feature" {
            Invoke-BuildInDocker -BuildData $buildData -RepoLocation $TestDrive
            Assert-VerifiableMock
            Assert-MockCalled -CommandName 'Publish-VstsBuildArtifact' -ParameterFilter {
                !$ArtifactAsFolder
            } -ModuleName $moduleName
        }
    }
}
