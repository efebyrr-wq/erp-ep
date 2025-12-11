#!/bin/bash
# Verify that the build was successful and rebuild if needed
echo "Checking if dist folder exists..."
if [ ! -d "/var/app/current/dist" ] || [ ! -f "/var/app/current/dist/src/main.js" ]; then
    echo "❌ dist folder or main.js NOT found - building now..."
    cd /var/app/current
    echo "Installing devDependencies..."
    npm install --include=dev 2>&1
    echo "Checking if nest CLI is available..."
    if [ -f "./node_modules/.bin/nest" ]; then
        echo "✅ nest CLI found at ./node_modules/.bin/nest"
    else
        echo "❌ nest CLI not found, trying npx..."
    fi
    echo "Building application..."
    npm run build 2>&1 | tee /tmp/build.log
    BUILD_EXIT=$?
    echo "Build command exit code: $BUILD_EXIT"
    echo "Build log contents:"
    cat /tmp/build.log
    echo "Checking dist folder contents..."
    ls -la dist/ 2>&1 || echo "dist folder does not exist"
    echo "Looking for main.js..."
    find dist/ -name "main.js" -o -name "main.js.map" 2>&1 || echo "main.js not found"
    if [ -f "/var/app/current/dist/src/main.js" ]; then
        echo "✅ Build successful! dist/src/main.js exists"
    else
        echo "❌ Build failed - dist/src/main.js still not found"
        echo "Trying direct TypeScript compilation..."
        ./node_modules/.bin/tsc -p tsconfig.build.json 2>&1
        echo "TypeScript compilation exit code: $?"
        echo "Checking for main.js after tsc..."
        find dist/ -name "main.js" 2>&1
        ls -la dist/ 2>&1
        if [ ! -f "/var/app/current/dist/src/main.js" ]; then
            echo "❌ Build still failed - checking for TypeScript errors..."
            ./node_modules/.bin/tsc -p tsconfig.build.json --noEmit 2>&1 | head -50
            echo "❌ Cannot find dist/src/main.js after all build attempts"
            exit 1
        fi
    fi
else
    echo "✅ dist folder exists and main.js is present"
fi

