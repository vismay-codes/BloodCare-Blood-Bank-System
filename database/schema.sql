CREATE DATABASE IF NOT EXISTS blood_bank_db;
USE blood_bank_db;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS match_logs;
DROP TABLE IF EXISTS donation_history;
DROP TABLE IF EXISTS blood_requests;
DROP TABLE IF EXISTS blood_units;
DROP TABLE IF EXISTS donors;
DROP TABLE IF EXISTS hospitals;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE hospitals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    contact VARCHAR(30) NOT NULL
);

CREATE TABLE donors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    blood_group VARCHAR(3) NOT NULL,
    city VARCHAR(80) NOT NULL,
    phone VARCHAR(20),
    last_donation_date DATE NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_donor_group_city (blood_group, city),
    INDEX idx_donor_available (available, last_donation_date)
);

CREATE TABLE blood_units (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    blood_group VARCHAR(3) NOT NULL,
    quantity INT NOT NULL,
    hospital_name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('AVAILABLE','ISSUED','EXPIRED') NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_stock_group_status_expiry (blood_group,status,expiry_date)
);

CREATE TABLE blood_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    patient_name VARCHAR(120) NOT NULL,
    blood_group VARCHAR(3) NOT NULL,
    units_needed INT NOT NULL,
    urgency ENUM('NORMAL','URGENT','CRITICAL') NOT NULL DEFAULT 'NORMAL',
    hospital_name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    status ENUM('PENDING','PARTIAL','FULFILLED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_request_queue (status,urgency,created_at)
);

CREATE TABLE donation_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    donor_id BIGINT NOT NULL,
    donation_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_donation_donor FOREIGN KEY (donor_id) REFERENCES donors(id)
);

CREATE TABLE match_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id BIGINT NOT NULL,
    source ENUM('STOCK','DONOR') NOT NULL,
    source_id VARCHAR(40) NOT NULL,
    units INT NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_match_request FOREIGN KEY (request_id) REFERENCES blood_requests(id)
);

INSERT INTO hospitals(name,city,contact) VALUES
('Lifeline Multispeciality Hospital','Nagpur','0712-4001001'),
('Orange City Medical Centre','Nagpur','0712-4001002'),
('Central Care Hospital','Pune','020-4001003'),
('City General Blood Centre','Mumbai','022-4001004');

INSERT INTO donors(full_name,blood_group,city,phone,last_donation_date,available) VALUES
('Aarav Sharma','O-','Nagpur','9000000001',DATE_SUB(CURDATE(),INTERVAL 140 DAY),1),
('Priya Patil','O+','Nagpur','9000000002',DATE_SUB(CURDATE(),INTERVAL 110 DAY),1),
('Rohan Deshmukh','A+','Nagpur','9000000003',DATE_SUB(CURDATE(),INTERVAL 70 DAY),1),
('Sneha Joshi','B+','Pune','9000000004',DATE_SUB(CURDATE(),INTERVAL 210 DAY),1),
('Aditya Kulkarni','AB+','Nagpur','9000000005',DATE_SUB(CURDATE(),INTERVAL 130 DAY),1),
('Meera Singh','A-','Nagpur','9000000006',DATE_SUB(CURDATE(),INTERVAL 180 DAY),1),
('Vivek Rao','B-','Mumbai','9000000007',DATE_SUB(CURDATE(),INTERVAL 95 DAY),1),
('Ananya Jain','O-','Pune','9000000008',DATE_SUB(CURDATE(),INTERVAL 80 DAY),1),
('Kabir More','O+','Nagpur','9000000009',NULL,1),
('Isha Verma','AB-','Nagpur','9000000010',DATE_SUB(CURDATE(),INTERVAL 300 DAY),1),
('Neel Shah','A+','Mumbai','9000000011',DATE_SUB(CURDATE(),INTERVAL 150 DAY),1),
('Tanya Gupta','B+','Nagpur','9000000012',DATE_SUB(CURDATE(),INTERVAL 120 DAY),1);

INSERT INTO blood_units(blood_group,quantity,hospital_name,city,collection_date,expiry_date,status) VALUES
('O-',5,'Lifeline Multispeciality Hospital','Nagpur',DATE_SUB(CURDATE(),INTERVAL 20 DAY),DATE_ADD(CURDATE(),INTERVAL 2 DAY),'AVAILABLE'),
('O+',8,'Orange City Medical Centre','Nagpur',DATE_SUB(CURDATE(),INTERVAL 15 DAY),DATE_ADD(CURDATE(),INTERVAL 8 DAY),'AVAILABLE'),
('A+',6,'Lifeline Multispeciality Hospital','Nagpur',DATE_SUB(CURDATE(),INTERVAL 10 DAY),DATE_ADD(CURDATE(),INTERVAL 3 DAY),'AVAILABLE'),
('B+',4,'Central Care Hospital','Pune',DATE_SUB(CURDATE(),INTERVAL 18 DAY),DATE_ADD(CURDATE(),INTERVAL 5 DAY),'AVAILABLE'),
('AB+',3,'City General Blood Centre','Mumbai',DATE_SUB(CURDATE(),INTERVAL 12 DAY),DATE_ADD(CURDATE(),INTERVAL 10 DAY),'AVAILABLE'),
('A-',2,'Lifeline Multispeciality Hospital','Nagpur',DATE_SUB(CURDATE(),INTERVAL 25 DAY),DATE_SUB(CURDATE(),INTERVAL 2 DAY),'EXPIRED'),
('O+',3,'Central Care Hospital','Pune',DATE_SUB(CURDATE(),INTERVAL 28 DAY),DATE_SUB(CURDATE(),INTERVAL 1 DAY),'EXPIRED');

INSERT INTO blood_requests(patient_name,blood_group,units_needed,urgency,hospital_name,city,status) VALUES
('Demo Critical Patient','O-',2,'CRITICAL','Lifeline Multispeciality Hospital','Nagpur','PENDING'),
('Demo Urgent Patient','A+',3,'URGENT','Orange City Medical Centre','Nagpur','PENDING'),
('Demo Normal Patient','B+',1,'NORMAL','Central Care Hospital','Pune','PENDING'),
('Demo Fulfilled Patient','AB+',1,'URGENT','City General Blood Centre','Mumbai','FULFILLED');

CREATE OR REPLACE VIEW v_stock_summary AS
SELECT blood_group, SUM(quantity) units
FROM blood_units WHERE status='AVAILABLE'
GROUP BY blood_group;

CREATE OR REPLACE VIEW v_request_summary AS
SELECT status, COUNT(*) total_requests
FROM blood_requests GROUP BY status;
