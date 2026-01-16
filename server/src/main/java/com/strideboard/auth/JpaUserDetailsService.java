package com.strideboard.auth;

import java.util.Collections;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.strideboard.data.user.ChangePasswordRequest;
import com.strideboard.data.user.User;
import com.strideboard.data.user.UserInfo;
import com.strideboard.data.user.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class JpaUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public JpaUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .map(user -> org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                        .password(user.getPassword()) // Plain text check
                        .authorities(Collections.emptyList())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public void registerUser(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(request.getPassword()) //
                .fullName(request.getFullName())
                .build();

        userRepository.save(user);
    }

    // Get the current user's info
    public UserInfo getUserInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new UserInfo(user.getFullName(), user.getEmail());
    }

    // Update general info (Name/Email)
    @Transactional
    public UserInfo updateUserInfo(String email, UserInfo request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        user.setFullName(request.fullName());

        // Only update email if it changed and isn't taken
        if (!user.getEmail().equals(request.email())) {
            if (userRepository.findByEmail(request.email()).isPresent()) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.email());
        }

        User saved = userRepository.save(user);
        return new UserInfo(saved.getFullName(), saved.getEmail());
    }

    // Change Password
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Validate current password (Plain text as per your setup)
        if (!user.getPassword().equals(request.currentPassword())) {
            throw new RuntimeException("Current password does not match");
        }

        // Set new password
        user.setPassword(request.newPassword());
        userRepository.save(user);
    }

}