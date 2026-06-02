package com.procurement.service.catalog;

import com.opencsv.CSVReader;
import com.procurement.model.enums.FileFormatType;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Path;
import java.util.*;

@Service
@Slf4j
public class FileParserService {

    public List<Map<String, String>> parse(Path filePath, FileFormatType format) throws Exception {
        return switch (format) {
            case CSV  -> parseCsv(filePath);
            case XLSX -> parseXlsx(filePath);
            case JSON -> parseJson(filePath);
            default   -> throw new UnsupportedOperationException("Format not yet supported: " + format);
        };
    }

    private List<Map<String, String>> parseCsv(Path path) throws Exception {
        List<Map<String, String>> rows = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new FileReader(path.toFile()))) {
            String[] headers = reader.readNext();
            if (headers == null) return rows;
            String[] line;
            while ((line = reader.readNext()) != null) {
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.length && i < line.length; i++) {
                    row.put(headers[i].trim().toLowerCase().replace(' ', '_'), line[i].trim());
                }
                rows.add(row);
            }
        }
        return rows;
    }

    private List<Map<String, String>> parseXlsx(Path path) throws Exception {
        List<Map<String, String>> rows = new ArrayList<>();
        try (Workbook wb = new XSSFWorkbook(path.toFile())) {
            Sheet sheet = wb.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return rows;
            List<String> headers = new ArrayList<>();
            for (Cell c : headerRow) {
                headers.add(c.getStringCellValue().trim().toLowerCase().replace(' ', '_'));
            }
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                Map<String, String> data = new LinkedHashMap<>();
                for (int c = 0; c < headers.size(); c++) {
                    Cell cell = row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    data.put(headers.get(c), cell == null ? "" : getCellValue(cell));
                }
                rows.add(data);
            }
        }
        return rows;
    }

    private List<Map<String, String>> parseJson(Path path) throws Exception {
        // Simple JSON array parser using Jackson ObjectMapper
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        List<Map<String, Object>> raw = mapper.readValue(path.toFile(),
                mapper.getTypeFactory().constructCollectionType(List.class, Map.class));
        List<Map<String, String>> rows = new ArrayList<>();
        for (Map<String, Object> r : raw) {
            Map<String, String> row = new LinkedHashMap<>();
            r.forEach((k, v) -> row.put(k.toLowerCase().replace(' ', '_'), v == null ? "" : v.toString()));
            rows.add(row);
        }
        return rows;
    }

    private String getCellValue(Cell cell) {
        return switch (cell.getCellType()) {
            case NUMERIC -> String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default      -> cell.getStringCellValue();
        };
    }
}
