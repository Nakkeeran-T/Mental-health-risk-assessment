package com.example.demo.service;

import com.example.demo.dto.response.ReportResponse;

import java.util.List;

public interface ReportService {

    ReportResponse generateReport(Long assessmentId, String userEmail);

    ReportResponse getReportById(Long id);

    ReportResponse getReportByAssessmentId(Long assessmentId, String userEmail);

    List<ReportResponse> getReportsByUser(String userEmail);
}
