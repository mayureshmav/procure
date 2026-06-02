package com.ocrreader.model;

public enum DocumentStatus {
    PENDING,      // Received but not yet processed (or missing mandatory fields)
    PROCESSING,   // Currently being processed by OCR engine
    SUCCESSFUL,   // All mandatory fields extracted successfully
    FAILED,       // OCR processing failed or critical error
    DUPLICATE     // Detected as a duplicate of an existing document
}
