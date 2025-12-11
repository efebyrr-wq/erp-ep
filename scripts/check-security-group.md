# Security Group Troubleshooting Checklist

## Verify These Settings in AWS Console:

### 1. Database Status
- Go to: RDS → Databases → erp-2025-db
- **Status must be: "Available"** (green)
- If it says "Creating" or "Modifying", wait until it's "Available"

### 2. Security Group Details
- Go to: RDS → Databases → erp-2025-db → Connectivity & security
- Click on the Security group name (e.g., `erp-2025-db-sg`)
- Click "Edit inbound rules"

### 3. Verify Inbound Rule
You should see a rule like this:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|------------|
| PostgreSQL | TCP | 5432 | 31.142.114.130/32 | Allow from my IP |

**Important checks:**
- ✅ Type is exactly "PostgreSQL" (or "Custom TCP Rule")
- ✅ Port is exactly 5432
- ✅ Source is exactly `31.142.114.130/32` (with /32)
- ✅ Rule status shows as active (not pending)

### 4. Check Outbound Rules
- Click "Outbound rules" tab
- Should have at least one rule allowing all outbound traffic (default)

### 5. VPC and Subnet Settings
- Go back to database details
- Check "Subnet group" - should have subnets configured
- Check "Publicly accessible" - should be **Yes**

### 6. Network ACLs (if using custom VPC)
- Check Network ACLs don't block port 5432

## Quick Test: Allow All IPs Temporarily

To rule out IP issues, temporarily add:
- Type: PostgreSQL
- Port: 5432  
- Source: `0.0.0.0/0`
- Description: "Temporary test"

If this works, the issue is with the specific IP rule.
If this still fails, the issue is elsewhere (database status, VPC, etc.)





