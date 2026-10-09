package com.bloodbank.repository;

import com.bloodbank.model.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public class BloodBankRepository {
    private final JdbcTemplate jdbc;

    public BloodBankRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }

    public List<Donor> findDonors(String bloodGroup, String city, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
            SELECT id, full_name, blood_group, city, phone, last_donation_date, available
            FROM donors WHERE 1=1
        """);
        var args = new java.util.ArrayList<Object>();
        if (bloodGroup != null && !bloodGroup.isBlank()) { sql.append(" AND blood_group=?"); args.add(bloodGroup); }
        if (city != null && !city.isBlank()) { sql.append(" AND LOWER(city) LIKE LOWER(?)"); args.add("%"+city+"%"); }
        sql.append(" ORDER BY available DESC, full_name LIMIT ? OFFSET ?");
        args.add(limit); args.add(offset);
        return jdbc.query(sql.toString(), (rs,n)->new Donor(
            rs.getLong("id"), rs.getString("full_name"), rs.getString("blood_group"),
            rs.getString("city"), rs.getString("phone"),
            rs.getDate("last_donation_date") == null ? null : rs.getDate("last_donation_date").toLocalDate(),
            rs.getBoolean("available")), args.toArray());
    }

    public int donorCount(String bloodGroup, String city) {
        StringBuilder sql=new StringBuilder("SELECT COUNT(*) FROM donors WHERE 1=1");
        var args=new java.util.ArrayList<Object>();
        if (bloodGroup != null && !bloodGroup.isBlank()) {sql.append(" AND blood_group=?");args.add(bloodGroup);}
        if (city != null && !city.isBlank()) {sql.append(" AND LOWER(city) LIKE LOWER(?)");args.add("%"+city+"%");}
        return count(sql.toString(), args.toArray());
    }

    public long addDonor(Donor d) {
        jdbc.update("INSERT INTO donors(full_name,blood_group,city,phone,last_donation_date,available) VALUES(?,?,?,?,?,?)",
                d.fullName(),d.bloodGroup(),d.city(),d.phone(),d.lastDonationDate(),d.available());
        return jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    public List<Donor> eligibleDonors(String bloodGroup, String city) {
        String sql = """
            SELECT id,full_name,blood_group,city,phone,last_donation_date,available
            FROM donors
            WHERE available=1
              AND (? IS NULL OR city=?)
              AND DATEDIFF(CURDATE(), COALESCE(last_donation_date,'1900-01-01')) >= 90
            ORDER BY last_donation_date ASC, full_name ASC
        """;
        return jdbc.query(sql,(rs,n)->new Donor(rs.getLong("id"),rs.getString("full_name"),rs.getString("blood_group"),
            rs.getString("city"),rs.getString("phone"),
            rs.getDate("last_donation_date")==null?null:rs.getDate("last_donation_date").toLocalDate(),
            rs.getBoolean("available")),city,city);
    }

    public List<BloodUnit> expiring(int days) {
        return jdbc.query("""
            SELECT id,blood_group,quantity,hospital_name,city,collection_date,expiry_date,status
            FROM blood_units
            WHERE status='AVAILABLE' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ORDER BY expiry_date ASC
        """,(rs,n)->new BloodUnit(rs.getLong("id"),rs.getString("blood_group"),rs.getInt("quantity"),
            rs.getString("hospital_name"),rs.getString("city"),rs.getDate("collection_date").toLocalDate(),
            rs.getDate("expiry_date").toLocalDate(),rs.getString("status")),days);
    }

    public void markExpired() { jdbc.update("UPDATE blood_units SET status='EXPIRED' WHERE status='AVAILABLE' AND expiry_date < CURDATE()"); }
    public void refreshDonorEligibility() {
        jdbc.update("UPDATE donors SET available=1 WHERE available=0 AND last_donation_date IS NOT NULL AND DATEDIFF(CURDATE(),last_donation_date)>=90");
    }

    public int totalStock(String group) {
        return count("SELECT COALESCE(SUM(quantity),0) FROM blood_units WHERE status='AVAILABLE' AND expiry_date>=CURDATE() AND blood_group=?", group);
    }

    public List<BloodUnit> availableUnits(String group, String city) {
        String sql="SELECT id,blood_group,quantity,hospital_name,city,collection_date,expiry_date,status FROM blood_units WHERE status='AVAILABLE' AND expiry_date>=CURDATE() AND blood_group=? AND (?='' OR city=?) ORDER BY expiry_date ASC";
        return jdbc.query(sql,(rs,n)->new BloodUnit(rs.getLong("id"),rs.getString("blood_group"),rs.getInt("quantity"),rs.getString("hospital_name"),rs.getString("city"),rs.getDate("collection_date").toLocalDate(),rs.getDate("expiry_date").toLocalDate(),rs.getString("status")),group,city,city);
    }

    public long addUnit(BloodUnit u) {
        jdbc.update("INSERT INTO blood_units(blood_group,quantity,hospital_name,city,collection_date,expiry_date,status) VALUES(?,?,?,?,?,?,?)",
            u.bloodGroup(),u.quantity(),u.hospitalName(),u.city(),u.collectionDate(),u.expiryDate(),"AVAILABLE");
        return jdbc.queryForObject("SELECT LAST_INSERT_ID()",Long.class);
    }

    public boolean issueUnit(long id, int quantity) {
        int changed=jdbc.update("UPDATE blood_units SET quantity=quantity-? WHERE id=? AND status='AVAILABLE' AND expiry_date>=CURDATE() AND quantity>=?",quantity,id,quantity);
        jdbc.update("UPDATE blood_units SET status='ISSUED' WHERE id=? AND quantity=0",id);
        return changed>0;
    }

    public long createRequest(BloodRequest r) {
        jdbc.update("""
INSERT INTO blood_requests(patient_name,blood_group,units_needed,urgency,hospital_name,city,status,created_at)
                       VALUES(?,?,?,?,?,?, 'PENDING', NOW())""",
                r.patientName(),r.bloodGroup(),r.unitsNeeded(),r.urgency(),r.hospitalName(),r.city());
        return jdbc.queryForObject("SELECT LAST_INSERT_ID()",Long.class);
    }

    public BloodRequest getRequest(long id) {
        return jdbc.queryForObject("""
SELECT id,patient_name,blood_group,units_needed,urgency,hospital_name,city,status,created_at
            FROM blood_requests WHERE id=?""",(rs,n)->new BloodRequest(rs.getLong("id"),rs.getString("patient_name"),
            rs.getString("blood_group"),rs.getInt("units_needed"),rs.getString("urgency"),rs.getString("hospital_name"),
            rs.getString("city"),rs.getString("status"),rs.getTimestamp("created_at").toLocalDateTime()),id);
    }

    public List<BloodRequest> pendingRequests() {
        return jdbc.query("""
SELECT id,patient_name,blood_group,units_needed,urgency,hospital_name,city,status,created_at
            FROM blood_requests WHERE status IN ('PENDING','PARTIAL') ORDER BY created_at""",(rs,n)->new BloodRequest(rs.getLong("id"),
            rs.getString("patient_name"),rs.getString("blood_group"),rs.getInt("units_needed"),rs.getString("urgency"),
            rs.getString("hospital_name"),rs.getString("city"),rs.getString("status"),rs.getTimestamp("created_at").toLocalDateTime()));
    }

    public void updateRequestStatus(long id,String status) { jdbc.update("UPDATE blood_requests SET status=? WHERE id=?",status,id); }

    public void logMatch(long requestId,String source,String sourceId,int units,String note) {
        jdbc.update("INSERT INTO match_logs(request_id,source,source_id,units,note) VALUES(?,?,?,?,?)",requestId,source,sourceId,units,note);
    }

    public DashboardStats dashboard() {
        int totalDonors=count("SELECT COUNT(*) FROM donors");
        int available=count("SELECT COUNT(*) FROM donors WHERE available=1");
        int active=count("SELECT COUNT(*) FROM blood_requests WHERE status IN ('PENDING','PARTIAL')");
        int critical=count("SELECT COUNT(*) FROM blood_requests WHERE status IN ('PENDING','PARTIAL') AND urgency='CRITICAL'");
        int stock=count("SELECT COALESCE(SUM(quantity),0) FROM blood_units WHERE status='AVAILABLE'");
        int exp=count("SELECT COALESCE(SUM(quantity),0) FROM blood_units WHERE status='AVAILABLE' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 3 DAY)");
        int fulfilled=count("SELECT COUNT(*) FROM blood_requests WHERE status='FULFILLED'");
        int all=count("SELECT COUNT(*) FROM blood_requests WHERE status <> 'CANCELLED'");
        double rate=all==0?0:(fulfilled*100.0/all);
        int waste=count("SELECT COALESCE(SUM(quantity),0) FROM blood_units WHERE status='EXPIRED'");
        return new DashboardStats(totalDonors,available,active,critical,stock,exp,rate,waste);
    }

    public Analytics analytics() {
        return new Analytics(
            jdbc.queryForList("SELECT blood_group AS bloodGroup, COUNT(*) AS requests FROM blood_requests GROUP BY blood_group ORDER BY requests DESC"),
            jdbc.queryForList("SELECT status, COUNT(*) AS total FROM blood_requests GROUP BY status ORDER BY total DESC"),
            jdbc.queryForList("SELECT city, COUNT(*) AS donors FROM donors GROUP BY city ORDER BY donors DESC LIMIT 8"),
            jdbc.queryForList("SELECT blood_group AS bloodGroup, COALESCE(SUM(quantity),0) AS wastedUnits FROM blood_units WHERE status='EXPIRED' GROUP BY blood_group ORDER BY wastedUnits DESC")
        );
    }

    public List<Map<String,Object>> stockSummary() {
        return jdbc.queryForList("""
SELECT blood_group AS bloodGroup, COALESCE(SUM(quantity),0) AS units
            FROM blood_units WHERE status='AVAILABLE' GROUP BY blood_group ORDER BY blood_group""");
    }

    public void recordDonation(long donorId, LocalDate date) {
        jdbc.update("UPDATE donors SET last_donation_date=?, available=0 WHERE id=?",date,donorId);
        jdbc.update("INSERT INTO donation_history(donor_id,donation_date) VALUES(?,?)",donorId,date);
    }
}

