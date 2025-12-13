# IncomePlus Scanner - Testing Guide

## Quick Start Testing

1. **Save these files in a folder:**
   - `index.html` - Main landing page
   - `login.html` - Login page
   - `dashboard.html` - Dashboard
   - `scanner-test.html` - Scanner test
   - `test.php` - PHP test (optional)

2. **Open in browser:**
   - Double-click `index.html` to open in browser
   - OR use local server: `python -m http.server 8000`

## What to Test Immediately:

### ✅ Test 1: Basic Navigation
1. Open `index.html`
2. Click "Test Login" button
3. Should open login page

### ✅ Test 2: Login System
1. On login page, click "Login to Dashboard"
2. Should redirect to dashboard
3. Check if user data appears in top bar

### ✅ Test 3: Dashboard Features
1. Click "Run Test Scan" button
2. Check if stats update
3. Check if results table updates

### ✅ Test 4: Scanner Test
1. Go to scanner-test.html
2. Click "Run Scanner Test"
3. Check if results appear
4. Test slider and dropdowns

## Expected Results:

### Landing Page (index.html)
- Should show clean design
- Buttons should work
- Links should navigate

### Login Page (login.html)
- Form should submit
- Should redirect to dashboard
- Should store user in localStorage

### Dashboard (dashboard.html)
- Should show user info
- Stats should update
- Scanner cards should be clickable
- Logout should work

### Scanner Test (scanner-test.html)
- Should generate random results
- Controls should work
- Should show confidence slider

## Common Issues & Solutions:

### ❌ Issue: Buttons not working
**Solution:** Check browser console (F12) for JavaScript errors

### ❌ Issue: Login not redirecting
**Solution:** Check if localStorage is enabled in browser

### ❌ Issue: Design looks broken
**Solution:** Check CSS is loading (no 404 errors)

### ❌ Issue: PHP test not working
**Solution:** Need PHP installed or use XAMPP/WAMP

## Quick PHP Setup (Optional):

If you want to test PHP:

1. **Install XAMPP:** https://www.apachefriends.org
2. **Start Apache** from XAMPP Control Panel
3. **Place files** in `htdocs/incomeplus` folder
4. **Access:** http://localhost/incomeplus/

## Next Steps After Testing:

1. If everything works: ✅ Proceed to build full version
2. If issues: Check browser console for errors
3. Test on mobile: Resize browser or use mobile emulator

## Test Data:
- Email: test@incomeplus.in
- Password: Test@123
- All data is stored in browser localStorage
- No database required for basic tests

## Ready for Production? Checklist:
- [ ] All 4 test pages work
- [ ] No JavaScript errors in console
- [ ] Design responsive on mobile
- [ ] Forms submit correctly
- [ ] Navigation works
- [ ] Scanner generates results
