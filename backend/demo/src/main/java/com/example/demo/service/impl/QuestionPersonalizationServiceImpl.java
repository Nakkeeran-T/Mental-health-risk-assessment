package com.example.demo.service.impl;

import com.example.demo.dto.response.PersonalizedQuestionResponse;
import com.example.demo.entity.Question;
import com.example.demo.entity.QuestionVariation;
import com.example.demo.entity.User;
import com.example.demo.enums.AgeGroup;
import com.example.demo.enums.QuestionCategory;
import com.example.demo.exception.BadRequestException;
import com.example.demo.repository.QuestionRepository;
import com.example.demo.repository.QuestionVariationRepository;
import com.example.demo.service.QuestionPersonalizationService;
import com.example.demo.service.UserService;
import com.example.demo.util.AgeCalculator;
import com.example.demo.util.AgeGroupUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionPersonalizationServiceImpl implements QuestionPersonalizationService {

    private final UserService userService;
    private final QuestionRepository questionRepository;
    private final QuestionVariationRepository questionVariationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PersonalizedQuestionResponse> getPersonalizedQuestions(String userEmail) {
        User user = userService.getCurrentUser(userEmail);
        AgeGroup ageGroup = determineAgeGroup(user);

        List<Question> masterQuestions = questionRepository.findByActiveTrueOrderByIdAsc();
        Map<Long, List<QuestionVariation>> variationsByQuestionId = questionVariationRepository
                .findByAgeGroupAndActiveTrueAndQuestionActiveTrue(ageGroup)
                .stream()
                .collect(Collectors.groupingBy(variation -> variation.getQuestion().getId()));

        Map<QuestionCategory, Integer> categorySequence = new EnumMap<>(QuestionCategory.class);
        Set<String> selectedVariationTexts = new HashSet<>();
        List<PersonalizedQuestionResponse> responses = new ArrayList<>();

        for (int index = 0; index < masterQuestions.size(); index++) {
            Question question = masterQuestions.get(index);
            int orderNumber = index + 1;
            String masterQuestionCode = buildMasterQuestionCode(question, categorySequence);

            QuestionVariation selectedVariation = selectRandomVariation(
                    variationsByQuestionId.get(question.getId()),
                    selectedVariationTexts
            );
            if (selectedVariation == null) {
                responses.add(PersonalizedQuestionResponse.fromQuestion(question, masterQuestionCode, orderNumber));
            } else {
                selectedVariationTexts.add(selectedVariation.getVariationText());
                responses.add(PersonalizedQuestionResponse.fromVariation(selectedVariation, masterQuestionCode, orderNumber));
            }
        }

        return responses;
    }

    private AgeGroup determineAgeGroup(User user) {
        if (user.getAgeGroup() != null) {
            return user.getAgeGroup();
        }

        if (user.getDateOfBirth() == null) {
            throw new BadRequestException("Date of birth is required to personalize assessment questions");
        }

        int age = AgeCalculator.calculateAge(user.getDateOfBirth());
        return AgeGroupUtils.determineAgeGroup(age);
    }

    private QuestionVariation selectRandomVariation(List<QuestionVariation> variations, Set<String> selectedVariationTexts) {
        if (variations == null || variations.isEmpty()) {
            return null;
        }

        List<QuestionVariation> unusedVariations = variations.stream()
                .filter(variation -> !selectedVariationTexts.contains(variation.getVariationText()))
                .toList();
        List<QuestionVariation> candidateVariations = unusedVariations.isEmpty() ? variations : unusedVariations;

        int selectedIndex = ThreadLocalRandom.current().nextInt(candidateVariations.size());
        return candidateVariations.get(selectedIndex);
    }

    private String buildMasterQuestionCode(Question question, Map<QuestionCategory, Integer> categorySequence) {
        int nextNumber = categorySequence.getOrDefault(question.getCategory(), 0) + 1;
        categorySequence.put(question.getCategory(), nextNumber);
        return categoryPrefix(question.getCategory()) + "_" + String.format("%02d", nextNumber);
    }

    private String categoryPrefix(QuestionCategory category) {
        Map<QuestionCategory, String> prefixes = new HashMap<>();
        prefixes.put(QuestionCategory.DEPRESSION, "DEP");
        prefixes.put(QuestionCategory.ANXIETY, "GAD");
        prefixes.put(QuestionCategory.STRESS, "STR");
        prefixes.put(QuestionCategory.SLEEP, "SLP");
        prefixes.put(QuestionCategory.SOCIAL, "SOC");
        prefixes.put(QuestionCategory.GENERAL, "GEN");
        return prefixes.getOrDefault(category, category.name().substring(0, 3));
    }
}
