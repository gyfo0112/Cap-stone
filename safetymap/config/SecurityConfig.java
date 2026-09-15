package com.safetymap.safetymap.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .authorizeHttpRequests(auth -> auth
                    // 로그인 없이 접근 가능한 공개 경로
                    .requestMatchers(
                            "/"
                            // 이후 공개 웹 경로는 이렇게 추가할 수 있습니다
                            // "/public/**",
                            // "/css/**",
                            // "/js/**",
                            // "/images/**"
                    ).permitAll()
                    // 그 외 모든 경로는 로그인이 필요한 웹으로 처리됩니다
                    .anyRequest().authenticated()
            );
            /*
            // 로그인 페이지 지정
            .formLogin(form -> form
                    .loginPage("컨트롤러 폼 주소 지정")
                    .loginProcessingUrl("컨트롤러 처리 주소 지정")
                    .usernameParameter("아이디값")      //  세션엔 지정한 컬럼값(엔티티 기준)이 들어갑니다. id 혹은 uuid를 추천해요
                    .passwordParameter("비밀번호값")
                    .defaultSuccessUrl("/", true)   //  로그인 성공 시 이동할 페이지
                    .permitAll()    // 접근 권한 지정 (permitAll은 공개)
            )
            //  로그아웃 페이지 지정
            .logout(logout -> logout
                    .logoutUrl("로그아웃 주소 지정")    //  로그아웃은 해당 주소 이동 시 자동 처리됨
                    .logoutSuccessUrl("/")  // 로그아웃 성공 시 주소 지정
                    .permitAll()
            );
            */

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}