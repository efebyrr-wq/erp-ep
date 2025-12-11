-- Seed data for ERP 2025 schema
-- Run after schema.sql to populate reference data for testing
-- 15 entries per table with maintained referential integrity

set search_path to public;

-- Customers -----------------------------------------------------------------
insert into customers (name, balance, created_at) values
  ( 'Acme Construction', 12500.00, now() - interval '45 days'),
  ( 'MetroBuild Corp', 8700.00, now() - interval '43 days'),
  ( 'Skyline Structures', 4350.00, now() - interval '41 days'),
  ( 'Evergreen Manufacturing', 9820.00, now() - interval '39 days'),
  ( 'Harbor Logistics', 3120.00, now() - interval '37 days'),
  ( 'Urban Works', 2850.00, now() - interval '35 days'),
  ( 'Summit Engineering', 6200.00, now() - interval '33 days'),
  ( 'Prime Fabrication', 4125.00, now() - interval '31 days'),
  ( 'Lighthouse Energy', 7550.00, now() - interval '29 days'),
  ('Northshore Industrial', 5680.00, now() - interval '27 days'),
  ('Pacific Builders', 11200.00, now() - interval '25 days'),
  ('Coastal Contractors', 6950.00, now() - interval '23 days'),
  ('Mountain View Inc', 8230.00, now() - interval '21 days'),
  ('Valley Works LLC', 4450.00, now() - interval '19 days'),
  ('Riverside Construction', 7890.00, now() - interval '17 days');

-- Customer Contacts ---------------------------------------------------------
insert into contact_persons (customer_id, name, role, email, phone_number, created_at) values
  ( 1, 'Jane Miller', 'Procurement Lead', 'jane.miller@acme.com', '+1-555-200-1001', now() - interval '45 days'),
  ( 1, 'Tom Jacobs', 'Project Manager', 'tom.jacobs@acme.com', '+1-555-200-1002', now() - interval '43 days'),
  ( 2, 'Sandra Lee', 'Operations', 'sandra.lee@metrobuild.com', '+1-555-201-1101', now() - interval '42 days'),
  ( 2, 'Mark Thompson', 'Site Supervisor', 'mark.thompson@metrobuild.com', '+1-555-201-1102', now() - interval '40 days'),
  ( 3, 'Luis Ramirez', 'Purchasing', 'luis.ramirez@skyline.net', '+1-555-202-1201', now() - interval '41 days'),
  ( 4, 'Emily Chen', 'Maintenance', 'emily.chen@evergreen.io', '+1-555-203-1301', now() - interval '39 days'),
  ( 5, 'Mike Johnson', 'Fleet Coordinator', 'mike.johnson@harborlogistics.com', '+1-555-204-1401', now() - interval '37 days'),
  ( 6, 'Priya Patel', 'Admin', 'priya.patel@urbanworks.com', '+1-555-205-1501', now() - interval '35 days'),
  ( 7, 'Robert King', 'Site Lead', 'robert.king@summiteng.com', '+1-555-206-1601', now() - interval '33 days'),
  (8, 'Hannah Moore', 'Procurement', 'h.moore@primefab.com', '+1-555-207-1701', now() - interval '31 days'),
  (9, 'Daniel Scott', 'Operations', 'daniel.scott@lighthouseenergy.com', '+1-555-208-1801', now() - interval '29 days'),
  (10,'Sarah Williams', 'Project Coordinator', 'sarah.williams@northshore.com', '+1-555-209-1901', now() - interval '27 days'),
  (11,'James Brown', 'Fleet Manager', 'james.brown@pacificbuilders.com', '+1-555-210-2001', now() - interval '25 days'),
  (12,'Lisa Anderson', 'Procurement', 'lisa.anderson@coastal.com', '+1-555-211-2101', now() - interval '23 days'),
  (13,'David Martinez', 'Site Manager', 'david.martinez@mountainview.com', '+1-555-212-2201', now() - interval '21 days');

-- Customer Working Sites ----------------------------------------------------
insert into working_sites (working_site_name, location, created_at) values
  ( 'Downtown Tower', '36.8969,30.7133', now() - interval '44 days'),
  ( 'Harborfront', '36.8841,30.7056', now() - interval '42 days'),
  ( 'East Yard', '36.9097,30.7210', now() - interval '40 days'),
  ( 'West Campus', '36.8833,30.7300', now() - interval '38 days'),
  ( 'Greenfield Plant', '36.9000,30.7000', now() - interval '36 days'),
  ( 'Pier 7', '36.8750,30.7150', now() - interval '34 days'),
  ( 'Midtown Hub', '36.8920,30.7080', now() - interval '32 days'),
  ( 'Summit Ridge', '36.9150,30.7100', now() - interval '30 days'),
  ( 'Prime Lot 12', '36.8880,30.7200', now() - interval '28 days'),
  ('Energy Field', '36.9050,30.7050', now() - interval '26 days'),
  ('Pacific Shore', '36.8800,30.7250', now() - interval '24 days'),
  ('Coastal Bay', '36.9100,30.7150', now() - interval '22 days'),
  ('Mountain Base', '36.8950,30.7000', now() - interval '20 days'),
  ('Valley Center', '36.8850,30.7100', now() - interval '18 days'),
  ('Riverside Park', '36.9000,30.7200', now() - interval '16 days');

-- Suppliers -----------------------------------------------------------------
insert into suppliers (name, balance, created_at) values
  ( 'Global Steel Ltd', 8200.00, now() - interval '45 days'),
  ( 'IronWorks Outsourcing', 4750.00, now() - interval '43 days'),
  ( 'Precision Tools Co', 3125.00, now() - interval '41 days'),
  ( 'Atlas Components', 2900.00, now() - interval '39 days'),
  ( 'Northwind Materials', 5100.00, now() - interval '37 days'),
  ( 'Cascade Logistics', 1800.00, now() - interval '35 days'),
  ( 'Summit Aggregates', 2650.00, now() - interval '33 days'),
  ( 'Harbor Freightways', 1980.00, now() - interval '31 days'),
  ( 'Vertex Electronics', 3400.00, now() - interval '29 days'),
  ('Apex Hydraulics', 4300.00, now() - interval '27 days'),
  ('Pacific Steel Works', 5200.00, now() - interval '25 days'),
  ('Coastal Supply Co', 3800.00, now() - interval '23 days'),
  ('Mountain Tools Inc', 2950.00, now() - interval '21 days'),
  ('Valley Components', 4100.00, now() - interval '19 days'),
  ('Riverside Materials', 3600.00, now() - interval '17 days');

-- Supplier Contacts ---------------------------------------------------------
insert into supplier_contact_persons (supplier_id, name, role, email, phone_number, created_at) values
  ( 1, 'Carlos Ramirez', 'Sales Manager', 'cramirez@globalsteel.com', '+1-555-300-1001', now() - interval '45 days'),
  ( 1, 'Laura Becker', 'Accounts', 'lbecker@globalsteel.com', '+1-555-300-1002', now() - interval '43 days'),
  ( 2, 'Olga Petrova', 'Coordinator', 'opetrova@ironworks.com', '+1-555-301-1101', now() - interval '42 days'),
  ( 3, 'Neil Kline', 'Sales', 'nkline@precisiontools.com', '+1-555-302-1201', now() - interval '41 days'),
  ( 4, 'Sara Kim', 'Account Exec', 'skim@atlascomponents.com', '+1-555-303-1301', now() - interval '39 days'),
  ( 5, 'Jason Lee', 'Regional Rep', 'jlee@northwind.com', '+1-555-304-1401', now() - interval '37 days'),
  ( 6, 'Brianna Holt', 'Logistics', 'bholt@cascadelogistics.com', '+1-555-305-1501', now() - interval '35 days'),
  ( 7, 'Adam Brooks', 'Supply Specialist', 'abrooks@summitaggs.com', '+1-555-306-1601', now() - interval '33 days'),
  ( 8, 'Kim Nguyen', 'Account Manager', 'knguyen@harborfreightways.com', '+1-555-307-1701', now() - interval '31 days'),
  (9, 'Victor Chen', 'Sales Engineer', 'vchen@vertexelec.com', '+1-555-308-1801', now() - interval '29 days'),
  (10,'Amanda White', 'Sales Director', 'awhite@apexhydraulics.com', '+1-555-309-1901', now() - interval '27 days'),
  (11,'Ryan Taylor', 'Account Manager', 'rtaylor@pacificsteel.com', '+1-555-310-2001', now() - interval '25 days'),
  (12,'Michelle Garcia', 'Sales Rep', 'mgarcia@coastalsupply.com', '+1-555-311-2101', now() - interval '23 days'),
  (13,'Kevin Wilson', 'Technical Sales', 'kwilson@mountaintools.com', '+1-555-312-2201', now() - interval '21 days'),
  (14,'Nicole Davis', 'Account Exec', 'ndavis@valleycomponents.com', '+1-555-313-2301', now() - interval '19 days');

-- Supplies ------------------------------------------------------------------
insert into supplies (supplier_id, type, product_name, quantity, price, created_at) values
  ( 1, 'Material', 'Rebar Steel Bars', 120, 58.50, now() - interval '44 days'),
  ( 1, 'Material', 'Structural Beams', 75, 215.00, now() - interval '42 days'),
  ( 2, 'Service', 'Machine Welding', 20, 145.00, now() - interval '41 days'),
  ( 3, 'Part', 'Precision Drill Bits', 250, 8.75, now() - interval '39 days'),
  ( 4, 'Component', 'Hydraulic Valves', 90, 42.60, now() - interval '37 days'),
  ( 5, 'Material', 'Concrete Mix', 140, 22.10, now() - interval '35 days'),
  ( 6, 'Service', 'Flatbed Transport', 15, 185.00, now() - interval '33 days'),
  ( 7, 'Material', 'Crushed Gravel', 200, 12.35, now() - interval '31 days'),
  ( 8, 'Service', 'Port Handling', 18, 95.00, now() - interval '29 days'),
  (9, 'Component', 'Control Circuits', 65, 68.20, now() - interval '27 days'),
  (10,'Component', 'Hydraulic Pumps', 40, 125.00, now() - interval '25 days'),
  (11,'Material', 'Steel Plates', 85, 95.50, now() - interval '23 days'),
  (12,'Material', 'Sand Aggregate', 180, 18.75, now() - interval '21 days'),
  (13,'Part', 'Tool Kits', 120, 35.00, now() - interval '19 days'),
  (14,'Component', 'Electrical Panels', 55, 88.00, now() - interval '17 days');

-- Machinery -----------------------------------------------------------------
insert into machinery (machine_number, machine_code, status, created_at) values
  ( 'MCH-2001', 'DRL-700', 'Active', now() - interval '50 days'),
  ( 'MCH-2002', 'CUT-520', 'Active', now() - interval '48 days'),
  ( 'MCH-2003', 'LFT-310', 'Maintenance', now() - interval '46 days'),
  ( 'MCH-2004', 'CMP-450', 'Active', now() - interval '44 days'),
  ( 'MCH-2005', 'WLD-680', 'Active', now() - interval '42 days'),
  ( 'MCH-2006', 'HND-220', 'Idle', now() - interval '40 days'),
  ( 'MCH-2007', 'PRT-905', 'Active', now() - interval '38 days'),
  ( 'MCH-2008', 'SND-150', 'Maintenance', now() - interval '36 days'),
  ( 'MCH-2009', 'GRD-330', 'Active', now() - interval '34 days'),
  ('MCH-2010', 'BLT-480', 'Active', now() - interval '32 days'),
  ('MCH-2011', 'CRN-600', 'Active', now() - interval '30 days'),
  ('MCH-2012', 'EXC-750', 'Active', now() - interval '28 days'),
  ('MCH-2013', 'LDR-420', 'Idle', now() - interval '26 days'),
  ('MCH-2014', 'MIX-550', 'Active', now() - interval '24 days'),
  ('MCH-2015', 'PRS-380', 'Maintenance', now() - interval '22 days');

-- Machinery Specs -----------------------------------------------------------
insert into machinery_specs (machinery_id, spec_name, spec_value, created_at) values
  ( 1, 'Power Output', '700W', now() - interval '50 days'),
  ( 1, 'Voltage', '240V', now() - interval '49 days'),
  ( 2, 'Cutting Depth', '120mm', now() - interval '48 days'),
  ( 3, 'Lift Capacity', '3.5T', now() - interval '46 days'),
  ( 4, 'Compression Force', '450kN', now() - interval '44 days'),
  ( 5, 'Welding Range', '0.5-2.0cm', now() - interval '42 days'),
  ( 6, 'Handle Length', '1.2m', now() - interval '40 days'),
  ( 7, 'Print Width', '950mm', now() - interval '38 days'),
  ( 8, 'Grit Range', '80-200', now() - interval '36 days'),
  (9, 'Grinding Wheel', '330mm', now() - interval '34 days'),
  (10,'Belt Width', '480mm', now() - interval '32 days'),
  (11,'Crane Capacity', '6.0T', now() - interval '30 days'),
  (12,'Excavation Depth', '7.5m', now() - interval '28 days'),
  (13,'Load Rating', '4.2T', now() - interval '26 days'),
  (14,'Mix Capacity', '550L', now() - interval '24 days');

-- Inventory -----------------------------------------------------------------
insert into inventory (item_name, quantity, reference_bill_id, used_at) values
  ( 'Hydraulic Pump', 6, 101, current_date - 30),
  ( 'Spare Drill Motor', 8, 102, current_date - 28),
  ( 'Gear Assembly', 12, 103, current_date - 26),
  ( 'Safety Harness', 30, 104, current_date - 24),
  ( 'Control Relay', 25, 105, current_date - 22),
  ( 'Seal Kit', 40, 106, current_date - 20),
  ( 'Cooling Fan', 14, 107, current_date - 18),
  ( 'Bearing Set', 18, 108, current_date - 16),
  ( 'Hydraulic Hose', 50, 109, current_date - 14),
  ('Circuit Breaker', 10, 110, current_date - 12),
  ('Welding Wire', 200, 111, current_date - 10),
  ('Cutting Discs', 150, 112, current_date - 8),
  ('Filter Cartridge', 35, 113, current_date - 6),
  ('Lubricant Oil', 80, 114, current_date - 4),
  ('Safety Gloves', 100, 115, current_date - 2);

-- Outsourcers ---------------------------------------------------------------
insert into outsourcers (name, balance, created_at) values
  ( 'Blue Harbor Outsource', 4200.00, now() - interval '45 days'),
  ( 'Rapid Response Services', 3900.00, now() - interval '43 days'),
  ( 'Pacific Maintainers', 3120.00, now() - interval '41 days'),
  ( 'Summit Field Crew', 2750.00, now() - interval '39 days'),
  ( 'Evergreen Rentals', 1980.00, now() - interval '37 days'),
  ( 'Pioneer Partners', 1600.00, now() - interval '35 days'),
  ( 'North Point Ops', 2850.00, now() - interval '33 days'),
  ( 'Harbor Technical', 2500.00, now() - interval '31 days'),
  ( 'Silverline Support', 3100.00, now() - interval '29 days'),
  ('Vertex Workforce', 3300.00, now() - interval '27 days'),
  ('Pacific Crew Services', 2800.00, now() - interval '25 days'),
  ('Coastal Maintenance', 2400.00, now() - interval '23 days'),
  ('Mountain Field Ops', 2600.00, now() - interval '21 days'),
  ('Valley Support Team', 2200.00, now() - interval '19 days'),
  ('Riverside Contractors', 2900.00, now() - interval '17 days');

-- Outsourcer Contacts -------------------------------------------------------
insert into outsourcer_contact_persons (outsourcer_id, name, role, email, phone_number, created_at) values
  ( 1, 'Nina Torres', 'Coordinator', 'nina.torres@blueharbor.com', '+1-555-400-1001', now() - interval '45 days'),
  ( 1, 'Ian Brooks', 'Lead', 'ian.brooks@blueharbor.com', '+1-555-400-1002', now() - interval '43 days'),
  ( 2, 'Kelly Smith', 'Manager', 'kelly.smith@rrs.com', '+1-555-401-1101', now() - interval '42 days'),
  ( 3, 'Victor Huang', 'Supervisor', 'victor.huang@pacmaintainers.com', '+1-555-402-1201', now() - interval '41 days'),
  ( 4, 'Amelia Grant', 'Coordinator', 'amelia.grant@summitfield.com', '+1-555-403-1301', now() - interval '39 days'),
  ( 5, 'Jared Cook', 'Rental Lead', 'jared.cook@evergreenrentals.com', '+1-555-404-1401', now() - interval '37 days'),
  ( 6, 'Melissa Park', 'Dispatch', 'melissa.park@pioneerpartners.com', '+1-555-405-1501', now() - interval '35 days'),
  ( 7, 'Chris Nolan', 'Supervisor', 'chris.nolan@northpointops.com', '+1-555-406-1601', now() - interval '33 days'),
  ( 8, 'Luke Harper', 'Technical Lead', 'luke.harper@harbortech.com', '+1-555-407-1701', now() - interval '31 days'),
  (9, 'Eva Morales', 'Operations', 'eva.morales@silverline.com', '+1-555-408-1801', now() - interval '29 days'),
  (10,'Alex Rivera', 'Field Manager', 'alex.rivera@vertexworkforce.com', '+1-555-409-1901', now() - interval '27 days'),
  (11,'Sophia Chen', 'Coordinator', 'sophia.chen@pacificcrew.com', '+1-555-410-2001', now() - interval '25 days'),
  (12,'Michael Torres', 'Supervisor', 'michael.torres@coastalmaintenance.com', '+1-555-411-2101', now() - interval '23 days'),
  (13,'Emma Wilson', 'Operations Lead', 'emma.wilson@mountainfield.com', '+1-555-412-2201', now() - interval '21 days'),
  (14,'Noah Brown', 'Field Coordinator', 'noah.brown@valleysupport.com', '+1-555-413-2301', now() - interval '19 days');

-- Vehicles ------------------------------------------------------------------
insert into vehicles (plate_number, vehicle_type, examination_date, insurance_date, created_at) values
  ( '34 ERP 2045', 'Flatbed Truck', current_date + interval '30 days', current_date + interval '60 days', now() - interval '50 days'),
  ( '45 NBI 1120', 'Crane Truck', current_date + interval '25 days', current_date + interval '55 days', now() - interval '48 days'),
  ( '56 SUM 3344', 'Delivery Van', current_date + interval '20 days', current_date + interval '50 days', now() - interval '46 days'),
  ( '67 HBR 7788', 'Heavy Hauler', current_date + interval '15 days', current_date + interval '45 days', now() - interval '44 days'),
  ( '78 CST 5566', 'Service Truck', current_date + interval '10 days', current_date + interval '40 days', now() - interval '42 days'),
  ( '89 PNW 9988', 'Pickup Truck', current_date + interval '5 days', current_date + interval '35 days', now() - interval '40 days'),
  ( '90 LHT 4455', 'Flatbed Truck', current_date + interval '35 days', current_date + interval '65 days', now() - interval '38 days'),
  ( '91 NSI 6677', 'Crane Truck', current_date + interval '28 days', current_date + interval '58 days', now() - interval '36 days'),
  ( '92 PAC 8899', 'Delivery Van', current_date + interval '22 days', current_date + interval '52 days', now() - interval '34 days'),
  ('93 CST 1122', 'Heavy Hauler', current_date + interval '18 days', current_date + interval '48 days', now() - interval '32 days'),
  ('94 MTN 3344', 'Service Truck', current_date + interval '12 days', current_date + interval '42 days', now() - interval '30 days'),
  ('95 VLY 5566', 'Pickup Truck', current_date + interval '8 days', current_date + interval '38 days', now() - interval '28 days'),
  ('96 RVR 7788', 'Flatbed Truck', current_date + interval '40 days', current_date + interval '70 days', now() - interval '26 days'),
  ('97 ERP 9900', 'Crane Truck', current_date + interval '32 days', current_date + interval '62 days', now() - interval '24 days'),
  ('98 LOG 2233', 'Delivery Van', current_date + interval '26 days', current_date + interval '56 days', now() - interval '22 days');

-- Transportation Operations -------------------------------------------------
insert into transportation_operations (plate_num, starting_loc, ending_loc, date, notes) values
  ( '34 ERP 2045', 'Seattle Yard', 'Tacoma Dock', current_date - 21, 'Moved drill rig'),
  ( '34 ERP 2045', 'Tacoma Dock', 'Seattle Yard', current_date - 20, 'Returned equipment'),
  ( '45 NBI 1120', 'Portland Depot', 'East Yard', current_date - 19, 'Delivered lift'),
  ( '45 NBI 1120', 'East Yard', 'Portland Depot', current_date - 18, 'Pickup maintenance'),
  ( '56 SUM 3344', 'Eugene Plant', 'Greenfield Plant', current_date - 17, 'Compressor delivery'),
  ( '67 HBR 7788', 'Oakland Port', 'Pier 7', current_date - 16, 'Logistics transfer'),
  ( '78 CST 5566', 'Denver Hub', 'Midtown Hub', current_date - 15, 'Print equipment move'),
  ( '89 PNW 9988', 'Boise Yard', 'Summit Ridge', current_date - 14, 'Sander shipment'),
  ( '90 LHT 4455', 'Spokane Warehouse', 'Prime Lot 12', current_date - 13, 'Grinder delivery'),
  ('91 NSI 6677', 'Salt Lake Yard', 'Energy Field', current_date - 12, 'Belt assembly move'),
  ('92 PAC 8899', 'San Diego Port', 'Pacific Shore', current_date - 11, 'Crane transport'),
  ('93 CST 1122', 'Los Angeles Yard', 'Coastal Bay', current_date - 10, 'Excavator move'),
  ('94 MTN 3344', 'Boulder Depot', 'Mountain Base', current_date - 9, 'Loader delivery'),
  ('95 VLY 5566', 'Phoenix Warehouse', 'Valley Center', current_date - 8, 'Mixer transport'),
  ('96 RVR 7788', 'Reno Yard', 'Riverside Park', current_date - 7, 'Press equipment move');

-- Internal Operations -------------------------------------------------------
insert into internal_operations (customer_name, machine_number, machine_code, working_site_name, start_date, end_date, transportation_operation_id) values
  ( 'Acme Construction', 'MCH-2001', 'DRL-700', 'Downtown Tower', current_date - 30, current_date - 25, 1),
  ( 'Acme Construction', 'MCH-2002', 'CUT-520', 'Harborfront', current_date - 28, current_date - 23, 2),
  ( 'MetroBuild Corp', 'MCH-2003', 'LFT-310', 'East Yard', current_date - 26, current_date - 21, 3),
  ( 'Skyline Structures', 'MCH-2004', 'CMP-450', 'West Campus', current_date - 24, current_date - 19, 4),
  ( 'Evergreen Manufacturing', 'MCH-2005', 'WLD-680', 'Greenfield Plant', current_date - 22, current_date - 17, 5),
  ( 'Harbor Logistics', 'MCH-2006', 'HND-220', 'Pier 7', current_date - 20, current_date - 15, 6),
  ( 'Urban Works', 'MCH-2007', 'PRT-905', 'Midtown Hub', current_date - 18, current_date - 13, 7),
  ( 'Summit Engineering', 'MCH-2008', 'SND-150', 'Summit Ridge', current_date - 16, current_date - 11, 8),
  ( 'Prime Fabrication', 'MCH-2009', 'GRD-330', 'Prime Lot 12', current_date - 14, current_date - 9, 9),
  ('Lighthouse Energy', 'MCH-2010', 'BLT-480', 'Energy Field', current_date - 12, current_date - 7, 10),
  ('Pacific Builders', 'MCH-2011', 'CRN-600', 'Pacific Shore', current_date - 10, current_date - 5, 11),
  ('Coastal Contractors', 'MCH-2012', 'EXC-750', 'Coastal Bay', current_date - 8, current_date - 3, 12),
  ('Mountain View Inc', 'MCH-2013', 'LDR-420', 'Mountain Base', current_date - 6, current_date - 1, 13),
  ('Valley Works LLC', 'MCH-2014', 'MIX-550', 'Valley Center', current_date - 4, current_date + 1, 14),
  ('Riverside Construction', 'MCH-2015', 'PRS-380', 'Riverside Park', current_date - 2, current_date + 3, 15),
  -- Active operations (end_date is null)
  ( 'Acme Construction', 'MCH-2016', 'PLT-850', 'Downtown Tower', current_date - 15, null, null),
  ( 'MetroBuild Corp', 'MCH-2017', 'LFT-320', 'East Yard', current_date - 12, null, null),
  ( 'Skyline Structures', 'MCH-2018', 'CMP-460', 'West Campus', current_date - 10, null, null),
  ( 'Evergreen Manufacturing', 'MCH-2019', 'WLD-690', 'Greenfield Plant', current_date - 8, null, null),
  ( 'Harbor Logistics', 'MCH-2020', 'HND-230', 'Pier 7', current_date - 6, null, null),
  ( 'Urban Works', 'MCH-2021', 'PRT-915', 'Midtown Hub', current_date - 5, null, null),
  ( 'Summit Engineering', 'MCH-2022', 'SND-160', 'Summit Ridge', current_date - 4, null, null),
  ( 'Prime Fabrication', 'MCH-2023', 'GRD-340', 'Prime Lot 12', current_date - 3, null, null),
  ('Lighthouse Energy', 'MCH-2024', 'BLT-490', 'Energy Field', current_date - 2, null, null),
  ('Pacific Builders', 'MCH-2025', 'CRN-610', 'Pacific Shore', current_date - 1, null, null);

-- Outsource Operations ------------------------------------------------------
insert into outsource_operations (customer_name, outsourcer_name, machine_code, working_site_name, start_date, end_date, transportation_operation_id) values
  ( 'Acme Construction', 'Blue Harbor Outsource', 'CUT-520', 'Harborfront', current_date - 29, current_date - 24, 1),
  ( 'MetroBuild Corp', 'Rapid Response Services', 'HND-220', 'East Yard', current_date - 27, current_date - 22, 2),
  ( 'Skyline Structures', 'Pacific Maintainers', 'CMP-450', 'West Campus', current_date - 25, current_date - 20, 3),
  ( 'Evergreen Manufacturing', 'Summit Field Crew', 'WLD-680', 'Greenfield Plant', current_date - 23, current_date - 18, 4),
  ( 'Harbor Logistics', 'Evergreen Rentals', 'LFT-310', 'Pier 7', current_date - 21, current_date - 16, 5),
  ( 'Urban Works', 'Pioneer Partners', 'PRT-905', 'Midtown Hub', current_date - 19, current_date - 14, 6),
  ( 'Summit Engineering', 'North Point Ops', 'SND-150', 'Summit Ridge', current_date - 17, current_date - 12, 7),
  ( 'Prime Fabrication', 'Harbor Technical', 'DRL-700', 'Prime Lot 12', current_date - 15, current_date - 10, 8),
  ( 'Lighthouse Energy', 'Silverline Support', 'BLT-480', 'Energy Field', current_date - 13, current_date - 8, 9),
  ('Northshore Industrial', 'Vertex Workforce', 'GRD-330', 'East Yard', current_date - 11, current_date - 6, 10),
  ('Pacific Builders', 'Pacific Crew Services', 'CRN-600', 'Pacific Shore', current_date - 9, current_date - 4, 11),
  ('Coastal Contractors', 'Coastal Maintenance', 'EXC-750', 'Coastal Bay', current_date - 7, current_date - 2, 12),
  ('Mountain View Inc', 'Mountain Field Ops', 'LDR-420', 'Mountain Base', current_date - 5, current_date, 13),
  ('Valley Works LLC', 'Valley Support Team', 'MIX-550', 'Valley Center', current_date - 3, current_date + 2, 14),
  ('Riverside Construction', 'Riverside Contractors', 'PRS-380', 'Riverside Park', current_date - 1, current_date + 4, 15),
  -- Active operations (end_date is null)
  ( 'Acme Construction', 'Blue Harbor Outsource', 'PLT-860', 'Harborfront', current_date - 14, null, null),
  ( 'MetroBuild Corp', 'Rapid Response Services', 'HND-240', 'East Yard', current_date - 11, null, null),
  ( 'Skyline Structures', 'Pacific Maintainers', 'CMP-470', 'West Campus', current_date - 9, null, null),
  ( 'Evergreen Manufacturing', 'Summit Field Crew', 'WLD-700', 'Greenfield Plant', current_date - 7, null, null),
  ( 'Harbor Logistics', 'Evergreen Rentals', 'LFT-330', 'Pier 7', current_date - 5, null, null),
  ( 'Urban Works', 'Pioneer Partners', 'PRT-925', 'Midtown Hub', current_date - 4, null, null),
  ( 'Summit Engineering', 'North Point Ops', 'SND-170', 'Summit Ridge', current_date - 3, null, null),
  ( 'Prime Fabrication', 'Harbor Technical', 'DRL-710', 'Prime Lot 12', current_date - 2, null, null),
  ('Lighthouse Energy', 'Silverline Support', 'BLT-500', 'Energy Field', current_date - 1, null, null),
  ('Pacific Builders', 'Pacific Crew Services', 'CRN-620', 'Pacific Shore', current_date, null, null);

-- Service Operations --------------------------------------------------------
insert into service_operations (machine_number, type, description, created_at, used_parts) values
  ( 'MCH-2001', 'Preventive', 'Replaced seals and lubricated joints', now() - interval '17 days', 'Seal Kit, Lubricant'),
  ( 'MCH-2002', 'Calibration', 'Laser alignment adjustment', now() - interval '16 days', 'Alignment Tool'),
  ( 'MCH-2003', 'Repair', 'Hydraulic cylinder fix', now() - interval '15 days', 'Cylinder Kit'),
  ( 'MCH-2004', 'Preventive', 'Compressor tune-up', now() - interval '14 days', 'Filter Set'),
  ( 'MCH-2005', 'Repair', 'Welding tip replacement', now() - interval '13 days', 'Welding Tips'),
  ( 'MCH-2006', 'Inspection', 'Handle safety check', now() - interval '12 days', 'Inspection Report'),
  ( 'MCH-2007', 'Preventive', 'Print head cleaning', now() - interval '11 days', 'Cleaning Solvent'),
  ( 'MCH-2008', 'Repair', 'Motor replacement', now() - interval '10 days', 'Motor Assembly'),
  ( 'MCH-2009', 'Calibration', 'Grinding speed calibration', now() - interval '9 days', 'Calibrator'),
  ('MCH-2010', 'Preventive', 'Belt tension check', now() - interval '8 days', 'Tension Gauge'),
  ('MCH-2011', 'Repair', 'Crane cable replacement', now() - interval '7 days', 'Cable Assembly'),
  ('MCH-2012', 'Preventive', 'Excavator hydraulic service', now() - interval '6 days', 'Hydraulic Fluid'),
  ('MCH-2013', 'Inspection', 'Loader tire inspection', now() - interval '5 days', 'Inspection Report'),
  ('MCH-2014', 'Repair', 'Mixer drum repair', now() - interval '4 days', 'Drum Seal Kit'),
  ('MCH-2015', 'Preventive', 'Press maintenance', now() - interval '3 days', 'Lubricant, Filters');

-- Bills ---------------------------------------------------------------------
-- Each bill will have at least 3 bill lines (mix of rental and non-rental)
insert into bills (customer_name, total_amount, lines, bill_date, taxed) values
  ( 'Acme Construction', 15250.00, 'Multiple services and rentals', current_date - 30, true),
  ( 'MetroBuild Corp', 11660.00, 'Equipment and platform rentals', current_date - 29, false),
  ( 'Skyline Structures', 8960.00, 'Parts and platform services', current_date - 28, true),
  ( 'Evergreen Manufacturing', 12720.00, 'Services and vertical platform', current_date - 27, false),
  ( 'Harbor Logistics', 8320.00, 'Parts and forklift rental', current_date - 26, false),
  ( 'Urban Works', 6320.00, 'Services and crane operations', current_date - 25, true),
  ( 'Summit Engineering', 6060.00, 'Survey and basket crane', current_date - 24, false),
  ( 'Prime Fabrication', 9250.00, 'Parts and dock rental', current_date - 23, true),
  ('Lighthouse Energy', 8650.00, 'Energy services and platform', current_date - 22, false),
  ('Northshore Industrial', 9680.00, 'Equipment and services', current_date - 21, false),
  ('Pacific Builders', 8580.00, 'Construction and platform rental', current_date - 20, true),
  ('Coastal Contractors', 8080.00, 'Site prep and terrain platform', current_date - 19, false),
  ('Mountain View Inc', 8400.00, 'Services and vertical platform', current_date - 18, false),
  ('Valley Works LLC', 6925.00, 'Repair work and forklift', current_date - 17, true),
  ('Riverside Construction', 9090.00, 'Parts and crane operations', current_date - 16, true);

-- Bill Lines (Non-Rental) ----------------------------------------------------
-- Most bills are rental-focused, so only 1 non-rental line per bill (or none for some)
insert into bill_lines (bill_line_id, customer_name, type, details, unit_price, amount, total_price, bill_id, operation_id) values
  ( 1001, 'Acme Construction', 'Service', 'Site prep labor', 150.00, 20, 3000.00, 1, 1),
  ( 1002, 'MetroBuild Corp', 'Service', 'Lift service', 300.00, 5, 1500.00, 2, 3),
  ( 1003, 'Skyline Structures', 'Part Selling', 'Custom beam parts', 700.00, 2, 1400.00, 3, 4),
  ( 1004, 'Evergreen Manufacturing', 'Service', 'Hydraulic tune', 850.00, 3, 2550.00, 4, 5),
  ( 1005, 'Harbor Logistics', 'Part Selling', 'Flatbed parts', 420.00, 3, 1260.00, 5, 6),
  ( 1006, 'Urban Works', 'Service', 'Site planning', 190.00, 6, 1140.00, 6, 7),
  ( 1007, 'Summit Engineering', 'Service', 'Geotech survey', 320.00, 4, 1280.00, 7, 8),
  ( 1008, 'Prime Fabrication', 'Part Selling', 'Sheet metal parts', 230.00, 8, 1840.00, 8, 9),
  ( 1009,'Lighthouse Energy', 'Service', 'Energy audit', 440.00, 5, 2200.00, 9, 10),
  (1010,'Pacific Builders', 'Service', 'Construction labor', 180.00, 15, 2700.00, 11, 11),
  (1011,'Coastal Contractors', 'Service', 'Site prep', 160.00, 10, 1600.00, 12, 12),
  (1012,'Mountain View Inc', 'Service', 'Equipment service', 275.00, 6, 1650.00, 13, 13),
  (1013,'Valley Works LLC', 'Service', 'Repair work', 165.00, 8, 1320.00, 14, 14),
  (1014,'Riverside Construction', 'Part Selling', 'Metal parts', 305.00, 5, 1525.00, 15, 15);

-- Bill Lines Rental ---------------------------------------------------------
-- Most bills are rental-focused: 2-3 rental lines per bill
insert into bill_lines_rental (bill_line_id, customer_name, type, details, unit_price, amount, total_price, bill_id, operation_id, start_date, end_date) values
  ( 2001, 'Acme Construction', 'Scissored Platform Rental', 'Platform rental', 450.00, 8, 3600.00, 1, 1, current_date - 30, current_date - 25),
  ( 2002, 'Acme Construction', 'Jointed Platform Rental', 'Joint platform', 380.00, 6, 2280.00, 1, 1, current_date - 28, current_date - 23),
  ( 2003, 'Acme Construction', 'Forklift Rental', 'Forklift service', 350.00, 5, 1750.00, 1, 1, current_date - 26, current_date - 21),
  ( 2004, 'MetroBuild Corp', 'Jointed Platform Rental', 'Joint platform', 380.00, 10, 3800.00, 2, 3, current_date - 28, current_date - 23),
  ( 2005, 'MetroBuild Corp', 'Forklift Rental', 'Forklift service', 350.00, 8, 2800.00, 2, 3, current_date - 26, current_date - 21),
  ( 2006, 'MetroBuild Corp', 'Vertical Platform Rental', 'Vertical lift', 420.00, 6, 2520.00, 2, 3, current_date - 24, current_date - 19),
  ( 2007, 'Skyline Structures', 'Terrain Type Platform Rental', 'Terrain platform', 520.00, 6, 3120.00, 3, 4, current_date - 24, current_date - 19),
  ( 2008, 'Skyline Structures', 'Vertical Platform Rental', 'Vertical lift', 420.00, 7, 2940.00, 3, 4, current_date - 22, current_date - 17),
  ( 2009, 'Evergreen Manufacturing', 'Vertical Platform Rental', 'Vertical lift', 420.00, 8, 3360.00, 4, 5, current_date - 22, current_date - 17),
  (2010, 'Evergreen Manufacturing', 'Crane Rental', 'Crane operation', 680.00, 4, 2720.00, 4, 5, current_date - 20, current_date - 15),
  (2011, 'Evergreen Manufacturing', 'Basket Crane Rental', 'Basket crane', 750.00, 2, 1500.00, 4, 5, current_date - 18, current_date - 13),
  (2012, 'Harbor Logistics', 'Forklift Rental', 'Forklift service', 350.00, 10, 3500.00, 5, 6, current_date - 20, current_date - 15),
  (2013, 'Harbor Logistics', 'Dock Rental', 'Dock space', 280.00, 8, 2240.00, 5, 6, current_date - 18, current_date - 13),
  (2014, 'Urban Works', 'Crane Rental', 'Crane operation', 680.00, 4, 2720.00, 6, 7, current_date - 18, current_date - 13),
  (2015, 'Urban Works', 'Dock Rental', 'Dock space', 280.00, 6, 1680.00, 6, 7, current_date - 16, current_date - 11),
  (2016, 'Summit Engineering', 'Basket Crane Rental', 'Basket crane', 750.00, 3, 2250.00, 7, 8, current_date - 16, current_date - 11),
  (2017, 'Summit Engineering', 'Scissored Platform Rental', 'Platform service', 450.00, 4, 1800.00, 7, 8, current_date - 14, current_date - 9),
  (2018, 'Prime Fabrication', 'Dock Rental', 'Dock space', 280.00, 12, 3360.00, 8, 9, current_date - 14, current_date - 9),
  (2019, 'Prime Fabrication', 'Crane Rental', 'Crane operation', 680.00, 3, 2040.00, 8, 9, current_date - 12, current_date - 7),
  (2020,'Lighthouse Energy', 'Scissored Platform Rental', 'Platform service', 450.00, 7, 3150.00, 9, 10, current_date - 12, current_date - 7),
  (2021,'Lighthouse Energy', 'Basket Crane Rental', 'Basket crane', 750.00, 3, 2250.00, 9, 10, current_date - 10, current_date - 5),
  (2022,'Pacific Builders', 'Jointed Platform Rental', 'Joint platform', 380.00, 8, 3040.00, 11, 11, current_date - 10, current_date - 5),
  (2023,'Pacific Builders', 'Terrain Type Platform Rental', 'Terrain platform', 520.00, 5, 2600.00, 11, 11, current_date - 8, current_date - 3),
  (2024,'Coastal Contractors', 'Terrain Type Platform Rental', 'Terrain platform', 520.00, 6, 3120.00, 12, 12, current_date - 7, current_date - 2),
  (2025,'Coastal Contractors', 'Forklift Rental', 'Forklift service', 350.00, 5, 1750.00, 12, 12, current_date - 5, current_date),
  (2026,'Mountain View Inc', 'Vertical Platform Rental', 'Vertical lift', 420.00, 7, 2940.00, 13, 13, current_date - 6, current_date - 1),
  (2027,'Mountain View Inc', 'Forklift Rental', 'Forklift service', 350.00, 6, 2100.00, 13, 13, current_date - 4, current_date + 1),
  (2028,'Mountain View Inc', 'Crane Rental', 'Crane operation', 680.00, 2, 1360.00, 13, 13, current_date - 2, current_date + 3),
  (2029,'Valley Works LLC', 'Forklift Rental', 'Forklift service', 350.00, 9, 3150.00, 14, 14, current_date - 3, current_date + 2),
  (2030,'Valley Works LLC', 'Dock Rental', 'Dock space', 280.00, 6, 1680.00, 14, 14, current_date - 1, current_date + 4),
  (2031,'Riverside Construction', 'Crane Rental', 'Crane operation', 680.00, 4, 2720.00, 15, 15, current_date - 1, current_date + 4),
  (2032,'Riverside Construction', 'Basket Crane Rental', 'Basket crane', 750.00, 3, 2250.00, 15, 15, current_date + 1, current_date + 6);

-- Invoices ------------------------------------------------------------------
insert into invoices (supplier_outsourcer_name, total_amount, lines, bill_date, taxed) values
  ( 'Global Steel Ltd', 9200.00, 'Steel supply and delivery', current_date - 28, false),
  ( 'IronWorks Outsourcing', 6100.00, 'Welding works', current_date - 27, true),
  ( 'Precision Tools Co', 3150.00, 'Tool consignment', current_date - 26, false),
  ( 'Atlas Components', 4520.00, 'Hydraulic components', current_date - 25, true),
  ( 'Northwind Materials', 5050.00, 'Concrete mix', current_date - 24, false),
  ( 'Cascade Logistics', 2780.00, 'Freight services', current_date - 23, false),
  ( 'Summit Aggregates', 3320.00, 'Gravel supply', current_date - 22, false),
  ( 'Harbor Freightways', 1980.00, 'Port handling charges', current_date - 21, false),
  ( 'Vertex Electronics', 3640.00, 'Control circuits', current_date - 20, true),
  ('Apex Hydraulics', 4270.00, 'Hydraulic kits', current_date - 19, true),
  ('Pacific Steel Works', 5800.00, 'Steel plates', current_date - 18, false),
  ('Coastal Supply Co', 4200.00, 'Sand aggregate', current_date - 17, false),
  ('Mountain Tools Inc', 3450.00, 'Tool kits', current_date - 16, false),
  ('Valley Components', 3850.00, 'Electrical panels', current_date - 15, true),
  ('Riverside Materials', 4100.00, 'Material supply', current_date - 14, false);

-- Invoice Lines -------------------------------------------------------------
insert into invoice_lines (bill_line_id, supplier_outsourcer_name, type, details, unit_price, amount, total_price, bill_id, operation_id) values
  ( 3001, 'Global Steel Ltd', 'Part Selling', 'Steel bars', 58.50, 120, 7020.00, 1, 1),
  ( 3002, 'IronWorks Outsourcing', 'Service', 'Welding labor', 150.00, 20, 3000.00, 2, 2),
  ( 3003, 'Precision Tools Co', 'Part Selling', 'Drill bits', 8.75, 250, 2187.50, 3, 3),
  ( 3004, 'Atlas Components', 'Part Selling', 'Hydraulic valves', 42.60, 90, 3834.00, 4, 4),
  ( 3005, 'Northwind Materials', 'Part Selling', 'Concrete mix', 22.10, 140, 3094.00, 5, 5),
  ( 3006, 'Cascade Logistics', 'Service', 'Flatbed delivery', 185.00, 10, 1850.00, 6, 6),
  ( 3007, 'Summit Aggregates', 'Part Selling', 'Gravel', 12.35, 200, 2470.00, 7, 7),
  ( 3008, 'Harbor Freightways', 'Service', 'Port handling', 95.00, 18, 1710.00, 8, 8),
  ( 3009, 'Vertex Electronics', 'Part Selling', 'Circuits', 68.20, 65, 4433.00, 9, 9),
  (3010,'Apex Hydraulics', 'Part Selling', 'Seal kits', 42.00, 80, 3360.00, 10, 10),
  (3011,'Pacific Steel Works', 'Part Selling', 'Steel plates', 95.50, 50, 4775.00, 11, 11),
  (3012,'Coastal Supply Co', 'Part Selling', 'Sand aggregate', 18.75, 150, 2812.50, 12, 12),
  (3013,'Mountain Tools Inc', 'Part Selling', 'Tool kits', 35.00, 80, 2800.00, 13, 13),
  (3014,'Valley Components', 'Part Selling', 'Electrical panels', 88.00, 40, 3520.00, 14, 14),
  (3015,'Riverside Materials', 'Part Selling', 'Building materials', 82.00, 50, 4100.00, 15, 15);

insert into invoice_lines_rental (bill_line_id, supplier_outsourcer_name, type, details, unit_price, amount, total_price, bill_id, operation_id, start_date, end_date) values
  ( 4001, 'Global Steel Ltd', 'Scissored Platform Rental', 'Platform rental', 450.00, 5, 2250.00, 1, 1, current_date - 21, current_date - 20),
  ( 4002, 'IronWorks Outsourcing', 'Jointed Platform Rental', 'Joint platform', 380.00, 7, 2660.00, 2, 2, current_date - 19, current_date - 18),
  ( 4003, 'Precision Tools Co', 'Terrain Type Platform Rental', 'Terrain platform', 520.00, 4, 2080.00, 3, 3, current_date - 18, current_date - 17),
  ( 4004, 'Atlas Components', 'Vertical Platform Rental', 'Vertical lift', 420.00, 6, 2520.00, 4, 4, current_date - 17, current_date - 16),
  ( 4005, 'Northwind Materials', 'Forklift Rental', 'Forklift service', 350.00, 8, 2800.00, 5, 5, current_date - 15, current_date - 14),
  ( 4006, 'Cascade Logistics', 'Crane Rental', 'Crane operation', 680.00, 3, 2040.00, 6, 6, current_date - 12, current_date - 11),
  ( 4007, 'Summit Aggregates', 'Basket Crane Rental', 'Basket crane', 750.00, 2, 1500.00, 7, 7, current_date - 11, current_date - 10),
  ( 4008, 'Harbor Freightways', 'Dock Rental', 'Dock space', 280.00, 10, 2800.00, 8, 8, current_date - 10, current_date - 9),
  ( 4009, 'Vertex Electronics', 'Scissored Platform Rental', 'Platform service', 450.00, 5, 2250.00, 9, 9, current_date - 9, current_date - 8),
  (4010,'Apex Hydraulics', 'Jointed Platform Rental', 'Joint platform', 380.00, 6, 2280.00, 10, 10, current_date - 8, current_date - 7),
  (4011,'Pacific Steel Works', 'Terrain Type Platform Rental', 'Terrain platform', 520.00, 4, 2080.00, 11, 11, current_date - 7, current_date - 6),
  (4012,'Coastal Supply Co', 'Vertical Platform Rental', 'Vertical lift', 420.00, 5, 2100.00, 12, 12, current_date - 6, current_date - 5),
  (4013,'Mountain Tools Inc', 'Forklift Rental', 'Forklift service', 350.00, 7, 2450.00, 13, 13, current_date - 5, current_date - 4),
  (4014,'Valley Components', 'Crane Rental', 'Crane operation', 680.00, 3, 2040.00, 14, 14, current_date - 4, current_date - 3),
  (4015,'Riverside Materials', 'Basket Crane Rental', 'Basket crane', 750.00, 2, 1500.00, 15, 15, current_date - 3, current_date - 2);

-- Collections (Check) -------------------------------------------------------
insert into collections_check (customer_name, check_date, amount, collection_date, account_name, notes) values
  ( 'Acme Construction', current_date - 19, 5000.00, current_date - 18, 'Corporate Account', 'January instalment'),
  ( 'MetroBuild Corp', current_date - 18, 3200.00, current_date - 17, 'Corporate Account', 'Phase I settlement'),
  ( 'Skyline Structures', current_date - 17, 2800.00, current_date - 16, 'Receivables', 'Progress draw'),
  ( 'Evergreen Manufacturing', current_date - 16, 4500.00, current_date - 15, 'Corporate Account', 'Maintenance retainer'),
  ( 'Harbor Logistics', current_date - 15, 2200.00, current_date - 14, 'Receivables', 'Transport fees'),
  ( 'Urban Works', current_date - 14, 1800.00, current_date - 13, 'Corporate Account', 'Consulting'),
  ( 'Summit Engineering', current_date - 13, 3600.00, current_date - 12, 'Corporate Account', 'Development draw'),
  ( 'Prime Fabrication', current_date - 12, 3000.00, current_date - 11, 'Receivables', 'Fabrication'),
  ( 'Lighthouse Energy', current_date - 11, 4100.00, current_date - 10, 'Corporate Account', 'Energy audit'),
  ('Northshore Industrial', current_date - 10, 2750.00, current_date - 9, 'Receivables', 'Maintenance contract'),
  ('Pacific Builders', current_date - 9, 5100.00, current_date - 8, 'Corporate Account', 'Construction payment'),
  ('Coastal Contractors', current_date - 8, 3575.00, current_date - 7, 'Receivables', 'Site prep payment'),
  ('Mountain View Inc', current_date - 7, 4125.00, current_date - 6, 'Corporate Account', 'Equipment lease'),
  ('Valley Works LLC', current_date - 6, 2475.00, current_date - 5, 'Receivables', 'Maintenance payment'),
  ('Riverside Construction', current_date - 5, 3050.00, current_date - 4, 'Corporate Account', 'Fabrication payment');

-- Collections (Credit Card) -------------------------------------------------
insert into collection_credit_card (customer_name, transaction_date, amount, payment_to, credit_card_fee, notes) values
  ( 'Acme Construction', current_date - 19, 2100.00, 'ERP Services', 31.50, 'Expedited payment'),
  ( 'MetroBuild Corp', current_date - 18, 1850.00, 'ERP Services', 27.75, 'Milestone release'),
  ( 'Skyline Structures', current_date - 17, 1620.00, 'ERP Services', 24.30, 'Partial payment'),
  ( 'Evergreen Manufacturing', current_date - 16, 1980.00, 'ERP Services', 29.70, 'Tooling costs'),
  ( 'Harbor Logistics', current_date - 15, 1320.00, 'ERP Services', 19.80, 'Freight surcharge'),
  ( 'Urban Works', current_date - 14, 1480.00, 'ERP Services', 22.20, 'Site review'),
  ( 'Summit Engineering', current_date - 13, 1760.00, 'ERP Services', 26.40, 'Planning meeting'),
  ( 'Prime Fabrication', current_date - 12, 1530.00, 'ERP Services', 22.95, 'Fabrication adjust'),
  ( 'Lighthouse Energy', current_date - 11, 1840.00, 'ERP Services', 27.60, 'Energy report'),
  ('Northshore Industrial', current_date - 10, 1690.00, 'ERP Services', 25.35, 'Maintenance visit'),
  ('Pacific Builders', current_date - 9, 2040.00, 'ERP Services', 30.60, 'Construction milestone'),
  ('Coastal Contractors', current_date - 8, 1785.00, 'ERP Services', 26.78, 'Site prep milestone'),
  ('Mountain View Inc', current_date - 7, 2062.50, 'ERP Services', 30.94, 'Equipment payment'),
  ('Valley Works LLC', current_date - 6, 1237.50, 'ERP Services', 18.56, 'Maintenance payment'),
  ('Riverside Construction', current_date - 5, 1525.00, 'ERP Services', 22.88, 'Fabrication payment');

-- Collections (Cash) --------------------------------------------------------
insert into collection_cash (customer_name, transaction_date, amount, account_name, notes) values
  ( 'Acme Construction', current_date - 18, 650.00, 'On-site register', 'Fuel reimbursement'),
  ( 'MetroBuild Corp', current_date - 17, 720.00, 'On-site register', 'Tool rental'),
  ( 'Skyline Structures', current_date - 16, 580.00, 'On-site register', 'Safety gear'),
  ( 'Evergreen Manufacturing', current_date - 15, 910.00, 'On-site register', 'Maintenance supplies'),
  ( 'Harbor Logistics', current_date - 14, 430.00, 'On-site register', 'Dock fees'),
  ( 'Urban Works', current_date - 13, 610.00, 'On-site register', 'Permit fees'),
  ( 'Summit Engineering', current_date - 12, 780.00, 'On-site register', 'Survey costs'),
  ( 'Prime Fabrication', current_date - 11, 520.00, 'On-site register', 'Material samples'),
  ( 'Lighthouse Energy', current_date - 10, 690.00, 'On-site register', 'Field test'),
  ('Northshore Industrial', current_date - 9, 470.00, 'On-site register', 'Travel reimbursement'),
  ('Pacific Builders', current_date - 8, 1020.00, 'On-site register', 'Construction materials'),
  ('Coastal Contractors', current_date - 7, 715.00, 'On-site register', 'Site prep supplies'),
  ('Mountain View Inc', current_date - 6, 825.00, 'On-site register', 'Equipment accessories'),
  ('Valley Works LLC', current_date - 5, 495.00, 'On-site register', 'Maintenance parts'),
  ('Riverside Construction', current_date - 4, 610.00, 'On-site register', 'Fabrication materials');

-- Payments (Check) ----------------------------------------------------------
insert into payments_check (collector_name, check_date, amount, collection_date, account_name, notes) values
  ( 'Global Steel Ltd', current_date - 18, 4100.00, current_date - 17, 'Accounts Payable', 'Steel invoice'),
  ( 'IronWorks Outsourcing', current_date - 17, 2850.00, current_date - 16, 'Accounts Payable', 'Welding works'),
  ( 'Precision Tools Co', current_date - 16, 1980.00, current_date - 15, 'Accounts Payable', 'Tool consignment'),
  ( 'Atlas Components', current_date - 15, 2560.00, current_date - 14, 'Accounts Payable', 'Hydraulic parts'),
  ( 'Northwind Materials', current_date - 14, 2760.00, current_date - 13, 'Accounts Payable', 'Concrete delivery'),
  ( 'Cascade Logistics', current_date - 13, 1420.00, current_date - 12, 'Accounts Payable', 'Freight charges'),
  ( 'Summit Aggregates', current_date - 12, 1880.00, current_date - 11, 'Accounts Payable', 'Gravel supply'),
  ( 'Harbor Freightways', current_date - 11, 970.00, current_date - 10, 'Accounts Payable', 'Port handling'),
  ( 'Vertex Electronics', current_date - 10, 2240.00, current_date - 9, 'Accounts Payable', 'Control circuits'),
  ('Apex Hydraulics', current_date - 9, 2380.00, current_date - 8, 'Accounts Payable', 'Hydraulic kits'),
  ('Pacific Steel Works', current_date - 8, 2900.00, current_date - 7, 'Accounts Payable', 'Steel plates'),
  ('Coastal Supply Co', current_date - 7, 2100.00, current_date - 6, 'Accounts Payable', 'Sand aggregate'),
  ('Mountain Tools Inc', current_date - 6, 1725.00, current_date - 5, 'Accounts Payable', 'Tool kits'),
  ('Valley Components', current_date - 5, 1925.00, current_date - 4, 'Accounts Payable', 'Electrical panels'),
  ('Riverside Materials', current_date - 4, 2050.00, current_date - 3, 'Accounts Payable', 'Material supply');

-- Payments (Credit Card) ----------------------------------------------------
insert into payment_credit_card (collector_name, transaction_date, amount, payment_from, credit_card_fee, notes) values
  ( 'Cascade Logistics', current_date - 17, 1180.00, 'ERP Logistics', 17.70, 'Emergency haul'),
  ( 'Summit Aggregates', current_date - 16, 980.00, 'ERP Logistics', 14.70, 'Weekend delivery'),
  ( 'Harbor Freightways', current_date - 15, 760.00, 'ERP Logistics', 11.40, 'Port charges'),
  ( 'Vertex Electronics', current_date - 14, 1280.00, 'ERP Logistics', 19.20, 'Express shipment'),
  ( 'Apex Hydraulics', current_date - 13, 1380.00, 'ERP Logistics', 20.70, 'Rush order'),
  ( 'Global Steel Ltd', current_date - 12, 1420.00, 'ERP Logistics', 21.30, 'Overnight delivery'),
  ( 'IronWorks Outsourcing', current_date - 11, 1160.00, 'ERP Logistics', 17.40, 'Weekend service'),
  ( 'Precision Tools Co', current_date - 10, 980.00, 'ERP Logistics', 14.70, 'Tool rush'),
  ( 'Atlas Components', current_date - 9, 1120.00, 'ERP Logistics', 16.80, 'Component resupply'),
  ('Northwind Materials', current_date - 8, 1260.00, 'ERP Logistics', 18.90, 'Bulk order'),
  ('Pacific Steel Works', current_date - 7, 1450.00, 'ERP Logistics', 21.75, 'Steel rush order'),
  ('Coastal Supply Co', current_date - 6, 1050.00, 'ERP Logistics', 15.75, 'Sand delivery'),
  ('Mountain Tools Inc', current_date - 5, 862.50, 'ERP Logistics', 12.94, 'Tool emergency'),
  ('Valley Components', current_date - 4, 962.50, 'ERP Logistics', 14.44, 'Panel rush'),
  ('Riverside Materials', current_date - 3, 1025.00, 'ERP Logistics', 15.38, 'Material rush');

-- Payments (Cash) -----------------------------------------------------------
insert into payments_cash (collector_name, transaction_date, amount, account_name, notes) values
  ( 'Global Steel Ltd', current_date - 16, 450.00, 'Petty Cash', 'Dock fees reimbursement'),
  ( 'IronWorks Outsourcing', current_date - 15, 380.00, 'Petty Cash', 'Consumables'),
  ( 'Precision Tools Co', current_date - 14, 290.00, 'Petty Cash', 'Tool handling'),
  ( 'Atlas Components', current_date - 13, 340.00, 'Petty Cash', 'Courier'),
  ( 'Northwind Materials', current_date - 12, 310.00, 'Petty Cash', 'Sample delivery'),
  ( 'Cascade Logistics', current_date - 11, 260.00, 'Petty Cash', 'Fuel surcharge'),
  ( 'Summit Aggregates', current_date - 10, 280.00, 'Petty Cash', 'Weigh station'),
  ( 'Harbor Freightways', current_date - 9, 230.00, 'Petty Cash', 'Port paperwork'),
  ( 'Vertex Electronics', current_date - 8, 320.00, 'Petty Cash', 'Expedite fee'),
  ('Apex Hydraulics', current_date - 7, 290.00, 'Petty Cash', 'Packaging'),
  ('Pacific Steel Works', current_date - 6, 290.00, 'Petty Cash', 'Steel handling'),
  ('Coastal Supply Co', current_date - 5, 210.00, 'Petty Cash', 'Sand handling'),
  ('Mountain Tools Inc', current_date - 4, 172.50, 'Petty Cash', 'Tool packaging'),
  ('Valley Components', current_date - 3, 192.50, 'Petty Cash', 'Panel handling'),
  ('Riverside Materials', current_date - 2, 205.00, 'Petty Cash', 'Material handling');

-- Accounts ------------------------------------------------------------------
insert into accounts (type, account_name, balance, created_at) values
  ( 'Asset', 'Main Operating Account', 52300.00, now() - interval '65 days'),
  ( 'Asset', 'Receivables', 18750.00, now() - interval '63 days'),
  ( 'Liability', 'Accounts Payable', -14200.00, now() - interval '61 days'),
  ( 'Asset', 'Petty Cash', 1250.00, now() - interval '59 days'),
  ( 'Asset', 'Equipment Reserve', 34600.00, now() - interval '57 days'),
  ( 'Liability', 'Credit Card Payable', -3150.00, now() - interval '55 days'),
  ( 'Equity', 'Retained Earnings', 48200.00, now() - interval '53 days'),
  ( 'Revenue', 'Services Revenue', 78500.00, now() - interval '51 days'),
  ( 'Expense', 'Maintenance Expense', -18600.00, now() - interval '49 days'),
  ('Revenue', 'Logistics Revenue', 22350.00, now() - interval '47 days'),
  ('Asset', 'Investment Account', 45600.00, now() - interval '45 days'),
  ('Liability', 'Short-term Loan', -12500.00, now() - interval '43 days'),
  ('Revenue', 'Equipment Rental', 31200.00, now() - interval '41 days'),
  ('Expense', 'Transportation Expense', -15200.00, now() - interval '39 days'),
  ('Asset', 'Savings Account', 28900.00, now() - interval '37 days');

-- Reset identity sequences --------------------------------------------------
select setval('customers_id_seq', 15, true);
select setval('contact_persons_id_seq', 15, true);
select setval('working_sites_id_seq', 15, true);
select setval('suppliers_id_seq', 15, true);
select setval('supplier_contact_persons_id_seq', 15, true);
select setval('supplies_id_seq', 15, true);
select setval('machinery_id_seq', 15, true);
select setval('machinery_specs_id_seq', 15, true);
select setval('inventory_id_seq', 15, true);
select setval('outsourcers_id_seq', 15, true);
select setval('outsourcer_contact_persons_id_seq', 15, true);
select setval('vehicles_id_seq', 15, true);
select setval('transportation_operations_transportation_op_id_seq', 15, true);
select setval('internal_operations_id_seq', 15, true);
select setval('outsource_operations_id_seq', 15, true);
select setval('service_operations_id_seq', 15, true);
select setval('bills_id_seq', 15, true);
select setval('bill_lines_id_seq', 15, true);
select setval('bill_lines_rental_id_seq', 15, true);
select setval('invoices_id_seq', 15, true);
select setval('invoice_lines_id_seq', 15, true);
select setval('invoice_lines_rental_id_seq', 15, true);
select setval('collections_check_collection_check_id_seq', 15, true);
select setval('collection_credit_card_collection_credit_card_id_seq', 15, true);
select setval('collection_cash_collection_cash_id_seq', 15, true);
select setval('payments_check_payment_check_id_seq', 15, true);
select setval('payment_credit_card_payment_credit_card_id_seq', 15, true);
select setval('payments_cash_payment_cash_id_seq', 15, true);
select setval('accounts_account_id_seq', 15, true);
