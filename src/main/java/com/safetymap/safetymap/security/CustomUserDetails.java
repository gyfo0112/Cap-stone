package com.safetymap.safetymap.security;

import com.safetymap.safetymap.entity.Users;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {

    private final String userId;
    private final String userPw;
    private final String userUuid;


    public CustomUserDetails(Users user) {
        this.userId = user.getUser_id();
        this.userPw = user.getUser_pw();
        this.userUuid = user.getUser_uuid();
    }


    public String getUserUuid() {
        return userUuid;
    }


    @Override
    public String getUsername() {
        return userId;
    }


    @Override
    public String getPassword() {
        return userPw;
    }


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }
}