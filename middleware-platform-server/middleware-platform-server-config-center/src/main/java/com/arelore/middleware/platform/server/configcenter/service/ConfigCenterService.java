package com.arelore.middleware.platform.server.configcenter.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.arelore.middleware.platform.server.configcenter.model.AppPermission;
import com.arelore.middleware.platform.server.configcenter.model.ConfigApp;
import com.arelore.middleware.platform.server.configcenter.model.ConfigSet;
import com.arelore.middleware.platform.server.configcenter.model.EnvGroup;
import com.arelore.middleware.platform.server.configcenter.model.Ticket;
import com.arelore.middleware.platform.server.configcenter.store.ConfigDataStore;

@Service
public class ConfigCenterService {

    private final ConfigDataStore store;

    public ConfigCenterService(ConfigDataStore store) {
        this.store = store;
    }

    public List<Map<String, Object>> listApps(String username, String role, String scope, String keyword) {
        boolean superAdmin = isSuperAdmin(role);
        String kw = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

        List<Map<String, Object>> result = new ArrayList<>();
        for (ConfigApp app : store.listApps()) {
            if (StringUtils.hasText(kw)) {
                String hay = (app.getName() + " " + app.getCode() + " " + app.getDescription()).toLowerCase(Locale.ROOT);
                if (!hay.contains(kw)) {
                    continue;
                }
            }
            String permStatus = resolvePermissionStatus(username, app.getId(), superAdmin);
            boolean hasAccess = "APPROVED".equals(permStatus) || superAdmin;
            if ("mine".equalsIgnoreCase(scope) && !hasAccess) {
                continue;
            }
            Map<String, Object> item = toAppMap(app);
            item.put("permissionStatus", superAdmin ? "APPROVED" : permStatus);
            item.put("hasPermission", hasAccess);
            result.add(item);
        }
        result.sort(Comparator.comparing(m -> String.valueOf(m.get("name"))));
        return result;
    }

    public Map<String, Object> applyPermission(String username, String role, String appId, String remark) {
        if (!StringUtils.hasText(username)) {
            throw new IllegalArgumentException("缺少操作人");
        }
        ConfigApp app = requireApp(appId);
        if (isSuperAdmin(role) || "APPROVED".equals(resolvePermissionStatus(username, appId, false))) {
            throw new IllegalStateException("已拥有该应用权限，无需申请");
        }
        AppPermission existing = findPermission(username, appId);
        if (existing != null && "PENDING".equals(existing.getStatus())) {
            throw new IllegalStateException("已有待审批的权限申请");
        }

        AppPermission perm = existing != null ? existing : new AppPermission();
        if (existing == null) {
            perm.setId(store.nextId("perm"));
            perm.setAppId(appId);
            perm.setUsername(username);
            store.permissions().put(perm.getId(), perm);
        }
        perm.setStatus("PENDING");
        perm.setRemark(remark);
        perm.setAppliedAt(System.currentTimeMillis());
        perm.setHandledAt(0);

        Ticket ticket = new Ticket();
        ticket.setId(store.nextId("tk"));
        ticket.setType("APP_PERMISSION");
        ticket.setTitle("申请应用权限：" + app.getName());
        ticket.setAppId(app.getId());
        ticket.setAppName(app.getName());
        ticket.setApplicant(username);
        ticket.setStatus("PENDING");
        ticket.setRemark(remark);
        ticket.setRelatedId(perm.getId());
        ticket.setCreatedAt(System.currentTimeMillis());
        ticket.setUpdatedAt(ticket.getCreatedAt());
        store.tickets().put(ticket.getId(), ticket);

        Map<String, Object> data = new HashMap<>();
        data.put("permissionId", perm.getId());
        data.put("ticketId", ticket.getId());
        data.put("status", perm.getStatus());
        return data;
    }

    public List<EnvGroup> listGroups(String username, String role, String appId) {
        requireAppAccess(username, role, appId);
        return store.groups().values().stream()
                .filter(g -> appId.equals(g.getAppId()))
                .sorted(Comparator.comparing(EnvGroup::getCreatedAt))
                .collect(Collectors.toList());
    }

    public EnvGroup createGroup(String username, String role, String appId, String code, String name) {
        requireAppAccess(username, role, appId);
        if (!StringUtils.hasText(code)) {
            throw new IllegalArgumentException("分组编码不能为空");
        }
        String normalized = code.trim().toUpperCase(Locale.ROOT);
        boolean exists = store.groups().values().stream()
                .anyMatch(g -> appId.equals(g.getAppId()) && normalized.equalsIgnoreCase(g.getCode()));
        if (exists) {
            throw new IllegalStateException("分组编码已存在：" + normalized);
        }
        EnvGroup group = new EnvGroup();
        group.setId(store.nextId("grp"));
        group.setAppId(appId);
        group.setCode(normalized);
        group.setName(StringUtils.hasText(name) ? name.trim() : normalized);
        group.setCreatedAt(System.currentTimeMillis());
        store.groups().put(group.getId(), group);
        return group;
    }

    public void deleteGroup(String username, String role, String appId, String groupId) {
        requireAppAccess(username, role, appId);
        EnvGroup group = store.groups().get(groupId);
        if (group == null || !appId.equals(group.getAppId())) {
            throw new IllegalArgumentException("分组不存在");
        }
        store.groups().remove(groupId);
        store.sets().entrySet().removeIf(e -> groupId.equals(e.getValue().getGroupId()));
    }

    public List<ConfigSet> listSets(String username, String role, String appId, String groupId) {
        requireAppAccess(username, role, appId);
        EnvGroup group = store.groups().get(groupId);
        if (group == null || !appId.equals(group.getAppId())) {
            throw new IllegalArgumentException("分组不存在");
        }
        return store.sets().values().stream()
                .filter(s -> groupId.equals(s.getGroupId()))
                .sorted(Comparator.comparing(ConfigSet::getName))
                .collect(Collectors.toList());
    }

    public ConfigSet createSet(String username, String role, String appId, String groupId, String name) {
        requireAppAccess(username, role, appId);
        EnvGroup group = store.groups().get(groupId);
        if (group == null || !appId.equals(group.getAppId())) {
            throw new IllegalArgumentException("分组不存在");
        }
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("配置集名称不能为空");
        }
        String setName = name.trim();
        boolean exists = store.sets().values().stream()
                .anyMatch(s -> groupId.equals(s.getGroupId()) && setName.equals(s.getName()));
        if (exists) {
            throw new IllegalStateException("配置集已存在：" + setName);
        }
        ConfigSet set = new ConfigSet();
        set.setId(store.nextId("set"));
        set.setAppId(appId);
        set.setGroupId(groupId);
        set.setName(setName);
        set.setItems(new LinkedHashMap<>());
        set.setVersion(0);
        set.setPublished(false);
        set.setUpdatedBy(username);
        set.setUpdatedAt(System.currentTimeMillis());
        store.sets().put(set.getId(), set);
        return set;
    }

    public ConfigSet renameSet(String username, String role, String setId, String name) {
        ConfigSet set = requireSetAccess(username, role, setId);
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("配置集名称不能为空");
        }
        String setName = name.trim();
        boolean exists = store.sets().values().stream()
                .anyMatch(s -> set.getGroupId().equals(s.getGroupId())
                        && setName.equals(s.getName())
                        && !set.getId().equals(s.getId()));
        if (exists) {
            throw new IllegalStateException("配置集已存在：" + setName);
        }
        set.setName(setName);
        set.setUpdatedBy(username);
        set.setUpdatedAt(System.currentTimeMillis());
        set.setPublished(false);
        return set;
    }

    public void deleteSet(String username, String role, String setId) {
        requireSetAccess(username, role, setId);
        store.sets().remove(setId);
    }

    public ConfigSet getSet(String username, String role, String setId) {
        return requireSetAccess(username, role, setId);
    }

    public ConfigSet saveItems(String username, String role, String setId, Map<String, String> items) {
        ConfigSet set = requireSetAccess(username, role, setId);
        LinkedHashMap<String, String> next = new LinkedHashMap<>();
        if (items != null) {
            for (Map.Entry<String, String> e : items.entrySet()) {
                if (!StringUtils.hasText(e.getKey())) {
                    continue;
                }
                next.put(e.getKey().trim(), e.getValue() == null ? "" : e.getValue());
            }
        }
        set.setItems(next);
        set.setUpdatedBy(username);
        set.setUpdatedAt(System.currentTimeMillis());
        set.setPublished(false);
        return set;
    }

    public ConfigSet publishSet(String username, String role, String setId) {
        ConfigSet set = requireSetAccess(username, role, setId);
        set.setVersion(set.getVersion() + 1);
        set.setPublished(true);
        set.setUpdatedBy(username);
        set.setUpdatedAt(System.currentTimeMillis());

        Ticket ticket = new Ticket();
        ticket.setId(store.nextId("tk"));
        ticket.setType("CONFIG_PUBLISH");
        ConfigApp app = store.apps().get(set.getAppId());
        ticket.setTitle("发布配置集：" + set.getName() + " v" + set.getVersion());
        ticket.setAppId(set.getAppId());
        ticket.setAppName(app == null ? set.getAppId() : app.getName());
        ticket.setApplicant(username);
        ticket.setStatus("DONE");
        ticket.setRemark("已发布");
        ticket.setRelatedId(set.getId());
        ticket.setCreatedAt(System.currentTimeMillis());
        ticket.setUpdatedAt(ticket.getCreatedAt());
        store.tickets().put(ticket.getId(), ticket);
        return set;
    }

    public List<Map<String, Object>> listTickets() {
        return store.tickets().values().stream()
                .sorted(Comparator.comparing(Ticket::getCreatedAt).reversed())
                .map(this::toTicketMap)
                .collect(Collectors.toList());
    }

    public Map<String, Object> handleTicket(String operator, String role, String ticketId, String action, String remark) {
        if (!isSuperAdmin(role)) {
            throw new IllegalStateException("仅超管可审批工单");
        }
        Ticket ticket = store.tickets().get(ticketId);
        if (ticket == null) {
            throw new IllegalArgumentException("工单不存在");
        }
        if (!"PENDING".equals(ticket.getStatus())) {
            throw new IllegalStateException("工单已处理");
        }
        boolean approve = "approve".equalsIgnoreCase(action);
        ticket.setStatus(approve ? "APPROVED" : "REJECTED");
        ticket.setRemark(StringUtils.hasText(remark) ? remark : (approve ? "已通过" : "已驳回"));
        ticket.setUpdatedAt(System.currentTimeMillis());

        if ("APP_PERMISSION".equals(ticket.getType()) && ticket.getRelatedId() != null) {
            AppPermission perm = store.permissions().get(ticket.getRelatedId());
            if (perm != null) {
                perm.setStatus(ticket.getStatus());
                perm.setHandledAt(System.currentTimeMillis());
                perm.setRemark(ticket.getRemark());
            }
        }
        Map<String, Object> data = toTicketMap(ticket);
        data.put("handledBy", operator);
        return data;
    }

    private ConfigSet requireSetAccess(String username, String role, String setId) {
        ConfigSet set = store.sets().get(setId);
        if (set == null) {
            throw new IllegalArgumentException("配置集不存在");
        }
        requireAppAccess(username, role, set.getAppId());
        return set;
    }

    private void requireAppAccess(String username, String role, String appId) {
        requireApp(appId);
        if (isSuperAdmin(role)) {
            return;
        }
        if (!"APPROVED".equals(resolvePermissionStatus(username, appId, false))) {
            throw new IllegalStateException("无该应用权限，请先申请");
        }
    }

    private ConfigApp requireApp(String appId) {
        ConfigApp app = store.apps().get(appId);
        if (app == null) {
            throw new IllegalArgumentException("应用不存在");
        }
        return app;
    }

    private String resolvePermissionStatus(String username, String appId, boolean superAdmin) {
        if (superAdmin) {
            return "APPROVED";
        }
        AppPermission perm = findPermission(username, appId);
        return perm == null ? "NONE" : perm.getStatus();
    }

    private AppPermission findPermission(String username, String appId) {
        if (!StringUtils.hasText(username)) {
            return null;
        }
        return store.permissions().values().stream()
                .filter(p -> appId.equals(p.getAppId()) && username.equals(p.getUsername()))
                .findFirst()
                .orElse(null);
    }

    private boolean isSuperAdmin(String role) {
        return "SUPER_ADMIN".equalsIgnoreCase(role);
    }

    private Map<String, Object> toAppMap(ConfigApp app) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", app.getId());
        m.put("code", app.getCode());
        m.put("name", app.getName());
        m.put("description", app.getDescription());
        m.put("owner", app.getOwner());
        m.put("createdAt", app.getCreatedAt());
        return m;
    }

    private Map<String, Object> toTicketMap(Ticket t) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", t.getId());
        m.put("type", t.getType());
        m.put("title", t.getTitle());
        m.put("appId", t.getAppId());
        m.put("appName", t.getAppName());
        m.put("applicant", t.getApplicant());
        m.put("status", t.getStatus());
        m.put("remark", t.getRemark());
        m.put("relatedId", t.getRelatedId());
        m.put("createdAt", t.getCreatedAt());
        m.put("updatedAt", t.getUpdatedAt());
        return m;
    }
}
