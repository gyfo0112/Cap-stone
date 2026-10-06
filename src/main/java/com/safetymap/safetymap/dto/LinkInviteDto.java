package com.safetymap.safetymap.dto;

// 연결 코드 응답. expires_at 은 만료 시각(밀리초, 자바스크립트 Date.now() 와 같은 단위)
public class LinkInviteDto {

    private String code;
    private long expires_at;

    public LinkInviteDto() {

    }

    public LinkInviteDto(String code, long expires_at) {
        this.code = code;
        this.expires_at = expires_at;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public long getExpires_at() {
        return expires_at;
    }

    public void setExpires_at(long expires_at) {
        this.expires_at = expires_at;
    }
}
