package com.bloodbank.model;

import java.time.LocalDateTime;

public record BloodRequest(
        Long id, String patientName, String bloodGroup, int unitsNeeded,
        String urgency, String hospitalName, String city, String status,
        LocalDateTime createdAt
) {}
