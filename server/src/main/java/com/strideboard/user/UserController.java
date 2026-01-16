package com.strideboard.user;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.strideboard.auth.JpaUserDetailsService;
import com.strideboard.auth.TokenService;
import com.strideboard.data.user.ChangePasswordRequest;
import com.strideboard.data.user.ProfileUpdateResponse;
import com.strideboard.data.user.UserInfo;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final JpaUserDetailsService userService;
    private final TokenService tokenService;

    public UserController(JpaUserDetailsService userService, TokenService tokenService) {
        this.userService = userService;
        this.tokenService = tokenService;
    }

    // GET /api/users/me
    @GetMapping("/me")
    public UserInfo getProfile(Authentication auth) {
        return userService.getUserInfo(auth.getName());
    }

    // PATCH /api/users/me
    @PatchMapping("/me")
    public ProfileUpdateResponse updateProfile(Authentication auth, @RequestBody UserInfo request) {
        // Update the user in the database
        UserInfo updatedUser = userService.updateUserInfo(auth.getName(), request);

        // Create a new Authentication object with the NEW email
        Authentication newAuth = new UsernamePasswordAuthenticationToken(
                updatedUser.email(),
                null,
                auth.getAuthorities());

        // Generate a new token based on the new info
        String newToken = tokenService.generateToken(newAuth);

        // Return both
        return new ProfileUpdateResponse(updatedUser, newToken);
    }

    // PATCH /api/users/me/password
    @PatchMapping("/me/password")
    public void changePassword(Authentication auth, @RequestBody ChangePasswordRequest request) {
        userService.changePassword(auth.getName(), request);
    }
}
