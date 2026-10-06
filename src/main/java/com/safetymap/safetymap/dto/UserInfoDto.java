package com.safetymap.safetymap.dto;

// 프론트에 돌려주는 회원 정보. 비밀번호(user_pw)는 절대 넣지 않는다
public class UserInfoDto {

    private String user_uuid;
    private String user_id;
    private String user_name;
    private String info;

    public UserInfoDto() {

    }

    public UserInfoDto(String user_uuid, String user_id, String user_name, String info) {
        this.user_uuid = user_uuid;
        this.user_id = user_id;
        this.user_name = user_name;
        this.info = info;
    }

    public String getUser_uuid() {
        return user_uuid;
    }

    public void setUser_uuid(String user_uuid) {
        this.user_uuid = user_uuid;
    }

    public String getUser_id() {
        return user_id;
    }

    public void setUser_id(String user_id) {
        this.user_id = user_id;
    }

    public String getUser_name() {
        return user_name;
    }

    public void setUser_name(String user_name) {
        this.user_name = user_name;
    }

    public String getInfo() {
        return info;
    }

    public void setInfo(String info) {
        this.info = info;
    }
}
