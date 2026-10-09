package com.bloodbank.model;

public record DashboardStats(
        int totalDonors, int availableDonors, int activeRequests,
        int criticalRequests, int totalStockUnits, int expiringUnits,
        double fulfilmentRate, int wastedUnits
) {}
