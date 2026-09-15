package com.arelore.middleware.platform.server.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.arelore.middleware.platform.server.auth.config.AuthProperties;

@SpringBootApplication
@EnableConfigurationProperties(AuthProperties.class)
public class MiddlewarePlatformAuthApplication {

    public static void main(String[] args) {
        SpringApplication.run(MiddlewarePlatformAuthApplication.class, args);
    }
}
