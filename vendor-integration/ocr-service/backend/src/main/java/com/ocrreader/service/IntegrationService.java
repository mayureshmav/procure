package com.ocrreader.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import com.ocrreader.model.IntegrationConfig;
import com.ocrreader.repository.IntegrationConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationService {

    private final IntegrationConfigRepository configRepository;
    private final ObjectMapper objectMapper;

    public Map<String, Object> getConfig(String key) {
        return configRepository.findById(key)
                .map(cfg -> {
                    try {
                        return objectMapper.readValue(cfg.getConfigJson(), new TypeReference<Map<String, Object>>() {});
                    } catch (Exception e) {
                        return Collections.<String, Object>emptyMap();
                    }
                })
                .orElse(Collections.emptyMap());
    }

    public void saveConfig(String key, Map<String, Object> config) {
        try {
            String json = objectMapper.writeValueAsString(config);
            IntegrationConfig cfg = IntegrationConfig.builder()
                    .configKey(key)
                    .configJson(json)
                    .build();
            configRepository.save(cfg);
            log.info("Saved integration config: {}", key);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save integration config: " + key, e);
        }
    }

    public Map<String, Object> testSftpConnection(Map<String, Object> config) {
        String host = (String) config.get("host");
        int port = Integer.parseInt(String.valueOf(config.getOrDefault("port", 22)));
        String username = (String) config.get("username");
        String password = (String) config.get("password");

        Map<String, Object> result = new HashMap<>();
        try {
            JSch jsch = new JSch();
            Session session = jsch.getSession(username, host, port);
            session.setPassword(password);
            Properties props = new Properties();
            props.put("StrictHostKeyChecking", "no");
            session.setConfig(props);
            session.setTimeout(5000);
            session.connect();
            session.disconnect();
            result.put("success", true);
            result.put("message", "Connection successful! SFTP server is reachable.");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Connection failed: " + e.getMessage());
        }
        return result;
    }
}
