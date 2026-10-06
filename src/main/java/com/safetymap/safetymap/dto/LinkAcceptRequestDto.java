package com.safetymap.safetymap.dto;

// 코드로 연결하기 요청
public class LinkAcceptRequestDto {

    private String code;

    public LinkAcceptRequestDto() {

    }

    public LinkAcceptRequestDto(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
