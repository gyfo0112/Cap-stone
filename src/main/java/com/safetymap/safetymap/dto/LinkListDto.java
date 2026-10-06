package com.safetymap.safetymap.dto;

// 연결 1건 (내 계정 기준으로 "상대" 정보를 담는다)
//  - link_id            : 연결 번호. 공유 켜기/끄기·권한·해제 주소에 쓴다
//  - user_id, user_name : 상대 아이디·이름
//  - role               : 상대의 계정 구분 (guardian / protected)
//  - latitude, longitude, updated_at : 상대의 마지막 위치와 갱신 시각(밀리초).
//                         내가 보호자이고 공유가 켜져 있을 때만 들어가고, 그 외에는 null
public class LinkListDto {

    private String link_id;
    private String user_id;
    private String user_name;
    private String role;
    private boolean sharing;
    private boolean can_toggle;
    private String changed_by;
    private Double latitude;
    private Double longitude;
    private Long updated_at;

    public LinkListDto() {

    }

    public LinkListDto(String link_id, String user_id, String user_name, String role, boolean sharing, boolean can_toggle, String changed_by, Double latitude, Double longitude, Long updated_at) {
        this.link_id = link_id;
        this.user_id = user_id;
        this.user_name = user_name;
        this.role = role;
        this.sharing = sharing;
        this.can_toggle = can_toggle;
        this.changed_by = changed_by;
        this.latitude = latitude;
        this.longitude = longitude;
        this.updated_at = updated_at;
    }

    public String getLink_id() {
        return link_id;
    }

    public void setLink_id(String link_id) {
        this.link_id = link_id;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isSharing() {
        return sharing;
    }

    public void setSharing(boolean sharing) {
        this.sharing = sharing;
    }

    public boolean isCan_toggle() {
        return can_toggle;
    }

    public void setCan_toggle(boolean can_toggle) {
        this.can_toggle = can_toggle;
    }

    public String getChanged_by() {
        return changed_by;
    }

    public void setChanged_by(String changed_by) {
        this.changed_by = changed_by;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Long getUpdated_at() {
        return updated_at;
    }

    public void setUpdated_at(Long updated_at) {
        this.updated_at = updated_at;
    }
}
