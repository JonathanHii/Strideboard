package com.strideboard.config;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "rsa") // This matches the 'rsa:' in your YAML
public record RsaKeyProperties(RSAPublicKey publicKey, RSAPrivateKey privateKey) {}