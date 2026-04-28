package com.ytlearner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class YtLearnerApplication {
    public static void main(String[] args) {
        SpringApplication.run(YtLearnerApplication.class, args);
    }
}
