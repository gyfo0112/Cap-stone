package com.safetymap.safetymap.init;

import com.safetymap.safetymap.service.MarkerImportService;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;

public class MarkerDataImportRunner {

    public static void main(String[] args) {

        ConfigurableApplicationContext context =
                SpringApplication.run(
                        com.safetymap.safetymap.SafetyMapApplication.class,
                        args
                );

        MarkerImportService importService = context.getBean(MarkerImportService.class);

        importService.importMarkerData();

        context.close();
    }
}