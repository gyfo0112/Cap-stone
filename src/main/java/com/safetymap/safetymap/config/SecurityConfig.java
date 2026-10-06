package com.safetymap.safetymap.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // 프론트(React)가 JSON 으로 POST·PATCH·DELETE 를 보내므로 CSRF 토큰 검사는 끈다
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                    // 로그인 없이 쓸 수 있는 API
                    .requestMatchers(
                            "/api/markers/**",
                            "/api/users/signup",
                            "/api/users/login",
                            "/api/users/logout",
                            "/api/users/find-id",
                            "/api/users/verify",
                            "/api/users/reset-password"
                    ).permitAll()
                    // 그 외 API 는 전부 로그인이 필요합니다 (/api/users/me, /api/favorites 등)
                    .requestMatchers("/api/**").authenticated()
                    // 페이지 주소(/, /map, /route, /help, /settings, /login, /sos)와 정적 파일은 공개
                    // 화면은 React 가 그리므로 서버는 페이지를 막지 않고 API 만 막는다
                    .anyRequest().permitAll()
            )
            // 로그인하지 않고 보호된 API 를 부르면 로그인 페이지로 보내지 않고 401 JSON 을 준다
            .exceptionHandling(exception -> exception
                    .authenticationEntryPoint((request, response, authException) -> {
                        response.setStatus(HttpStatus.UNAUTHORIZED.value());
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"message\":\"로그인이 필요합니다\"}");
                    })
            );
            // 로그인·로그아웃은 UserApiController 의 /api/users/login, /api/users/logout 이 처리합니다

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
