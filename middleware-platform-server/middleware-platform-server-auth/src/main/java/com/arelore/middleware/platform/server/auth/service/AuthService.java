package com.arelore.middleware.platform.server.auth.service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.arelore.middleware.platform.server.auth.config.AuthProperties;
import com.arelore.middleware.platform.server.auth.model.UserSession;

@Service
public class AuthService {

    public static final String ROLE_SUPER_ADMIN = "SUPER_ADMIN";

    private final AuthProperties authProperties;
    private final Map<String, UserSession> sessions = new ConcurrentHashMap<>();

    public AuthService(AuthProperties authProperties) {
        this.authProperties = authProperties;
    }

    public Optional<UserSession> login(String username, String password) {
        AuthProperties.SuperAdmin admin = authProperties.getSuperAdmin();
        if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) {
            return Optional.empty();
        }
        if (!admin.getUsername().equals(username) || !admin.getPassword().equals(password)) {
            return Optional.empty();
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        UserSession session = new UserSession(
                token,
                admin.getUsername(),
                admin.getDisplayName(),
                ROLE_SUPER_ADMIN,
                System.currentTimeMillis()
        );
        sessions.put(token, session);
        return Optional.of(session);
    }

    public Optional<UserSession> getByToken(String token) {
        if (!StringUtils.hasText(token)) {
            return Optional.empty();
        }
        return Optional.ofNullable(sessions.get(token));
    }

    public void logout(String token) {
        if (StringUtils.hasText(token)) {
            sessions.remove(token);
        }
    }
}
