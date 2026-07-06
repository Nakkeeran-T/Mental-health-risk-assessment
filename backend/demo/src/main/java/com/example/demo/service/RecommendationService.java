package com.example.demo.service;

import com.example.demo.dto.response.RecommendationResponse;

import java.util.List;

public interface RecommendationService {

    List<RecommendationResponse> getRecommendationsByAssessmentId(Long assessmentId);

    List<RecommendationResponse> generateRecommendations(Long assessmentId);
}
