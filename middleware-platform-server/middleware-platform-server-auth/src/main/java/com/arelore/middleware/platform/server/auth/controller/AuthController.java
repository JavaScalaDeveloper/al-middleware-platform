package com.arelore.middleware.platform.server.auth.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.arelore.middleware.platform.server.auth.model.UserSession;
import com.arelore.middleware.platform.server.auth.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = body == null ? null : body.get("username");
        String password = body == null ? null : body.get("password");

        Optional<UserSession> sessionOpt = authService.login(username, password);
        if (!sessionOpt.isPresent()) {
            return fail(401, "用户名或密码错误");
        }
        return ok(toUserMap(sessionOpt.get(), true));
    }

    @GetMapping("/me")
    public Map<String, Object> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Optional<UserSession> sessionOpt = authService.getByToken(extractToken(authorization));
        if (!sessionOpt.isPresent()) {
            return fail(401, "未登录或登录已失效");
        }
        return ok(toUserMap(sessionOpt.get(), false));
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        authService.logout(extractToken(authorization));
        return ok(null);
    }

    private String extractToken(String authorization) {
        if (!StringUtils.hasText(authorization)) {
            return null;
        }
        String value = authorization.trim();
        if (value.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return value.substring(7).trim();
        }
        return value;
    }

    private Map<String, Object> toUserMap(UserSession session, boolean includeToken) {
        Map<String, Object> user = new HashMap<>();
        if (includeToken) {
            user.put("token", session.getToken());
        }
        user.put("username", session.getUsername());
        user.put("displayName", session.getDisplayName());
        user.put("role", session.getRole());
        user.put("loginAt", session.getLoginAt());
        return user;
    }

    private Map<String, Object> ok(Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("code", 0);
        result.put("message", "ok");
        result.put("data", data);
        return result;
    }

    private Map<String, Object> fail(int code, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("code", code);
        result.put("message", message);
        result.put("data", null);
        return result;
    }
}
