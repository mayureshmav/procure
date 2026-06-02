package com.procurement.model;

import com.procurement.model.enums.ProtocolType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sftp_integrations")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SftpIntegration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false, unique = true)
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(name = "protocol_type", nullable = false, length = 10)
    @Builder.Default
    private ProtocolType protocolType = ProtocolType.SFTP;

    // ── Connection ────────────────────────────────────────────────────────────
    @Column(length = 255)
    private String host;

    @Builder.Default
    private int port = 22;

    @Column(length = 100)
    private String username;

    @Column(name = "password_encrypted", columnDefinition = "CLOB")
    private String passwordEncrypted;

    @Column(name = "private_key_path", columnDefinition = "CLOB")
    private String privateKeyPath;

    @Column(name = "private_key_passphrase", columnDefinition = "CLOB")
    private String privateKeyPassphrase;

    @Column(name = "strict_host_key_checking")
    @Builder.Default
    private boolean strictHostKeyChecking = true;

    // ── File handling ─────────────────────────────────────────────────────────
    @Column(name = "remote_directory", length = 500)
    @Builder.Default
    private String remoteDirectory = "/";

    @Column(name = "archive_directory", length = 500)
    private String archiveDirectory;

    @Column(name = "file_pattern", length = 255)
    @Builder.Default
    private String filePattern = "*.csv";

    @Column(name = "processed_file_suffix", length = 50)
    private String processedFileSuffix;

    // ── FTP extras ────────────────────────────────────────────────────────────
    @Column(name = "ftp_mode", length = 10)
    private String ftpMode;

    @Column(name = "ftp_use_tls")
    @Builder.Default
    private boolean ftpUseTls = false;

    // ── AS2 ───────────────────────────────────────────────────────────────────
    @Column(name = "as2_from", length = 255)
    private String as2From;

    @Column(name = "as2_to", length = 255)
    private String as2To;

    @Column(name = "as2_partner_url", length = 500)
    private String as2PartnerUrl;

    @Column(name = "as2_certificate", columnDefinition = "CLOB")
    private String as2Certificate;

    @Column(name = "as2_private_key", columnDefinition = "CLOB")
    private String as2PrivateKey;

    @Column(name = "as2_mdn_url", length = 500)
    private String as2MdnUrl;

    @Column(name = "as2_subject", length = 255)
    private String as2Subject;

    @Column(name = "as2_encryption_alg", length = 20)
    private String as2EncryptionAlg;

    @Column(name = "as2_signing_alg", length = 20)
    private String as2SigningAlg;

    @Column(name = "as2_mdn_mode", length = 10)
    private String as2MdnMode;

    @Column(name = "as2_compression_enabled")
    @Builder.Default
    private boolean as2CompressionEnabled = false;

    // ── AS4 ───────────────────────────────────────────────────────────────────
    @Column(name = "as4_party_id", length = 255)
    private String as4PartyId;

    @Column(name = "as4_party_id_type", length = 255)
    private String as4PartyIdType;

    @Column(name = "as4_partner_party_id", length = 255)
    private String as4PartnerPartyId;

    @Column(name = "as4_endpoint_url", length = 500)
    private String as4EndpointUrl;

    @Column(name = "as4_certificate", columnDefinition = "CLOB")
    private String as4Certificate;

    @Column(name = "as4_private_key", columnDefinition = "CLOB")
    private String as4PrivateKey;

    @Column(name = "as4_pmode_id", length = 255)
    private String as4PModeId;

    @Column(name = "as4_service", length = 255)
    private String as4Service;

    @Column(name = "as4_action", length = 255)
    private String as4Action;

    @Column(name = "as4_security_mode", length = 20)
    private String as4SecurityMode;

    // ── Status ────────────────────────────────────────────────────────────────
    @Builder.Default
    private boolean active = true;

    @Column(name = "last_polled_at")
    private LocalDateTime lastPolledAt;

    @Builder.Default
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
