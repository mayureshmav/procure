package com.procurement.tax;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * HTTP client that calls the Tax Engine service.
 *
 * The Tax Engine runs separately (default: http://localhost:8080).
 * It authenticates via JWT; we use a pre-configured service-account token.
 *
 * If the Tax Engine is unreachable, calculate() returns a zeroed-out
 * TaxResult so the PO flow is never blocked by tax service downtime.
 */
@Component
public class TaxEngineClient {

    private static final Logger log = LoggerFactory.getLogger(TaxEngineClient.class);

    private final String baseUrl;
    private final String serviceToken;
    private final HttpClient http;
    private final ObjectMapper mapper;

    public TaxEngineClient(
            @Value("${taxengine.url:http://localhost:8080}") String baseUrl,
            @Value("${taxengine.service-token:}") String serviceToken) {
        this.baseUrl = baseUrl;
        this.serviceToken = serviceToken;
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    /**
     * Call POST /api/v1/tax/calculate and return the response.
     * Returns an empty TaxResult (zero tax) on any error so callers are never blocked.
     */
    public TaxResult calculate(TaxRequest request) {
        try {
            String body = mapper.writeValueAsString(request);

            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/v1/tax/calculate"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json");

            if (serviceToken != null && !serviceToken.isBlank()) {
                builder.header("Authorization", "Bearer " + serviceToken);
            }

            HttpRequest req = builder.POST(HttpRequest.BodyPublishers.ofString(body)).build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() == 200) {
                return mapper.readValue(resp.body(), TaxResult.class);
            }
            log.warn("Tax Engine returned HTTP {}: {}", resp.statusCode(), resp.body());
        } catch (Exception e) {
            log.warn("Tax Engine unreachable ({}): {}. Defaulting to zero tax.", baseUrl, e.getMessage());
        }
        return TaxResult.zero(request.transactionId());
    }

    // ── DTOs (mirrors Tax Engine contract) ────────────────────────────────────

    public record TaxRequest(
            String transactionId,
            LocalDate transactionDate,
            String currency,
            String placeOfSupply,
            String transactionType,
            PartyDto supplier,
            PartyDto customer,
            List<LineItemDto> lineItems
    ) {}

    public record PartyDto(
            String country,
            String region,
            String taxId,
            boolean registered,
            String exemptionCode,
            String customerType
    ) {}

    public record LineItemDto(
            String id,
            String productCode,
            String category,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal discount,
            String taxClass,
            String exemptionCode
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TaxResult(
            String transactionId,
            Instant calculatedAt,
            String baseCurrency,
            List<LineResultDto> lineResults,
            TotalsDto totals,
            String auditId
    ) {
        public static TaxResult zero(String txId) {
            return new TaxResult(txId, Instant.now(), null, List.of(),
                    new TotalsDto(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO), null);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LineResultDto(
            String lineId,
            BigDecimal netAmount,
            BigDecimal taxAmount,
            BigDecimal grossAmount,
            List<ComponentDto> components
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ComponentDto(String name, BigDecimal rate, BigDecimal amount) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TotalsDto(BigDecimal totalNet, BigDecimal totalTax, BigDecimal totalGross) {}
}
