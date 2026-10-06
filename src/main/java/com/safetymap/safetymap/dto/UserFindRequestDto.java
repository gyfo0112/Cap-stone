package com.safetymap.safetymap.dto;

// 아이디 찾기 · 본인 확인 · 비밀번호 재설정 요청
//  - 아이디 찾기:      user_name + info(휴대폰 번호)
//  - 본인 확인:        user_id + user_name + info
//  - 비밀번호 재설정:  user_id + user_name + info + user_pw(새 비밀번호)
public class UserFindRequestDto {

    private String user_id;
    private String user_name;
    private String info;
    private String user_pw;

    public UserFindRequestDto() {

    }

    public UserFindRequestDto(String user_id, String user_name, String info, String user_pw) {
        this.user_id = user_id;
        this.user_name = user_name;
        this.info = info;
        this.user_pw = user_pw;
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

    public String getUser_pw() {
        return user_pw;
    }

    public void setUser_pw(String user_pw) {
        this.user_pw = user_pw;
    }
}
