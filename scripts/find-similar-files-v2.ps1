# Enhanced script to find similar files
$files = Get-ChildItem -Recurse -File | Where-Object { 
    $_.FullName -notmatch 'node_modules|\.next|\.git|coverage|test-results|playwright-report|\.pnpm|\.cache' -and
    $_.Extension -match '\.(ts|tsx|js|jsx|md)$'
} | Select-Object FullName, Name, Directory, Length

$results = @()
$total = $files.Count

Write-Host "Analyzing $total files for similar names and content..."

# First, group by similar names
$nameGroups = @{}
foreach ($file in $files) {
    $baseName = $file.Name -replace '\.(ts|tsx|js|jsx|md)$', ''
    if (-not $nameGroups.ContainsKey($baseName)) {
        $nameGroups[$baseName] = @()
    }
    $nameGroups[$baseName] += $file
}

# Find files with similar names
Write-Host "`n=== FILES WITH SIMILAR NAMES ==="
foreach ($group in $nameGroups.GetEnumerator()) {
    if ($group.Value.Count -gt 1) {
        $group.Value | ForEach-Object {
            Write-Host "  $($_.FullName.Replace((Get-Location).Path + '\', ''))"
        }
        Write-Host ""
    }
}

# Compare files with similar names
Write-Host "`n=== COMPARING FILES WITH SIMILAR NAMES ==="
foreach ($group in $nameGroups.GetEnumerator()) {
    if ($group.Value.Count -gt 1) {
        for ($i = 0; $i -lt $group.Value.Count; $i++) {
            for ($j = $i + 1; $j -lt $group.Value.Count; $j++) {
                $file1 = $group.Value[$i]
                $file2 = $group.Value[$j]
                
                try {
                    $content1 = Get-Content $file1.FullName -Raw -ErrorAction SilentlyContinue
                    $content2 = $file2.FullName | Get-Content -Raw -ErrorAction SilentlyContinue
                    
                    if ($null -eq $content1 -or $null -eq $content2) { continue }
                    
                    $lines1 = ($content1 -split "`n").Count
                    $lines2 = ($content2 -split "`n").Count
                    
                    # Calculate similarity
                    $common = 0
                    $total = [Math]::Max($lines1, $lines2)
                    $arr1 = $content1 -split "`n"
                    $arr2 = $content2 -split "`n"
                    $min = [Math]::Min($arr1.Count, $arr2.Count)
                    
                    for ($k = 0; $k -lt $min; $k++) {
                        if ($arr1[$k].Trim() -eq $arr2[$k].Trim()) {
                            $common++
                        }
                    }
                    
                    $similarity = ($common / $total) * 100
                    
                    if ($similarity -ge 80) {
                        $relPath1 = $file1.FullName.Replace((Get-Location).Path + '\', '')
                        $relPath2 = $file2.FullName.Replace((Get-Location).Path + '\', '')
                        
                        $results += [PSCustomObject]@{
                            File1 = $relPath1
                            File2 = $relPath2
                            Similarity = [Math]::Round($similarity, 2)
                            Lines1 = $lines1
                            Lines2 = $lines2
                            CommonLines = $common
                        }
                    }
                } catch {
                    continue
                }
            }
        }
    }
}

# Also check files in same directory with similar patterns
Write-Host "`n=== CHECKING FILES IN SAME DIRECTORIES ==="
$dirGroups = $files | Group-Object Directory
foreach ($dirGroup in $dirGroups) {
    if ($dirGroup.Count -gt 1) {
        $dirFiles = $dirGroup.Group
        for ($i = 0; $i -lt $dirFiles.Count; $i++) {
            for ($j = $i + 1; $j -lt $dirFiles.Count; $j++) {
                $file1 = $dirFiles[$i]
                $file2 = $dirFiles[$j]
                
                # Skip if already compared
                $alreadyFound = $results | Where-Object { 
                    ($_.File1 -eq $file1.FullName.Replace((Get-Location).Path + '\', '') -and $_.File2 -eq $file2.FullName.Replace((Get-Location).Path + '\', '')) -or
                    ($_.File1 -eq $file2.FullName.Replace((Get-Location).Path + '\', '') -and $_.File2 -eq $file1.FullName.Replace((Get-Location).Path + '\', ''))
                }
                if ($alreadyFound) { continue }
                
                # Check if names are similar
                $name1 = $file1.Name -replace '\.(ts|tsx|js|jsx|md)$', ''
                $name2 = $file2.Name -replace '\.(ts|tsx|js|jsx|md)$', ''
                
                if ($name1 -eq $name2 -or 
                    $name1 -like "*$name2*" -or 
                    $name2 -like "*$name1*" -or
                    ($name1.Length -gt 5 -and $name2.Length -gt 5 -and 
                     ($name1.Substring(0, [Math]::Min(5, $name1.Length)) -eq $name2.Substring(0, [Math]::Min(5, $name2.Length))))) {
                    
                    try {
                        $content1 = Get-Content $file1.FullName -Raw -ErrorAction SilentlyContinue
                        $content2 = Get-Content $file2.FullName -Raw -ErrorAction SilentlyContinue
                        
                        if ($null -eq $content1 -or $null -eq $content2) { continue }
                        
                        $arr1 = $content1 -split "`n"
                        $arr2 = $content2 -split "`n"
                        $min = [Math]::Min($arr1.Count, $arr2.Count)
                        $total = [Math]::Max($arr1.Count, $arr2.Count)
                        
                        $common = 0
                        for ($k = 0; $k -lt $min; $k++) {
                            if ($arr1[$k].Trim() -eq $arr2[$k].Trim()) {
                                $common++
                            }
                        }
                        
                        $similarity = ($common / $total) * 100
                        
                        if ($similarity -ge 80) {
                            $relPath1 = $file1.FullName.Replace((Get-Location).Path + '\', '')
                            $relPath2 = $file2.FullName.Replace((Get-Location).Path + '\', '')
                            
                            $results += [PSCustomObject]@{
                                File1 = $relPath1
                                File2 = $relPath2
                                Similarity = [Math]::Round($similarity, 2)
                                Lines1 = $arr1.Count
                                Lines2 = $arr2.Count
                                CommonLines = $common
                            }
                        }
                    } catch {
                        continue
                    }
                }
            }
        }
    }
}

# Remove duplicates
$uniqueResults = @()
$seen = @{}
foreach ($result in $results) {
    $key = if ($result.File1 -lt $result.File2) { "$($result.File1)|$($result.File2)" } else { "$($result.File2)|$($result.File1)" }
    if (-not $seen.ContainsKey($key)) {
        $seen[$key] = $true
        $uniqueResults += $result
    }
}

Write-Host "`n=== FINAL RESULTS: FILES WITH >= 80% SIMILARITY ==="
$uniqueResults = $uniqueResults | Sort-Object Similarity -Descending
$uniqueResults | Format-Table -AutoSize

# Export
$uniqueResults | Export-Csv -Path "similar-files-report.csv" -NoTypeInformation
Write-Host "`nResults exported to similar-files-report.csv"
Write-Host "Total pairs found: $($uniqueResults.Count)"

