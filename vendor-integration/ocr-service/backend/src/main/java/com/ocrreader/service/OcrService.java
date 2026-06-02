package com.ocrreader.service;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Slf4j
public class OcrService {

    @Value("${ocr.tesseract.data-path}")
    private String tessDataPath;

    @Value("${ocr.tesseract.default-language:eng}")
    private String defaultLanguage;

    @Value("${ocr.tesseract.ocr-engine-mode:3}")
    private int ocrEngineMode;

    /**
     * Extract raw text from a file (PDF or image).
     * Returns the concatenated text from all pages.
     */
    public String extractText(File file, String language) throws IOException, TesseractException {
        if (file == null || !file.exists()) {
            throw new IllegalArgumentException("Source file does not exist: " + file);
        }
        String lang = (language != null && !language.isBlank()) ? language : defaultLanguage;
        String fileName = file.getName().toLowerCase();

        if (fileName.endsWith(".pdf")) {
            return extractFromPdf(file, lang);
        } else {
            return extractFromImage(file, lang);
        }
    }

    private String extractFromPdf(File pdfFile, String language) throws IOException, TesseractException {
        // Create an isolated temp directory for this document's page images
        Path tempDir = Files.createTempDirectory("ocr-pdf-");
        List<String> pageTexts = new ArrayList<>();

        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFRenderer renderer = new PDFRenderer(document);
            int totalPages = document.getNumberOfPages();
            log.debug("Rendering {} pages from PDF: {}", totalPages, pdfFile.getName());

            for (int page = 0; page < totalPages; page++) {
                Path pageImagePath = tempDir.resolve("page_" + page + ".png");
                File pageImage = pageImagePath.toFile();
                try {
                    BufferedImage image = renderer.renderImageWithDPI(page, 300, ImageType.RGB);
                    ImageIO.write(image, "PNG", pageImage);
                    String pageText = runTesseract(pageImage, language);
                    pageTexts.add(pageText);
                    log.debug("OCR completed for page {}/{}", page + 1, totalPages);
                } finally {
                    // Delete each page image immediately — don't wait until loop ends
                    deleteSilently(pageImage);
                }
            }
        } finally {
            // Clean up the temp directory (should be empty by now, but defensive cleanup)
            deleteDirectorySilently(tempDir);
        }

        return String.join("\n\n--- PAGE BREAK ---\n\n", pageTexts);
    }

    private String extractFromImage(File imageFile, String language) throws TesseractException {
        return runTesseract(imageFile, language);
    }

    private String runTesseract(File imageFile, String language) throws TesseractException {
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(tessDataPath);
        tesseract.setLanguage(language);
        tesseract.setOcrEngineMode(ocrEngineMode);
        tesseract.setPageSegMode(3);  // PSM 3 = Fully automatic page segmentation
        return tesseract.doOCR(imageFile);
    }

    /**
     * Confidence score based on printable ASCII character ratio.
     * 0 = completely garbled, 100 = all printable ASCII.
     * For production: use Tesseract's word-level confidence API instead.
     */
    public int calculateConfidence(String rawText) {
        if (rawText == null || rawText.isBlank()) return 0;
        long total = rawText.length();
        long printable = rawText.chars().filter(c -> c >= 32 && c < 127).count();
        return (int) ((printable * 100.0) / total);
    }

    private void deleteSilently(File file) {
        try {
            if (file != null && file.exists()) file.delete();
        } catch (Exception e) {
            log.warn("Could not delete temp file {}: {}", file, e.getMessage());
        }
    }

    private void deleteDirectorySilently(Path dir) {
        try {
            if (dir != null && Files.exists(dir)) {
                // Walk bottom-up to delete files before their parent directory
                Files.walk(dir)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
            }
        } catch (Exception e) {
            log.warn("Could not delete temp directory {}: {}", dir, e.getMessage());
        }
    }
}
