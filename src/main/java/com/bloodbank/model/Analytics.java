package com.bloodbank.model;

import java.util.List;
import java.util.Map;

public record Analytics(
        List<Map<String,Object>> requestsByGroup,
        List<Map<String,Object>> fulfilment,
        List<Map<String,Object>> topCities,
        List<Map<String,Object>> wasteByGroup
) {}
