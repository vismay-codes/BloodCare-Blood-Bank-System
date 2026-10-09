package com.bloodbank.model;

public record MatchResult(
        Long requestId, String source, String sourceName, String bloodGroup,
        int units, String message
) {}
