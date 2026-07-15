package com.example.demo.util;

import com.example.demo.enums.AgeGroup;

public final class AgeGroupUtils {

    private AgeGroupUtils() {
    }

    public static AgeGroup determineAgeGroup(int age) {
        if (age < 13) {
            throw new IllegalArgumentException("User must be at least 13 years old");
        }
        if (age <= 17) {
            return AgeGroup.ADOLESCENT;
        }
        if (age <= 25) {
            return AgeGroup.YOUNG_ADULT;
        }
        if (age <= 40) {
            return AgeGroup.ADULT;
        }
        if (age <= 60) {
            return AgeGroup.MIDDLE_AGED;
        }
        return AgeGroup.OLDER_ADULT;
    }
}
