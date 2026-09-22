package com.safetymap.safetymap.dto;

public class UserPublicDto {

    private String user_uuid;
    private String user_name;
    private String user_id;
    private String user_pw;
    private String info;

    public UserPublicDto(String user_uuid, String user_name, String user_id, String user_pw, String info) {
        this.user_uuid = user_uuid;
        this.user_name = user_name;
        this.user_id = user_id;
        this.user_pw = user_pw;
        this.info = info;
    }

    public String getUser_uuid() {
        return user_uuid;
    }

    public void setUser_uuid(String user_uuid) {
        this.user_uuid = user_uuid;
    }

    public String getUser_name() {
        return user_name;
    }

    public void setUser_name(String user_name) {
        this.user_name = user_name;
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

    public String getInfo() {
        return info;
    }

    public void setInfo(String info) {
        this.info = info;
    }
}
