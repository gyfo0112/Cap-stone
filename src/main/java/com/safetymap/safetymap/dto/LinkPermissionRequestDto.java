package com.safetymap.safetymap.dto;

// 보호 대상에게 켜기/끄기 권한 주기·거두기 요청
public class LinkPermissionRequestDto {

    private Boolean can_toggle;

    public LinkPermissionRequestDto() {

    }

    public LinkPermissionRequestDto(Boolean can_toggle) {
        this.can_toggle = can_toggle;
    }

    public Boolean getCan_toggle() {
        return can_toggle;
    }

    public void setCan_toggle(Boolean can_toggle) {
        this.can_toggle = can_toggle;
    }
}
