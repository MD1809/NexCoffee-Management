package com.nexcoffee.managementsystem.config;

import com.nexcoffee.managementsystem.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Auth public
                        .requestMatchers("/api/auth/**").permitAll()

                        .requestMatchers("/images/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/locations/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/delivery/check").permitAll()


                        // Public cho trang menu khách hàng
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers("/api/checkout/**").hasAuthority("CUSTOMER")

                        // Dashboard: chỉ ADMIN
                        .requestMatchers("/api/dashboard/**").hasAuthority("ADMIN")

                        // Product management: chỉ ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/products/**").hasAuthority("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").hasAuthority("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasAuthority("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/products/**").hasAuthority("ADMIN")

                        // Category management: chỉ ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/categories/**").hasAuthority("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasAuthority("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasAuthority("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/categories/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/admin/delivery-setting/**").hasAuthority("ADMIN")

                        // Nếu có các controller admin khác đang dùng endpoint hiện tại
                        .requestMatchers("/api/users/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/orders/**").hasAnyAuthority("ADMIN", "STAFF")
                        .requestMatchers("/api/delivery-areas/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/pos/**").hasAnyAuthority("ADMIN", "STAFF")
                        .requestMatchers(
                                "/api/delivery-areas",
                                "/api/delivery-areas/**"
                        ).hasAuthority("ADMIN")

                        // Customer APIs sau này
                        .requestMatchers("/api/cart/**").permitAll()
                        .requestMatchers("/api/checkout/**").hasAuthority("CUSTOMER")
                        .requestMatchers("/api/customer/**").hasAuthority("CUSTOMER")
                        .requestMatchers("/api/maps/**").hasAuthority("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/advertisements/**").permitAll()
                        .requestMatchers("/api/admin/advertisements/**").hasAuthority("ADMIN")

                        // Các API còn lại bắt buộc đăng nhập
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        return new CorsConfigurationSource() {
            @Override
            public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(List.of("http://localhost:5173"));
                config.setAllowedMethods(List.of("GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("Authorization",
                        "Content-Type",
                        "Accept",
                        "Origin",
                        "X-Requested-With",
                        "X-Cart-Token"));
                config.setAllowCredentials(true);
                config.setExposedHeaders(List.of("Authorization"));
                config.setAllowCredentials(true);
                config.setMaxAge(3600L);

                return config;
            }
        };
    }
}