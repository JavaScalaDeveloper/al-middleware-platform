package com.arelore.middleware.platform.server.configcenter.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.arelore.middleware.platform.server.configcenter.common.ApiResult;
import com.arelore.middleware.platform.server.configcenter.model.ConfigSet;
import com.arelore.middleware.platform.server.configcenter.model.EnvGroup;
import com.arelore.middleware.platform.server.configcenter.service.ConfigCenterService;

@RestController
@RequestMapping("/api/config")
public class ConfigCenterController {

    private final ConfigCenterService service;

    public ConfigCenterController(ConfigCenterService service) {
        this.service = service;
    }

    @GetMapping("/apps")
    public Map<String, Object> listApps(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @RequestParam(value = "scope", defaultValue = "all") String scope,
            @RequestParam(value = "keyword", required = false) String keyword) {
        try {
            return ApiResult.ok(service.listApps(username, role, scope, keyword));
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @PostMapping("/apps/{appId}/permission/apply")
    public Map<String, Object> applyPermission(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String appId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String remark = body == null ? null : body.get("remark");
            return ApiResult.ok(service.applyPermission(username, role, appId, remark));
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @GetMapping("/apps/{appId}/groups")
    public Map<String, Object> listGroups(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String appId) {
        try {
            return ApiResult.ok(service.listGroups(username, role, appId));
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @PostMapping("/apps/{appId}/groups")
    public Map<String, Object> createGroup(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String appId,
            @RequestBody Map<String, String> body) {
        try {
            EnvGroup group = service.createGroup(username, role, appId, body.get("code"), body.get("name"));
            return ApiResult.ok(group);
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @DeleteMapping("/apps/{appId}/groups/{groupId}")
    public Map<String, Object> deleteGroup(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String appId,
            @PathVariable String groupId) {
        try {
            service.deleteGroup(username, role, appId, groupId);
            return ApiResult.ok(null);
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @GetMapping("/apps/{appId}/groups/{groupId}/sets")
    public Map<String, Object> listSets(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String appId,
            @PathVariable String groupId) {
        try {
            return ApiResult.ok(service.listSets(username, role, appId, groupId));
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @PostMapping("/apps/{appId}/groups/{groupId}/sets")
    public Map<String, Object> createSet(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String appId,
            @PathVariable String groupId,
            @RequestBody Map<String, String> body) {
        try {
            return ApiResult.ok(service.createSet(username, role, appId, groupId, body.get("name")));
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @GetMapping("/sets/{setId}")
    public Map<String, Object> getSet(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String setId) {
        try {
            return ApiResult.ok(service.getSet(username, role, setId));
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @PutMapping("/sets/{setId}")
    public Map<String, Object> renameSet(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String setId,
            @RequestBody Map<String, String> body) {
        try {
            return ApiResult.ok(service.renameSet(username, role, setId, body.get("name")));
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @DeleteMapping("/sets/{setId}")
    public Map<String, Object> deleteSet(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String setId) {
        try {
            service.deleteSet(username, role, setId);
            return ApiResult.ok(null);
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @PutMapping("/sets/{setId}/items")
    public Map<String, Object> saveItems(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String setId,
            @RequestBody Map<String, Object> body) {
        try {
            Map<String, String> items = new LinkedHashMap<>();
            Object raw = body == null ? null : body.get("items");
            if (raw instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) raw;
                for (Map.Entry<String, Object> e : map.entrySet()) {
                    items.put(e.getKey(), e.getValue() == null ? "" : String.valueOf(e.getValue()));
                }
            } else if (raw instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> list = (List<Map<String, Object>>) raw;
                for (Map<String, Object> row : list) {
                    Object key = row.get("key");
                    if (key == null || !StringUtils.hasText(String.valueOf(key))) {
                        continue;
                    }
                    Object value = row.get("value");
                    items.put(String.valueOf(key).trim(), value == null ? "" : String.valueOf(value));
                }
            } else if (body != null && body.get("text") != null) {
                items = parsePropertiesText(String.valueOf(body.get("text")));
            }
            ConfigSet set = service.saveItems(username, role, setId, items);
            return ApiResult.ok(set);
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @PostMapping("/sets/{setId}/publish")
    public Map<String, Object> publishSet(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String setId) {
        try {
            return ApiResult.ok(service.publishSet(username, role, setId));
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    @GetMapping("/tickets")
    public Map<String, Object> listTickets() {
        return ApiResult.ok(service.listTickets());
    }

    @PostMapping("/tickets/{ticketId}/handle")
    public Map<String, Object> handleTicket(
            @RequestHeader(value = "X-Username", required = false) String username,
            @RequestHeader(value = "X-Role", required = false) String role,
            @PathVariable String ticketId,
            @RequestBody Map<String, String> body) {
        try {
            String action = body == null ? null : body.get("action");
            String remark = body == null ? null : body.get("remark");
            return ApiResult.ok(service.handleTicket(username, role, ticketId, action, remark));
        } catch (Exception e) {
            return ApiResult.fail(400, e.getMessage());
        }
    }

    private LinkedHashMap<String, String> parsePropertiesText(String text) {
        LinkedHashMap<String, String> items = new LinkedHashMap<>();
        if (!StringUtils.hasText(text)) {
            return items;
        }
        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (!StringUtils.hasText(trimmed) || trimmed.startsWith("#") || trimmed.startsWith("!")) {
                continue;
            }
            int idx = trimmed.indexOf('=');
            if (idx < 0) {
                idx = trimmed.indexOf(':');
            }
            if (idx <= 0) {
                continue;
            }
            String key = trimmed.substring(0, idx).trim();
            String value = trimmed.substring(idx + 1).trim();
            if (StringUtils.hasText(key)) {
                items.put(key, value);
            }
        }
        return items;
    }
}
