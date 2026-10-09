package com.bloodbank.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CompatibilityServiceTest {
    private final CompatibilityService service = new CompatibilityService();

    @Test void oNegativeCanDonateToAll() {
        assertTrue(service.canDonate("O-", "AB+"));
        assertTrue(service.canDonate("O-", "O-"));
    }

    @Test void abPositiveCannotDonateToOPositive() {
        assertFalse(service.canDonate("AB+", "O+"));
    }

    @Test void aPositiveCompatibleGroups() {
        assertTrue(service.compatibleDonorGroups("A+").contains("A+"));
        assertTrue(service.compatibleDonorGroups("A+").contains("O-"));
        assertFalse(service.compatibleDonorGroups("A+").contains("B+"));
    }
}
