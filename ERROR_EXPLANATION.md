# Why We're Getting 500 Errors

## Root Cause
The backend is trying to connect to PostgreSQL database on port 5432, but the connection is being **refused** (`ECONNREFUSED`). This means:

1. **PostgreSQL is not running**, OR
2. **PostgreSQL is running on a different port**, OR  
3. **Database credentials are incorrect**, OR
4. **Database doesn't exist**

## Error Details
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

This error occurs when:
- The backend tries to execute any database query
- TypeORM tries to initialize the connection
- The service methods try to query the database

## Solution

### Option 1: Start PostgreSQL
```bash
# On macOS with Homebrew
brew services start postgresql

# Or start manually
pg_ctl -D /usr/local/var/postgres start
```

### Option 2: Check Database Configuration
Check your `.env` file in the `backend` directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=erp_2025
```

### Option 3: Verify Database Exists
```bash
psql -U postgres -c "CREATE DATABASE erp_2025;"
```

## What I Fixed

1. **Added Global Exception Filter**: Now all errors are properly logged with details
2. **Improved Error Handling**: Service methods now detect database connection errors and provide clearer error messages
3. **Better Logging**: You'll now see exactly what error is happening in the backend console

## Next Steps

1. **Start PostgreSQL** if it's not running
2. **Check the backend console** - you should now see detailed error messages
3. **Verify database connection** - make sure the database is accessible

The 500 errors will stop once PostgreSQL is running and accessible.





