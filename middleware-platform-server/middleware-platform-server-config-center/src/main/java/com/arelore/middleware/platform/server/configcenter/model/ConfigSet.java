package com.arelore.middleware.platform.server.configcenter.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class ConfigSet {
    private String id;
    private String appId;
    private String groupId;
    private String name;
    private Map<String, String> items = new LinkedHashMap<>();
    private int version;
    private boolean published;
    private String updatedBy;
    private long updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }
    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Map<String, String> getItems() { return items; }
    public void setItems(Map<String, String> items) { this.items = items; }
    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}
