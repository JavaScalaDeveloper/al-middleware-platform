package com.arelore.middleware.platform.server.configcenter.model;

public class AppPermission {
    private String id;
    private String appId;
    private String username;
    /** PENDING / APPROVED / REJECTED */
    private String status;
    private String remark;
    private long appliedAt;
    private long handledAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public long getAppliedAt() { return appliedAt; }
    public void setAppliedAt(long appliedAt) { this.appliedAt = appliedAt; }
    public long getHandledAt() { return handledAt; }
    public void setHandledAt(long handledAt) { this.handledAt = handledAt; }
}
