# Script to find files with similarity >= 80%
$files = Get-ChildItem -Recurse -File | Where-Object { 
    $_.FullName -notmatch 'node_modules|\.next|\.git|coverage|test-results|playwright-report|\.pnpm' -and
    $_.Extension -match '\.(ts|tsx|js|jsx|md)$'
} | Select-Object FullName, Length

$results = @()
$total = $files.Count
$processed = 0

Write-Host "Analyzing $total files..."

for ($i = 0; $i -lt $files.Count; $i++) {
    for ($j = $i + 1; $j -lt $files.Count; $j++) {
        $file1 = $files[$i]
        $file2 = $files[$j]
        
        # Skip if files are too different in size (likely not similar)
        $sizeDiff = [Math]::Abs($file1.Length - $file2.Length)
        $avgSize = ($file1.Length + $file2.Length) / 2
        if ($avgSize -gt 0 -and ($sizeDiff / $avgSize) -gt 0.5) {
            continue
        }
        
        try {
            $content1 = Get-Content $file1.FullName -Raw -ErrorAction SilentlyContinue
            $content2 = Get-Content $file2.FullName -Raw -ErrorAction SilentlyContinue
            
            if ($null -eq $content1 -or $null -eq $content2) { continue }
            
            # Calculate similarity using Levenshtein-like approach
            $len1 = $content1.Length
            $len2 = $content2.Length
            
            if ($len1 -eq 0 -or $len2 -eq 0) { continue }
            
            # Simple similarity: compare line by line
            $lines1 = $content1 -split "`n"
            $lines2 = $content2 -split "`n"
            
            $commonLines = 0
            $totalLines = [Math]::Max($lines1.Count, $lines2.Count)
            
            if ($totalLines -eq 0) { continue }
            
            # Compare line by line (exact match)
            $minLines = [Math]::Min($lines1.Count, $lines2.Count)
            for ($k = 0; $k -lt $minLines; $k++) {
                if ($lines1[$k].Trim() -eq $lines2[$k].Trim()) {
                    $commonLines++
                }
            }
            
            $lineSimilarity = ($commonLines / $totalLines) * 100
            
            # Also check character-level similarity for small differences
            $charSimilarity = 0
            if ($len1 -gt 0 -and $len2 -gt 0) {
                $maxLen = [Math]::Max($len1, $len2)
                $diff = 0
                $minLen = [Math]::Min($len1, $len2)
                
                # Simple character comparison
                for ($c = 0; $c -lt $minLen; $c++) {
                    if ($content1[$c] -ne $content2[$c]) {
                        $diff++
                    }
                }
                $diff += [Math]::Abs($len1 - $len2)
                $charSimilarity = (($maxLen - $diff) / $maxLen) * 100
            }
            
            # Use the higher similarity score
            $similarity = [Math]::Max($lineSimilarity, $charSimilarity)
            
            if ($similarity -ge 80) {
                $relPath1 = $file1.FullName.Replace((Get-Location).Path + '\', '')
                $relPath2 = $file2.FullName.Replace((Get-Location).Path + '\', '')
                
                $results += [PSCustomObject]@{
                    File1 = $relPath1
                    File2 = $relPath2
                    Similarity = [Math]::Round($similarity, 2)
                    Size1 = $file1.Length
                    Size2 = $file2.Length
                    LineSimilarity = [Math]::Round($lineSimilarity, 2)
                    CharSimilarity = [Math]::Round($charSimilarity, 2)
                }
            }
        } catch {
            # Skip files that can't be read
            continue
        }
    }
    
    $processed++
    if ($processed % 50 -eq 0) {
        Write-Host "Processed $processed / $total files..."
    }
}

Write-Host "`nFound $($results.Count) pairs with similarity >= 80%`n"

# Sort by similarity descending
$results = $results | Sort-Object Similarity -Descending

# Display results
$results | Format-Table -AutoSize

# Export to CSV
$results | Export-Csv -Path "similar-files-report.csv" -NoTypeInformation
Write-Host "Results exported to similar-files-report.csv"

