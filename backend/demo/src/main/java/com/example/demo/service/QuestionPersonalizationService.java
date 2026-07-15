package com.example.demo.service;

import com.example.demo.dto.response.PersonalizedQuestionResponse;

import java.util.List;

public interface QuestionPersonalizationService {

    List<PersonalizedQuestionResponse> getPersonalizedQuestions(String userEmail);
}
