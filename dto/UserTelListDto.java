package com.safetymap.safetymap.dto;

public class UserTelListDto {

    private String tel_uuid;
    private String user_uuid;
    private String tel_num;
    private String tel_name;
    private String tel_type;

    public UserTelListDto(String tel_uuid, String user_uuid, String tel_num, String tel_name, String tel_type) {
        this.tel_uuid = tel_uuid;
        this.user_uuid = user_uuid;
        this.tel_num = tel_num;
        this.tel_name = tel_name;
        this.tel_type = tel_type;
    }

    public String getTel_uuid() {
        return tel_uuid;
    }

    public void setTel_uuid(String tel_uuid) {
        this.tel_uuid = tel_uuid;
    }

    public String getUser_uuid() {
        return user_uuid;
    }

    public void setUser_uuid(String user_uuid) {
        this.user_uuid = user_uuid;
    }

    public String getTel_num() {
        return tel_num;
    }

    public void setTel_num(String tel_num) {
        this.tel_num = tel_num;
    }

    public String getTel_name() {
        return tel_name;
    }

    public void setTel_name(String tel_name) {
        this.tel_name = tel_name;
    }

    public String getTel_type() {
        return tel_type;
    }

    public void setTel_type(String tel_type) {
        this.tel_type = tel_type;
    }
}
