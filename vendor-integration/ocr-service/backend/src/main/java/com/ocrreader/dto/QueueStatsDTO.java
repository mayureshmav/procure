package com.ocrreader.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class QueueStatsDTO {
    private long total;
    private long pending;
    private long processing;
    private long successful;
    private long failed;
    private long duplicate;
}
