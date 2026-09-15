package com.arelore.middleware.platform.server.configcenter.common;

import java.util.HashMap;
import java.util.Map;

public final class ApiResult {

    private ApiResult() {
    }

    public static Map<String, Object> ok(Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("code", 0);
        result.put("message", "ok");
        result.put("data", data);
        return result;
    }

    public static Map<String, Object> fail(int code, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("code", code);
        result.put("message", message);
        result.put("data", null);
        return result;
    }
}
