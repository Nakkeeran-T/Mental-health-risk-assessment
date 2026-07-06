package com.example.demo.service;

import com.example.demo.dto.request.AssessmentRequest;
import com.example.demo.dto.response.AssessmentResponse;

import java.util.List;

public interface AssessmentService {

    AssessmentResponse submitAssessment(String userEmail, AssessmentRequest request);

    AssessmentResponse getAssessmentById(Long id, String userEmail);

    List<AssessmentResponse> getAssessmentHistory(String userEmail);

    List<AssessmentResponse> getAllAssessments();
}
