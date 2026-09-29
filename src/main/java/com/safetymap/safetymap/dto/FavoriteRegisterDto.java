package com.safetymap.safetymap.dto;

public class FavoriteRegisterDto {

    private String marker_uuid;
    private String fav_name;

    public FavoriteRegisterDto() {

    }

    public FavoriteRegisterDto(String marker_uuid, String fav_name) {
        this.marker_uuid = marker_uuid;
        this.fav_name = fav_name;
    }

    public String getMarker_uuid() {
        return marker_uuid;
    }

    public void setMarker_uuid(String marker_uuid) {
        this.marker_uuid = marker_uuid;
    }

    public String getFav_name() {
        return fav_name;
    }

    public void setFav_name(String fav_name) {
        this.fav_name = fav_name;
    }
}