package com.bloodbank.service;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class CompatibilityService {
    private static final Map<String, Set<String>> DONOR_TO_RECIPIENT = Map.of(
        "O-", Set.of("O-","O+","A-","A+","B-","B+","AB-","AB+"),
        "O+", Set.of("O+","A+","B+","AB+"),
        "A-", Set.of("A-","A+","AB-","AB+"),
        "A+", Set.of("A+","AB+"),
        "B-", Set.of("B-","B+","AB-","AB+"),
        "B+", Set.of("B+","AB+"),
        "AB-", Set.of("AB-","AB+"),
        "AB+", Set.of("AB+")
    );

    public boolean canDonate(String donor, String recipient) {
        return DONOR_TO_RECIPIENT.getOrDefault(donor.toUpperCase(), Set.of()).contains(recipient.toUpperCase());
    }

    public List<String> compatibleDonorGroups(String recipient) {
        return DONOR_TO_RECIPIENT.entrySet().stream()
            .filter(e -> e.getValue().contains(recipient.toUpperCase()))
            .map(Map.Entry::getKey).toList();
    }
}
