package com.safetymap.safetymap.dto;

// 위치 공유 켜기/끄기 요청 (on: true 켜기, false 끄기)
public class LinkSharingRequestDto {

    private Boolean on;

    public LinkSharingRequestDto() {

    }

    public LinkSharingRequestDto(Boolean on) {
        this.on = on;
    }

    public Boolean getOn() {
        return on;
    }

    public void setOn(Boolean on) {
        this.on = on;
    }
}
