package com.bloodbank.model;

import java.time.LocalDate;

public record BloodUnit(
        Long id, String bloodGroup, int quantity, String hospitalName,
        String city, LocalDate collectionDate, LocalDate expiryDate, String status
) {}
