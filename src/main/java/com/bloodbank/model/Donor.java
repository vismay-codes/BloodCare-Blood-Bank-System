package com.bloodbank.model;

import java.time.LocalDate;

public record Donor(
        Long id, String fullName, String bloodGroup, String city,
        String phone, LocalDate lastDonationDate, boolean available
) {}
