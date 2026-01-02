package com.strideboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.strideboard.config.RsaKeyProperties; // Import your record

@SpringBootApplication
@EnableConfigurationProperties(RsaKeyProperties.class) // This is the missing link
public class StrideboardServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(StrideboardServerApplication.class, args);
    }
}