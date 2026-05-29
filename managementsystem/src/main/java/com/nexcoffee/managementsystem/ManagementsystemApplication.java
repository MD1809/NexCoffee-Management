package com.nexcoffee.managementsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ManagementsystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(ManagementsystemApplication.class, args);
	}

}
