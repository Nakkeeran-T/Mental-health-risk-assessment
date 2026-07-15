package com.example.demo.util;

import java.time.LocalDate;
import java.time.Period;

public final class AgeCalculator {

    private AgeCalculator() {
    }

    public static int calculateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            throw new IllegalArgumentException("Date of birth is required");
        }
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
}
