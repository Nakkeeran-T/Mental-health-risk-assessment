package com.example.demo.dto.response;

import com.example.demo.entity.JournalEntry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntryResponse {

    private Long id;
    private String title;
    private String content;
    private Integer moodTag;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static JournalEntryResponse from(JournalEntry entry) {
        return JournalEntryResponse.builder()
                .id(entry.getId())
                .title(entry.getTitle())
                .content(entry.getContent())
                .moodTag(entry.getMoodTag())
                .category(entry.getCategory())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }
}
