package com.strideboard.auth;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final TokenService tokenService;
    private final JpaUserDetailsService userDetailsService;

    public AuthController(TokenService tokenService, JpaUserDetailsService userDetailsService) {
        this.tokenService = tokenService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping("/login")
    public String token(Authentication auth) {
        return tokenService.generateToken(auth);
    }

    @PostMapping("/register")
    public void register(@RequestBody RegisterRequest registration) {
        userDetailsService.registerUser(registration);
    }


    
}