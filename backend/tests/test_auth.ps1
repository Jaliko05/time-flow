# Test Script: Authentication Endpoints
# TimeFlow API - Auth Testing

$baseUrl = "http://localhost:8080"
$testResults = @()

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TimeFlow API - Authentication Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login SuperAdmin
Write-Host "[TEST 1] Login as SuperAdmin..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -Body (@{
            email    = "superadmin@timeflow.com"
            password = "admin123"
        } | ConvertTo-Json) -ContentType "application/json"
    
    if ($loginResponse.token) {
        Write-Host "✓ PASS: SuperAdmin login successful" -ForegroundColor Green
        $superAdminToken = $loginResponse.token
        $testResults += @{ Test = "SuperAdmin Login"; Result = "PASS" }
    }
    else {
        Write-Host "✗ FAIL: No token received" -ForegroundColor Red
        $testResults += @{ Test = "SuperAdmin Login"; Result = "FAIL" }
    }
}
catch {
    Write-Host "✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "SuperAdmin Login"; Result = "FAIL" }
}
Write-Host ""

# Test 2: Login Admin
Write-Host "[TEST 2] Login as Admin..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -Body (@{
            email    = "admin@timeflow.com"
            password = "admin123"
        } | ConvertTo-Json) -ContentType "application/json"
    
    if ($loginResponse.token) {
        Write-Host "✓ PASS: Admin login successful" -ForegroundColor Green
        $adminToken = $loginResponse.token
        $testResults += @{ Test = "Admin Login"; Result = "PASS" }
    }
    else {
        Write-Host "✗ FAIL: No token received" -ForegroundColor Red
        $testResults += @{ Test = "Admin Login"; Result = "FAIL" }
    }
}
catch {
    Write-Host "✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Admin Login"; Result = "FAIL" }
}
Write-Host ""

# Test 3: Login User
Write-Host "[TEST 3] Login as User..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -Body (@{
            email    = "user@timeflow.com"
            password = "user123"
        } | ConvertTo-Json) -ContentType "application/json"
    
    if ($loginResponse.token) {
        Write-Host "✓ PASS: User login successful" -ForegroundColor Green
        $userToken = $loginResponse.token
        $testResults += @{ Test = "User Login"; Result = "PASS" }
    }
    else {
        Write-Host "✗ FAIL: No token received" -ForegroundColor Red
        $testResults += @{ Test = "User Login"; Result = "FAIL" }
    }
}
catch {
    Write-Host "✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "User Login"; Result = "FAIL" }
}
Write-Host ""

# Test 4: Login with invalid credentials
Write-Host "[TEST 4] Login with invalid credentials..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -Body (@{
            email    = "invalid@test.com"
            password = "wrongpassword"
        } | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✗ FAIL: Should have failed with invalid credentials" -ForegroundColor Red
    $testResults += @{ Test = "Invalid Login"; Result = "FAIL" }
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✓ PASS: Correctly rejected invalid credentials" -ForegroundColor Green
        $testResults += @{ Test = "Invalid Login"; Result = "PASS" }
    }
    else {
        Write-Host "✗ FAIL: Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Invalid Login"; Result = "FAIL" }
    }
}
Write-Host ""

# Test 5: Get current user info (with token)
Write-Host "[TEST 5] Get current user info with valid token..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $superAdminToken"
    }
    $userInfo = Invoke-RestMethod -Uri "$baseUrl/api/users/me" -Method GET -Headers $headers
    
    if ($userInfo.email -eq "superadmin@timeflow.com") {
        Write-Host "✓ PASS: User info retrieved successfully" -ForegroundColor Green
        $testResults += @{ Test = "Get User Info"; Result = "PASS" }
    }
    else {
        Write-Host "✗ FAIL: Incorrect user info" -ForegroundColor Red
        $testResults += @{ Test = "Get User Info"; Result = "FAIL" }
    }
}
catch {
    Write-Host "✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Get User Info"; Result = "FAIL" }
}
Write-Host ""

# Test 6: Access protected endpoint without token
Write-Host "[TEST 6] Access protected endpoint without token..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/projects" -Method GET -ErrorAction Stop
    Write-Host "✗ FAIL: Should have been rejected without token" -ForegroundColor Red
    $testResults += @{ Test = "No Token Access"; Result = "FAIL" }
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ PASS: Correctly rejected request without token" -ForegroundColor Green
        $testResults += @{ Test = "No Token Access"; Result = "PASS" }
    }
    else {
        Write-Host "✗ FAIL: Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Test = "No Token Access"; Result = "FAIL" }
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$passCount = ($testResults | Where-Object { $_.Result -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Result -eq "FAIL" }).Count
Write-Host "PASSED: $passCount / $($testResults.Count)" -ForegroundColor Green
Write-Host "FAILED: $failCount / $($testResults.Count)" -ForegroundColor Red
Write-Host ""

# Export results
$testResults | Format-Table -AutoSize
