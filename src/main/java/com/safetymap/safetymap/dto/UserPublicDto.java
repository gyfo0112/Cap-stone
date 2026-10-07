package com.safetymap.safetymap.dto;

public class UserPublicDto {

    private String user_uuid;
    private String user_name;
    private String user_id;
    private String info;

    public UserPublicDto(String user_uuid, String user_name, String user_id, String info) {
        this.user_uuid = user_uuid;
        this.user_name = user_name;
        this.user_id = user_id;
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

    public String getInfo() {
        return info;
    }

    public void setInfo(String info) {
        this.info = info;
    }
}
