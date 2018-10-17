# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

$moduleName = 'vstsBuild'
$modulePath = "$PSScriptRoot\..\vstsBuild\$moduleName.psm1"
Import-module $modulePath -force -Scope Local

Describe $moduleName {
    Context "Publish-VstsBuildArtifact -ArtifactAsFolder" {
        BeforeAll {
            $emptyScriptBlock = {}
            Mock -CommandName 'Write-Host' -MockWith $emptyScriptBlock -Verifiable -ModuleName $moduleName
            Mock -CommandName 'Publish-VstsArtifact' -MockWith $emptyScriptBlock -ModuleName $moduleName
            $path = 'testdrive:\testfolder'
            if(!(Test-Path $path))
            {
                $null = New-Item -Path $path -ItemType Directory
            }

            $file1 = Join-Path -Path $path -ChildPath 'file1.txt'
            $file2 = Join-Path -Path $path -ChildPath 'file2.csv'
            '' | Out-File -FilePath $file1
            '' | Out-File -FilePath $file2
        }

        It "Verify all files use the bucket name" {
            Publish-VstsBuildArtifact -ArtifactPath $path -ArtifactAsFolder -bucket testbucket
            Assert-VerifiableMock
            Assert-MockCalled -CommandName 'Publish-VstsArtifact' `
                            -ModuleName $moduleName `
                            -Exactly 2 `
                            -ParameterFilter {
                                $ArtifactName -eq 'testbucket' 
                            }
        }
    }

    Context "Publish-VstsBuildArtifact -ArtifactAsFolder -PublishAsFolder" {
        BeforeAll {
            $emptyScriptBlock = {}
            Mock -CommandName 'Write-Host' -MockWith $emptyScriptBlock -Verifiable -ModuleName $moduleName
            Mock -CommandName 'Publish-VstsArtifact' -MockWith $emptyScriptBlock -ModuleName $moduleName
            $path = 'testdrive:\testfolder'
            if(!(Test-Path $path))
            {
                $null = New-Item -Path $path -ItemType Directory
            }

            $file1 = Join-Path -Path $path -ChildPath 'file1.txt'
            $file2 = Join-Path -Path $path -ChildPath 'file2.csv'
            '' | Out-File -FilePath $file1
            '' | Out-File -FilePath $file2
        }
        It "Verify the folder uses the bucket name with ArtifactAsFolder and PublishAsFolder" {
            Publish-VstsBuildArtifact -ArtifactPath $path -ArtifactAsFolder -bucket testbucket -PublishAsFolder
            Assert-VerifiableMock
            Assert-MockCalled -CommandName 'Publish-VstsArtifact' `
                            -ModuleName $moduleName `
                            -Exactly 1 `
                            -ParameterFilter {
                                $ArtifactName -eq 'testbucket' 
                            }
        }
    }
}
