package com.safetymap.safetymap.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

                        // =========================
                        // React 페이지
                        // =========================
                        .requestMatchers(
                                "/",
                                "/map",
                                "/route",
                                "/help",
                                "/settings",
                                "/login",
                                "/signup",
                                "/sos"
                        ).permitAll()

                        // =========================
                        // React 정적 리소스
                        // =========================
                        .requestMatchers(
                                "/index.html",
                                "/assets/**",
                                "/favicon.ico",
                                "/favicon.png"
                        ).permitAll()

                        // =========================
                        // 로그인 없이 사용 가능한 API
                        // =========================

                        // 회원가입
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/users/signup"
                        ).permitAll()

                        // 지도 마커 조회
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/markers/**"
                        ).permitAll()

                        // =========================
                        // 그 외 API는 로그인 필요
                        // =========================
                        .anyRequest().authenticated()
                )

                // =========================
                // 로그인
                // =========================
                .formLogin(form -> form

                        // React 로그인 페이지
                        .loginPage("/login")

                        // 로그인 폼이 POST할 주소
                        .loginProcessingUrl("/login")

                        // React form input name과 일치시켜야 함
                        .usernameParameter("user_id")
                        .passwordParameter("user_pw")

                        // 로그인 성공
                        .defaultSuccessUrl("/", true)

                        // 로그인 실패
                        .failureUrl("/login?error")

                        .permitAll()
                )

                // =========================
                // 로그아웃
                // =========================
                .logout(logout -> logout

                        .logoutUrl("/logout")

                        .logoutSuccessUrl("/")

                        // 세션 제거
                        .invalidateHttpSession(true)

                        // 세션 쿠키 제거
                        .deleteCookies("JSESSIONID")

                        .permitAll()
                );

        return http.build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}