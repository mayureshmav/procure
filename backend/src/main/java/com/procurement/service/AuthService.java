package com.procurement.service;

import com.procurement.dto.AuthRequest;
import com.procurement.dto.AuthResponse;
import com.procurement.model.User;
import com.procurement.repository.UserRepository;
import com.procurement.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Value("${jwt.expiration-ms:86400000}")
    private long expirationMs;

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        UserDetails ud = userDetailsService.loadUserByUsername(request.getUsername());
        String accessMatrix = user.getPosition() != null ? user.getPosition().getAccessMatrix() : "{}";
        Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role",       user.getRole().name());
        claims.put("vendorId",   user.getVendor()   != null ? user.getVendor().getId()             : null);
        claims.put("customerId", user.getCustomer() != null ? user.getCustomer().getCustomerId()    : null);
        claims.put("companyId",  user.getCompany()  != null ? user.getCompany().getCompanyId()      : null);
        claims.put("positionId", user.getPosition() != null ? user.getPosition().getPositionId()    : null);
        claims.put("accessMatrix", accessMatrix);

        String accessToken  = jwtUtil.generateToken(ud, claims);
        String refreshToken = jwtUtil.generateRefreshToken(ud);

        return buildResponse(accessToken, refreshToken, user, accessMatrix);
    }

    public AuthResponse refresh(String refreshToken) {
        String username = jwtUtil.extractUsername(refreshToken);
        UserDetails ud = userDetailsService.loadUserByUsername(username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String accessMatrix = user.getPosition() != null ? user.getPosition().getAccessMatrix() : "{}";
        Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role",       user.getRole().name());
        claims.put("vendorId",   user.getVendor()   != null ? user.getVendor().getId()             : null);
        claims.put("customerId", user.getCustomer() != null ? user.getCustomer().getCustomerId()    : null);
        claims.put("companyId",  user.getCompany()  != null ? user.getCompany().getCompanyId()      : null);
        claims.put("positionId", user.getPosition() != null ? user.getPosition().getPositionId()    : null);
        claims.put("accessMatrix", accessMatrix);
        String newAccessToken = jwtUtil.generateToken(ud, claims);

        return buildResponse(newAccessToken, refreshToken, user, accessMatrix);
    }

    private AuthResponse buildResponse(String accessToken, String refreshToken, User user, String accessMatrix) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(expirationMs / 1000)
                .username(user.getUsername())
                .role(user.getRole().name())
                .vendorId(user.getVendor()    != null ? user.getVendor().getId()                      : null)
                .vendorName(user.getVendor()  != null ? user.getVendor().getName()                    : null)
                .customerId(user.getCustomer() != null ? user.getCustomer().getCustomerId()           : null)
                .customerName(user.getCustomer() != null ? user.getCustomer().getCustomerName()       : null)
                .companyId(user.getCompany()  != null ? user.getCompany().getCompanyId()              : null)
                .companyName(user.getCompany() != null ? user.getCompany().getCompanyName()           : null)
                .positionId(user.getPosition() != null ? user.getPosition().getPositionId()           : null)
                .positionName(user.getPosition() != null ? user.getPosition().getPositionName()       : null)
                .personId(user.getPerson()    != null ? user.getPerson().getPersonId()                : null)
                .accessMatrix(accessMatrix)
                .build();
    }
}
