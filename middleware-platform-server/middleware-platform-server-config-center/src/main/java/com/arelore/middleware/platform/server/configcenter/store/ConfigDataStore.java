package com.arelore.middleware.platform.server.configcenter.store;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Component;

import com.arelore.middleware.platform.server.configcenter.model.AppPermission;
import com.arelore.middleware.platform.server.configcenter.model.ConfigApp;
import com.arelore.middleware.platform.server.configcenter.model.ConfigSet;
import com.arelore.middleware.platform.server.configcenter.model.EnvGroup;
import com.arelore.middleware.platform.server.configcenter.model.Ticket;

@Component
public class ConfigDataStore {

    private final AtomicLong seq = new AtomicLong(1000);
    private final Map<String, ConfigApp> apps = new ConcurrentHashMap<>();
    private final Map<String, EnvGroup> groups = new ConcurrentHashMap<>();
    private final Map<String, ConfigSet> sets = new ConcurrentHashMap<>();
    private final Map<String, AppPermission> permissions = new ConcurrentHashMap<>();
    private final Map<String, Ticket> tickets = new ConcurrentHashMap<>();

    public String nextId(String prefix) {
        return prefix + "_" + seq.incrementAndGet();
    }

    public Map<String, ConfigApp> apps() { return apps; }
    public Map<String, EnvGroup> groups() { return groups; }
    public Map<String, ConfigSet> sets() { return sets; }
    public Map<String, AppPermission> permissions() { return permissions; }
    public Map<String, Ticket> tickets() { return tickets; }

    @PostConstruct
    public void seed() {
        ConfigApp order = app("app_order", "order-service", "订单服务", "电商订单核心服务", "admin");
        ConfigApp user = app("app_user", "user-center", "用户中心", "账号与资料服务", "admin");
        ConfigApp pay = app("app_pay", "payment", "支付中心", "支付与对账", "admin");

        apps.put(order.getId(), order);
        apps.put(user.getId(), user);
        apps.put(pay.getId(), pay);

        // 超管默认拥有全部应用权限
        approve("admin", order);
        approve("admin", user);
        approve("admin", pay);

        seedGroupsAndSets(order);
        seedGroupsAndSets(user);

        // pay 仅默认分组，无配置集，便于演示申请与空态
        for (String[] g : defaultGroups()) {
            EnvGroup group = group(pay.getId(), g[0], g[1]);
            groups.put(group.getId(), group);
        }
    }

    private void seedGroupsAndSets(ConfigApp app) {
        for (String[] g : defaultGroups()) {
            EnvGroup group = group(app.getId(), g[0], g[1]);
            groups.put(group.getId(), group);
            if ("D1".equals(g[0]) || "PROD".equals(g[0])) {
                ConfigSet application = configSet(app.getId(), group.getId(), "application.properties");
                application.getItems().put("server.port", "8080");
                application.getItems().put("spring.application.name", app.getCode());
                application.setPublished(true);
                application.setVersion(1);
                sets.put(application.getId(), application);

                ConfigSet datasource = configSet(app.getId(), group.getId(), "datasource.properties");
                datasource.getItems().put("spring.datasource.url", "jdbc:mysql://localhost:3306/" + app.getCode());
                datasource.getItems().put("spring.datasource.username", "root");
                datasource.getItems().put("spring.datasource.password", "******");
                datasource.setPublished(true);
                datasource.setVersion(1);
                sets.put(datasource.getId(), datasource);
            }
        }
    }

    private String[][] defaultGroups() {
        return new String[][]{
                {"D1", "开发环境-1"},
                {"D2", "开发环境-2"},
                {"T1", "测试环境-1"},
                {"T2", "测试环境-2"},
                {"PRE", "预发环境"},
                {"PROD", "生产环境"}
        };
    }

    private ConfigApp app(String id, String code, String name, String desc, String owner) {
        ConfigApp a = new ConfigApp();
        a.setId(id);
        a.setCode(code);
        a.setName(name);
        a.setDescription(desc);
        a.setOwner(owner);
        a.setCreatedAt(System.currentTimeMillis());
        return a;
    }

    private EnvGroup group(String appId, String code, String name) {
        EnvGroup g = new EnvGroup();
        g.setId(nextId("grp"));
        g.setAppId(appId);
        g.setCode(code);
        g.setName(name);
        g.setCreatedAt(System.currentTimeMillis());
        return g;
    }

    private ConfigSet configSet(String appId, String groupId, String name) {
        ConfigSet s = new ConfigSet();
        s.setId(nextId("set"));
        s.setAppId(appId);
        s.setGroupId(groupId);
        s.setName(name);
        s.setItems(new LinkedHashMap<>());
        s.setVersion(0);
        s.setPublished(false);
        s.setUpdatedBy("system");
        s.setUpdatedAt(System.currentTimeMillis());
        return s;
    }

    private void approve(String username, ConfigApp app) {
        AppPermission p = new AppPermission();
        p.setId(nextId("perm"));
        p.setAppId(app.getId());
        p.setUsername(username);
        p.setStatus("APPROVED");
        p.setAppliedAt(System.currentTimeMillis());
        p.setHandledAt(System.currentTimeMillis());
        permissions.put(p.getId(), p);
    }

    public List<ConfigApp> listApps() {
        return new ArrayList<>(apps.values());
    }
}
