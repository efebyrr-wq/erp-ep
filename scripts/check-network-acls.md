# Network ACLs Check

Since security group rules are correct but connection still fails, check Network ACLs:

## Steps to Check Network ACLs:

1. **Go to VPC Console:**
   - AWS Console → VPC → Network ACLs

2. **Find the Network ACL for your subnets:**
   - Your database uses subnets:
     - `subnet-06950276212e67908`
     - `subnet-0259a5f3ebb48d20c`
     - `subnet-049f0e069580b8f76`
   - Find which Network ACL is associated with these subnets

3. **Check Inbound Rules:**
   - Should allow:
     - Rule 100: All traffic from 0.0.0.0/0 (or at least TCP port 5432)
   - Default Network ACLs usually allow all traffic

4. **Check Outbound Rules:**
   - Should allow:
     - Rule 100: All traffic to 0.0.0.0/0
   - Default Network ACLs usually allow all traffic

## If Network ACLs are blocking:

- Edit the Network ACL
- Add inbound rule: Type: Custom TCP, Port: 5432, Source: 0.0.0.0/0
- Add outbound rule: Type: Custom TCP, Port: 1024-65535, Destination: 0.0.0.0/0








