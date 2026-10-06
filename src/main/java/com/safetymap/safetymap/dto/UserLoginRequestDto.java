package com.safetymap.safetymap.dto;

public class UserLoginRequestDto {

    private String user_id;
    private String user_pw;
    // 요청에 없을 수도 있어서(null) boolean 이 아니라 Boolean 으로 받는다
    private Boolean keep_login;

    public UserLoginRequestDto() {

    }

    public UserLoginRequestDto(String user_id, String user_pw, Boolean keep_login) {
        this.user_id = user_id;
        this.user_pw = user_pw;
        this.keep_login = keep_login;
    }

    public String getUser_id() {
        return user_id;
    }

    public void setUser_id(String user_id) {
        this.user_id = user_id;
    }

    public String getUser_pw() {
        return user_pw;
    }

    public void setUser_pw(String user_pw) {
        this.user_pw = user_pw;
    }

    public Boolean getKeep_login() {
        return keep_login;
    }

    public void setKeep_login(Boolean keep_login) {
        this.keep_login = keep_login;
    }
}
