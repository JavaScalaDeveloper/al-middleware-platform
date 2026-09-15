package com.arelore.middleware.platform.server.auth.model;

public class UserSession {

    private String token;
    private String username;
    private String displayName;
    /** 现阶段固定为 SUPER_ADMIN */
    private String role;
    private long loginAt;

    public UserSession() {
    }

    public UserSession(String token, String username, String displayName, String role, long loginAt) {
        this.token = token;
        this.username = username;
        this.displayName = displayName;
        this.role = role;
        this.loginAt = loginAt;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public long getLoginAt() {
        return loginAt;
    }

    public void setLoginAt(long loginAt) {
        this.loginAt = loginAt;
    }
}
